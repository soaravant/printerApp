import { NextResponse } from "next/server"
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin"
import { FIREBASE_COLLECTIONS, FirebaseIncome } from "@/lib/firebase-schema"
import { recomputeUserDebts } from "@/lib/server/debt"

const roundMoney = (v: number) => Math.round((v + Number.EPSILON) * 100) / 100

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization") || ""
    const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null
    if (!idToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const auth = getAdminAuth()
    const decoded = await auth.verifyIdToken(idToken)
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = (await req.json()) as FirebaseIncome
    if (!body || !body.uid || !body.incomeId) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
    }
    const db = getAdminDb()
    await db.runTransaction(async (tx) => {
      // 1) Read user's current debts
      const userRef = db.collection(FIREBASE_COLLECTIONS.USERS).doc(body.uid)
      const userSnap = await tx.get(userRef)
      const user = userSnap.data() as any || {}
      const currentLaminationDebt = Math.max(0, user.laminationDebt || 0)
      const currentPrintDebt = Math.max(0, user.printDebt || 0)

      // 2) Allocate income: lamination first, then print, leftover to print bank
      let remaining = body.amount
      const laminationPayment = Math.min(remaining, currentLaminationDebt)
      remaining = roundMoney(remaining - laminationPayment)
      const printPayment = Math.min(remaining, currentPrintDebt)
      remaining = roundMoney(remaining - printPayment)
      const leftoverToPrintBank = Math.max(0, remaining)

      // 3) Update bank document
      const bankRef = db.collection(FIREBASE_COLLECTIONS.BANK).doc("main-bank")
      const bankSnap = await tx.get(bankRef)
      const bank = bankSnap.exists ? bankSnap.data() as any : { bankId: "main-bank", printBank: 0, laminationBank: 0, timestamp: new Date() }
      const newPrintBank = roundMoney((bank.printBank || 0) + printPayment + leftoverToPrintBank)
      const newLaminationBank = roundMoney((bank.laminationBank || 0) + laminationPayment)
      tx.set(bankRef, { bankId: "main-bank", printBank: newPrintBank, laminationBank: newLaminationBank, lastUpdated: new Date() }, { merge: true })

      // 4) Write income
      const incomeRef = db.collection(FIREBASE_COLLECTIONS.INCOME).doc(body.incomeId)
      tx.set(incomeRef, { ...body, timestamp: new Date(body.timestamp as any) })
    })
    await recomputeUserDebts(body.uid)
    // Read back updated user to return to client for local merge
    const updatedUserSnap = await getAdminDb().collection(FIREBASE_COLLECTIONS.USERS).doc(body.uid).get()
    const u = (updatedUserSnap.exists ? (updatedUserSnap.data() as any) : {})
    const responseUser = {
      uid: body.uid,
      username: u.username || "",
      displayName: u.displayName || "",
      accessLevel: u.accessLevel,
      userRole: u.userRole,
      printDebt: Number(u.printDebt || 0),
      laminationDebt: Number(u.laminationDebt || 0),
      totalDebt: typeof u.totalDebt === 'number' ? Number(u.totalDebt) : Number(u.printDebt || 0) + Number(u.laminationDebt || 0),
    }
    return NextResponse.json({ ok: true, user: responseUser })
  } catch (e) {
    console.error("POST /api/income", e)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}


