const fs = require("fs")
const path = require("path")
const XLSX = require("xlsx")

const ROOT_DIR = path.resolve(__dirname, "..")
const OUTPUT_DIR = path.join(ROOT_DIR, "generated-excel-import-pairs")
const PHOTO_SOURCE = path.join(ROOT_DIR, "ΦΩΤΟΤΥΠΙΚΟ.xlsx")
const LAMINATION_SOURCE = path.join(ROOT_DIR, "ΠΛΑΣΤΙΚΟΠΟΙΗΤΗΣ.xlsx")
const TARGET_START_PERIOD_KEY = process.env.EXCEL_TEST_START_PERIOD_KEY || "2025-01"
const DATE_RANGE_PATTERN = /(\d{1,2}\/\d{1,2}\/\d{4})\s*-\s*(\d{1,2}\/\d{1,2}\/\d{4})/

const NAME_ALIASES = new Map([
  ["νικηφοροι jr", "Νικηφόροι"],
  ["φλογ α", "Φλόγα"],
])

const FALLBACK_CODES = new Map([["συμψυχοι", 117]])

function roundMoney(value) {
  return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100
}

function roundCount(value) {
  return Math.max(0, Math.round(Number(value || 0) + Number.EPSILON))
}

function datenum(date) {
  const utc = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  return utc / 86400000 + 25569
}

function toExcelSerial(date) {
  return datenum(date)
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

function normalizeName(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}+/gu, "")
    .toLowerCase()
    .replace(/[().,/-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function canonicalizeName(value) {
  const trimmed = String(value || "").trim()
  if (!trimmed) return ""
  return NAME_ALIASES.get(normalizeName(trimmed)) || trimmed
}

function resolveCode(rawCode, rawName) {
  if (isNumericCode(rawCode)) return Number(rawCode)
  return FALLBACK_CODES.get(normalizeName(canonicalizeName(rawName))) || null
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

function parseDateString(value) {
  const [day, month, year] = String(value || "")
    .split("/")
    .map((part) => Number(part))
  if (!day || !month || !year) return null
  const date = new Date(Date.UTC(year, month - 1, day))
  return Number.isNaN(date.getTime()) ? null : date
}

function buildPeriodInfo(rows) {
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
      if (!sameMonth) {
        throw new Error(`Source workbook period is not a single calendar month: ${match[0]}`)
      }
      return {
        key: `${endDate.getUTCFullYear()}-${String(endDate.getUTCMonth() + 1).padStart(2, "0")}`,
        label: `${match[1]} - ${match[2]}`,
        startDate,
        endDate,
      }
    }
  }

  throw new Error("Could not determine source workbook period from the first 24 rows.")
}

function buildMonthlyPeriods(startPeriodKey, endPeriodKey) {
  const periods = []
  const [startYear, startMonth] = startPeriodKey.split("-").map(Number)
  const [endYear, endMonth] = endPeriodKey.split("-").map(Number)
  let cursor = new Date(Date.UTC(startYear, startMonth - 1, 1))
  const limit = new Date(Date.UTC(endYear, endMonth - 1, 1))

  while (cursor <= limit) {
    periods.push({
      key: `${cursor.getUTCFullYear()}-${String(cursor.getUTCMonth() + 1).padStart(2, "0")}`,
      firstDay: new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth(), 1)),
      lastDay: new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 0)),
    })
    cursor = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 1))
  }

  return periods
}

function buildPeriodMeta(periodKey) {
  const [year, month] = periodKey.split("-").map(Number)
  const firstDay = new Date(Date.UTC(year, month - 1, 1))
  const lastDay = new Date(Date.UTC(year, month, 0))
  return {
    key: periodKey,
    measurementDate: lastDay,
    label: `${firstDay.getUTCDate()}/${month}/${year} - ${lastDay.getUTCDate()}/${month}/${year}`,
  }
}

function monthDistanceFromLatest(latestPeriodKey, targetPeriodKey) {
  const [latestYear, latestMonth] = latestPeriodKey.split("-").map(Number)
  const [targetYear, targetMonth] = targetPeriodKey.split("-").map(Number)
  return (latestYear - targetYear) * 12 + (latestMonth - targetMonth)
}

