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

    // 1) Look up user by username in Firestore users collection
    const snap = await db.collection(FIREBASE_COLLECTIONS.USERS).where("username", "==", String(username)).limit(1).get()
    if (snap.empty) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }
    const userDoc = snap.docs[0]
    const userData = userDoc.data() as any

    // 2) Verify password against legacy dummy scheme
    // Map your dummy scheme: admin -> admin123, numeric -> itself
    const expected = username === "admin" ? "admin123" : username
    if (String(password) !== expected) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const uid = userData.uid || userDoc.id

    // 3) Ensure there is a Firebase Auth user with this uid
    let userRecord
    try {
      userRecord = await auth.getUser(uid)
    } catch (e) {
      userRecord = await auth.createUser({ uid, displayName: userData.displayName })
    }

    // 4) Create a custom token and return
    const customToken = await auth.createCustomToken(uid, {
      role: userData.role || "user",
      accessLevel: userData.accessLevel || "Χρήστης",
    })

    return NextResponse.json({ token: customToken, uid })
  } catch (err: any) {
    console.error("custom-login error", err)
    // Handle common Firebase quota / permission errors explicitly for better UX
    const message = String(err?.message || "")
    if (message.includes("quota") || message.includes("exceeded")) {
      return NextResponse.json({ error: "firestore_quota_exceeded" }, { status: 503 })
    }
    if (message.includes("permission") || message.includes("PERMISSION_DENIED")) {
      return NextResponse.json({ error: "permission_denied" }, { status: 403 })
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
