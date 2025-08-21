/* eslint-disable no-console */
import { config } from 'dotenv'
import { existsSync } from 'fs'
if (existsSync('.env.local')) config({ path: '.env.local' })
else config()
import getAdminDb from './utils/firebase-admin'
import { FIREBASE_COLLECTIONS, FirebasePrintJob } from '../lib/firebase-schema'

async function main() {
  const db = getAdminDb()
  const snap = await db.collection(FIREBASE_COLLECTIONS.PRINT_JOBS).get()
  const byName = new Map<string, number>()
  let missingIp = 0
  const samples: Array<Pick<FirebasePrintJob, 'jobId' | 'deviceName' | 'deviceIP'>> = []
  for (const d of snap.docs) {
    const j = d.data() as FirebasePrintJob
    const name = (j.deviceName || '').trim()
    byName.set(name, (byName.get(name) || 0) + 1)
    if (!j.deviceIP || String(j.deviceIP).trim() === '') {
      missingIp++
      if (samples.length < 10) samples.push({ jobId: j.jobId, deviceName: name, deviceIP: j.deviceIP })
    }
  }
  console.log(`Total jobs: ${snap.size}`)
  console.log(`Missing deviceIP: ${missingIp}`)
  console.log('Top deviceName values:')
  const sorted = [...byName.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20)
  for (const [name, count] of sorted) console.log(`- "${name}": ${count}`)
  if (samples.length) {
    console.log('Samples missing deviceIP:')
    for (const s of samples) console.log(s)
  }
}

if (require.main === module) {
  main().catch((e) => { console.error(e); process.exit(1) })
}