function buildHistoryWeights(count) {
  if (count <= 0) return []
  const rawWeights = Array.from({ length: count }, (_, index) => count - index)
  const total = rawWeights.reduce((sum, value) => sum + value, 0)
  return rawWeights.map((value) => value / total)
}

function computeBackfillFactor(openingDebt, latestCharge, maxWeight) {
  const numericOpeningDebt = Math.max(0, roundMoney(openingDebt))
  const numericLatestCharge = roundMoney(latestCharge)
  if (numericOpeningDebt <= 0 || numericLatestCharge <= 0) return 0

  const ratio = numericOpeningDebt / numericLatestCharge
  const maxFactor = maxWeight > 0 ? 0.85 / maxWeight : ratio
  return Math.max(0, Math.min(ratio, maxFactor))
}

function scaleMoney(base, factor) {
  if (!factor || !base) return 0
  return roundMoney(base * factor)
}

function scaleCount(base, factor) {
  if (!factor || !base) return 0
  return roundCount(base * factor)
}

function derivePhotoUsage(row, monthFactor) {
  const bw2520Count = scaleCount(row.photoBw2520Count, monthFactor)
  const color3330Count = scaleCount(row.photoColor3330Count, monthFactor)
  const bw3330Count = scaleCount(row.photoBw3330Count, monthFactor)
  const totalBwCount = bw2520Count + bw3330Count
  const kydoniaCharge = scaleMoney(row.photoKydoniaCharge, monthFactor)
  const specialCharge = scaleMoney(row.photoSpecialCharge, monthFactor)
  const basementCharge = scaleMoney(row.photoBasementCharge, monthFactor)
  const newPrintCharge = roundMoney(
    totalBwCount * 0.05 + color3330Count * 0.25 + kydoniaCharge + specialCharge + basementCharge
  )

  return {
    bw2520Count,
    color3330Count,
    bw3330Count,
    totalBwCount,
    kydoniaCharge,
    specialCharge,
    basementCharge,
    newPrintCharge,
  }
}

function deriveLaminationUsage(row, monthFactor) {
  const charge40 = scaleMoney(row.laminationCharge40, monthFactor)
  const chargeKydonia = scaleMoney(row.laminationChargeKydonia, monthFactor)
  return {
    charge40,
    chargeKydonia,
    newLaminationCharge: roundMoney(charge40 + chargeKydonia),
  }
}

function buildSourceState(photoRows, laminationRows) {
  const rows = []

  photoRows.forEach((row, index) => {
    const photoCode = resolveCode(row.C, row.B)
    if (photoCode === null) return

    const laminationRow = laminationRows[index]
    rows.push({
      rowNumber: index + 1,
      photoCode,
      latestPhotoOldDebt: getNumber(row, "D"),
      latestPhotoCharge: getNumber(row, "L"),
      photoBw2520Count: getNumber(row, "E"),
      photoColor3330Count: getNumber(row, "F"),
      photoBw3330Count: getNumber(row, "G"),
      photoKydoniaCharge: getNumber(row, "I"),
      photoSpecialCharge: getNumber(row, "J"),
      photoBasementCharge: getNumber(row, "K"),
      latestLaminationOldDebt: getNumber(laminationRow, "C"),
      laminationCharge40: getNumber(laminationRow, "D"),
      laminationChargeKydonia: getNumber(laminationRow, "E"),
      latestLaminationCharge: roundMoney(getNumber(laminationRow, "D") + getNumber(laminationRow, "E")),
    })
  })

  return rows
}

function applyPeriodToTemplate(photoSheet, laminationSheet, periodMeta) {
  setCellValue(photoSheet, "A8", toExcelSerial(periodMeta.measurementDate))
  setCellValue(photoSheet, "A12", periodMeta.label)
  setCellValue(laminationSheet, "A10", toExcelSerial(periodMeta.measurementDate))
  setCellValue(laminationSheet, "A14", periodMeta.label)
}

