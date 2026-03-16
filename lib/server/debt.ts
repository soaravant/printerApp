import { getAdminDb } from "@/lib/firebase-admin"
import { FIREBASE_COLLECTIONS, FirebasePrintJob, FirebaseLaminationJob, FirebaseIncome } from "@/lib/firebase-schema"
import { coerceToDate, computeDebtsAndBankForUser } from "@/lib/debt-projection"

export async function recomputeUserDebt(uid: string): Promise<void> {
  const db = getAdminDb()
  const [userSnap, pSnap, lSnap, iSnap] = await Promise.all([
    db.collection(FIREBASE_COLLECTIONS.USERS).doc(uid).get(),
    db.collection(FIREBASE_COLLECTIONS.PRINT_JOBS).where("uid", "==", uid).get(),
    db.collection(FIREBASE_COLLECTIONS.LAMINATION_JOBS).where("uid", "==", uid).get(),
    db.collection(FIREBASE_COLLECTIONS.INCOME).where("uid", "==", uid).get(),
  ])
  const userDoc = (userSnap.exists ? userSnap.data() : {}) as Record<string, unknown>

  const printJobs = pSnap.docs.map(d => d.data() as FirebasePrintJob)
  const lamJobs = lSnap.docs.map(d => d.data() as FirebaseLaminationJob)
  const incomes = iSnap.docs.map(d => d.data() as FirebaseIncome)

  const events: Array<{ kind: "print" | "lamination" | "income"; amount: number; timestamp: Date }> = []
  for (const job of printJobs) {
    const timestamp = coerceToDate(job.timestamp)
    if (!timestamp) continue
    events.push({ kind: "print", amount: job.totalCost, timestamp })
  }
  for (const job of lamJobs) {
    const timestamp = coerceToDate(job.timestamp)
    if (!timestamp) continue
    events.push({ kind: "lamination", amount: job.totalCost, timestamp })
  }
  for (const income of incomes) {
    const timestamp = coerceToDate(income.timestamp)
    if (!timestamp) continue
    events.push({ kind: "income", amount: income.amount, timestamp })
  }

  const { debts } = computeDebtsAndBankForUser(events, {
    printDebt: Number(userDoc.openingPrintDebt || 0),
    laminationDebt: Number(userDoc.openingLaminationDebt || 0),
  })

  // Update user doc
  // Compute last payment timestamp from incomes
  const lastPayment: Date | null = incomes.length
    ? incomes
      .map((income) => coerceToDate(income.timestamp))
      .filter((timestamp): timestamp is Date => Boolean(timestamp))
      .reduce((latest, current) => (current > latest ? current : latest))
    : null

  await db.collection(FIREBASE_COLLECTIONS.USERS).doc(uid).update({
    printDebt: debts.printDebt,
    laminationDebt: debts.laminationDebt,
    totalDebt: debts.totalDebt,
    lastPayment: lastPayment || null,
  })

  // Update bank document incrementally by reading current bank and applying this user's latest income
  // For simplicity, recompute user's contributions from incomes vs debts snapshot and add to totals.
  // Here we'll approximate by summing all incomes for all users only once to avoid heavy fan-out.
  // Cheaper approach: maintain bank via Cloud Scheduler/cron; for now, skip heavy recompute here.
}
