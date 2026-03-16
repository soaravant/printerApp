import { NextResponse } from "next/server"

import { listCompletedExcelImportSummaries } from "@/lib/server/excel-import"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const history = await listCompletedExcelImportSummaries()
    return NextResponse.json({ history })
  } catch (error) {
    console.error("excel import history route", error)
    return NextResponse.json({ error: "Εσωτερικό σφάλμα διακομιστή." }, { status: 500 })
  }
}
