/* eslint-disable no-console */
import { config } from "dotenv"
import { existsSync, readFileSync } from "fs"
import { spawnSync } from "child_process"
import path from "path"
import Module from "module"

if (existsSync(".env.local")) config({ path: ".env.local" })
else config()

import { main as clearFirestore } from "./clear-firestore"
import { main as seedFirestore } from "./seed-firestore"
import getAdminDb from "./utils/firebase-admin"
import {
  FIREBASE_COLLECTIONS,
  FirebaseBank,
  FirebaseIncome,
  FirebaseLaminationJob,
  FirebasePrintJob,
  FirebaseUser,
} from "../lib/firebase-schema"

type GeneratedPair = {
  periodKey: string
  photoPath: string
  laminationPath: string
}

type GeneratedManifest = {
  createdAt: string
  pairs: GeneratedPair[]
}

const REPO_ROOT = path.resolve(__dirname, "../..")
const MANIFEST_PATH = path.join(REPO_ROOT, "generated-excel-import-pairs", "manifest.json")
const ADMIN_ACTOR = {
  uid: "admin-1",
  displayName: "Διαχειριστής",
}

let runExcelImport: typeof import("../lib/server/excel-import").runExcelImport
let recomputeUserDebt: typeof import("../lib/server/debt").recomputeUserDebt

function roundMoney(value: number) {
  return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100
}

function coerceToDate(value: any): Date | null {
  if (!value) return null
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value
  if (typeof value === "object" && typeof value.toDate === "function") {
    const next = value.toDate()
    return Number.isNaN(next.getTime()) ? null : next
  }
  if (typeof value === "object") {
    const seconds =
      typeof value._seconds === "number"
        ? value._seconds
        : typeof value.seconds === "number"
          ? value.seconds
          : null
    const nanoseconds =
      typeof value._nanoseconds === "number"
        ? value._nanoseconds
        : typeof value.nanoseconds === "number"
          ? value.nanoseconds
          : 0
    if (seconds !== null) {
      return new Date(seconds * 1000 + Math.floor(nanoseconds / 1_000_000))
    }
  }
  const next = new Date(value)
  return Number.isNaN(next.getTime()) ? null : next
}

function computeDebtsAndBankForUser(
  events: Array<{ kind: "print" | "lamination" | "income"; amount: number; timestamp: Date }>,
  openingBalances?: { printDebt: number; laminationDebt: number }
) {
  const sortedEvents = [...events].sort((left, right) => left.timestamp.getTime() - right.timestamp.getTime())
  let printDebt = Math.max(0, roundMoney(Number(openingBalances?.printDebt || 0)))
  let laminationDebt = Math.max(0, roundMoney(Number(openingBalances?.laminationDebt || 0)))
  let totalCredit = roundMoney(Math.max(0, -Number(openingBalances?.printDebt || 0)) + Math.max(0, -Number(openingBalances?.laminationDebt || 0)))
  let printBank = 0
  let laminationBank = 0

  for (const event of sortedEvents) {
    if (event.kind === "print") {
      if (totalCredit > 0) {
        if (event.amount <= totalCredit) {
          totalCredit = roundMoney(totalCredit - event.amount)
        } else {
          const remainder = roundMoney(event.amount - totalCredit)
          totalCredit = 0
          printDebt = roundMoney(printDebt + remainder)
        }
      } else {
        printDebt = roundMoney(printDebt + event.amount)
      }
      continue
    }

    if (event.kind === "lamination") {
      if (totalCredit > 0) {
        if (event.amount <= totalCredit) {
          totalCredit = roundMoney(totalCredit - event.amount)
        } else {
          const remainder = roundMoney(event.amount - totalCredit)
          totalCredit = 0
          laminationDebt = roundMoney(laminationDebt + remainder)
        }
      } else {
        laminationDebt = roundMoney(laminationDebt + event.amount)
      }
      continue
    }

    let remaining = roundMoney(event.amount)
    if (laminationDebt > 0) {
      const laminationPayment = Math.min(remaining, laminationDebt)
      laminationDebt = roundMoney(laminationDebt - laminationPayment)
      remaining = roundMoney(remaining - laminationPayment)
      laminationBank = roundMoney(laminationBank + laminationPayment)
    }
    if (remaining > 0 && printDebt > 0) {
      const printPayment = Math.min(remaining, printDebt)
      printDebt = roundMoney(printDebt - printPayment)
      remaining = roundMoney(remaining - printPayment)
      printBank = roundMoney(printBank + printPayment)
    }
    if (remaining > 0) {
      totalCredit = roundMoney(totalCredit + remaining)
      printBank = roundMoney(printBank + remaining)
    }
  }

  return {
    bank: {
      printBank,
      laminationBank,
    },
  }
}

