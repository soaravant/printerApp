import { db } from "./firebase-client"
import { collection, doc, getDoc, getDocs, orderBy, query, where, limit, startAfter } from "firebase/firestore"
import { useQuery, useQueryClient, useInfiniteQuery } from "@tanstack/react-query"
import { FIREBASE_COLLECTIONS, FirebasePrintJob, FirebaseLaminationJob, FirebaseUser, FirebaseIncome, FirebaseBank, FirebasePriceTable } from "./firebase-schema"
import { auth } from "./firebase-client"
import { getAdminDb } from "./firebase-admin"

export async function fetchAllUsers(): Promise<FirebaseUser[]> {
  const snap = await getDocs(collection(db, FIREBASE_COLLECTIONS.USERS))
  return snap.docs.map(d => d.data() as FirebaseUser)
}

export async function fetchUserById(uid: string): Promise<FirebaseUser | null> {
  const ref = doc(db, FIREBASE_COLLECTIONS.USERS, uid)
  const snap = await getDoc(ref)
  return snap.exists() ? (snap.data() as FirebaseUser) : null
}

export async function fetchUserByUsername(username: string): Promise<FirebaseUser | null> {
  const q = query(collection(db, FIREBASE_COLLECTIONS.USERS), where("username", "==", username))
  const snap = await getDocs(q)
  const docSnap = snap.docs[0]
  return docSnap ? (docSnap.data() as FirebaseUser) : null
}

export async function fetchPrintJobsFor(uid?: string): Promise<FirebasePrintJob[]> {
  const col = collection(db, FIREBASE_COLLECTIONS.PRINT_JOBS)
  const q = uid ? query(col, where("uid", "==", uid), orderBy("timestamp", "desc")) : query(col, orderBy("timestamp", "desc"))
  const snap = await getDocs(q)
  const toDate = (v: any) => (v && typeof v.toDate === "function" ? v.toDate() : new Date(v))
  return snap.docs.map(d => {
    const data = d.data() as any
    if (data && data.timestamp) data.timestamp = toDate(data.timestamp)
    return data as FirebasePrintJob
  })
}

export async function fetchLaminationJobsFor(uid?: string): Promise<FirebaseLaminationJob[]> {
  const col = collection(db, FIREBASE_COLLECTIONS.LAMINATION_JOBS)
  const q = uid ? query(col, where("uid", "==", uid), orderBy("timestamp", "desc")) : query(col, orderBy("timestamp", "desc"))
  const snap = await getDocs(q)
  const toDate = (v: any) => (v && typeof v.toDate === "function" ? v.toDate() : new Date(v))
  return snap.docs.map(d => {
    const data = d.data() as any
    if (data && data.timestamp) data.timestamp = toDate(data.timestamp)
    return data as FirebaseLaminationJob
  })
}

export async function fetchIncomeFor(uid?: string): Promise<FirebaseIncome[]> {
  const col = collection(db, FIREBASE_COLLECTIONS.INCOME)
  const q = uid ? query(col, where("uid", "==", uid), orderBy("timestamp", "desc")) : query(col, orderBy("timestamp", "desc"))
  const snap = await getDocs(q)
  const toDate = (v: any) => (v && typeof v.toDate === "function" ? v.toDate() : new Date(v))
  return snap.docs.map(d => {
    const data = d.data() as any
    if (data && data.timestamp) data.timestamp = toDate(data.timestamp)
    return data as FirebaseIncome
  })
}

export async function fetchBankTotals(): Promise<{ printBank: number; laminationBank: number }> {
  const ref = doc(db, FIREBASE_COLLECTIONS.BANK, "main-bank")
  const snap = await getDoc(ref)
  if (!snap.exists()) return { printBank: 0, laminationBank: 0 }
  const bank = snap.data() as FirebaseBank
  return { printBank: bank.printBank || 0, laminationBank: bank.laminationBank || 0 }
}

export async function fetchPriceTable(id: string): Promise<FirebasePriceTable | null> {
  const ref = doc(db, FIREBASE_COLLECTIONS.PRICE_TABLES, id)
  const snap = await getDoc(ref)
  return snap.exists() ? (snap.data() as FirebasePriceTable) : null
}

// React Query hooks for caching with SWR behavior
export function usePriceTable(id: string) {
  return useQuery({
    queryKey: ["priceTable", id],
    queryFn: () => fetchPriceTable(id),
    staleTime: 5 * 60 * 1000,
  })
}

export async function fetchUsers(): Promise<FirebaseUser[]> {
  const snap = await getDocs(collection(db, FIREBASE_COLLECTIONS.USERS))
  return snap.docs.map(d => {
    const data = d.data() as any
    const toJsDate = (v: any): Date | null => {
      if (!v) return null
      return (v && typeof v.toDate === "function") ? v.toDate() : new Date(v)
    }
    if (data && data.lastPayment) {
      data.lastPayment = toJsDate(data.lastPayment)
    } else {
      data.lastPayment = null
    }
    return data as FirebaseUser
  })
}

export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: () => fetchUsers(),
    staleTime: 60 * 1000,
  })
}

