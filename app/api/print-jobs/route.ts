import { NextResponse } from "next/server"
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin"
import { FIREBASE_COLLECTIONS, FirebasePrintJob } from "@/lib/firebase-schema"

const roundMoney = (v: number) => Math.round((v + Number.EPSILON) * 100) / 100

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization") || ""
    const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null
    if (!idToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const auth = getAdminAuth()
    const decoded = await auth.verifyIdToken(idToken)
    // Optional: Allow any signed-in user to create jobs, or require admin
    if (!decoded || !decoded.uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = (await req.json()) as FirebasePrintJob
    if (!body || !body.uid || !body.jobId) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
    }
    const db = getAdminDb()
    await db.runTransaction(async (tx) => {
      const userRef = db.collection(FIREBASE_COLLECTIONS.USERS).doc(body.uid)
      const userSnap = await tx.get(userRef)
      const user = (userSnap.exists ? userSnap.data() : {}) as any
      const prevPrintDebt = Number(user.printDebt || 0)
      const prevLaminationDebt = Number(user.laminationDebt || 0)
      const prevTotalDebt = typeof user.totalDebt === 'number' ? Number(user.totalDebt) : prevPrintDebt + prevLaminationDebt
      const prevCredit = Math.max(0, -prevTotalDebt)

      const jobAmount = Number(body.totalCost || 0)
      const consume = Math.min(prevCredit, jobAmount)
      const remainder = roundMoney(jobAmount - consume)
      const newCredit = roundMoney(prevCredit - consume)
      const newPrintDebt = roundMoney(prevPrintDebt + remainder)
      const newTotalDebt = roundMoney(newPrintDebt + prevLaminationDebt - newCredit)

      const jobRef = db.collection(FIREBASE_COLLECTIONS.PRINT_JOBS).doc(body.jobId)
      tx.set(jobRef, { ...body, timestamp: new Date(body.timestamp as any) })
      tx.update(userRef, { printDebt: newPrintDebt, totalDebt: newTotalDebt })
    })
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
    console.error("POST /api/print-jobs", e)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}