function installAliasResolver() {
  const originalResolveFilename = (Module as any)._resolveFilename
  if ((installAliasResolver as any).installed) return

  ;(Module as any)._resolveFilename = function patchedResolveFilename(
    request: string,
    parent: unknown,
    isMain: boolean,
    options: unknown
  ) {
    if (request.startsWith("@/")) {
      const compiledTarget = path.join(REPO_ROOT, ".scripts-dist", request.slice(2))
      return originalResolveFilename.call(this, compiledTarget, parent, isMain, options)
    }
    return originalResolveFilename.call(this, request, parent, isMain, options)
  }

  ;(installAliasResolver as any).installed = true
}

function loadServerModules() {
  installAliasResolver()
  ;({ runExcelImport } = require("../lib/server/excel-import"))
  ;({ recomputeUserDebt } = require("../lib/server/debt"))
}

function bufferToArrayBuffer(buffer: Buffer): ArrayBuffer {
  return Uint8Array.from(buffer).buffer
}

function periodMidpointDate(periodKey: string) {
  const [yearPart, monthPart] = periodKey.split("-")
  const year = Number(yearPart)
  const month = Number(monthPart)
  return new Date(Date.UTC(year, month - 1, 20, 12, 0, 0))
}

function buildIncomeAmount(periodIndex: number, userIndex: number) {
  return 20 + ((periodIndex * 7 + userIndex * 11) % 8) * 5
}

function pickIncomeRecipients(users: FirebaseUser[], periodIndex: number) {
  const eligibleUsers = users
    .filter((user) => user.accessLevel === "Χρήστης")
    .filter((user) => user.userRole === "Ναός" || user.userRole === "Ομάδα" || user.userRole === "Άτομο")
    .sort((left, right) => left.username.localeCompare(right.username))

  if (eligibleUsers.length === 0) return []
  const recipientCount = Math.min(8, eligibleUsers.length)
  return Array.from({ length: recipientCount }, (_, offset) => eligibleUsers[(periodIndex * 5 + offset) % eligibleUsers.length])
}

async function generateExcelPairs() {
  const result = spawnSync(process.execPath, [path.join(REPO_ROOT, "scripts", "generate-excel-import-test-pairs.js")], {
    cwd: REPO_ROOT,
    stdio: "inherit",
  })

  if (result.status !== 0) {
    throw new Error("Failed to generate Excel import pairs.")
  }
}

function loadManifest() {
  const raw = readFileSync(MANIFEST_PATH, "utf8")
  return JSON.parse(raw) as GeneratedManifest
}

async function fetchAllUsers() {
  const db = getAdminDb()
  const snap = await db.collection(FIREBASE_COLLECTIONS.USERS).get()
  return snap.docs.map((doc) => doc.data() as FirebaseUser)
}

async function createDummyIncomeForPeriod(periodKey: string, periodIndex: number) {
  const db = getAdminDb()
  const users = await fetchAllUsers()
  const recipients = pickIncomeRecipients(users, periodIndex)
  const timestamp = periodMidpointDate(periodKey)
  const batch = db.batch()

  recipients.forEach((user, userIndex) => {
    const income: FirebaseIncome = {
      incomeId: `dummy-income-${periodKey}-${user.uid}`,
      uid: user.uid,
      username: user.username,
      userDisplayName: user.displayName,
      amount: buildIncomeAmount(periodIndex, userIndex),
      timestamp,
      createdAt: new Date(),
    }
    batch.set(db.collection(FIREBASE_COLLECTIONS.INCOME).doc(income.incomeId), income)
  })

  await batch.commit()
}

