// Lightweight IndexedDB snapshot store for large collections
// Stores full collection arrays with a lastUpdated timestamp per scope

export interface CollectionSnapshot<T> {
  lastUpdated: number // epoch millis UTC
  items: T[]
}

type UpgradeHandler = (db: IDBDatabase) => void

const DB_NAME = "printerAppSnapshotV1"
const STORE_NAME = "snapshots"

function openDatabase(onUpgrade?: UpgradeHandler): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      // SSR or unsupported env; act as no-op store
      reject(new Error("IndexedDB unavailable"))
      return
    }
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
      onUpgrade?.(db)
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error || new Error("IndexedDB open error"))
  })
}

export async function getSnapshot<T>(key: string): Promise<CollectionSnapshot<T> | null> {
  try {
    const db = await openDatabase()
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly")
      const store = tx.objectStore(STORE_NAME)
      const req = store.get(key)
      req.onsuccess = () => {
        resolve((req.result as CollectionSnapshot<T>) || null)
      }
      req.onerror = () => reject(req.error || new Error("IndexedDB get error"))
    })
  } catch {
    return null
  }
}

export async function saveSnapshot<T>(key: string, snapshot: CollectionSnapshot<T>): Promise<void> {
  try {
    const db = await openDatabase()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite")
      const store = tx.objectStore(STORE_NAME)
      const req = store.put(snapshot, key)
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error || new Error("IndexedDB put error"))
    })
  } catch {
    // ignore when not available (SSR); callers should tolerate missing persistence
  }
}

export function makeScopeKey(collection: string, uid?: string | null): string {
  return uid ? `${collection}:uid:${uid}` : `${collection}:all`
}

export function mergeById<T extends Record<string, any>>(existing: T[], incoming: T[], idFields: string[]): T[] {
  if (!incoming.length) return existing.slice()
  const idOf = (obj: T) => idFields.map(k => String(obj[k] ?? "")).join("|")
  const seen = new Map<string, number>()
  const merged: T[] = []
  for (let i = 0; i < existing.length; i++) {
    const key = idOf(existing[i])
    seen.set(key, merged.length)
    merged.push(existing[i])
  }
  for (const item of incoming) {
    const key = idOf(item)
    const index = seen.get(key)
    if (index !== undefined) {
      merged[index] = item
    } else {
      seen.set(key, merged.length)
      merged.push(item)
    }
  }
  return merged
}

export function sortByTimestampDesc<T extends { timestamp: any }>(arr: T[]): T[] {
  return arr.slice().sort((a, b) => new Date(b.timestamp as any).getTime() - new Date(a.timestamp as any).getTime())
}