// Bank totals with long-lived cache
export function useBankTotals() {
  return useQuery({
    queryKey: ["bankTotals"],
    queryFn: () => fetchBankTotals(),
    staleTime: Infinity,
    gcTime: 30 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  })
}

// Mutation helpers with cache invalidation
export function useUsersMutations() {
  const qc = useQueryClient()
  return {
    invalidate: () => qc.invalidateQueries({ queryKey: ["users"] }),
  }
}

// Infinite queries for jobs/income with strong caching to persist across route switches
export function usePrintJobsInfinite(uid?: string, bigBatchPageSize: number = 1000, options?: { enabled?: boolean }) {
  return useInfiniteQuery({
    queryKey: ["printJobs", uid ?? "all"],
    queryFn: ({ pageParam }) => {
      const size = pageParam ? bigBatchPageSize : 10
      return fetchPrintJobsPage({ uid, pageSize: size, startAfterTimestamp: pageParam })
    },
    initialPageParam: undefined as any,
    getNextPageParam: (last) => last.nextCursor,
    staleTime: Infinity,
    gcTime: 30 * 60 * 1000,
    enabled: options?.enabled ?? true,
  })
}

export function useLaminationJobsInfinite(uid?: string, bigBatchPageSize: number = 1000, options?: { enabled?: boolean }) {
  return useInfiniteQuery({
    queryKey: ["laminationJobs", uid ?? "all"],
    queryFn: ({ pageParam }) => {
      const size = pageParam ? bigBatchPageSize : 10
      return fetchLaminationJobsPage({ uid, pageSize: size, startAfterTimestamp: pageParam })
    },
    initialPageParam: undefined as any,
    getNextPageParam: (last) => last.nextCursor,
    staleTime: Infinity,
    gcTime: 30 * 60 * 1000,
    enabled: options?.enabled ?? true,
  })
}

export function useIncomeInfinite(uid?: string, bigBatchPageSize: number = 1000, options?: { enabled?: boolean }) {
  return useInfiniteQuery({
    queryKey: ["income", uid ?? "all"],
    queryFn: ({ pageParam }) => {
      const size = pageParam ? bigBatchPageSize : 10
      return fetchIncomePage({ uid, pageSize: size, startAfterTimestamp: pageParam })
    },
    initialPageParam: undefined as any,
    getNextPageParam: (last) => last.nextCursor,
    staleTime: Infinity,
    gcTime: 30 * 60 * 1000,
    enabled: options?.enabled ?? true,
  })
}

export function useJobsMutations() {
  const qc = useQueryClient()
  const invalidatePrint = (uid?: string) => {
    qc.invalidateQueries({ queryKey: ["printJobs", uid ?? "all"] })
  }
  const invalidateLam = (uid?: string) => {
    qc.invalidateQueries({ queryKey: ["laminationJobs", uid ?? "all"] })
  }
  const invalidateInc = (uid?: string) => {
    qc.invalidateQueries({ queryKey: ["income", uid ?? "all"] })
  }
  const invalidateBank = () => {
    qc.invalidateQueries({ queryKey: ["bankTotals"] })
  }
  return { invalidatePrint, invalidateLam, invalidateInc, invalidateBank }
}

// Server write helpers (call secure API routes)
async function api<T>(path: string, method: string, body: any): Promise<T> {
  const token = await auth.currentUser?.getIdToken()
  const res = await fetch(path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    let text = ""
    try { text = await res.text() } catch {}
    throw new Error(text || `Request failed: ${res.status}`)
  }
  return (await res.json()) as T
}

export async function addPrintJobServer(doc: FirebasePrintJob) {
  return api<{ ok: boolean; user: Partial<FirebaseUser> }>("/api/print-jobs", "POST", doc)
}
export async function addLaminationJobServer(doc: FirebaseLaminationJob) {
  return api<{ ok: boolean; user: Partial<FirebaseUser> }>("/api/lamination-jobs", "POST", doc)
}
export async function addIncomeServer(doc: FirebaseIncome) {
  return api<{ ok: boolean; user: Partial<FirebaseUser> }>("/api/income", "POST", doc)
}
export async function addUserServer(user: FirebaseUser) {
  return api<{ ok: boolean }>("/api/users", "POST", user)
}
export async function updateUserServer(uid: string, updates: Partial<FirebaseUser>) {
  return api<{ ok: boolean }>(`/api/users/${uid}`, "PATCH", updates)
}

// ============================================================================
// Paginated query helpers (limit + startAfter)
// ============================================================================

function toJsDate(v: any): Date { return (v && typeof v.toDate === "function") ? v.toDate() : new Date(v) }

