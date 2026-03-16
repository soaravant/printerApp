import { NextRequest, NextResponse } from "next/server"
import { ZodError } from "zod"

import {
  ExcelImportServerError,
  getLatestCompletedExcelImportSummary,
  getLatestExcelImportSummary,
  rollbackExcelImport,
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
    return NextResponse.json({ error: "Μη έγκυρο αίτημα αναίρεσης Excel.", issues: error.issues }, { status: 400 })
  }

  console.error("excel rollback route", error)
  return NextResponse.json({ error: "Εσωτερικό σφάλμα διακομιστή." }, { status: 500 })
}

export async function POST(req: NextRequest) {
  try {
    const token = getBearerToken(req)
    if (!token) {
      return NextResponse.json({ error: "Μη εξουσιοδοτημένη πρόσβαση." }, { status: 401 })
    }

    const actor = await verifyExcelImportAdmin(token)
    const { importId } = await req.json()
    if (!importId || typeof importId !== "string") {
      return NextResponse.json({ error: "Λείπει το importId της εισαγωγής που θέλετε να αναιρέσετε." }, { status: 400 })
    }

    await rollbackExcelImport(importId, actor)
    const [latestImport, rollbackCandidateImport] = await Promise.all([
      getLatestExcelImportSummary(),
      getLatestCompletedExcelImportSummary(),
    ])
    return NextResponse.json({ ok: true, latestImport, rollbackCandidateImport })
  } catch (error) {
    return errorResponse(error)
  }
}
