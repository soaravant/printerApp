import { FieldValue, type DocumentReference, type SetOptions } from "firebase-admin/firestore"
import { z } from "zod"

import {
  buildExcelImportPlan,
  createSyntheticLaminationJobs,
  createSyntheticPrintJobs,
  getSyntheticImportDocumentIds,
  inferUserRoleFromExcelName,
  parseExcelImportFiles,
  type ExcelPreviewRow,
} from "@/lib/excel-import"
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin"
import {
  FIREBASE_COLLECTIONS,
  type FirebaseExcelImportRunSummary,
  type FirebaseUser,
} from "@/lib/firebase-schema"
import { recomputeUserDebt } from "@/lib/server/debt"

const MAX_BATCH_OPERATIONS = 400

const importRowSchema = z.object({
  rowNumber: z.number().int().positive(),
  code: z.string().min(1),
  username: z.string().min(1),
  dbUserName: z.string().min(1),
  oldPrintDebt: z.number(),
  oldLaminationDebt: z.number(),
  totalBwCount: z.number().min(0),
  color3330Count: z.number().min(0),
  extraPrintCharge: z.number(),
  newPrintCharge: z.number(),
  newLaminationCharge: z.number(),
  finalExcelTotalDebt: z.number(),
  computedFinalTotalDebt: z.number(),
  canImport: z.boolean(),
})

type AdminActor = {
  uid: string
  displayName: string
}

type BatchOperation =
  | { kind: "set"; ref: DocumentReference; data: Record<string, unknown>; options?: SetOptions }
  | { kind: "delete"; ref: DocumentReference }

type UserRestoreRecord = {
  existedBefore: boolean
  previousOpeningPrintDebt: number | null
  previousOpeningLaminationDebt: number | null
  previousOpeningDebtSource: string | null
  previousOpeningDebtImportedAt: unknown | null
}

type JobRestoreRecord = {
  existedBefore: boolean
  beforeData: Record<string, unknown> | null
}

type ResolvedImportRow = ExcelPreviewRow & {
  dbUserUid: string
  dbUserName: string
  inferredUserRole: FirebaseUser["userRole"]
  matchedExistingUser: boolean
}

export class ExcelImportServerError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object") {
    return value as Record<string, unknown>
  }
  return {}
}

function pruneUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => pruneUndefined(item)) as T
  }
  if (value && typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype) {
    const next: Record<string, unknown> = {}
    for (const [key, entry] of Object.entries(value)) {
      if (entry === undefined) continue
      next[key] = pruneUndefined(entry)
    }
    return next as T
  }
  return value
}

function getImportEventTimestamp(endDate: string | null | undefined) {
  if (!endDate) return new Date()
  const next = new Date(`${endDate}T12:00:00.000Z`)
  return Number.isNaN(next.getTime()) ? new Date() : next
}

async function commitBatchOperations(operations: BatchOperation[]) {
  const db = getAdminDb()
  for (let index = 0; index < operations.length; index += MAX_BATCH_OPERATIONS) {
    const chunk = operations.slice(index, index + MAX_BATCH_OPERATIONS)
    const batch = db.batch()
    for (const operation of chunk) {
      if (operation.kind === "set") {
        if (operation.options) {
          batch.set(operation.ref, pruneUndefined(operation.data), operation.options)
        } else {
          batch.set(operation.ref, pruneUndefined(operation.data))
        }
      } else {
        batch.delete(operation.ref)
      }
    }
    await batch.commit()
  }
}

function restoreFieldOrDelete(value: unknown) {
  return value === null || value === undefined ? FieldValue.delete() : value
}

function mapImportSummary(data: Record<string, unknown>, importId: string): FirebaseExcelImportRunSummary {
  return {
    importId,
    periodKey: String(data.periodKey || ""),
    periodLabel: String(data.periodLabel || ""),
    rowCount: Number(data.rowCount || 0),
    missingUsers: Number(data.missingUsers || 0),
    createdAt: data.createdAt,
    completedAt: (data.completedAt as FirebaseExcelImportRunSummary["completedAt"]) ?? null,
    createdByUid: String(data.createdByUid || ""),
    createdByDisplayName: String(data.createdByDisplayName || ""),
    status: (data.status as FirebaseExcelImportRunSummary["status"]) || "failed",
    rolledBackAt: (data.rolledBackAt as FirebaseExcelImportRunSummary["rolledBackAt"]) ?? null,
    finalExcelDebt: Number(data.finalExcelDebt || 0),
    computedFinalDebt: Number(data.computedFinalDebt || 0),
  }
}

