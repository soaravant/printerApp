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

export async function main() {
  const db = getAdminDb()

  console.log('Loading incomes...')
  const iSnap = await db.collection(FIREBASE_COLLECTIONS.INCOME).get()
  const incomes = iSnap.docs.map(d => ({ id: d.id, data: d.data() as FirebaseIncome }))
  console.log(`Loaded ${incomes.length} incomes`)

  let updatedCreatedAt = 0
  let renamed = 0

  for (const inc of incomes) {
    const id = inc.id
    const data = inc.data

    // 1) Ensure createdAt exists
    if (!(data as any).createdAt) {
      const createdAt = new Date()
      await db.collection(FIREBASE_COLLECTIONS.INCOME).doc(id).set({ createdAt }, { merge: true })
      updatedCreatedAt++
    }

    // 2) If id does not follow <username>-<date>-<amount>-<random>, create new doc and delete old
    const usernamePart = data.username ? slugifyUsername(data.username) : 'unknown'
    const ts = toDate((data as any).timestamp)
    const y = ts.getFullYear()
    const m = String(ts.getMonth() + 1).padStart(2, '0')
    const d = String(ts.getDate()).padStart(2, '0')
    const datePart = `${d}-${m}-${y}`
    const amountPart = Number(data.amount || 0).toFixed(2)
    const pattern = new RegExp(`^${usernamePart}-${datePart}-${amountPart}-[a-z0-9]{6,}$`)
    if (!pattern.test(id)) {
      const rand = Math.random().toString(36).slice(2, 8)
      const newId = `${usernamePart}-${datePart}-${amountPart}-${rand}`
      const newDoc = { ...data, incomeId: newId }
      await db.runTransaction(async tx => {
        const fromRef = db.collection(FIREBASE_COLLECTIONS.INCOME).doc(id)
        const toRef = db.collection(FIREBASE_COLLECTIONS.INCOME).doc(newId)
        tx.set(toRef, newDoc)
        tx.delete(fromRef)
      })
      renamed++
    }
  }

  console.log(`Backfill complete. createdAt added: ${updatedCreatedAt}, renamed docs: ${renamed}`)
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch(err => { console.error(err); process.exit(1) })
}


