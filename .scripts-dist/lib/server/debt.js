"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recomputeUserDebt = recomputeUserDebt;
const firebase_admin_1 = require("@/lib/firebase-admin");
const firebase_schema_1 = require("@/lib/firebase-schema");
const debt_projection_1 = require("@/lib/debt-projection");
async function recomputeUserDebt(uid) {
    const db = (0, firebase_admin_1.getAdminDb)();
    const [userSnap, pSnap, lSnap, iSnap] = await Promise.all([
        db.collection(firebase_schema_1.FIREBASE_COLLECTIONS.USERS).doc(uid).get(),
        db.collection(firebase_schema_1.FIREBASE_COLLECTIONS.PRINT_JOBS).where("uid", "==", uid).get(),
        db.collection(firebase_schema_1.FIREBASE_COLLECTIONS.LAMINATION_JOBS).where("uid", "==", uid).get(),
        db.collection(firebase_schema_1.FIREBASE_COLLECTIONS.INCOME).where("uid", "==", uid).get(),
    ]);
    const userDoc = (userSnap.exists ? userSnap.data() : {});
    const printJobs = pSnap.docs.map(d => d.data());
    const lamJobs = lSnap.docs.map(d => d.data());
    const incomes = iSnap.docs.map(d => d.data());
    const events = [];
    for (const job of printJobs) {
        const timestamp = (0, debt_projection_1.coerceToDate)(job.timestamp);
        if (!timestamp)
            continue;
        events.push({ kind: "print", amount: job.totalCost, timestamp });
    }
    for (const job of lamJobs) {
        const timestamp = (0, debt_projection_1.coerceToDate)(job.timestamp);
        if (!timestamp)
            continue;
        events.push({ kind: "lamination", amount: job.totalCost, timestamp });
    }
    for (const income of incomes) {
        const timestamp = (0, debt_projection_1.coerceToDate)(income.timestamp);
        if (!timestamp)
            continue;
        events.push({ kind: "income", amount: income.amount, timestamp });
    }
    const { debts } = (0, debt_projection_1.computeDebtsAndBankForUser)(events, {
        printDebt: Number(userDoc.openingPrintDebt || 0),
        laminationDebt: Number(userDoc.openingLaminationDebt || 0),
    });
    // Update user doc
    // Compute last payment timestamp from incomes
    const lastPayment = incomes.length
        ? incomes
            .map((income) => (0, debt_projection_1.coerceToDate)(income.timestamp))
            .filter((timestamp) => Boolean(timestamp))
            .reduce((latest, current) => (current > latest ? current : latest))
        : null;
    await db.collection(firebase_schema_1.FIREBASE_COLLECTIONS.USERS).doc(uid).update({
        printDebt: debts.printDebt,
        laminationDebt: debts.laminationDebt,
        totalDebt: debts.totalDebt,
        lastPayment: lastPayment || null,
    });
    // Update bank document incrementally by reading current bank and applying this user's latest income
    // For simplicity, recompute user's contributions from incomes vs debts snapshot and add to totals.
    // Here we'll approximate by summing all incomes for all users only once to avoid heavy fan-out.
    // Cheaper approach: maintain bank via Cloud Scheduler/cron; for now, skip heavy recompute here.
}