async function loadAllUsers() {
  const db = getAdminDb()
  const usersSnap = await db.collection(FIREBASE_COLLECTIONS.USERS).get()
  return usersSnap.docs.map((doc) => {
    const data = asRecord(doc.data())
    return {
      ...(data as unknown as FirebaseUser),
      uid: doc.id,
      username: String(data.username || ""),
      displayName: String(data.displayName || ""),
      userRole: (data.userRole || inferUserRoleFromExcelName(String(data.displayName || ""))) as FirebaseUser["userRole"],
    }
  })
}

async function getExistingDocsMap(refs: DocumentReference[]) {
  const db = getAdminDb()
  const result = new Map<string, { exists: boolean; data: Record<string, unknown> | null }>()
  for (let index = 0; index < refs.length; index += 250) {
    const chunk = refs.slice(index, index + 250)
    const snapshots = await db.getAll(...chunk)
    snapshots.forEach((snapshot) => {
      result.set(snapshot.ref.id, {
        exists: snapshot.exists,
        data: snapshot.exists ? (snapshot.data() as Record<string, unknown>) : null,
      })
    })
  }
  return result
}

async function getImportRestoreSnapshots(importId: string) {
  const db = getAdminDb()
  const importRef = db.collection(FIREBASE_COLLECTIONS.EXCEL_IMPORTS).doc(importId)
  const [userRestoreSnap, printRestoreSnap, laminationRestoreSnap] = await Promise.all([
    importRef.collection("userRestores").get(),
    importRef.collection("printJobRestores").get(),
    importRef.collection("laminationJobRestores").get(),
  ])

  return {
    importRef,
    userRestores: userRestoreSnap.docs.map((doc) => ({
      uid: doc.id,
      ...(doc.data() as UserRestoreRecord),
    })),
    printJobRestores: printRestoreSnap.docs.map((doc) => ({
      jobId: doc.id,
      ...(doc.data() as JobRestoreRecord),
    })),
    laminationJobRestores: laminationRestoreSnap.docs.map((doc) => ({
      jobId: doc.id,
      ...(doc.data() as JobRestoreRecord),
    })),
  }
}

async function recomputeUsers(userIds: string[]) {
  for (const uid of userIds) {
    await recomputeUserDebt(uid)
  }
}

async function cleanupNewUsers(userRestores: Array<{ uid: string; existedBefore: boolean }>) {
  const db = getAdminDb()
  for (const restore of userRestores.filter((entry) => !entry.existedBefore)) {
    const [printSnap, laminationSnap, incomeSnap] = await Promise.all([
      db.collection(FIREBASE_COLLECTIONS.PRINT_JOBS).where("uid", "==", restore.uid).limit(1).get(),
      db.collection(FIREBASE_COLLECTIONS.LAMINATION_JOBS).where("uid", "==", restore.uid).limit(1).get(),
      db.collection(FIREBASE_COLLECTIONS.INCOME).where("uid", "==", restore.uid).limit(1).get(),
    ])
    const hasRemainingRecords = !printSnap.empty || !laminationSnap.empty || !incomeSnap.empty
    if (!hasRemainingRecords) {
      await db.collection(FIREBASE_COLLECTIONS.USERS).doc(restore.uid).delete()
    }
  }
}

async function rollbackImportInternal(
  importId: string,
  actor: AdminActor,
  options?: { failed?: boolean; failureMessage?: string }
) {
  const db = getAdminDb()
  const { importRef, userRestores, printJobRestores, laminationJobRestores } = await getImportRestoreSnapshots(importId)
  const importSnap = await importRef.get()
  if (!importSnap.exists) {
    throw new ExcelImportServerError(404, "Η εισαγωγή Excel δεν βρέθηκε.")
  }

  const restoreOperations: BatchOperation[] = []

  for (const restore of printJobRestores) {
    const ref = db.collection(FIREBASE_COLLECTIONS.PRINT_JOBS).doc(restore.jobId)
    if (restore.existedBefore && restore.beforeData) {
      restoreOperations.push({ kind: "set", ref, data: restore.beforeData })
    } else {
      restoreOperations.push({ kind: "delete", ref })
    }
  }

  for (const restore of laminationJobRestores) {
    const ref = db.collection(FIREBASE_COLLECTIONS.LAMINATION_JOBS).doc(restore.jobId)
    if (restore.existedBefore && restore.beforeData) {
      restoreOperations.push({ kind: "set", ref, data: restore.beforeData })
    } else {
      restoreOperations.push({ kind: "delete", ref })
    }
  }

  for (const restore of userRestores) {
    const ref = db.collection(FIREBASE_COLLECTIONS.USERS).doc(restore.uid)
    restoreOperations.push({
      kind: "set",
      ref,
      data: {
        openingPrintDebt: restoreFieldOrDelete(restore.previousOpeningPrintDebt),
        openingLaminationDebt: restoreFieldOrDelete(restore.previousOpeningLaminationDebt),
        openingDebtSource: restoreFieldOrDelete(restore.previousOpeningDebtSource),
        openingDebtImportedAt: restoreFieldOrDelete(restore.previousOpeningDebtImportedAt),
      },
      options: { merge: true },
    })
  }

  await commitBatchOperations(restoreOperations)
  await recomputeUsers(userRestores.map((restore) => restore.uid))
  await cleanupNewUsers(userRestores)

  await importRef.set(
    {
      status: options?.failed ? "failed" : "rolled_back",
      failureMessage: options?.failureMessage || null,
      rolledBackAt: new Date(),
      rolledBackByUid: actor.uid,
      rolledBackByDisplayName: actor.displayName,
    },
    { merge: true }
  )
}

