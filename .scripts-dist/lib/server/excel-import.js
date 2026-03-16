"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExcelImportServerError = void 0;
exports.verifyExcelImportAdmin = verifyExcelImportAdmin;
exports.getLatestExcelImportSummary = getLatestExcelImportSummary;
exports.getLatestCompletedExcelImportSummary = getLatestCompletedExcelImportSummary;
exports.listCompletedExcelImportSummaries = listCompletedExcelImportSummaries;
exports.runExcelImport = runExcelImport;
exports.rollbackExcelImport = rollbackExcelImport;
const firestore_1 = require("firebase-admin/firestore");
const zod_1 = require("zod");
const excel_import_1 = require("@/lib/excel-import");
const firebase_admin_1 = require("@/lib/firebase-admin");
const firebase_schema_1 = require("@/lib/firebase-schema");
const debt_1 = require("@/lib/server/debt");
const MAX_BATCH_OPERATIONS = 400;
const importRowSchema = zod_1.z.object({
    rowNumber: zod_1.z.number().int().positive(),
    code: zod_1.z.string().min(1),
    username: zod_1.z.string().min(1),
    dbUserName: zod_1.z.string().min(1),
    oldPrintDebt: zod_1.z.number(),
    oldLaminationDebt: zod_1.z.number(),
    totalBwCount: zod_1.z.number().min(0),
    color3330Count: zod_1.z.number().min(0),
    extraPrintCharge: zod_1.z.number(),
    newPrintCharge: zod_1.z.number(),
    newLaminationCharge: zod_1.z.number(),
    finalExcelTotalDebt: zod_1.z.number(),
    computedFinalTotalDebt: zod_1.z.number(),
    canImport: zod_1.z.boolean(),
});
class ExcelImportServerError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}
exports.ExcelImportServerError = ExcelImportServerError;
function asRecord(value) {
    if (value && typeof value === "object") {
        return value;
    }
    return {};
}
function pruneUndefined(value) {
    if (Array.isArray(value)) {
        return value.map((item) => pruneUndefined(item));
    }
    if (value && typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype) {
        const next = {};
        for (const [key, entry] of Object.entries(value)) {
            if (entry === undefined)
                continue;
            next[key] = pruneUndefined(entry);
        }
        return next;
    }
    return value;
}
function getImportEventTimestamp(endDate) {
    if (!endDate)
        return new Date();
    const next = new Date(`${endDate}T12:00:00.000Z`);
    return Number.isNaN(next.getTime()) ? new Date() : next;
}
async function commitBatchOperations(operations) {
    const db = (0, firebase_admin_1.getAdminDb)();
    for (let index = 0; index < operations.length; index += MAX_BATCH_OPERATIONS) {
        const chunk = operations.slice(index, index + MAX_BATCH_OPERATIONS);
        const batch = db.batch();
        for (const operation of chunk) {
            if (operation.kind === "set") {
                if (operation.options) {
                    batch.set(operation.ref, pruneUndefined(operation.data), operation.options);
                }
                else {
                    batch.set(operation.ref, pruneUndefined(operation.data));
                }
            }
            else {
                batch.delete(operation.ref);
            }
        }
        await batch.commit();
    }
}
function restoreFieldOrDelete(value) {
    return value === null || value === undefined ? firestore_1.FieldValue.delete() : value;
}
function mapImportSummary(data, importId) {
    var _a, _b;
    return {
        importId,
        periodKey: String(data.periodKey || ""),
        periodLabel: String(data.periodLabel || ""),
        rowCount: Number(data.rowCount || 0),
        missingUsers: Number(data.missingUsers || 0),
        createdAt: data.createdAt,
        completedAt: (_a = data.completedAt) !== null && _a !== void 0 ? _a : null,
        createdByUid: String(data.createdByUid || ""),
        createdByDisplayName: String(data.createdByDisplayName || ""),
        status: data.status || "failed",
        rolledBackAt: (_b = data.rolledBackAt) !== null && _b !== void 0 ? _b : null,
        finalExcelDebt: Number(data.finalExcelDebt || 0),
        computedFinalDebt: Number(data.computedFinalDebt || 0),
    };
}
async function loadAllUsers() {
    const db = (0, firebase_admin_1.getAdminDb)();
    const usersSnap = await db.collection(firebase_schema_1.FIREBASE_COLLECTIONS.USERS).get();
    return usersSnap.docs.map((doc) => {
        const data = asRecord(doc.data());
        return {
            ...data,
            uid: doc.id,
            username: String(data.username || ""),
            displayName: String(data.displayName || ""),
            userRole: (data.userRole || (0, excel_import_1.inferUserRoleFromExcelName)(String(data.displayName || ""))),
        };
    });
}
async function getExistingDocsMap(refs) {
    const db = (0, firebase_admin_1.getAdminDb)();
    const result = new Map();
    for (let index = 0; index < refs.length; index += 250) {
        const chunk = refs.slice(index, index + 250);
        const snapshots = await db.getAll(...chunk);
        snapshots.forEach((snapshot) => {
            result.set(snapshot.ref.id, {
                exists: snapshot.exists,
                data: snapshot.exists ? snapshot.data() : null,
            });
        });
    }
    return result;
}
async function getImportRestoreSnapshots(importId) {
    const db = (0, firebase_admin_1.getAdminDb)();
    const importRef = db.collection(firebase_schema_1.FIREBASE_COLLECTIONS.EXCEL_IMPORTS).doc(importId);
    const [userRestoreSnap, printRestoreSnap, laminationRestoreSnap] = await Promise.all([
        importRef.collection("userRestores").get(),
        importRef.collection("printJobRestores").get(),
        importRef.collection("laminationJobRestores").get(),
    ]);
    return {
        importRef,
        userRestores: userRestoreSnap.docs.map((doc) => ({
            uid: doc.id,
            ...doc.data(),
        })),
        printJobRestores: printRestoreSnap.docs.map((doc) => ({
            jobId: doc.id,
            ...doc.data(),
        })),
        laminationJobRestores: laminationRestoreSnap.docs.map((doc) => ({
            jobId: doc.id,
            ...doc.data(),
        })),
    };
}
async function recomputeUsers(userIds) {
    for (const uid of userIds) {
        await (0, debt_1.recomputeUserDebt)(uid);
    }
}
async function cleanupNewUsers(userRestores) {
    const db = (0, firebase_admin_1.getAdminDb)();
    for (const restore of userRestores.filter((entry) => !entry.existedBefore)) {
        const [printSnap, laminationSnap, incomeSnap] = await Promise.all([
            db.collection(firebase_schema_1.FIREBASE_COLLECTIONS.PRINT_JOBS).where("uid", "==", restore.uid).limit(1).get(),
            db.collection(firebase_schema_1.FIREBASE_COLLECTIONS.LAMINATION_JOBS).where("uid", "==", restore.uid).limit(1).get(),
            db.collection(firebase_schema_1.FIREBASE_COLLECTIONS.INCOME).where("uid", "==", restore.uid).limit(1).get(),
        ]);
        const hasRemainingRecords = !printSnap.empty || !laminationSnap.empty || !incomeSnap.empty;
        if (!hasRemainingRecords) {
            await db.collection(firebase_schema_1.FIREBASE_COLLECTIONS.USERS).doc(restore.uid).delete();
        }
    }
}
async function rollbackImportInternal(importId, actor, options) {
    const db = (0, firebase_admin_1.getAdminDb)();
    const { importRef, userRestores, printJobRestores, laminationJobRestores } = await getImportRestoreSnapshots(importId);
    const importSnap = await importRef.get();
    if (!importSnap.exists) {
        throw new ExcelImportServerError(404, "Η εισαγωγή Excel δεν βρέθηκε.");
    }
    const restoreOperations = [];
    for (const restore of printJobRestores) {
        const ref = db.collection(firebase_schema_1.FIREBASE_COLLECTIONS.PRINT_JOBS).doc(restore.jobId);
        if (restore.existedBefore && restore.beforeData) {
            restoreOperations.push({ kind: "set", ref, data: restore.beforeData });
        }
        else {
            restoreOperations.push({ kind: "delete", ref });
        }
    }
    for (const restore of laminationJobRestores) {
        const ref = db.collection(firebase_schema_1.FIREBASE_COLLECTIONS.LAMINATION_JOBS).doc(restore.jobId);
        if (restore.existedBefore && restore.beforeData) {
            restoreOperations.push({ kind: "set", ref, data: restore.beforeData });
        }
        else {
            restoreOperations.push({ kind: "delete", ref });
        }
    }
    for (const restore of userRestores) {
        const ref = db.collection(firebase_schema_1.FIREBASE_COLLECTIONS.USERS).doc(restore.uid);
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
        });
    }
    await commitBatchOperations(restoreOperations);
    await recomputeUsers(userRestores.map((restore) => restore.uid));
    await cleanupNewUsers(userRestores);
    await importRef.set({
        status: (options === null || options === void 0 ? void 0 : options.failed) ? "failed" : "rolled_back",
        failureMessage: (options === null || options === void 0 ? void 0 : options.failureMessage) || null,
        rolledBackAt: new Date(),
        rolledBackByUid: actor.uid,
        rolledBackByDisplayName: actor.displayName,
    }, { merge: true });
}
async function verifyExcelImportAdmin(idToken) {
    const auth = (0, firebase_admin_1.getAdminAuth)();
    let decoded;
    try {
        decoded = await auth.verifyIdToken(idToken);
    }
    catch {
        throw new ExcelImportServerError(401, "Μη έγκυρο token.");
    }
    const db = (0, firebase_admin_1.getAdminDb)();
    const adminSnap = await db.collection(firebase_schema_1.FIREBASE_COLLECTIONS.USERS).doc(decoded.uid).get();
    const adminData = adminSnap.exists ? asRecord(adminSnap.data()) : null;
    if (!adminData || adminData.accessLevel !== "Διαχειριστής") {
        throw new ExcelImportServerError(403, "Δεν έχετε δικαιώματα διαχειριστή.");
    }
    return {
        uid: decoded.uid,
        displayName: String(adminData.displayName || adminData.username || "Διαχειριστής"),
    };
}
async function getLatestExcelImportSummary() {
    const db = (0, firebase_admin_1.getAdminDb)();
    const latestSnap = await db
        .collection(firebase_schema_1.FIREBASE_COLLECTIONS.EXCEL_IMPORTS)
        .orderBy("createdAt", "desc")
        .limit(1)
        .get();
    if (latestSnap.empty)
        return null;
    const doc = latestSnap.docs[0];
    return mapImportSummary(doc.data(), doc.id);
}
async function getLatestCompletedExcelImportSummary() {
    const db = (0, firebase_admin_1.getAdminDb)();
    let cursor = null;
    while (true) {
        let query = db.collection(firebase_schema_1.FIREBASE_COLLECTIONS.EXCEL_IMPORTS).orderBy("createdAt", "desc").limit(25);
        if (cursor) {
            query = query.startAfter(cursor);
        }
        const snap = await query.get();
        if (snap.empty)
            return null;
        for (const doc of snap.docs) {
            const summary = mapImportSummary(doc.data(), doc.id);
            if (summary.status === "completed") {
                return summary;
            }
        }
        if (snap.size < 25) {
            return null;
        }
        cursor = snap.docs[snap.docs.length - 1];
    }
}
async function listCompletedExcelImportSummaries() {
    const db = (0, firebase_admin_1.getAdminDb)();
    const snap = await db
        .collection(firebase_schema_1.FIREBASE_COLLECTIONS.EXCEL_IMPORTS)
        .orderBy("createdAt", "asc")
        .get();
    return snap.docs
        .map((doc) => mapImportSummary(doc.data(), doc.id))
        .filter((summary) => summary.status === "completed");
}
async function runExcelImport(params) {
    var _a, _b, _c, _d, _e;
    const db = (0, firebase_admin_1.getAdminDb)();
    const parsed = (0, excel_import_1.parseExcelImportFiles)(params.photoBuffer, params.laminationBuffer);
    const users = await loadAllUsers();
    const latestCompletedImport = await getLatestCompletedExcelImportSummary();
    const plan = (0, excel_import_1.buildExcelImportPlan)(parsed, users, {
        allowCreateUsers: params.allowCreateUsers,
        latestCompletedImportPeriodKey: (_a = latestCompletedImport === null || latestCompletedImport === void 0 ? void 0 : latestCompletedImport.periodKey) !== null && _a !== void 0 ? _a : null,
    });
    const importableRows = plan.rows.filter((row) => row.canImport);
    importRowSchema.array().parse(importableRows.map((row) => ({
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
    })));
    if (plan.blockingErrors.length > 0) {
        throw new ExcelImportServerError(400, plan.blockingErrors.join(" "));
    }
    const usersByUsername = new Map(users.map((user) => [String(user.username).trim(), user]));
    const resolvedRows = importableRows.map((row) => {
        var _a, _b, _c, _d;
        const existingUser = (_a = usersByUsername.get(row.username)) !== null && _a !== void 0 ? _a : null;
        return {
            ...row,
            dbUserUid: (_b = existingUser === null || existingUser === void 0 ? void 0 : existingUser.uid) !== null && _b !== void 0 ? _b : `excel-import-${row.username}`,
            dbUserName: (_c = existingUser === null || existingUser === void 0 ? void 0 : existingUser.displayName) !== null && _c !== void 0 ? _c : row.excelName,
            inferredUserRole: (_d = existingUser === null || existingUser === void 0 ? void 0 : existingUser.userRole) !== null && _d !== void 0 ? _d : row.inferredUserRole,
            matchedExistingUser: Boolean(existingUser),
        };
    });
    const now = new Date();
    const importEventTimestamp = getImportEventTimestamp(parsed.period.endDate);
    const importId = `excel-${parsed.period.key}-${now.getTime()}`;
    const importRef = db.collection(firebase_schema_1.FIREBASE_COLLECTIONS.EXCEL_IMPORTS).doc(importId);
    const printRefs = [];
    const laminationRefs = [];
    const userRestores = new Map();
    const mutationOperations = [];
    const createdUserIds = new Set();
    for (const row of resolvedRows) {
        const existingUser = (_b = usersByUsername.get(row.username)) !== null && _b !== void 0 ? _b : null;
        userRestores.set(row.dbUserUid, {
            existedBefore: Boolean(existingUser),
            previousOpeningPrintDebt: typeof (existingUser === null || existingUser === void 0 ? void 0 : existingUser.openingPrintDebt) === "number" ? existingUser.openingPrintDebt : null,
            previousOpeningLaminationDebt: typeof (existingUser === null || existingUser === void 0 ? void 0 : existingUser.openingLaminationDebt) === "number" ? existingUser.openingLaminationDebt : null,
            previousOpeningDebtSource: (_c = existingUser === null || existingUser === void 0 ? void 0 : existingUser.openingDebtSource) !== null && _c !== void 0 ? _c : null,
            previousOpeningDebtImportedAt: (_d = existingUser === null || existingUser === void 0 ? void 0 : existingUser.openingDebtImportedAt) !== null && _d !== void 0 ? _d : null,
        });
        const ids = (0, excel_import_1.getSyntheticImportDocumentIds)(row.username, parsed.period.key);
        printRefs.push(db.collection(firebase_schema_1.FIREBASE_COLLECTIONS.PRINT_JOBS).doc(ids.printBw), db.collection(firebase_schema_1.FIREBASE_COLLECTIONS.PRINT_JOBS).doc(ids.printColor), db.collection(firebase_schema_1.FIREBASE_COLLECTIONS.PRINT_JOBS).doc(ids.printAdjustment));
        laminationRefs.push(db.collection(firebase_schema_1.FIREBASE_COLLECTIONS.LAMINATION_JOBS).doc(ids.lamination));
        const userRef = db.collection(firebase_schema_1.FIREBASE_COLLECTIONS.USERS).doc(row.dbUserUid);
        if (!existingUser) {
            createdUserIds.add(row.dbUserUid);
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
            });
        }
        if (!(existingUser === null || existingUser === void 0 ? void 0 : existingUser.openingDebtSource)) {
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
            });
        }
        const printJobs = (0, excel_import_1.createSyntheticPrintJobs)(row, parsed.period.key, importId, importEventTimestamp, now);
        const printJobsById = new Map(printJobs.map((job) => [job.jobId, job]));
        for (const jobId of [ids.printBw, ids.printColor, ids.printAdjustment]) {
            const ref = db.collection(firebase_schema_1.FIREBASE_COLLECTIONS.PRINT_JOBS).doc(jobId);
            const job = printJobsById.get(jobId);
            if (job) {
                mutationOperations.push({ kind: "set", ref, data: job });
            }
            else {
                mutationOperations.push({ kind: "delete", ref });
            }
        }
        const laminationJobs = (0, excel_import_1.createSyntheticLaminationJobs)(row, parsed.period.key, importId, importEventTimestamp, now);
        const laminationJob = (_e = laminationJobs[0]) !== null && _e !== void 0 ? _e : null;
        const laminationRef = db.collection(firebase_schema_1.FIREBASE_COLLECTIONS.LAMINATION_JOBS).doc(ids.lamination);
        if (laminationJob) {
            mutationOperations.push({
                kind: "set",
                ref: laminationRef,
                data: laminationJob,
            });
        }
        else {
            mutationOperations.push({ kind: "delete", ref: laminationRef });
        }
    }
    const [existingPrintDocs, existingLaminationDocs] = await Promise.all([
        getExistingDocsMap(printRefs),
        getExistingDocsMap(laminationRefs),
    ]);
    const metadataOperations = [
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
    ];
    for (const [uid, restore] of userRestores.entries()) {
        metadataOperations.push({
            kind: "set",
            ref: importRef.collection("userRestores").doc(uid),
            data: restore,
        });
    }
    for (const ref of printRefs) {
        const snapshot = existingPrintDocs.get(ref.id);
        metadataOperations.push({
            kind: "set",
            ref: importRef.collection("printJobRestores").doc(ref.id),
            data: {
                existedBefore: Boolean(snapshot === null || snapshot === void 0 ? void 0 : snapshot.exists),
                beforeData: (snapshot === null || snapshot === void 0 ? void 0 : snapshot.exists) ? snapshot.data : null,
            },
        });
    }
    for (const ref of laminationRefs) {
        const snapshot = existingLaminationDocs.get(ref.id);
        metadataOperations.push({
            kind: "set",
            ref: importRef.collection("laminationJobRestores").doc(ref.id),
            data: {
                existedBefore: Boolean(snapshot === null || snapshot === void 0 ? void 0 : snapshot.exists),
                beforeData: (snapshot === null || snapshot === void 0 ? void 0 : snapshot.exists) ? snapshot.data : null,
            },
        });
    }
    await commitBatchOperations(metadataOperations);
    try {
        await commitBatchOperations(mutationOperations);
        await recomputeUsers(Array.from(userRestores.keys()));
        await importRef.set({
            status: "completed",
            completedAt: importEventTimestamp,
        }, { merge: true });
    }
    catch (error) {
        await rollbackImportInternal(importId, params.actor, {
            failed: true,
            failureMessage: error instanceof Error && error.message ? error.message : "failed",
        });
        throw error;
    }
    return mapImportSummary({
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
    }, importId);
}
async function rollbackExcelImport(importId, actor) {
    const latest = await getLatestCompletedExcelImportSummary();
    if (!latest || latest.importId !== importId) {
        throw new ExcelImportServerError(400, "Μπορεί να αναιρεθεί μόνο η πιο πρόσφατη εισαγωγή Excel.");
    }
    await rollbackImportInternal(importId, actor);
    const updated = await getLatestExcelImportSummary();
    if (!updated) {
        throw new ExcelImportServerError(500, "Η κατάσταση της εισαγωγής δεν ήταν διαθέσιμη μετά την αναίρεση.");
    }
    return updated;
}
