/* eslint-disable no-console */
import { config } from 'dotenv'
import { existsSync } from 'fs'
if (existsSync('.env.local')) config({ path: '.env.local' })
else config()

import getAdminDb from './utils/firebase-admin'
import { FIREBASE_COLLECTIONS, FirebaseIncome, FirebaseUser } from '../lib/firebase-schema'

function toDate(v: any): Date {
  return v && typeof v.toDate === 'function' ? v.toDate() : new Date(v)
}

export async function main() {
  const db = getAdminDb()

  console.log('Loading incomes...')
  const iSnap = await db.collection(FIREBASE_COLLECTIONS.INCOME).get()
  const incomes = iSnap.docs.map(d => d.data() as FirebaseIncome)
  console.log(`Loaded ${incomes.length} incomes`)

  // Build map: uid -> latest income Date
  const latestByUser = new Map<string, Date>()
  for (const inc of incomes) {
    const ts = toDate((inc as any).timestamp)
    const prev = latestByUser.get(inc.uid)
    if (!prev || ts > prev) latestByUser.set(inc.uid, ts)
  }

  console.log('Loading users...')
  const uSnap = await db.collection(FIREBASE_COLLECTIONS.USERS).get()
  const users = uSnap.docs.map(d => d.data() as FirebaseUser)
  console.log(`Loaded ${users.length} users`)

  const batch = db.batch()
  let updates = 0
  for (const u of users) {
    const last = latestByUser.get(u.uid) || null
    const ref = db.collection(FIREBASE_COLLECTIONS.USERS).doc(u.uid)
    batch.update(ref, { lastPayment: last })
    updates++
    // Commit in chunks of 400 to avoid limits
    if (updates % 400 === 0) {
      await batch.commit()
      console.log(`Committed ${updates} user updates so far...`)
    }
  }

  // Commit remaining
  await batch.commit()
  console.log(`Backfill complete. Updated ${updates} users with lastPayment`)
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch(err => { console.error(err); process.exit(1) })
}