function writeDerivedPeriodPair(periodMeta, latestPeriodKey, historyWeights, sourceRows, openingStateByRow) {
  const photoWorkbook = readWorkbook(PHOTO_SOURCE)
  const laminationWorkbook = readWorkbook(LAMINATION_SOURCE)
  const photoSheet = photoWorkbook.Sheets[photoWorkbook.SheetNames[0]]
  const laminationSheet = laminationWorkbook.Sheets[laminationWorkbook.SheetNames[0]]
  const distance = monthDistanceFromLatest(latestPeriodKey, periodMeta.key)
  const historyWeight = historyWeights[distance - 1]
  const maxWeight = historyWeights[0] || 1

  if (!historyWeight) {
    throw new Error(`Missing history weight for ${periodMeta.key} (distance ${distance}).`)
  }

  applyPeriodToTemplate(photoSheet, laminationSheet, periodMeta)

  sourceRows.forEach((row) => {
    const openingState = openingStateByRow.get(row.rowNumber)
    if (!openingState) return

    const photoBackfillFactor = computeBackfillFactor(row.latestPhotoOldDebt, row.latestPhotoCharge, maxWeight)
    const laminationBackfillFactor = computeBackfillFactor(
      row.latestLaminationOldDebt,
      row.latestLaminationCharge,
      maxWeight
    )

    const photoUsage = derivePhotoUsage(row, photoBackfillFactor * historyWeight)
    const laminationUsage = deriveLaminationUsage(row, laminationBackfillFactor * historyWeight)

    const photoFinalDebt = openingState.nextPhotoOpening
    const laminationFinalDebt = openingState.nextLaminationOpening
    const photoOldDebt = roundMoney(photoFinalDebt - photoUsage.newPrintCharge)
    const laminationOldDebt = roundMoney(laminationFinalDebt - laminationUsage.newLaminationCharge)

    setCellValue(photoSheet, `D${row.rowNumber}`, photoOldDebt)
    setCellValue(photoSheet, `E${row.rowNumber}`, photoUsage.bw2520Count)
    setCellValue(photoSheet, `F${row.rowNumber}`, photoUsage.color3330Count)
    setCellValue(photoSheet, `G${row.rowNumber}`, photoUsage.bw3330Count)
    setCellValue(photoSheet, `H${row.rowNumber}`, photoUsage.totalBwCount)
    setCellValue(photoSheet, `I${row.rowNumber}`, photoUsage.kydoniaCharge)
    setCellValue(photoSheet, `J${row.rowNumber}`, photoUsage.specialCharge)
    setCellValue(photoSheet, `K${row.rowNumber}`, photoUsage.basementCharge)
    setCellValue(photoSheet, `L${row.rowNumber}`, photoUsage.newPrintCharge)
    setCellValue(photoSheet, `M${row.rowNumber}`, photoFinalDebt)

    setCellValue(laminationSheet, `C${row.rowNumber}`, laminationOldDebt)
    setCellValue(laminationSheet, `D${row.rowNumber}`, laminationUsage.charge40)
    setCellValue(laminationSheet, `E${row.rowNumber}`, laminationUsage.chargeKydonia)
    setCellValue(laminationSheet, `F${row.rowNumber}`, laminationFinalDebt)

    openingStateByRow.set(row.rowNumber, {
      nextPhotoOpening: photoOldDebt,
      nextLaminationOpening: laminationOldDebt,
    })
  })

  const photoPath = path.join(OUTPUT_DIR, `${periodMeta.key}-ΦΩΤΟΤΥΠΙΚΟ.xlsx`)
  const laminationPath = path.join(OUTPUT_DIR, `${periodMeta.key}-ΠΛΑΣΤΙΚΟΠΟΙΗΤΗΣ.xlsx`)
  XLSX.writeFile(photoWorkbook, photoPath)
  XLSX.writeFile(laminationWorkbook, laminationPath)

  return {
    periodKey: periodMeta.key,
    photoPath,
    laminationPath,
  }
}

