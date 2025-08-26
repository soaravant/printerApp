import { NextResponse } from "next/server"
import { getAdminAuth } from "@/lib/firebase-admin"
import { getAdminApp } from "@/lib/firebase-admin"
import { getStorage } from "firebase-admin/storage"

type CollectionName = "printJobs" | "laminationJobs" | "income"

function getIdKey(collection: CollectionName): string {
  switch (collection) {
    case "printJobs":
    case "laminationJobs":
      return "jobId"
    case "income":
      return "incomeId"
  }
}

function toIso(value: any): string | null {
  try {
    if (!value) return null
    if (typeof value.toDate === "function") return value.toDate().toISOString()
    const d = new Date(value)
    if (Number.isFinite(d.getTime())) return d.toISOString()
    return null
  } catch {
    return null
  }
}

function computeFilePath(collection: CollectionName, uid?: string | null): string {
  const scope = uid ? `uid-${uid}` : "all"
  return `snapshots/${collection}-${scope}.json`
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization") || ""
    const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null
    if (!idToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const auth = getAdminAuth()
    const decoded = await auth.verifyIdToken(idToken)
    if (!decoded || !decoded.uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = (await req.json()) as {
      collection: CollectionName
      uid?: string | null
      delta: any[]
    }
    if (!body || !body.collection || !Array.isArray(body.delta)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
    }

    // Security: only allow updating global (all) snapshots by admins
    if (!body.uid) {
      if ((decoded as any).role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    } else {
      // For user-scoped snapshots, allow owner or admin
      if (decoded.uid !== body.uid && (decoded as any).role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    }

    // Short-circuit when no delta
    if (body.delta.length === 0) {
      return NextResponse.json({ ok: true, updated: false })
    }

    // Initialize admin app and storage
    getAdminApp()
    const bucketName = process.env.SNAPSHOT_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
    if (!bucketName) return NextResponse.json({ error: "Missing SNAPSHOT_BUCKET" }, { status: 500 })
    const storage = getStorage()
    const bucket = storage.bucket(bucketName)

    const filePath = computeFilePath(body.collection, body.uid || undefined)
    const file = bucket.file(filePath)

    // Load existing snapshot if present
    let existing: { lastUpdated: number; items: any[] } = { lastUpdated: 0, items: [] }
    try {
      const [buf] = await file.download({ validation: false })
      const json = JSON.parse(buf.toString("utf8"))
      if (json && typeof json === "object" && Array.isArray((json as any).items)) {
        existing = { lastUpdated: Number((json as any).lastUpdated || 0), items: (json as any).items }
      }
    } catch {
      // treat as empty
    }

    // Merge delta into existing by id key
    const idKey = getIdKey(body.collection)
    const index = new Map<string, number>()
    const merged = existing.items.slice()
    for (let i = 0; i < merged.length; i++) {
      const key = String((merged[i] || {})[idKey] || "")
      index.set(key, i)
    }
    for (const item of body.delta) {
      if (!item) continue
      if (item.timestamp) {
        const iso = toIso(item.timestamp)
        if (iso) item.timestamp = iso
      }
      if (item.createdAt) {
        const iso2 = toIso(item.createdAt)
        if (iso2) item.createdAt = iso2
      }
      const key = String(item[idKey] || "")
      const pos = index.get(key)
      if (pos !== undefined) {
        merged[pos] = item
      } else {
        index.set(key, merged.length)
        merged.push(item)
      }
    }
    // Update lastUpdated (prefer createdAt when available)
    let maxMs = existing.lastUpdated || 0
    for (const d of body.delta) {
      const t = (d as any)?.createdAt ?? (d as any)?.timestamp
      const ms = typeof t === "string" ? Date.parse(t) : new Date(t as any).getTime()
      if (Number.isFinite(ms) && ms > maxMs) maxMs = ms
    }

    // Save updated snapshot
    const out = JSON.stringify({ lastUpdated: maxMs || Date.now(), items: merged })
    await file.save(out, {
      contentType: "application/json",
      resumable: false,
      cacheControl: "public, max-age=60, must-revalidate",
    })

    return NextResponse.json({ ok: true, updated: true })
  } catch (e) {
    console.error("POST /api/snapshots/update", e)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}