export async function verifyExcelImportAdmin(idToken: string): Promise<AdminActor> {
  const auth = getAdminAuth()
  let decoded: { uid: string }
  try {
    decoded = await auth.verifyIdToken(idToken) as { uid: string }
  } catch {
    throw new ExcelImportServerError(401, "Μη έγκυρο token.")
  }

  const db = getAdminDb()
  const adminSnap = await db.collection(FIREBASE_COLLECTIONS.USERS).doc(decoded.uid).get()
  const adminData = adminSnap.exists ? asRecord(adminSnap.data()) : null
  if (!adminData || adminData.accessLevel !== "Διαχειριστής") {
    throw new ExcelImportServerError(403, "Δεν έχετε δικαιώματα διαχειριστή.")
  }

  return {
    uid: decoded.uid,
    displayName: String(adminData.displayName || adminData.username || "Διαχειριστής"),
  }
}

export async function getLatestExcelImportSummary() {
  const db = getAdminDb()
  const latestSnap = await db
    .collection(FIREBASE_COLLECTIONS.EXCEL_IMPORTS)
    .orderBy("createdAt", "desc")
    .limit(1)
    .get()

  if (latestSnap.empty) return null
  const doc = latestSnap.docs[0]
  return mapImportSummary(doc.data() as Record<string, unknown>, doc.id)
}

export async function getLatestCompletedExcelImportSummary() {
  const db = getAdminDb()
  let cursor: FirebaseFirestore.QueryDocumentSnapshot | null = null

  while (true) {
    let query = db.collection(FIREBASE_COLLECTIONS.EXCEL_IMPORTS).orderBy("createdAt", "desc").limit(25)
    if (cursor) {
      query = query.startAfter(cursor)
    }

    const snap = await query.get()
    if (snap.empty) return null

    for (const doc of snap.docs) {
      const summary = mapImportSummary(doc.data() as Record<string, unknown>, doc.id)
      if (summary.status === "completed") {
        return summary
      }
    }

    if (snap.size < 25) {
      return null
    }

    cursor = snap.docs[snap.docs.length - 1]
  }
}

export async function listCompletedExcelImportSummaries() {
  const db = getAdminDb()
  const snap = await db
    .collection(FIREBASE_COLLECTIONS.EXCEL_IMPORTS)
    .orderBy("createdAt", "asc")
    .get()

  return snap.docs
    .map((doc) => mapImportSummary(doc.data() as Record<string, unknown>, doc.id))
    .filter((summary) => summary.status === "completed")
}

