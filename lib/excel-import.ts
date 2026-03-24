import * as XLSX from "xlsx"

import type { FirebaseUser } from "@/lib/firebase-schema"
import { normalizeGreek, roundMoney } from "@/lib/utils"

const PHOTO_HEADERS = {
  B1: "Όνομα",
  C1: "Κωδικοί Χρηστών",
  D1: "Παλιές Οφειλές",
  L1: "Σύνολο",
  M1: "Τελικές Οφειλές",
} as const

const LAMINATION_HEADERS = {
  B1: "Όνομα",
  C1: "Παλιές Οφειλές",
  D1: "Χρεώσεις  40",
  E1: "Χρεώσεις Κυδωνιών",
  F1: "Σύνολο",
} as const

const TEAM_NAMES = new Set([
  "Ενωμένοι",
  "Σποριάδες",
  "Καρποφόροι",
  "Ολόφωτοι",
  "Νικητές",
  "Νικηφόροι",
  "Φλόγα",
  "Σύμψυχοι",
])

const EXCEL_DISPLAY_NAME_ALIASES = new Map<string, string>([
  ["νικηφοροι jr", "Νικηφόροι"],
  ["φλογ α", "Φλόγα"],
])

const EXCEL_NAME_FALLBACK_CODES = new Map<string, string>([
  ["συμψυχοι", "117"],
])

const DATE_RANGE_PATTERN = /(\d{1,2}\/\d{1,2}\/\d{4})\s*-\s*(\d{1,2}\/\d{1,2}\/\d{4})/
const LOW_ROW_WARNING_THRESHOLD = 100
const HIGH_ROW_WARNING_THRESHOLD = 250

export const EXCEL_PRINT_TYPES = {
  bw: "ExcelBWImport",
  color: "ExcelColorImport",
  adjustment: "ExcelAdjustmentImport",
} as const

export const EXCEL_LAMINATION_TYPE = "ExcelLaminationImport" as const
export const EXCEL_IMPORT_DEVICE_NAME = "Excel Φωτοτυπικό"
export const EXCEL_IMPORT_NOTES = "Συνθετική χρέωση από εισαγωγή Excel"

export function getSyntheticImportDocumentIds(username: string, periodKey: string) {
  return {
    printBw: `excel-print-bw-${periodKey}-${username}`,
    printColor: `excel-print-color-${periodKey}-${username}`,
    printAdjustment: `excel-print-adjustment-${periodKey}-${username}`,
    lamination: `excel-lamination-${periodKey}-${username}`,
  }
}

type SheetRow = Record<string, unknown>

export type ExcelImportWarningCode =
  | "missing-user"
  | "name-mismatch-db"
  | "name-mismatch-sheets"
  | "continuity-mismatch"
  | "balance-allocation-shift"
  | "negative-opening-balance"
  | "negative-final-balance"
  | "missing-lamination-row"
  | "row-count-outlier"

export interface ExcelImportWarning {
  code: ExcelImportWarningCode
  severity: "warning" | "error"
  message: string
}

export interface PeriodInfo {
  label: string
  key: string
  startDate: string
  endDate: string
}

export interface ParsedPhotocopierRow {
  rowNumber: number
  code: string
  displayName: string
  oldPrintDebt: number
  bw2520Count: number
  color3330Count: number
  bw3330Count: number
  totalBwCount: number
  kydoniaCharge: number
  specialCharge: number
  basementCharge: number
  newPrintCharge: number
  finalPrintDebt: number
}

export interface ParsedLaminationRow {
  rowNumber: number
  displayName: string
  oldLaminationDebt: number
  laminationCharge40: number
  laminationKydoniaCharge: number
  finalLaminationDebt: number
}

export interface ParsedPhotocopierWorkbook {
  rows: ParsedPhotocopierRow[]
  errors: string[]
  warnings: string[]
  period: PeriodInfo
  totals: {
    newPrintCharge: number
    finalPrintDebt: number
  }
}

export interface ParsedLaminationWorkbook {
  rowsByNumber: Map<number, ParsedLaminationRow>
  comparableRowCount: number
  errors: string[]
  warnings: string[]
  period: PeriodInfo
  totals: {
    newLaminationCharge: number
    finalLaminationDebt: number
  }
}

export interface ParsedExcelImportRow {
  rowNumber: number
  code: string
  photoDisplayName: string
  laminationDisplayName: string
  oldPrintDebt: number
  oldLaminationDebt: number
  bw2520Count: number
  color3330Count: number
  bw3330Count: number
  totalBwCount: number
  extraPrintCharge: number
  newPrintCharge: number
  newLaminationCharge: number
  finalPrintDebt: number
  finalLaminationDebt: number
  computedFinalTotalDebt: number
  finalExcelTotalDebt: number
  warnings: ExcelImportWarning[]
}

