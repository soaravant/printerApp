import { NextRequest, NextResponse } from "next/server"
import { ZodError } from "zod"

import {
  ExcelImportServerError,
  getLatestCompletedExcelImportSummary,
  getLatestExcelImportSummary,
  runExcelImport,
  verifyExcelImportAdmin,
} from "@/lib/server/excel-import"

export const dynamic = "force-dynamic"

function getBearerToken(req: NextRequest) {
  const authHeader = req.headers.get("authorization") || ""
  return authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null
}

function errorResponse(error: unknown) {
  if (error instanceof ExcelImportServerError) {
    return NextResponse.json({ error: error.message }, { status: error.status })
  }
  if (error instanceof ZodError) {
    return NextResponse.json({ error: "Μη έγκυρα δεδομένα εισαγωγής Excel.", issues: error.issues }, { status: 400 })
  }

  console.error("excel import route", error)
  return NextResponse.json({ error: "Εσωτερικό σφάλμα διακομιστή." }, { status: 500 })
}

export async function GET(req: NextRequest) {
  try {
    const token = getBearerToken(req)
    if (!token) {
      return NextResponse.json({ error: "Μη εξουσιοδοτημένη πρόσβαση." }, { status: 401 })
    }

    await verifyExcelImportAdmin(token)
    const [latestImport, rollbackCandidateImport] = await Promise.all([
      getLatestExcelImportSummary(),
      getLatestCompletedExcelImportSummary(),
    ])
    return NextResponse.json({ latestImport, rollbackCandidateImport })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = getBearerToken(req)
    if (!token) {
      return NextResponse.json({ error: "Μη εξουσιοδοτημένη πρόσβαση." }, { status: 401 })
    }

    const actor = await verifyExcelImportAdmin(token)
    const formData = await req.formData()
    const photoFile = formData.get("photoFile")
    const laminationFile = formData.get("lamFile")
    const allowCreateUsers = String(formData.get("allowCreateUsers") || "false") === "true"

    if (!(photoFile instanceof File) || !(laminationFile instanceof File)) {
      return NextResponse.json({ error: "Λείπει ένα ή και τα δύο αρχεία Excel." }, { status: 400 })
    }

    const importRun = await runExcelImport({
      photoBuffer: await photoFile.arrayBuffer(),
      laminationBuffer: await laminationFile.arrayBuffer(),
      photoFileName: photoFile.name,
      laminationFileName: laminationFile.name,
      allowCreateUsers,
      actor,
    })

    return NextResponse.json({ ok: true, importRun, latestImport: importRun, rollbackCandidateImport: importRun })
  } catch (error) {
    return errorResponse(error)
  }
}
