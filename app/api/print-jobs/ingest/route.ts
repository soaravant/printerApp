import { NextResponse } from "next/server"
import { timingSafeEqual, createHmac } from "crypto"
import { getAdminDb } from "@/lib/firebase-admin"
import { FIREBASE_COLLECTIONS, FirebasePrintJob } from "@/lib/firebase-schema"
import { createHash } from "crypto"

type IngestPayload = {
  username: string
  type: FirebasePrintJob["type"]
  quantity: number
  deviceIP?: string
  deviceName?: string
  timestamp?: string | number
  accountUsername?: string
  accountPassword?: string
}

const roundMoney = (v: number) => Math.round((v + Number.EPSILON) * 100) / 100

function mapTypeToPriceKey(type: FirebasePrintJob["type"]): string {
  switch (type) {
    case "A4BW":
      return "a4BW"
    case "A4Color":
      return "a4Color"
    case "A3BW":
      return "a3BW"
    case "A3Color":
      return "a3Color"
    case "RizochartoA3":
      return "rizochartoA3"
    case "RizochartoA4":
      return "rizochartoA4"
    case "ChartoniA3":
      return "chartoniA3"
    case "ChartoniA4":
      return "chartoniA4"
    case "Autokollito":
      return "autokollito"
  }
}

function safeJsonParse<T>(text: string): T | null {
  try {
    return JSON.parse(text) as T
  } catch {
    return null
  }
}

function validateHmac(rawBody: string, timestamp: string | null, signature: string | null): boolean {
  const secret = process.env.PRINT_INGEST_HMAC_SECRET || ""
  if (!secret || !timestamp || !signature) return false
  // Reject stale timestamps (> 5 minutes)
  const nowSec = Math.floor(Date.now() / 1000)
  const ts = Number(timestamp)
  if (!Number.isFinite(ts) || Math.abs(nowSec - ts) > 300) return false
  const data = `${timestamp}.${rawBody}`
  const expected = createHmac("sha256", secret).update(data).digest("hex")
  try {
    const a = Buffer.from(signature, "utf8")
    const b = Buffer.from(expected, "utf8")
    return a.length === b.length && timingSafeEqual(a, b)
  } catch {
    return false
  }
}

export async function POST(req: Request) {
  try {
    const raw = await req.text()
    const sig = req.headers.get("x-signature")
    const ts = req.headers.get("x-timestamp")
    if (!validateHmac(raw, ts, sig)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = safeJsonParse<IngestPayload>(raw)
    if (!payload || !payload.username || !payload.type || !payload.quantity) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
    }

    const db = getAdminDb()

    // Find user by username (numeric code or string)
    const userSnap = await db
      .collection(FIREBASE_COLLECTIONS.USERS)
      .where("username", "==", String(payload.username))
      .limit(1)
      .get()

    if (userSnap.empty) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }
    const userDoc = userSnap.docs[0]
    const user = userDoc.data() as any

    // Load printing price table
    const priceSnap = await db.collection(FIREBASE_COLLECTIONS.PRICE_TABLES).doc("printing").get()
    if (!priceSnap.exists) {
      return NextResponse.json({ error: "Missing price table" }, { status: 500 })
    }
    const prices = (priceSnap.data() as any).prices || {}
    const priceKey = mapTypeToPriceKey(payload.type)
    const pricePerUnit = Number(prices[priceKey] || 0)
    const totalCost = roundMoney(pricePerUnit * Number(payload.quantity))

    const now = new Date()
    const tsDate = payload.timestamp ? new Date(payload.timestamp as any) : now
    const jobId = `print-${userDoc.id}-${tsDate.getTime()}-${Math.random().toString(36).slice(2, 10)}`

    // Apply the same debt/credit logic as /api/print-jobs
    await db.runTransaction(async (tx) => {
      const userRef = db.collection(FIREBASE_COLLECTIONS.USERS).doc(userDoc.id)
      const userSnapTx = await tx.get(userRef)
      const prevUser = (userSnapTx.exists ? userSnapTx.data() : {}) as any
      const prevPrintDebt = Number(prevUser.printDebt || 0)
      const prevLaminationDebt = Number(prevUser.laminationDebt || 0)
      const prevTotalDebt = typeof prevUser.totalDebt === 'number' ? Number(prevUser.totalDebt) : prevPrintDebt + prevLaminationDebt
      const prevCredit = Math.max(0, -prevTotalDebt)

      const jobAmount = Number(totalCost || 0)
      const consume = Math.min(prevCredit, jobAmount)
      const remainder = roundMoney(jobAmount - consume)
      const newCredit = roundMoney(prevCredit - consume)
      const newPrintDebt = roundMoney(prevPrintDebt + remainder)
      const newTotalDebt = roundMoney(newPrintDebt + prevLaminationDebt - newCredit)

      const jobRef = db.collection(FIREBASE_COLLECTIONS.PRINT_JOBS).doc(jobId)
      const jobDoc: FirebasePrintJob = {
        jobId,
        uid: userDoc.id,
        username: String(user.username || payload.username),
        userDisplayName: String(user.displayName || ""),
        type: payload.type,
        quantity: Number(payload.quantity),
        pricePerUnit,
        totalCost,
        deviceIP: payload.deviceIP || "",
        deviceName: payload.deviceName || "",
        timestamp: tsDate as any,
        status: "completed",
      }
      if (payload.accountUsername) {
        (jobDoc as any).printerAccountUsername = String(payload.accountUsername)
      }
      if (payload.accountPassword) {
        const hash = createHash("sha256").update(String(payload.accountPassword)).digest("hex")
        ;(jobDoc as any).printerAccountPasswordHash = hash
      }
      tx.set(jobRef, jobDoc)
      tx.update(userRef, { printDebt: newPrintDebt, totalDebt: newTotalDebt })
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("POST /api/print-jobs/ingest", e)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}


