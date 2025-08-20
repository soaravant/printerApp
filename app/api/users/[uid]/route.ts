import { NextResponse } from "next/server"
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin"
import { FIREBASE_COLLECTIONS } from "@/lib/firebase-schema"

export async function PATCH(_req: Request, { params }: { params: { uid: string } }) {
  try {
    const req = _req
    const authHeader = req.headers.get("authorization") || ""
    const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null
    if (!idToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const auth = getAdminAuth()
    const decoded = await auth.verifyIdToken(idToken)
    if (!decoded || decoded.role !== 'admin') return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const body = await req.json()
    const db = getAdminDb()
    await db.collection(FIREBASE_COLLECTIONS.USERS).doc(params.uid).update({ ...body })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("PATCH /api/users/[uid]", e)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}