export async function runExcelImport(params: {
  photoBuffer: ArrayBuffer
  laminationBuffer: ArrayBuffer
  photoFileName: string
  laminationFileName: string
  allowCreateUsers: boolean
  actor: AdminActor
}) {
  const db = getAdminDb()
  const parsed = parseExcelImportFiles(params.photoBuffer, params.laminationBuffer)
  const users = await loadAllUsers()
  const latestCompletedImport = await getLatestCompletedExcelImportSummary()
  const plan = buildExcelImportPlan(parsed, users, {
    allowCreateUsers: params.allowCreateUsers,
    latestCompletedImportPeriodKey: latestCompletedImport?.periodKey ?? null,
  })
  const importableRows = plan.rows.filter((row) => row.canImport)

  importRowSchema.array().parse(
    importableRows.map((row) => ({
      rowNumber: row.rowNumber,
      code: row.code,
      username: row.username,
      dbUserName: row.dbUserName,
      oldPrintDebt: row.oldPrintDebt,
      oldLaminationDebt: row.oldLaminationDebt,
      totalBwCount: row.totalBwCount,
      color3330Count: row.color3330Count,
      extraPrintCharge: row.extraPrintCharge,
      newPrintCharge: row.newPrintCharge,
      newLaminationCharge: row.newLaminationCharge,
      finalExcelTotalDebt: row.finalExcelTotalDebt,
      computedFinalTotalDebt: row.computedFinalTotalDebt,
      canImport: row.canImport,
    }))
  )

  if (plan.blockingErrors.length > 0) {
    throw new ExcelImportServerError(400, plan.blockingErrors.join(" "))
  }

  const usersByUsername = new Map(users.map((user) => [String(user.username).trim(), user]))
  const resolvedRows: ResolvedImportRow[] = importableRows.map((row) => {
    const existingUser = usersByUsername.get(row.username) ?? null
    return {
      ...row,
      dbUserUid: existingUser?.uid ?? `excel-import-${row.username}`,
      dbUserName: existingUser?.displayName ?? row.excelName,
      inferredUserRole: existingUser?.userRole ?? row.inferredUserRole,
      matchedExistingUser: Boolean(existingUser),
    }
  })

  const now = new Date()
  const importEventTimestamp = getImportEventTimestamp(parsed.period.endDate)
  const importId = `excel-${parsed.period.key}-${now.getTime()}`
  const importRef = db.collection(FIREBASE_COLLECTIONS.EXCEL_IMPORTS).doc(importId)

  const printRefs: DocumentReference[] = []
  const laminationRefs: DocumentReference[] = []
  const userRestores = new Map<string, UserRestoreRecord>()
  const mutationOperations: BatchOperation[] = []
  const createdUserIds = new Set<string>()

  for (const row of resolvedRows) {
    const existingUser = usersByUsername.get(row.username) ?? null
    userRestores.set(row.dbUserUid, {
      existedBefore: Boolean(existingUser),
      previousOpeningPrintDebt:
        typeof existingUser?.openingPrintDebt === "number" ? existingUser.openingPrintDebt : null,
      previousOpeningLaminationDebt:
        typeof existingUser?.openingLaminationDebt === "number" ? existingUser.openingLaminationDebt : null,
      previousOpeningDebtSource: existingUser?.openingDebtSource ?? null,
      previousOpeningDebtImportedAt: existingUser?.openingDebtImportedAt ?? null,
    })

    const ids = getSyntheticImportDocumentIds(row.username, parsed.period.key)
    printRefs.push(
      db.collection(FIREBASE_COLLECTIONS.PRINT_JOBS).doc(ids.printBw),
      db.collection(FIREBASE_COLLECTIONS.PRINT_JOBS).doc(ids.printColor),
      db.collection(FIREBASE_COLLECTIONS.PRINT_JOBS).doc(ids.printAdjustment)
    )
    laminationRefs.push(db.collection(FIREBASE_COLLECTIONS.LAMINATION_JOBS).doc(ids.lamination))

    const userRef = db.collection(FIREBASE_COLLECTIONS.USERS).doc(row.dbUserUid)
    if (!existingUser) {
      createdUserIds.add(row.dbUserUid)
      mutationOperations.push({
        kind: "set",
        ref: userRef,
        data: {
          uid: row.dbUserUid,
          username: row.username,
          displayName: row.excelName,
          createdAt: now,
          userRole: row.inferredUserRole,
          accessLevel: "Χρήστης",
          role: "user",
          printDebt: 0,
          laminationDebt: 0,
          totalDebt: 0,
        },
      })
    }
    if (!existingUser?.openingDebtSource) {
      mutationOperations.push({
        kind: "set",
        ref: userRef,
        data: {
          openingPrintDebt: row.oldPrintDebt,
          openingLaminationDebt: row.oldLaminationDebt,
          openingDebtSource: parsed.period.key,
          openingDebtImportedAt: now,
        },
        options: { merge: true },
      })
    }

    const printJobs = createSyntheticPrintJobs(row, parsed.period.key, importId, importEventTimestamp, now)
    const printJobsById = new Map(printJobs.map((job) => [job.jobId, job]))
    for (const jobId of [ids.printBw, ids.printColor, ids.printAdjustment]) {
      const ref = db.collection(FIREBASE_COLLECTIONS.PRINT_JOBS).doc(jobId)
      const job = printJobsById.get(jobId)
      if (job) {
        mutationOperations.push({ kind: "set", ref, data: job as unknown as Record<string, unknown> })
      } else {
        mutationOperations.push({ kind: "delete", ref })
      }
    }

    const laminationJobs = createSyntheticLaminationJobs(row, parsed.period.key, importId, importEventTimestamp, now)
    const laminationJob = laminationJobs[0] ?? null
    const laminationRef = db.collection(FIREBASE_COLLECTIONS.LAMINATION_JOBS).doc(ids.lamination)
    if (laminationJob) {
      mutationOperations.push({
        kind: "set",
        ref: laminationRef,
        data: laminationJob as unknown as Record<string, unknown>,
      })
    } else {
      mutationOperations.push({ kind: "delete", ref: laminationRef })
    }
  }

  const [existingPrintDocs, existingLaminationDocs] = await Promise.all([
    getExistingDocsMap(printRefs),
    getExistingDocsMap(laminationRefs),
  ])

  const metadataOperations: BatchOperation[] = [
    {
      kind: "set",
      ref: importRef,
      data: {
        importId,
        periodKey: parsed.period.key,
        periodLabel: parsed.period.label,
        rowCount: resolvedRows.length,
        missingUsers: plan.totals.missingUsers,
        createdAt: now,
        createdByUid: params.actor.uid,
        createdByDisplayName: params.actor.displayName,
        status: "running",
        finalExcelDebt: plan.totals.finalExcelDebt,
        computedFinalDebt: plan.totals.computedFinalDebt,
        allowCreateUsers: params.allowCreateUsers,
        photoFileName: params.photoFileName,
        laminationFileName: params.laminationFileName,
        warnings: [...parsed.warnings, ...plan.warnings],
        createdUserCount: createdUserIds.size,
      },
    },
  ]

  for (const [uid, restore] of userRestores.entries()) {
    metadataOperations.push({
      kind: "set",
      ref: importRef.collection("userRestores").doc(uid),
      data: restore as unknown as Record<string, unknown>,
    })
  }

  for (const ref of printRefs) {
    const snapshot = existingPrintDocs.get(ref.id)
    metadataOperations.push({
      kind: "set",
      ref: importRef.collection("printJobRestores").doc(ref.id),
      data: {
        existedBefore: Boolean(snapshot?.exists),
        beforeData: snapshot?.exists ? snapshot.data : null,
      },
    })
  }

  for (const ref of laminationRefs) {
    const snapshot = existingLaminationDocs.get(ref.id)
    metadataOperations.push({
      kind: "set",
      ref: importRef.collection("laminationJobRestores").doc(ref.id),
      data: {
        existedBefore: Boolean(snapshot?.exists),
        beforeData: snapshot?.exists ? snapshot.data : null,
      },
    })
  }

  await commitBatchOperations(metadataOperations)

  try {
    await commitBatchOperations(mutationOperations)
    await recomputeUsers(Array.from(userRestores.keys()))
    await importRef.set(
      {
        status: "completed",
        completedAt: importEventTimestamp,
      },
      { merge: true }
    )
  } catch (error: unknown) {
    await rollbackImportInternal(importId, params.actor, {
      failed: true,
      failureMessage:
        error instanceof Error && error.message ? error.message : "failed",
    })
    throw error
  }

  return mapImportSummary(
    {
      importId,
      periodKey: parsed.period.key,
      periodLabel: parsed.period.label,
      rowCount: resolvedRows.length,
      missingUsers: plan.totals.missingUsers,
      createdAt: now,
      completedAt: importEventTimestamp,
      createdByUid: params.actor.uid,
      createdByDisplayName: params.actor.displayName,
      status: "completed",
      finalExcelDebt: plan.totals.finalExcelDebt,
      computedFinalDebt: plan.totals.computedFinalDebt,
    },
    importId
  )
}

export async function rollbackExcelImport(importId: string, actor: AdminActor) {
  const latest = await getLatestCompletedExcelImportSummary()
  if (!latest || latest.importId !== importId) {
    throw new ExcelImportServerError(400, "Μπορεί να αναιρεθεί μόνο η πιο πρόσφατη εισαγωγή Excel.")
  }

  await rollbackImportInternal(importId, actor)
  const updated = await getLatestExcelImportSummary()
  if (!updated) {
    throw new ExcelImportServerError(500, "Η κατάσταση της εισαγωγής δεν ήταν διαθέσιμη μετά την αναίρεση.")
  }
  return updated
}
