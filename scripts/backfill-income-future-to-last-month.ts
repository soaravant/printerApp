/* eslint-disable no-console */
import { config } from 'dotenv'
import { existsSync } from 'fs'
if (existsSync('.env.local')) config({ path: '.env.local' })
else config()

import getAdminDb from './utils/firebase-admin'
import { FIREBASE_COLLECTIONS, FirebaseIncome } from '../lib/firebase-schema'

function toDate(v: any): Date {
  return v && typeof v.toDate === 'function' ? v.toDate() : new Date(v)
}

function slugifyUsername(username: string): string {
  return String(username || '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

// Map any income with timestamp in the future (after today) to an earlier date from last month.
// Strategy: move to the same day-of-month last month if it exists, otherwise clamp to the last day of last month.
// Time component is preserved.
function moveToLastMonth(date: Date): Date {
  const now = new Date()
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonthYear = lastMonth.getFullYear()
  const lastMonthIndex = lastMonth.getMonth() // 0-11
  const desiredDay = Math.min(
    date.getDate(),
    // days in last month
    new Date(lastMonthYear, lastMonthIndex + 1, 0).getDate()
  )
  const moved = new Date(lastMonthYear, lastMonthIndex, desiredDay, date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds())
  return moved
}

export async function main() {
  const db = getAdminDb()

  const today = new Date()
  today.setHours(23, 59, 59, 999)

  console.log('Scanning income for future timestamps...')
  const snap = await db.collection(FIREBASE_COLLECTIONS.INCOME).get()
  const updates: Array<{ id: string; uid: string; username: string; amount: number; old: Date; new: Date }> = []

  for (const doc of snap.docs) {
    const data = doc.data() as FirebaseIncome
    const ts = toDate((data as any).timestamp)
    if (ts.getTime() > today.getTime()) {
      const updatedDate = moveToLastMonth(ts)
      updates.push({ id: doc.id, uid: data.uid, username: data.username, amount: Number(data.amount || 0), old: ts, new: updatedDate })
    }
  }

  console.log(`Found ${updates.length} future-dated income documents.`)
  let updated = 0
  for (const item of updates) {
    const usernamePart = item.username ? slugifyUsername(item.username) : 'unknown'
    const y = item.new.getFullYear()
    const m = String(item.new.getMonth() + 1).padStart(2, '0')
    const d = String(item.new.getDate()).padStart(2, '0')
    const datePart = `${d}-${m}-${y}`
    const amountPart = Number(item.amount || 0).toFixed(2)

    // Always generate a new id so it reflects the new date
    let newId = `${usernamePart}-${datePart}-${amountPart}-${Math.random().toString(36).slice(2, 8)}`
    const toRef0 = db.collection(FIREBASE_COLLECTIONS.INCOME).doc(newId)
    const exists = await toRef0.get()
    if (exists.exists) {
      newId = `${usernamePart}-${datePart}-${amountPart}-${Math.random().toString(36).slice(2, 10)}`
    }

    await db.runTransaction(async tx => {
      const fromRef = db.collection(FIREBASE_COLLECTIONS.INCOME).doc(item.id)
      const toRef = db.collection(FIREBASE_COLLECTIONS.INCOME).doc(newId)
      const snap = await tx.get(fromRef)
      if (!snap.exists) return
      const data = snap.data() as any
      const newDoc = { ...data, incomeId: newId, timestamp: item.new }
      tx.set(toRef, newDoc)
      tx.delete(fromRef)
    })

    updated++
    if (updated % 25 === 0) console.log(`Updated ${updated}/${updates.length}...`)
  }

  // Compute and update users' lastPayment from the effective income timestamps (after changes)
  console.log('Reconciling timestamp to match ID dates (if mismatched)...')
  {
    const all = await db.collection(FIREBASE_COLLECTIONS.INCOME).get()
    let fixedTs = 0
    for (const doc of all.docs) {
      const id = doc.id
      const m = id.match(/^([a-z0-9-]+)-(\d{2})-(\d{2})-(\d{4})-([0-9]+(?:\.[0-9]{2})?)-([a-z0-9]{6,})$/)
      if (!m) continue
      const [, , dd, mm, yyyy] = m
      const data = doc.data() as FirebaseIncome
      const ts = toDate((data as any).timestamp)
      const desired = new Date(Number(yyyy), Number(mm) - 1, Number(dd), ts.getHours(), ts.getMinutes(), ts.getSeconds(), ts.getMilliseconds())
      const sameDate = ts.getFullYear() === desired.getFullYear() && ts.getMonth() === desired.getMonth() && ts.getDate() === desired.getDate()
      if (!sameDate) {
        await doc.ref.set({ timestamp: desired }, { merge: true })
        fixedTs++
      }
    }
    console.log(`Timestamp reconciliation complete. Fixed ${fixedTs} documents.`)
  }

  console.log('Updating users.lastPayment...')
  const incomesSnap = await db.collection(FIREBASE_COLLECTIONS.INCOME).get()
  const lastMap = new Map<string, Date>() // uid -> latest date
  for (const doc of incomesSnap.docs) {
    const inc = doc.data() as FirebaseIncome
    const ts = toDate((inc as any).timestamp)
    if (!inc.uid) continue
    const prev = lastMap.get(inc.uid)
    if (!prev || ts > prev) lastMap.set(inc.uid, ts)
  }

  let updatedUsers = 0
  for (const [uid, date] of lastMap.entries()) {
    await db.collection(FIREBASE_COLLECTIONS.USERS).doc(uid).set({ lastPayment: date }, { merge: true })
    updatedUsers++
  }

  console.log(`Done. Updated ${updated} income docs and ${updatedUsers} users.`)
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch(err => { console.error(err); process.exit(1) })
}


