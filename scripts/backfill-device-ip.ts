/* eslint-disable no-console */
import { config } from 'dotenv'
import { existsSync } from 'fs'
if (existsSync('.env.local')) config({ path: '.env.local' })
else config()
import getAdminDb from './utils/firebase-admin'
import { FIREBASE_COLLECTIONS, FirebasePrintJob } from '../lib/firebase-schema'

/**
 * Backfills deviceIP on printJobs based on a provided mapping from deviceName to IP or IP to deviceName.
 * Provide JSON via env BACKFILL_IP_MAP = { "192.168.3.41":"Canon B/W", ... }
 * or BACKFILL_NAME_MAP = { "Canon B/W":"192.168.3.41", ... }
 */

function parseMap(envVar: string | undefined): Record<string, string> {
  if (!envVar) return {}
  try { return JSON.parse(envVar) } catch { return {} }
}

async function main() {
  const db = getAdminDb()
  const ipToName = parseMap(process.env.BACKFILL_IP_MAP)
  const nameToIp = parseMap(process.env.BACKFILL_NAME_MAP)
  const defaultName = process.env.BACKFILL_DEFAULT_NAME
  const defaultIp = process.env.BACKFILL_DEFAULT_IP
  const FORCE = String(process.env.BACKFILL_FORCE || "false").toLowerCase() === "true"

  // Normalize name map (case-insensitive, trimmed)
  const norm = (s: string) => (s || "").trim().toLowerCase()
  const nameToIpNorm: Record<string, string> = {}
  for (const [k, v] of Object.entries(nameToIp)) nameToIpNorm[norm(k)] = v

  const snap = await db.collection(FIREBASE_COLLECTIONS.PRINT_JOBS).get()
  let updates = 0
  let batch = db.batch()
  let inBatch = 0
  for (const doc of snap.docs) {
    const j = doc.data() as FirebasePrintJob
    let need = false
    let deviceIP = j.deviceIP || ''
    let deviceName = j.deviceName || ''
    const mappedIp = deviceName ? nameToIp[deviceName] || nameToIpNorm[norm(deviceName)] : undefined
    if (mappedIp && (FORCE ? deviceIP !== mappedIp : !deviceIP)) {
      deviceIP = mappedIp
      need = true
    }
    if (!deviceName && deviceIP && ipToName[deviceIP]) {
      deviceName = ipToName[deviceIP]
      need = true
    }
    if (!deviceName && defaultName) {
      deviceName = defaultName
      need = true
    }
    if (!deviceIP && defaultIp) {
      deviceIP = defaultIp
      need = true
    }
    if (need) {
      batch.update(doc.ref, { deviceIP, deviceName })
      updates++
      inBatch++
      if (inBatch >= 400) {
        await batch.commit()
        batch = db.batch()
        inBatch = 0
      }
    }
  }
  if (inBatch > 0) await batch.commit()
  console.log(`Backfill complete. Updated ${updates} documents.`)
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e)
    process.exit(1)
  })
}


