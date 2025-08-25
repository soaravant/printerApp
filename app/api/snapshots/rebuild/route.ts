import { NextResponse } from "next/server"
import { getAdminApp, getAdminDb, getAdminAuth } from "@/lib/firebase-admin"
import { getStorage } from "firebase-admin/storage"

type CollectionName = "printJobs" | "laminationJobs" | "income"

const COLLECTIONS: CollectionName[] = ["printJobs", "laminationJobs", "income"]
const PAGE_SIZE = Number(process.env.SNAPSHOT_EXPORT_PAGE_SIZE || 2000)

function toIso(value: any): string | null {
  try {
    if (!value) return null
    if (typeof value.toDate === "function") return value.toDate().toISOString()
    const d = new Date(value)
    if (Number.isFinite(d.getTime())) return d.toISOString()
    return null
  } catch { return null }
}

async function fetchAllByTimestamp(col: string) {
  const db = getAdminDb()
  const items: any[] = []
  let cursor: any = undefined
  while (true) {
    const base = db.collection(col).orderBy("timestamp", "desc").limit(PAGE_SIZE)
    const q = cursor ? base.startAfter(cursor) : base
    const snap = await q.get()
    if (snap.empty) break
    for (const doc of snap.docs) {
      const data = doc.data()
      if (data && data.timestamp) {
        const iso = toIso(data.timestamp)
        if (iso) data.timestamp = iso
      }
      items.push(data)
    }
    const lastDoc = snap.docs[snap.docs.length - 1]
    cursor = lastDoc?.get("timestamp")
    if (!cursor || snap.size < PAGE_SIZE) break
  }
  return items
}

function computeLastUpdated(items: any[]): number {
  let maxMs = 0
  for (const it of items) {
    const v = it?.timestamp
    const ms = typeof v === "string" ? Date.parse(v) : new Date(v as any).getTime()
    if (Number.isFinite(ms) && ms > maxMs) maxMs = ms
  }
  return maxMs || Date.now()
}

function filePath(collection: CollectionName, uid?: string | null): string {
  const scope = uid ? `uid-${uid}` : "all"
  return `snapshots/${collection}-${scope}.json`
}

async function authorize(req: Request) {
  // 1) Cron secret header
  const secret = process.env.SNAPSHOT_CRON_SECRET || ""
  if (secret && req.headers.get("x-cron-secret") === secret) return true
  // 2) Admin Firebase ID token
  const authHeader = req.headers.get("authorization") || ""
  const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null
  if (!idToken) return false
  const auth = getAdminAuth()
  const decoded = await auth.verifyIdToken(idToken)
  return Boolean(decoded && (decoded as any).role === "admin")
}

export async function POST(req: Request) {
  try {
    // Block expensive rebuilds in development unless explicitly allowed
    if (process.env.NODE_ENV !== "production" && process.env.ALLOW_SNAPSHOT_REBUILD_DEV !== "true") {
      return NextResponse.json({ error: "Disabled in development" }, { status: 403 })
    }
    if (!(await authorize(req))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    getAdminApp()
    const bucketName = process.env.SNAPSHOT_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
    if (!bucketName) return NextResponse.json({ error: "Missing SNAPSHOT_BUCKET" }, { status: 500 })
    const storage = getStorage()
    const bucket = storage.bucket(bucketName)

    const result: Record<string, number> = {}
    for (const col of COLLECTIONS) {
      const items = await fetchAllByTimestamp(col)
      const lastUpdated = computeLastUpdated(items)
      const out = JSON.stringify({ lastUpdated, items })
      const fp = filePath(col)
      await bucket.file(fp).save(out, {
        contentType: "application/json",
        resumable: false,
        cacheControl: "public, max-age=60, must-revalidate",
      })
      result[col] = items.length
    }

    return NextResponse.json({ ok: true, counts: result })
  } catch (e) {
    console.error("POST /api/snapshots/rebuild", e)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}



