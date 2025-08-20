import { getAdminDb } from "@/lib/firebase-admin"
import { FIREBASE_COLLECTIONS, FirebasePrintJob, FirebaseLaminationJob, FirebaseIncome } from "@/lib/firebase-schema"

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

type UserDebts = { printDebt: number; laminationDebt: number; totalDebt: number }
type BankIncrements = { printBank: number; laminationBank: number }

function computeDebtsAndBankForUser(events: Array<{ kind: "print" | "lamination" | "income"; amount: number; timestamp: Date }>): { debts: UserDebts; bank: BankIncrements } {
  events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
  let printDebt = 0
  let laminationDebt = 0
  let totalCredit = 0
  let printBank = 0
  let laminationBank = 0

  for (const e of events) {
    if (e.kind === "print") {
      if (totalCredit > 0) {
        if (e.amount <= totalCredit) {
          totalCredit = roundMoney(totalCredit - e.amount)
        } else {
          const remainder = roundMoney(e.amount - totalCredit)
          totalCredit = 0
          printDebt = roundMoney(printDebt + remainder)
        }
      } else {
        printDebt = roundMoney(printDebt + e.amount)
      }
    } else if (e.kind === "lamination") {
      if (totalCredit > 0) {
        if (e.amount <= totalCredit) {
          totalCredit = roundMoney(totalCredit - e.amount)
        } else {
          const remainder = roundMoney(e.amount - totalCredit)
          totalCredit = 0
          laminationDebt = roundMoney(laminationDebt + remainder)
        }
      } else {
        laminationDebt = roundMoney(laminationDebt + e.amount)
      }
    } else {
      let remaining = e.amount
      if (laminationDebt > 0) {
        const payL = Math.min(remaining, laminationDebt)
        laminationDebt = roundMoney(laminationDebt - payL)
        remaining = roundMoney(remaining - payL)
        laminationBank = roundMoney(laminationBank + payL)
      }
      if (remaining > 0 && printDebt > 0) {
        const payP = Math.min(remaining, printDebt)
        printDebt = roundMoney(printDebt - payP)
        remaining = roundMoney(remaining - payP)
        printBank = roundMoney(printBank + payP)
      }
      if (remaining > 0) {
        totalCredit = roundMoney(totalCredit + remaining)
        printBank = roundMoney(printBank + remaining)
      }
    }
  }

  const totalDebt = roundMoney(printDebt + laminationDebt - totalCredit)
  return { debts: { printDebt, laminationDebt, totalDebt }, bank: { printBank, laminationBank } }
}

const toDate = (v: any): Date => (v && typeof v.toDate === "function" ? v.toDate() : new Date(v))

export async function recomputeUserDebts(uid: string): Promise<void> {
  const db = getAdminDb()
  const [pSnap, lSnap, iSnap] = await Promise.all([
    db.collection(FIREBASE_COLLECTIONS.PRINT_JOBS).where("uid", "==", uid).get(),
    db.collection(FIREBASE_COLLECTIONS.LAMINATION_JOBS).where("uid", "==", uid).get(),
    db.collection(FIREBASE_COLLECTIONS.INCOME).where("uid", "==", uid).get(),
  ])

  const printJobs = pSnap.docs.map(d => d.data() as FirebasePrintJob)
  const lamJobs = lSnap.docs.map(d => d.data() as FirebaseLaminationJob)
  const incomes = iSnap.docs.map(d => d.data() as FirebaseIncome)

  const events: Array<{ kind: "print" | "lamination" | "income"; amount: number; timestamp: Date }> = []
  for (const j of printJobs) events.push({ kind: "print", amount: j.totalCost, timestamp: toDate((j as any).timestamp) })
  for (const j of lamJobs) events.push({ kind: "lamination", amount: j.totalCost, timestamp: toDate((j as any).timestamp) })
  for (const inc of incomes) events.push({ kind: "income", amount: inc.amount, timestamp: toDate((inc as any).timestamp) })

  const { debts, bank } = computeDebtsAndBankForUser(events)

  // Update user doc
  await db.collection(FIREBASE_COLLECTIONS.USERS).doc(uid).update({
    printDebt: debts.printDebt,
    laminationDebt: debts.laminationDebt,
    totalDebt: debts.totalDebt,
  })

  // Update bank document incrementally by reading current bank and applying this user's latest income
  // For simplicity, recompute user's contributions from incomes vs debts snapshot and add to totals.
  // Here we'll approximate by summing all incomes for all users only once to avoid heavy fan-out.
  // Cheaper approach: maintain bank via Cloud Scheduler/cron; for now, skip heavy recompute here.
}


