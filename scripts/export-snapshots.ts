import { writeFileSync, mkdirSync, existsSync } from "fs"
import path from "path"
import getAdminDb from "./utils/firebase-admin"

type GenericDoc = Record<string, any>

const OUTPUT_DIR = path.resolve(process.cwd(), "public", "snapshots")
const PAGE_SIZE = Number(process.env.EXPORT_PAGE_SIZE || 2000)

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

async function fetchAllByTimestamp(collection: string): Promise<GenericDoc[]> {
  const db = getAdminDb()
  const items: GenericDoc[] = []
  let last: any = undefined
  while (true) {
    const base = db.collection(collection).orderBy("timestamp", "desc").limit(PAGE_SIZE)
    const q = last ? base.startAfter(last) : base
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
    last = lastDoc?.get("timestamp")
    if (!last || snap.size < PAGE_SIZE) break
  }
  return items
}

function computeLastUpdated(items: GenericDoc[]): number {
  let maxMs = 0
  for (const it of items) {
    const v = it?.timestamp
    if (!v) continue
    const ms = typeof v === "string" ? Date.parse(v) : new Date(v as any).getTime()
    if (Number.isFinite(ms) && ms > maxMs) maxMs = ms
  }
  return maxMs || Date.now()
}

async function exportCollection(collection: string, outFile: string) {
  const items = await fetchAllByTimestamp(collection)
  const snapshot = { lastUpdated: computeLastUpdated(items), items }
  writeFileSync(outFile, JSON.stringify(snapshot))
  console.log(`Wrote ${items.length} ${collection} → ${outFile}`)
}

async function main() {
  if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true })
  await exportCollection("printJobs", path.join(OUTPUT_DIR, "printJobs-all.json"))
  await exportCollection("laminationJobs", path.join(OUTPUT_DIR, "laminationJobs-all.json"))
  await exportCollection("income", path.join(OUTPUT_DIR, "income-all.json"))
}

main().catch((e) => {
  console.error("export-snapshots failed", e)
  process.exit(1)
})