function copyLatestSourcePair(latestPeriodKey) {
  const photoPath = path.join(OUTPUT_DIR, `${latestPeriodKey}-ΦΩΤΟΤΥΠΙΚΟ.xlsx`)
  const laminationPath = path.join(OUTPUT_DIR, `${latestPeriodKey}-ΠΛΑΣΤΙΚΟΠΟΙΗΤΗΣ.xlsx`)
  fs.copyFileSync(PHOTO_SOURCE, photoPath)
  fs.copyFileSync(LAMINATION_SOURCE, laminationPath)

  return {
    periodKey: latestPeriodKey,
    photoPath,
    laminationPath,
  }
}

function assertPeriodRange(startPeriodKey, latestPeriodKey) {
  if (monthDistanceFromLatest(latestPeriodKey, startPeriodKey) < 0) {
    throw new Error(`Start period ${startPeriodKey} is after latest source period ${latestPeriodKey}.`)
  }
}

function main() {
  const photoWorkbook = readWorkbook(PHOTO_SOURCE)
  const laminationWorkbook = readWorkbook(LAMINATION_SOURCE)
  const photoSheet = photoWorkbook.Sheets[photoWorkbook.SheetNames[0]]
  const laminationSheet = laminationWorkbook.Sheets[laminationWorkbook.SheetNames[0]]
  const photoRows = getSheetRows(photoSheet)
  const laminationRows = getSheetRows(laminationSheet)
  const photoPeriod = buildPeriodInfo(photoRows)
  const laminationPeriod = buildPeriodInfo(laminationRows)

  if (photoPeriod.key !== laminationPeriod.key) {
    throw new Error(
      `Source workbooks are not aligned: photocopier is ${photoPeriod.label}, lamination is ${laminationPeriod.label}.`
    )
  }

  assertPeriodRange(TARGET_START_PERIOD_KEY, photoPeriod.key)

  const periods = buildMonthlyPeriods(TARGET_START_PERIOD_KEY, photoPeriod.key)
  const latestPeriodKey = photoPeriod.key
  const priorPeriods = periods.slice(0, -1)
  const historyWeights = buildHistoryWeights(priorPeriods.length)
  const sourceRows = buildSourceState(photoRows, laminationRows)
  const openingStateByRow = new Map(
    sourceRows.map((row) => [
      row.rowNumber,
      {
        nextPhotoOpening: row.latestPhotoOldDebt,
        nextLaminationOpening: row.latestLaminationOldDebt,
      },
    ])
  )

  fs.rmSync(OUTPUT_DIR, { recursive: true, force: true })
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })

  const pairsByPeriod = new Map()
  pairsByPeriod.set(latestPeriodKey, copyLatestSourcePair(latestPeriodKey))

  priorPeriods
    .slice()
    .reverse()
    .forEach((period) => {
      const periodMeta = buildPeriodMeta(period.key)
      const pair = writeDerivedPeriodPair(periodMeta, latestPeriodKey, historyWeights, sourceRows, openingStateByRow)
      pairsByPeriod.set(period.key, pair)
    })

  const orderedPairs = periods.map((period) => {
    const pair = pairsByPeriod.get(period.key)
    if (!pair) {
      throw new Error(`Missing generated pair for ${period.key}.`)
    }
    return pair
  })

  const manifestPath = path.join(OUTPUT_DIR, "manifest.json")
  fs.writeFileSync(
    manifestPath,
    JSON.stringify(
      {
        createdAt: new Date().toISOString(),
        mode: "backfill-from-latest-source",
        startPeriodKey: TARGET_START_PERIOD_KEY,
        latestPeriodKey,
        sourceFiles: {
          photo: PHOTO_SOURCE,
          lamination: LAMINATION_SOURCE,
        },
        pairs: orderedPairs,
      },
      null,
      2
    )
  )

  console.log(
    JSON.stringify(
      {
        outputDir: OUTPUT_DIR,
        startPeriodKey: TARGET_START_PERIOD_KEY,
        latestPeriodKey,
        generatedPairCount: orderedPairs.length,
        manifestPath,
      },
      null,
      2
    )
  )
}

main()