export interface ParsedExcelImportResult {
  period: PeriodInfo
  photo: ParsedPhotocopierWorkbook
  lamination: ParsedLaminationWorkbook
  rows: ParsedExcelImportRow[]
  errors: string[]
  warnings: string[]
  totals: {
    newPrintCharge: number
    newLaminationCharge: number
    finalExcelDebt: number
    computedFinalDebt: number
  }
}

export interface ExcelPreviewRow {
  rowNumber: number
  code: string
  excelName: string
  laminationName: string
  dbUserUid: string | null
  dbUserName: string
  username: string
  inferredUserRole: FirebaseUser["userRole"]
  matchStatus: "matched" | "missing"
  canImport: boolean
  oldPrintDebt: number
  oldLaminationDebt: number
  totalBwCount: number
  color3330Count: number
  extraPrintCharge: number
  newPrintCharge: number
  newLaminationCharge: number
  finalExcelTotalDebt: number
  computedFinalTotalDebt: number
  warnings: ExcelImportWarning[]
}

export interface ExcelImportPlan {
  period: PeriodInfo
  rows: ExcelPreviewRow[]
  blockingErrors: string[]
  warnings: string[]
  totals: {
    importableRows: number
    missingUsers: number
    nameMismatches: number
    negativeBalanceRows: number
    newPrintCharge: number
    newLaminationCharge: number
    finalExcelDebt: number
    computedFinalDebt: number
  }
}

function sheetToRows(sheet: XLSX.WorkSheet): SheetRow[] {
  return XLSX.utils.sheet_to_json(sheet, { header: "A", defval: null }) as SheetRow[]
}

function readWorkbook(buffer: ArrayBuffer): XLSX.WorkBook {
  return XLSX.read(buffer, { type: "array", cellFormula: true, cellStyles: true })
}

function getCellString(row: SheetRow | undefined, key: string): string {
  const value = row?.[key]
  if (value === null || value === undefined) return ""
  return String(value).trim()
}

function getCellNumber(row: SheetRow | undefined, key: string): number {
  const value = row?.[key]
  if (value === null || value === undefined || value === "") return 0
  const numericValue = typeof value === "number" ? value : Number(String(value).replace(",", "."))
  return Number.isFinite(numericValue) ? roundMoney(numericValue) : 0
}

function isNumericCode(value: unknown): value is string | number {
  if (value === null || value === undefined || value === "") return false
  return /^\d+$/.test(String(value).trim())
}

