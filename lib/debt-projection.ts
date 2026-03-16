import { roundMoney } from "@/lib/utils"

export type DebtEvent = {
  kind: "print" | "lamination" | "income"
  amount: number
  timestamp: Date
}

export type UserDebts = {
  printDebt: number
  laminationDebt: number
  totalDebt: number
}

export type BankIncrements = {
  printBank: number
  laminationBank: number
}

export type OpeningBalances = {
  printDebt: number
  laminationDebt: number
}

export type FirestoreTimestampLike =
  | { toDate?: () => Date }
  | Date
  | number
  | string
  | null
  | undefined

export function coerceToDate(value: FirestoreTimestampLike): Date | null {
  if (!value) return null
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value
  if (typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    const next = value.toDate()
    return Number.isNaN(next.getTime()) ? null : next
  }
  if (typeof value === "object" && value !== null) {
    const seconds =
      typeof (value as { _seconds?: unknown })._seconds === "number"
        ? (value as { _seconds: number })._seconds
        : typeof (value as { seconds?: unknown }).seconds === "number"
          ? (value as { seconds: number }).seconds
          : null
    const nanoseconds =
      typeof (value as { _nanoseconds?: unknown })._nanoseconds === "number"
        ? (value as { _nanoseconds: number })._nanoseconds
        : typeof (value as { nanoseconds?: unknown }).nanoseconds === "number"
          ? (value as { nanoseconds: number }).nanoseconds
          : 0
    if (seconds !== null) {
      const next = new Date(seconds * 1000 + Math.floor(nanoseconds / 1_000_000))
      return Number.isNaN(next.getTime()) ? null : next
    }
  }
  const next = new Date(value as string | number)
  return Number.isNaN(next.getTime()) ? null : next
}

export function computeDebtsAndBankForUser(
  events: DebtEvent[],
  openingBalances?: OpeningBalances
): { debts: UserDebts; bank: BankIncrements } {
  const sortedEvents = [...events].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
  const openingPrintDebt = roundMoney(Number(openingBalances?.printDebt || 0))
  const openingLaminationDebt = roundMoney(Number(openingBalances?.laminationDebt || 0))
  let printDebt = Math.max(0, openingPrintDebt)
  let laminationDebt = Math.max(0, openingLaminationDebt)
  let totalCredit = roundMoney(Math.max(0, -openingPrintDebt) + Math.max(0, -openingLaminationDebt))
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

    let remaining = event.amount
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
    debts: {
      printDebt,
      laminationDebt,
      totalDebt: roundMoney(printDebt + laminationDebt - totalCredit),
    },
    bank: {
      printBank,
      laminationBank,
    },
  }
}
