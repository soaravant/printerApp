const fs = require("fs")
const path = require("path")
const XLSX = require("xlsx")

const ROOT_DIR = path.resolve(__dirname, "..")
const OUTPUT_DIR = path.join(ROOT_DIR, "generated-excel-import-pairs")
const PHOTO_SOURCE = path.join(ROOT_DIR, "ΦΩΤΟΤΥΠΙΚΟ.xlsx")
const LAMINATION_SOURCE = path.join(ROOT_DIR, "ΠΛΑΣΤΙΚΟΠΟΙΗΤΗΣ.xlsx")
const CODE_OFFSET = Number.parseInt(process.env.EXCEL_TEST_CODE_OFFSET || "0", 10)
const TIMELINE_START_PERIOD_KEY = "2025-01"
const TIMELINE_END_PERIOD_KEY = "2026-03"

function buildMonthlyPeriods(startPeriodKey, endPeriodKey) {
  const periods = []
  const [startYear, startMonth] = startPeriodKey.split("-").map(Number)
  const [endYear, endMonth] = endPeriodKey.split("-").map(Number)
  let cursor = new Date(Date.UTC(startYear, startMonth - 1, 1))
  const limit = new Date(Date.UTC(endYear, endMonth - 1, 1))

  while (cursor <= limit) {
    const year = cursor.getUTCFullYear()
    const month = cursor.getUTCMonth()
    const firstDay = new Date(Date.UTC(year, month, 1))
    const lastDay = new Date(Date.UTC(year, month + 1, 0))
    const key = `${year}-${String(month + 1).padStart(2, "0")}`
    periods.push({
      key,
      label: `${firstDay.getUTCDate()}/${month + 1}/${year} - ${lastDay.getUTCDate()}/${month + 1}/${year}`,
      measurementDate: lastDay,
    })
    cursor = new Date(Date.UTC(year, month + 1, 1))
  }

  return periods
}

const PERIODS = buildMonthlyPeriods(TIMELINE_START_PERIOD_KEY, TIMELINE_END_PERIOD_KEY)

function roundMoney(value) {
  return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100
}

function toExcelSerial(date) {
  return XLSX.SSF.parse_date_code ? datenum(date) : datenum(date)
}

function datenum(date) {
  const utc = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  return utc / 86400000 + 25569
}

function readWorkbook(filePath) {
  return XLSX.readFile(filePath, { cellFormula: true, cellStyles: true })
}

function getSheetRows(sheet) {
  return XLSX.utils.sheet_to_json(sheet, { header: "A", defval: null, blankrows: true })
}

function isNumericCode(value) {
  return value !== null && value !== undefined && value !== "" && /^\d+$/.test(String(value).trim())
}

function getNumber(row, key) {
  const value = row?.[key]
  if (value === null || value === undefined || value === "") return 0
  return roundMoney(typeof value === "number" ? value : Number(String(value).replace(",", ".")))
}

function setCellValue(sheet, address, value) {
  const previous = sheet[address] || {}
  const next = {
    ...previous,
    v: value,
    t: typeof value === "number" ? "n" : "s",
  }
  delete next.f
  delete next.w
  sheet[address] = next
}

function buildSourceState() {
  const photoWorkbook = readWorkbook(PHOTO_SOURCE)
  const laminationWorkbook = readWorkbook(LAMINATION_SOURCE)
  const photoSheet = photoWorkbook.Sheets[photoWorkbook.SheetNames[0]]
  const laminationSheet = laminationWorkbook.Sheets[laminationWorkbook.SheetNames[0]]
  const photoRows = getSheetRows(photoSheet)
  const laminationRows = getSheetRows(laminationSheet)

  const rows = []
  photoRows.forEach((row, index) => {
    if (!isNumericCode(row.C)) return
    const rowNumber = index + 1
    rows.push({
      rowNumber,
      photoCode: Number(row.C),
      photoOldDebt: getNumber(row, "D"),
      photoCharge: getNumber(row, "L"),
      laminationOldDebt: getNumber(laminationRows[index], "C"),
      laminationCharge: roundMoney(getNumber(laminationRows[index], "D") + getNumber(laminationRows[index], "E")),
    })
  })

  return rows
}

function writePeriodPair(period, sourceRows) {
  const photoWorkbook = readWorkbook(PHOTO_SOURCE)
  const laminationWorkbook = readWorkbook(LAMINATION_SOURCE)
  const photoSheet = photoWorkbook.Sheets[photoWorkbook.SheetNames[0]]
  const laminationSheet = laminationWorkbook.Sheets[laminationWorkbook.SheetNames[0]]

  setCellValue(photoSheet, "A8", toExcelSerial(period.measurementDate))
  setCellValue(photoSheet, "A12", period.label)
  setCellValue(laminationSheet, "A10", toExcelSerial(period.measurementDate))
  setCellValue(laminationSheet, "A14", period.label)

  sourceRows.forEach((row) => {
    const printFinalDebt = roundMoney(row.photoOldDebt + row.photoCharge)
    const laminationFinalDebt = roundMoney(row.laminationOldDebt + row.laminationCharge)

    setCellValue(photoSheet, `C${row.rowNumber}`, row.photoCode + CODE_OFFSET)
    setCellValue(photoSheet, `D${row.rowNumber}`, row.photoOldDebt)
    setCellValue(photoSheet, `M${row.rowNumber}`, printFinalDebt)
    setCellValue(laminationSheet, `C${row.rowNumber}`, row.laminationOldDebt)
    setCellValue(laminationSheet, `F${row.rowNumber}`, laminationFinalDebt)

    row.photoOldDebt = printFinalDebt
    row.laminationOldDebt = laminationFinalDebt
  })

  const photoPath = path.join(OUTPUT_DIR, `${period.key}-ΦΩΤΟΤΥΠΙΚΟ.xlsx`)
  const laminationPath = path.join(OUTPUT_DIR, `${period.key}-ΠΛΑΣΤΙΚΟΠΟΙΗΤΗΣ.xlsx`)
  XLSX.writeFile(photoWorkbook, photoPath)
  XLSX.writeFile(laminationWorkbook, laminationPath)

  return { periodKey: period.key, photoPath, laminationPath }
}

function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  const sourceRows = buildSourceState()
  const pairs = PERIODS.map((period) => writePeriodPair(period, sourceRows))

  const manifestPath = path.join(OUTPUT_DIR, "manifest.json")
  fs.writeFileSync(manifestPath, JSON.stringify({ createdAt: new Date().toISOString(), pairs }, null, 2))

  console.log(JSON.stringify({ outputDir: OUTPUT_DIR, pairs, manifestPath }, null, 2))
}

main()
