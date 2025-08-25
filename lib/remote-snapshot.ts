import { CollectionSnapshot } from "./snapshot-store"

function computeSnapshotFileName(collection: string, uid?: string | null): string {
  const scope = uid ? `uid-${uid}` : "all"
  return `${collection}-${scope}.json`
}

export async function loadRemoteSnapshot<T>(collection: string, uid?: string | null): Promise<CollectionSnapshot<T> | null> {
  try {
    const base = process.env.NEXT_PUBLIC_SNAPSHOT_BASE_URL || "/snapshots"
    const file = computeSnapshotFileName(collection, uid)
    const url = `${base.replace(/\/$/, "")}/${file}`
    const res = await fetch(url, { cache: "no-store" })
    if (!res.ok) return null
    const json = await res.json()
    if (!json || typeof json !== "object" || !("items" in json)) return null
    return {
      lastUpdated: Number((json as any).lastUpdated || Date.now()),
      items: (json as any).items || [],
    } as CollectionSnapshot<T>
  } catch {
    return null
  }
}