function normalizeExcelAliasKey(value: string) {
  return normalizeGreek(value)
    .replace(/[().,/-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function canonicalizeExcelDisplayName(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return ""
  return EXCEL_DISPLAY_NAME_ALIASES.get(normalizeExcelAliasKey(trimmed)) ?? trimmed
}

function resolveExcelCode(rawCode: unknown, rawDisplayName: string) {
  if (isNumericCode(rawCode)) {
    return String(rawCode).trim()
  }

  const canonicalName = canonicalizeExcelDisplayName(rawDisplayName)
  return EXCEL_NAME_FALLBACK_CODES.get(normalizeExcelAliasKey(canonicalName)) ?? null
}

function sameMoney(left: number, right: number): boolean {
  return Math.abs(roundMoney(left) - roundMoney(right)) <= 0.01
}

function normalizeExcelBalancesToAppState(printDebt: number, laminationDebt: number) {
  const normalizedPrintDebt = roundMoney(Math.max(0, printDebt))
  const normalizedLaminationDebt = roundMoney(Math.max(0, laminationDebt))
  const totalCredit = roundMoney(Math.max(0, -printDebt) + Math.max(0, -laminationDebt))

  return {
    printDebt: normalizedPrintDebt,
    laminationDebt: normalizedLaminationDebt,
    totalDebt: roundMoney(normalizedPrintDebt + normalizedLaminationDebt - totalCredit),
  }
}

function parseDateString(value: string): Date | null {
  const [day, month, year] = value.split("/").map((part) => Number(part))
  if (!day || !month || !year) return null
  const date = new Date(Date.UTC(year, month - 1, day))
  return Number.isNaN(date.getTime()) ? null : date
}

function formatIsoDate(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`
}

function buildPeriodInfo(rows: SheetRow[]): PeriodInfo {
  const previewRows = rows.slice(0, 24)
  for (const row of previewRows) {
    for (const value of Object.values(row)) {
      const text = value === null || value === undefined ? "" : String(value)
      const match = text.match(DATE_RANGE_PATTERN)
      if (!match) continue
      const startDate = parseDateString(match[1])
      const endDate = parseDateString(match[2])
      if (!startDate || !endDate) continue
      const sameMonth =
        startDate.getUTCFullYear() === endDate.getUTCFullYear() &&
        startDate.getUTCMonth() === endDate.getUTCMonth()
      return {
        label: `${match[1]} - ${match[2]}`,
        key: sameMonth
          ? `${endDate.getUTCFullYear()}-${String(endDate.getUTCMonth() + 1).padStart(2, "0")}`
          : `${formatIsoDate(startDate)}_${formatIsoDate(endDate)}`,
        startDate: formatIsoDate(startDate),
        endDate: formatIsoDate(endDate),
      }
    }
  }

  const now = new Date()
  const fallbackMonth = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`
  return {
    label: fallbackMonth,
    key: fallbackMonth,
    startDate: `${fallbackMonth}-01`,
    endDate: `${fallbackMonth}-01`,
  }
}

function normalizeImportName(value: string): string {
  return normalizeGreek(value)
    .replace(/[().,]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function validateHeaders(sheet: XLSX.WorkSheet, expected: Record<string, string>, workbookLabel: string): string[] {
  const errors: string[] = []
  for (const [cellAddress, expectedValue] of Object.entries(expected)) {
    const cellValue = String(sheet[cellAddress]?.v ?? "").replace(/\s+/g, " ").trim()
    const normalizedExpectedValue = expectedValue.replace(/\s+/g, " ").trim()
    if (cellValue !== normalizedExpectedValue) {
      errors.push(
        `${workbookLabel}: αναμενόταν "${expectedValue}" στο ${cellAddress}, βρέθηκε "${cellValue || "κενό"}".`
      )
    }
  }
  return errors
}

function matchesHeaders(sheet: XLSX.WorkSheet, expected: Record<string, string>) {
  return Object.entries(expected).every(([cellAddress, expectedValue]) => {
    const cellValue = String(sheet[cellAddress]?.v ?? "").replace(/\s+/g, " ").trim()
    const normalizedExpectedValue = expectedValue.replace(/\s+/g, " ").trim()
    return cellValue === normalizedExpectedValue
  })
}

export function parsePhotocopierWorkbook(buffer: ArrayBuffer): ParsedPhotocopierWorkbook {
  const workbook = readWorkbook(buffer)
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows = sheetToRows(sheet)
  const errors = validateHeaders(sheet, PHOTO_HEADERS, "ΦΩΤΟΤΥΠΙΚΟ.xlsx")
  const warnings: string[] = []
  const parsedRows: ParsedPhotocopierRow[] = []
  const seenCodes = new Set<string>()

  if (matchesHeaders(sheet, LAMINATION_HEADERS) && !matchesHeaders(sheet, PHOTO_HEADERS)) {
    return {
      rows: [],
      errors: [
        "Το αρχείο που μπήκε στο βήμα ΦΩΤΟΤΥΠΙΚΟ φαίνεται να είναι το template του ΠΛΑΣΤΙΚΟΠΟΙΗΤΗΣ.xlsx. Βάλτε το στο δεύτερο βήμα.",
      ],
      warnings,
      period: buildPeriodInfo(rows),
      totals: {
        newPrintCharge: 0,
        finalPrintDebt: 0,
      },
    }
  }

  rows.forEach((row, index) => {
    const rowNumber = index + 1
    const displayName = canonicalizeExcelDisplayName(getCellString(row, "B"))
    const code = resolveExcelCode(row.C, displayName)
    if (!code) return

    const oldPrintDebt = getCellNumber(row, "D")
    const bw2520Count = getCellNumber(row, "E")
    const color3330Count = getCellNumber(row, "F")
    const bw3330Count = getCellNumber(row, "G")
    const totalBwCount = getCellNumber(row, "H")
    const kydoniaCharge = getCellNumber(row, "I")
    const specialCharge = getCellNumber(row, "J")
    const basementCharge = getCellNumber(row, "K")
    const newPrintCharge = getCellNumber(row, "L")
    const finalPrintDebt = getCellNumber(row, "M")

    if (seenCodes.has(code)) {
      errors.push(`ΦΩΤΟΤΥΠΙΚΟ.xlsx: διπλό code "${code}" στη γραμμή ${rowNumber}.`)
      return
    }
    seenCodes.add(code)

    if (!displayName) {
      errors.push(`ΦΩΤΟΤΥΠΙΚΟ.xlsx: λείπει το όνομα στη γραμμή ${rowNumber}.`)
      return
    }

    if (!sameMoney(totalBwCount, bw2520Count + bw3330Count)) {
      errors.push(`ΦΩΤΟΤΥΠΙΚΟ.xlsx: ασυμφωνία τύπου H=E+G στη γραμμή ${rowNumber}.`)
    }
    if (
      !sameMoney(
        newPrintCharge,
        totalBwCount * 0.05 + color3330Count * 0.25 + kydoniaCharge + specialCharge + basementCharge
      )
    ) {
      errors.push(`ΦΩΤΟΤΥΠΙΚΟ.xlsx: ασυμφωνία τύπου L=H*0.05+F*0.25+I+J+K στη γραμμή ${rowNumber}.`)
    }
    if (!sameMoney(finalPrintDebt, oldPrintDebt + newPrintCharge)) {
      errors.push(`ΦΩΤΟΤΥΠΙΚΟ.xlsx: ασυμφωνία τύπου M=D+L στη γραμμή ${rowNumber}.`)
    }

    parsedRows.push({
      rowNumber,
      code,
      displayName,
      oldPrintDebt,
      bw2520Count,
      color3330Count,
      bw3330Count,
      totalBwCount,
      kydoniaCharge,
      specialCharge,
      basementCharge,
      newPrintCharge,
      finalPrintDebt,
    })
  })

  if (parsedRows.length < LOW_ROW_WARNING_THRESHOLD || parsedRows.length > HIGH_ROW_WARNING_THRESHOLD) {
    warnings.push(`ΦΩΤΟΤΥΠΙΚΟ.xlsx: βρέθηκαν ${parsedRows.length} κωδικοποιημένες γραμμές. Ελέγξτε ότι το template είναι το σωστό.`)
  }

  return {
    rows: parsedRows,
    errors,
    warnings,
    period: buildPeriodInfo(rows),
    totals: {
      newPrintCharge: roundMoney(parsedRows.reduce((sum, row) => sum + row.newPrintCharge, 0)),
      finalPrintDebt: roundMoney(parsedRows.reduce((sum, row) => sum + row.finalPrintDebt, 0)),
    },
  }
}

export function parseLaminationWorkbook(buffer: ArrayBuffer): ParsedLaminationWorkbook {
  const workbook = readWorkbook(buffer)
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows = sheetToRows(sheet)
  const errors = validateHeaders(sheet, LAMINATION_HEADERS, "ΠΛΑΣΤΙΚΟΠΟΙΗΤΗΣ.xlsx")
  const warnings: string[] = []
  const rowsByNumber = new Map<number, ParsedLaminationRow>()
  let comparableRowCount = 0

  if (matchesHeaders(sheet, PHOTO_HEADERS) && !matchesHeaders(sheet, LAMINATION_HEADERS)) {
    return {
      rowsByNumber,
      comparableRowCount: 0,
      errors: [
        "Το αρχείο που μπήκε στο βήμα ΠΛΑΣΤΙΚΟΠΟΙΗΤΗΣ φαίνεται να είναι το template του ΦΩΤΟΤΥΠΙΚΟ.xlsx. Βάλτε το στο πρώτο βήμα.",
      ],
      warnings,
      period: buildPeriodInfo(rows),
      totals: {
        newLaminationCharge: 0,
        finalLaminationDebt: 0,
      },
    }
  }

  rows.forEach((row, index) => {
    const rowNumber = index + 1
    const displayName = canonicalizeExcelDisplayName(getCellString(row, "B"))
    const oldLaminationDebt = getCellNumber(row, "C")
    const laminationCharge40 = getCellNumber(row, "D")
    const laminationKydoniaCharge = getCellNumber(row, "E")
    const finalLaminationDebt = getCellNumber(row, "F")
    const hasComparableData =
      Boolean(displayName) ||
      oldLaminationDebt !== 0 ||
      laminationCharge40 !== 0 ||
      laminationKydoniaCharge !== 0 ||
      finalLaminationDebt !== 0

    if (!hasComparableData) return
    comparableRowCount += 1

    if (!sameMoney(finalLaminationDebt, oldLaminationDebt + laminationCharge40 + laminationKydoniaCharge)) {
      errors.push(`ΠΛΑΣΤΙΚΟΠΟΙΗΤΗΣ.xlsx: ασυμφωνία τύπου F=C+D+E στη γραμμή ${rowNumber}.`)
    }

    rowsByNumber.set(rowNumber, {
      rowNumber,
      displayName,
      oldLaminationDebt,
      laminationCharge40,
      laminationKydoniaCharge,
      finalLaminationDebt,
    })
  })

  if (comparableRowCount < LOW_ROW_WARNING_THRESHOLD || comparableRowCount > HIGH_ROW_WARNING_THRESHOLD) {
    warnings.push(
      `ΠΛΑΣΤΙΚΟΠΟΙΗΤΗΣ.xlsx: βρέθηκαν ${comparableRowCount} συγκρίσιμες γραμμές. Ελέγξτε ότι το template είναι το σωστό.`
    )
  }

  return {
    rowsByNumber,
    comparableRowCount,
    errors,
    warnings,
    period: buildPeriodInfo(rows),
    totals: {
      newLaminationCharge: roundMoney(
        Array.from(rowsByNumber.values()).reduce(
          (sum, row) => sum + row.laminationCharge40 + row.laminationKydoniaCharge,
          0
        )
      ),
      finalLaminationDebt: roundMoney(
        Array.from(rowsByNumber.values()).reduce((sum, row) => sum + row.finalLaminationDebt, 0)
      ),
    },
  }
}

export function parseExcelImportFiles(
  photoBuffer: ArrayBuffer,
  laminationBuffer: ArrayBuffer
): ParsedExcelImportResult {
  const photo = parsePhotocopierWorkbook(photoBuffer)
  const lamination = parseLaminationWorkbook(laminationBuffer)
  const errors = [...photo.errors, ...lamination.errors]
  const warnings = [...photo.warnings, ...lamination.warnings]

  if (photo.period.key !== lamination.period.key) {
    warnings.push(
      `Οι περίοδοι των δύο αρχείων διαφέρουν (${photo.period.label} vs ${lamination.period.label}). Θα χρησιμοποιηθεί η περίοδος του φωτοτυπικού.`
    )
  }

  const rows: ParsedExcelImportRow[] = photo.rows.map((photoRow) => {
    const laminationRow = lamination.rowsByNumber.get(photoRow.rowNumber)
    const rowWarnings: ExcelImportWarning[] = []

    if (!laminationRow) {
      rowWarnings.push({
        code: "missing-lamination-row",
        severity: "warning",
        message: `Λείπει γραμμή πλαστικοποιητή για το code ${photoRow.code}. Οι χρεώσεις πλαστικοποιητή μηδενίστηκαν.`,
      })
    }

    const laminationDisplayName = laminationRow?.displayName ?? ""
    const oldLaminationDebt = laminationRow?.oldLaminationDebt ?? 0
    const newLaminationCharge = roundMoney(
      (laminationRow?.laminationCharge40 ?? 0) + (laminationRow?.laminationKydoniaCharge ?? 0)
    )
    const finalLaminationDebt = laminationRow?.finalLaminationDebt ?? 0
    const extraPrintCharge = roundMoney(
      photoRow.kydoniaCharge + photoRow.specialCharge + photoRow.basementCharge
    )

    if (
      laminationDisplayName &&
      normalizeImportName(photoRow.displayName) !== normalizeImportName(laminationDisplayName)
    ) {
      rowWarnings.push({
        code: "name-mismatch-sheets",
        severity: "warning",
        message: `Το όνομα στα δύο Excel διαφέρει (${photoRow.displayName} vs ${laminationDisplayName}).`,
      })
    }

    const computedFinalTotalDebt = roundMoney(
      photoRow.oldPrintDebt + oldLaminationDebt + photoRow.newPrintCharge + newLaminationCharge
    )
    const finalExcelTotalDebt = roundMoney(photoRow.finalPrintDebt + finalLaminationDebt)

    if (!sameMoney(computedFinalTotalDebt, finalExcelTotalDebt)) {
      errors.push(
        `Γραμμή ${photoRow.rowNumber} / code ${photoRow.code}: το άθροισμα των τελικών οφειλών (${finalExcelTotalDebt.toFixed(2)}) δεν ταιριάζει με την υπολογισμένη οφειλή (${computedFinalTotalDebt.toFixed(2)}).`
      )
    }

    if (
      photoRow.oldPrintDebt < 0 ||
      oldLaminationDebt < 0
    ) {
      rowWarnings.push({
        code: "negative-opening-balance",
        severity: "warning",
        message: `Υπάρχει πιστωτικό υπόλοιπο πριν από την περίοδο για το code ${photoRow.code}.`,
      })
    }
    if (photoRow.finalPrintDebt < 0 || finalLaminationDebt < 0) {
      rowWarnings.push({
        code: "negative-final-balance",
        severity: "warning",
        message: `Το τελικό Excel υπόλοιπο είναι αρνητικό για το code ${photoRow.code}.`,
      })
    }

    return {
      rowNumber: photoRow.rowNumber,
      code: photoRow.code,
      photoDisplayName: photoRow.displayName,
      laminationDisplayName,
      oldPrintDebt: photoRow.oldPrintDebt,
      oldLaminationDebt,
      bw2520Count: photoRow.bw2520Count,
      color3330Count: photoRow.color3330Count,
      bw3330Count: photoRow.bw3330Count,
      totalBwCount: photoRow.totalBwCount,
      extraPrintCharge,
      newPrintCharge: photoRow.newPrintCharge,
      newLaminationCharge,
      finalPrintDebt: photoRow.finalPrintDebt,
      finalLaminationDebt,
      computedFinalTotalDebt,
      finalExcelTotalDebt,
      warnings: rowWarnings,
    }
  })

  const alignedLaminationRows = rows.filter(
    (row) =>
      row.laminationDisplayName ||
      row.oldLaminationDebt !== 0 ||
      row.newLaminationCharge !== 0 ||
      row.finalLaminationDebt !== 0
  ).length
  if (Math.abs(photo.rows.length - alignedLaminationRows) > 0) {
    warnings.push(
      `Οι γραμμές του πλαστικοποιητή που ευθυγραμμίζονται με το φωτοτυπικό είναι ${alignedLaminationRows} ενώ οι κωδικοποιημένες γραμμές του φωτοτυπικού είναι ${photo.rows.length}.`
    )
  }

  return {
    period: photo.period,
    photo,
    lamination,
    rows,
    errors,
    warnings,
    totals: {
      newPrintCharge: roundMoney(rows.reduce((sum, row) => sum + row.newPrintCharge, 0)),
      newLaminationCharge: roundMoney(rows.reduce((sum, row) => sum + row.newLaminationCharge, 0)),
      finalExcelDebt: roundMoney(rows.reduce((sum, row) => sum + row.finalExcelTotalDebt, 0)),
      computedFinalDebt: roundMoney(rows.reduce((sum, row) => sum + row.computedFinalTotalDebt, 0)),
    },
  }
}

export function inferUserRoleFromExcelName(name: string): FirebaseUser["userRole"] {
  const trimmedName = canonicalizeExcelDisplayName(name)
  if (trimmedName.startsWith("Ι.Ν.")) return "Ναός"
  if (TEAM_NAMES.has(trimmedName)) return "Ομάδα"
  return "Άτομο"
}

export function buildExcelImportPlan(
  parsed: ParsedExcelImportResult,
  users: Array<
    Pick<
      FirebaseUser,
      | "uid"
      | "username"
      | "displayName"
      | "userRole"
      | "printDebt"
      | "laminationDebt"
      | "totalDebt"
      | "openingDebtSource"
    >
  >,
  options?: {
    allowCreateUsers?: boolean
    latestCompletedImportPeriodKey?: string | null
    completedImportPeriodKeys?: string[] | null
  }
): ExcelImportPlan {
  const allowCreateUsers = Boolean(options?.allowCreateUsers)
  const latestCompletedImportPeriodKey = options?.latestCompletedImportPeriodKey ?? null
  const completedImportPeriodKeys = new Set(options?.completedImportPeriodKeys ?? [])
  const hasExistingCompletedImportForPeriod = completedImportPeriodKeys.has(parsed.period.key)
  const isLatestPeriodReimport = latestCompletedImportPeriodKey === parsed.period.key
  const isPeriodReimport = hasExistingCompletedImportForPeriod || isLatestPeriodReimport
  const usersByUsername = new Map(
    users
      .filter((user) => user.username)
      .map((user) => [String(user.username).trim(), user])
  )

  const rows = parsed.rows.map<ExcelPreviewRow>((row) => {
    const matchedUser = usersByUsername.get(row.code) ?? null
    const warnings = [...row.warnings]
    const currentPrintDebt = roundMoney(Number(matchedUser?.printDebt || 0))
    const currentLaminationDebt = roundMoney(Number(matchedUser?.laminationDebt || 0))
    const currentTotalDebt = roundMoney(Number(matchedUser?.totalDebt || 0))
    const hasPriorExcelBaseline = Boolean(matchedUser?.openingDebtSource)
    const expectedCurrentState = normalizeExcelBalancesToAppState(row.oldPrintDebt, row.oldLaminationDebt)
    const expectedCurrentTotalDebt = roundMoney(row.oldPrintDebt + row.oldLaminationDebt)

    if (matchedUser && normalizeImportName(row.photoDisplayName) !== normalizeImportName(matchedUser.displayName)) {
      warnings.push({
        code: "name-mismatch-db",
        severity: "warning",
        message: `Το όνομα της βάσης διαφέρει από το Excel (${matchedUser.displayName} vs ${row.photoDisplayName}). Θα χρησιμοποιηθεί το όνομα της βάσης.`,
      })
    }

    if (!matchedUser) {
      warnings.push({
        code: "missing-user",
        severity: allowCreateUsers ? "warning" : "error",
        message: allowCreateUsers
          ? `Δεν βρέθηκε χρήστης με code ${row.code}. Θα δημιουργηθεί νέος χρήστης.`
          : `Δεν βρέθηκε χρήστης με code ${row.code}.`,
      })
    }

    if (
      matchedUser &&
      hasPriorExcelBaseline &&
      !isPeriodReimport &&
      !sameMoney(expectedCurrentTotalDebt, currentTotalDebt)
    ) {
      warnings.push({
        code: "continuity-mismatch",
        severity: "error",
        message:
          `Οι παλιές οφειλές του Excel (${formatMoneyForWarning(row.oldPrintDebt)} / ${formatMoneyForWarning(row.oldLaminationDebt)}) ` +
          `δεν ταιριάζουν με την τρέχουσα βάση (${formatMoneyForWarning(currentPrintDebt)} / ${formatMoneyForWarning(currentLaminationDebt)} / Σύνολο ${formatMoneyForWarning(currentTotalDebt)}). ` +
          "Εισάγετε πρώτα την προηγούμενη περίοδο ή κάντε αναίρεση της τελευταίας εισαγωγής.",
      })
    }

    if (
      matchedUser &&
      hasPriorExcelBaseline &&
      !isPeriodReimport &&
      sameMoney(expectedCurrentTotalDebt, currentTotalDebt) &&
      (
        !sameMoney(expectedCurrentState.printDebt, currentPrintDebt) ||
        !sameMoney(expectedCurrentState.laminationDebt, currentLaminationDebt)
      )
    ) {
      warnings.push({
        code: "balance-allocation-shift",
        severity: "warning",
        message:
          "Το συνολικό υπόλοιπο συμφωνεί, αλλά ο επιμερισμός ΤΟ. ΦΩ. / ΠΛΑ. ΤΟ. έχει μεταβληθεί λόγω credit normalization της εφαρμογής. Η εισαγωγή θα συνεχίσει με έλεγχο στο συνολικό υπόλοιπο.",
      })
    }

    const hasBlockingWarning = warnings.some((warning) => warning.severity === "error")

    return {
      rowNumber: row.rowNumber,
      code: row.code,
      excelName: row.photoDisplayName,
      laminationName: row.laminationDisplayName,
      dbUserUid: matchedUser?.uid ?? null,
      dbUserName: matchedUser?.displayName ?? row.photoDisplayName,
      username: row.code,
      inferredUserRole: matchedUser?.userRole ?? inferUserRoleFromExcelName(row.photoDisplayName),
      matchStatus: matchedUser ? "matched" : "missing",
      canImport: (Boolean(matchedUser) || allowCreateUsers) && !hasBlockingWarning,
      oldPrintDebt: row.oldPrintDebt,
      oldLaminationDebt: row.oldLaminationDebt,
      totalBwCount: row.totalBwCount,
      color3330Count: row.color3330Count,
      extraPrintCharge: row.extraPrintCharge,
      newPrintCharge: row.newPrintCharge,
      newLaminationCharge: row.newLaminationCharge,
      finalExcelTotalDebt: row.finalExcelTotalDebt,
      computedFinalTotalDebt: row.computedFinalTotalDebt,
      warnings,
    }
  })

  const blockingErrors = [...parsed.errors]
  if (!allowCreateUsers) {
    const missingUsers = rows.filter((row) => row.matchStatus === "missing")
    if (missingUsers.length > 0) {
      blockingErrors.push(`Βρέθηκαν ${missingUsers.length} codes που δεν υπάρχουν στη βάση.`)
    }
  }

  const continuityMismatches = rows.filter((row) =>
    row.warnings.some((warning) => warning.code === "continuity-mismatch")
  )
  if (continuityMismatches.length > 0) {
    blockingErrors.push(
      `Βρέθηκαν ${continuityMismatches.length} γραμμές όπου οι παλιές οφειλές του Excel δεν συμφωνούν με την τρέχουσα βάση.`
    )
  }

  const planWarnings = [...parsed.warnings]
  if (hasExistingCompletedImportForPeriod) {
    planWarnings.unshift(
      `Υπάρχει ήδη καταχωρημένη εισαγωγή για την περίοδο ${parsed.period.label}. Αν προχωρήσετε, τα υπάρχοντα δεδομένα της ίδιας περιόδου θα αντικατασταθούν.`
    )
  }

  const openingBalanceReplacementCount = rows.filter((row) => {
    const matchedUser = usersByUsername.get(row.username)
    return matchedUser?.openingDebtSource === parsed.period.key
  }).length
  if (openingBalanceReplacementCount > 0) {
    planWarnings.push(
      `Για ${openingBalanceReplacementCount} χρήστες η περίοδος αυτή είναι η αρχική βάση χρέους. Τα opening balances τους θα ενημερωθούν με τα νέα στοιχεία του Excel.`
    )
  }

  return {
    period: parsed.period,
    rows,
    blockingErrors,
    warnings: planWarnings,
    totals: {
      importableRows: rows.filter((row) => row.canImport).length,
      missingUsers: rows.filter((row) => row.matchStatus === "missing").length,
      nameMismatches: rows.filter((row) =>
        row.warnings.some((warning) => warning.code === "name-mismatch-db" || warning.code === "name-mismatch-sheets")
      ).length,
      negativeBalanceRows: rows.filter((row) =>
        row.warnings.some(
          (warning) => warning.code === "negative-opening-balance" || warning.code === "negative-final-balance"
        )
      ).length,
      newPrintCharge: parsed.totals.newPrintCharge,
      newLaminationCharge: parsed.totals.newLaminationCharge,
      finalExcelDebt: parsed.totals.finalExcelDebt,
      computedFinalDebt: parsed.totals.computedFinalDebt,
    },
  }
}

function formatMoneyForWarning(value: number) {
  return `${roundMoney(value).toFixed(2).replace(".", ",")}€`
}

export function createSyntheticPrintJobs(
  row: ExcelPreviewRow,
  periodKey: string,
  importRunId: string,
  timestamp: Date,
  createdAt: Date = timestamp
) {
  const jobs: Array<{
    jobId: string
    type: typeof EXCEL_PRINT_TYPES[keyof typeof EXCEL_PRINT_TYPES]
    quantity: number
    pricePerUnit: number
    totalCost: number
  }> = []

  const bwCost = roundMoney(row.newPrintCharge === 0 ? 0 : row.totalBwCount * 0.05)
  const colorCost = roundMoney(row.newPrintCharge === 0 ? 0 : row.color3330Count * 0.25)
  const adjustmentCost = roundMoney(row.newPrintCharge - bwCost - colorCost)

  if (bwCost > 0) {
    jobs.push({
      jobId: getSyntheticImportDocumentIds(row.username, periodKey).printBw,
      type: EXCEL_PRINT_TYPES.bw,
      quantity: row.totalBwCount,
      pricePerUnit: 0.05,
      totalCost: bwCost,
    })
  }
  if (colorCost > 0) {
    jobs.push({
      jobId: getSyntheticImportDocumentIds(row.username, periodKey).printColor,
      type: EXCEL_PRINT_TYPES.color,
      quantity: row.color3330Count,
      pricePerUnit: 0.25,
      totalCost: colorCost,
    })
  }
  if (adjustmentCost > 0) {
    jobs.push({
      jobId: getSyntheticImportDocumentIds(row.username, periodKey).printAdjustment,
      type: EXCEL_PRINT_TYPES.adjustment,
      quantity: 0,
      pricePerUnit: adjustmentCost,
      totalCost: adjustmentCost,
    })
  }

  return jobs.map((job) => ({
    ...job,
    uid: row.dbUserUid,
    username: row.username,
    userDisplayName: row.dbUserName,
    deviceIP: "",
    deviceName: EXCEL_IMPORT_DEVICE_NAME,
    timestamp,
    status: "completed" as const,
    createdAt,
    importId: importRunId,
    importPeriod: periodKey,
    isSyntheticImport: true,
  }))
}

export function createSyntheticLaminationJobs(
  row: ExcelPreviewRow,
  periodKey: string,
  importRunId: string,
  timestamp: Date,
  createdAt: Date = timestamp
) {
  if (row.newLaminationCharge <= 0) return []

  return [
    {
      jobId: getSyntheticImportDocumentIds(row.username, periodKey).lamination,
      uid: row.dbUserUid,
      username: row.username,
      userDisplayName: row.dbUserName,
      type: EXCEL_LAMINATION_TYPE,
      quantity: 0,
      pricePerUnit: row.newLaminationCharge,
      totalCost: row.newLaminationCharge,
      timestamp,
      status: "completed" as const,
      createdAt,
      notes: EXCEL_IMPORT_NOTES,
      importId: importRunId,
      importPeriod: periodKey,
      isSyntheticImport: true,
    },
  ]
}