export async function fetchPrintJobsPage(params: { uid?: string; pageSize: number; startAfterTimestamp?: any }): Promise<{ items: FirebasePrintJob[]; nextCursor?: any }> {
  const col = collection(db, FIREBASE_COLLECTIONS.PRINT_JOBS)
  const base = params.uid
    ? query(col, where("uid", "==", params.uid), orderBy("timestamp", "desc"))
    : query(col, orderBy("timestamp", "desc"))
  const q = params.startAfterTimestamp
    ? query(base, startAfter(params.startAfterTimestamp), limit(params.pageSize))
    : query(base, limit(params.pageSize))
  const snap = await getDocs(q)
  const items = snap.docs.map(d => {
    const data = d.data() as any
    if (data && data.timestamp) data.timestamp = toJsDate(data.timestamp)
    return data as FirebasePrintJob
  })
  const hasMore = snap.docs.length === params.pageSize
  const last = snap.docs[snap.docs.length - 1]
  const nextCursor = hasMore && last ? last.get("timestamp") : undefined
  return { items, nextCursor }
}

export async function fetchLaminationJobsPage(params: { uid?: string; pageSize: number; startAfterTimestamp?: any }): Promise<{ items: FirebaseLaminationJob[]; nextCursor?: any }> {
  const col = collection(db, FIREBASE_COLLECTIONS.LAMINATION_JOBS)
  const base = params.uid
    ? query(col, where("uid", "==", params.uid), orderBy("timestamp", "desc"))
    : query(col, orderBy("timestamp", "desc"))
  const q = params.startAfterTimestamp
    ? query(base, startAfter(params.startAfterTimestamp), limit(params.pageSize))
    : query(base, limit(params.pageSize))
  const snap = await getDocs(q)
  const items = snap.docs.map(d => {
    const data = d.data() as any
    if (data && data.timestamp) data.timestamp = toJsDate(data.timestamp)
    return data as FirebaseLaminationJob
  })
  const hasMore = snap.docs.length === params.pageSize
  const last = snap.docs[snap.docs.length - 1]
  const nextCursor = hasMore && last ? last.get("timestamp") : undefined
  return { items, nextCursor }
}

export async function fetchIncomePage(params: { uid?: string; pageSize: number; startAfterTimestamp?: any }): Promise<{ items: FirebaseIncome[]; nextCursor?: any }> {
  const col = collection(db, FIREBASE_COLLECTIONS.INCOME)
  const base = params.uid
    ? query(col, where("uid", "==", params.uid), orderBy("timestamp", "desc"))
    : query(col, orderBy("timestamp", "desc"))
  const q = params.startAfterTimestamp
    ? query(base, startAfter(params.startAfterTimestamp), limit(params.pageSize))
    : query(base, limit(params.pageSize))
  const snap = await getDocs(q)
  const items = snap.docs.map(d => {
    const data = d.data() as any
    if (data && data.timestamp) data.timestamp = toJsDate(data.timestamp)
    return data as FirebaseIncome
  })
  const hasMore = snap.docs.length === params.pageSize
  const last = snap.docs[snap.docs.length - 1]
  const nextCursor = hasMore && last ? last.get("timestamp") : undefined
  return { items, nextCursor }
}

// Delta helpers: fetch documents with timestamp strictly greater than `since`.
export async function fetchPrintJobsSince(params: { uid?: string; since: Date; cap?: number }): Promise<FirebasePrintJob[]> {
  const col = collection(db, FIREBASE_COLLECTIONS.PRINT_JOBS)
  const base = params.uid
    ? query(col, where("uid", "==", params.uid), where("createdAt", ">", params.since), orderBy("createdAt", "desc"))
    : query(col, where("createdAt", ">", params.since), orderBy("createdAt", "desc"))
  const q = params.cap ? query(base, limit(params.cap)) : base
  const snap = await getDocs(q)
  return snap.docs.map(d => {
    const data = d.data() as any
    if (data && data.timestamp) data.timestamp = toJsDate(data.timestamp)
    return data as FirebasePrintJob
  })
}

export async function fetchLaminationJobsSince(params: { uid?: string; since: Date; cap?: number }): Promise<FirebaseLaminationJob[]> {
  const col = collection(db, FIREBASE_COLLECTIONS.LAMINATION_JOBS)
  const base = params.uid
    ? query(col, where("uid", "==", params.uid), where("createdAt", ">", params.since), orderBy("createdAt", "desc"))
    : query(col, where("createdAt", ">", params.since), orderBy("createdAt", "desc"))
  const q = params.cap ? query(base, limit(params.cap)) : base
  const snap = await getDocs(q)
  return snap.docs.map(d => {
    const data = d.data() as any
    if (data && data.timestamp) data.timestamp = toJsDate(data.timestamp)
    return data as FirebaseLaminationJob
  })
}

export async function fetchIncomeSince(params: { uid?: string; since: Date; cap?: number }): Promise<FirebaseIncome[]> {
  const col = collection(db, FIREBASE_COLLECTIONS.INCOME)
  // Use createdAt for delta detection so backdated payments (older timestamp) still appear
  const base = params.uid
    ? query(col, where("uid", "==", params.uid), where("createdAt", ">", params.since), orderBy("createdAt", "desc"))
    : query(col, where("createdAt", ">", params.since), orderBy("createdAt", "desc"))
  const q = params.cap ? query(base, limit(params.cap)) : base
  const snap = await getDocs(q)
  return snap.docs.map(d => {
    const data = d.data() as any
    if (data && data.timestamp) data.timestamp = toJsDate(data.timestamp)
    return data as FirebaseIncome
  })
}
