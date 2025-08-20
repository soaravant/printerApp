import { NextResponse } from "next/server"
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin"
import { FIREBASE_COLLECTIONS } from "@/lib/firebase-schema"

// WARNING: This approach treats the provided password as a shared secret checked server-side.
// In production, migrate to proper Firebase Auth (email/password or SSO) and do not store plain passwords.

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json()
    if (!username || !password) {
      return NextResponse.json({ error: "Missing credentials" }, { status: 400 })
    }

    const db = getAdminDb()
    const auth = getAdminAuth()

    // Look up user by username
    const snap = await db
      .collection(FIREBASE_COLLECTIONS.USERS)
      .where("username", "==", String(username))
      .limit(1)
      .get()

    if (snap.empty) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })

    const userDoc = snap.docs[0]
    const userData = userDoc.data() as any

    // Demo password check
    const expected = username === "admin" ? "admin123" : username
    if (String(password) !== expected) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const uid = userData.uid || userDoc.id

    // Create a custom token and return (no need to pre-create Auth user)
    const customToken = await auth.createCustomToken(uid, {
      role: userData.role || "user",
      accessLevel: userData.accessLevel || "Χρήστης",
    })

    return NextResponse.json({ token: customToken, uid })
  } catch (err: any) {
    console.error("custom-login error", err)
    const message = String(err?.message || "").toLowerCase()
    if (message.includes("quota") || message.includes("exceed") || message.includes("unavailable")) {
      return NextResponse.json({ error: "service_unavailable" }, { status: 503 })
    }
    if (message.includes("permission") || message.includes("insufficient") || message.includes("denied")) {
      return NextResponse.json({ error: "permission_denied" }, { status: 403 })
    }
    return NextResponse.json({ error: "server_error" }, { status: 500 })
  }
}