async function recomputeAllUsersAndBank() {
  const db = getAdminDb()
  const [usersSnap, printSnap, laminationSnap, incomeSnap] = await Promise.all([
    db.collection(FIREBASE_COLLECTIONS.USERS).get(),
    db.collection(FIREBASE_COLLECTIONS.PRINT_JOBS).get(),
    db.collection(FIREBASE_COLLECTIONS.LAMINATION_JOBS).get(),
    db.collection(FIREBASE_COLLECTIONS.INCOME).get(),
  ])

  const users = usersSnap.docs.map((doc) => doc.data() as FirebaseUser)
  for (const user of users) {
    await recomputeUserDebt(user.uid)
  }

  const printJobs = printSnap.docs.map((doc) => doc.data() as FirebasePrintJob)
  const laminationJobs = laminationSnap.docs.map((doc) => doc.data() as FirebaseLaminationJob)
  const incomes = incomeSnap.docs.map((doc) => doc.data() as FirebaseIncome)

  let printBank = 0
  let laminationBank = 0

  for (const user of users) {
    const events: Array<{ kind: "print" | "lamination" | "income"; amount: number; timestamp: Date }> = []
    const openingPrintDebt = Number(user.openingPrintDebt || 0)
    const openingLaminationDebt = Number(user.openingLaminationDebt || 0)

    printJobs
      .filter((job) => job.uid === user.uid)
      .forEach((job) => {
        const timestamp = coerceToDate(job.timestamp)
        if (!timestamp) return
        events.push({ kind: "print", amount: Number(job.totalCost || 0), timestamp })
      })

    laminationJobs
      .filter((job) => job.uid === user.uid)
      .forEach((job) => {
        const timestamp = coerceToDate(job.timestamp)
        if (!timestamp) return
        events.push({ kind: "lamination", amount: Number(job.totalCost || 0), timestamp })
      })

    incomes
      .filter((income) => income.uid === user.uid)
      .forEach((income) => {
        const timestamp = coerceToDate(income.timestamp)
        if (!timestamp) return
        events.push({ kind: "income", amount: Number(income.amount || 0), timestamp })
      })

    const { bank } = computeDebtsAndBankForUser(events, {
      printDebt: openingPrintDebt,
      laminationDebt: openingLaminationDebt,
    })

    printBank += bank.printBank
    laminationBank += bank.laminationBank
  }

  const bankDoc: FirebaseBank = {
    bankId: "main-bank",
    printBank,
    laminationBank,
    timestamp: new Date(),
    lastUpdated: new Date(),
  }

  await db.collection(FIREBASE_COLLECTIONS.BANK).doc(bankDoc.bankId).set(bankDoc)
}

export async function main() {
  loadServerModules()
  console.log("Generating monthly Excel pairs...")
  await generateExcelPairs()

  console.log("Clearing Firestore...")
  await clearFirestore()

  console.log("Seeding base Firestore documents...")
  await seedFirestore()

  const manifest = loadManifest()
  for (const [index, pair] of manifest.pairs.entries()) {
    console.log(`Importing ${pair.periodKey} (${index + 1}/${manifest.pairs.length})...`)
    const photoBuffer = readFileSync(pair.photoPath)
    const laminationBuffer = readFileSync(pair.laminationPath)
    await runExcelImport({
      photoBuffer: bufferToArrayBuffer(photoBuffer),
      laminationBuffer: bufferToArrayBuffer(laminationBuffer),
      photoFileName: path.basename(pair.photoPath),
      laminationFileName: path.basename(pair.laminationPath),
      allowCreateUsers: true,
      actor: ADMIN_ACTOR,
    })
  }

  for (const [index, pair] of manifest.pairs.entries()) {
    console.log(`Creating income for ${pair.periodKey} (${index + 1}/${manifest.pairs.length})...`)
    await createDummyIncomeForPeriod(pair.periodKey, index)
  }

  console.log("Recomputing balances and bank totals...")
  await recomputeAllUsersAndBank()
}

if (require.main === module) {
  main()
    .then(() => {
      console.log("Dummy history bootstrap completed")
      process.exit(0)
    })
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}
