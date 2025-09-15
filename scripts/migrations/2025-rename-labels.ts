/* eslint-disable no-console */
import { config } from 'dotenv'
import { existsSync } from 'fs'
if (existsSync('.env.local')) config({ path: '.env.local' })
else config()

import getAdminDb from "../utils/firebase-admin"
import { FIREBASE_COLLECTIONS, FirebaseUser, FirebasePrintJob, FirebaseLaminationJob, FirebaseIncome } from "../../lib/firebase-schema"

// Maps old team names to new numbered labels
const teamMap = new Map<string, string>([
  ["Ενωμένοι", "Ομάδα 1"],
  ["Σποριάδες", "Ομάδα 2"],
  ["Καρποφόροι", "Ομάδα 3"],
  ["Ολόφωτοι", "Ομάδα 4"],
  ["Νικητές", "Ομάδα 5"],
  ["Νικηφόροι", "Ομάδα 6"],
  ["Φλόγα", "Ομάδα 7"],
  ["Σύμψυχοι", "Ομάδα 8"],
])

function mapLabel(label: string): string {
  if (!label) return label
  if (teamMap.has(label)) return teamMap.get(label) as string
  const naos = label.match(/^Ναός\s+(\d+)$/)
  if (naos) return `Τμήμα ${naos[1]}`
  return label
}

function mapArray(values?: string[]): string[] | undefined {
  if (!values || !Array.isArray(values)) return values
  return values.map((v) => mapLabel(v))
}

async function migrateUsers() {
  const db = getAdminDb()
  const snap = await db.collection(FIREBASE_COLLECTIONS.USERS).get()
  let updated = 0
  const batch = db.batch()

  snap.docs.forEach((docRef) => {
    const u = docRef.data() as FirebaseUser
    const patch: Partial<FirebaseUser> = {}

    // displayName
    const newDisplay = mapLabel(u.displayName)
    if (newDisplay !== u.displayName) patch.displayName = newDisplay

    // userRole: Ναός -> Τμήμα
    if ((u.userRole as any) === "Ναός") patch.userRole = "Τμήμα" as any

    // team field
    if (u.team && teamMap.has(u.team)) patch.team = teamMap.get(u.team)

    // memberOf / responsibleFor arrays
    const newMemberOf = mapArray(u.memberOf)
    if (JSON.stringify(newMemberOf) !== JSON.stringify(u.memberOf)) patch.memberOf = newMemberOf
    const newRespFor = mapArray(u.responsibleFor)
    if (JSON.stringify(newRespFor) !== JSON.stringify(u.responsibleFor)) patch.responsibleFor = newRespFor

    if (Object.keys(patch).length) {
      batch.update(docRef.ref, patch)
      updated++
    }
  })

  if (updated) await batch.commit()
  console.log(`Users updated: ${updated}`)
}

async function migrateCollectionDisplayName<T extends { userDisplayName: string }>(collection: string) {
  const db = getAdminDb()
  const snap = await db.collection(collection).get()
  let total = 0
  let batch = db.batch()
  let ops = 0

  for (const docRef of snap.docs) {
    const data = docRef.data() as any
    const mapped = mapLabel(data.userDisplayName)
    if (mapped !== data.userDisplayName) {
      batch.update(docRef.ref, { userDisplayName: mapped })
      ops++
      total++
      if (ops >= 400) { // keep large safety margin below 500 limit
        await batch.commit()
        batch = db.batch()
        ops = 0
      }
    }
  }
  if (ops) await batch.commit()
  console.log(`${collection}: updated ${total}`)
}

async function main() {
  console.log("Starting migration: Rename teams and Ναός->Τμήμα labels")
  await migrateUsers()
  await migrateCollectionDisplayName<FirebasePrintJob>(FIREBASE_COLLECTIONS.PRINT_JOBS)
  await migrateCollectionDisplayName<FirebaseLaminationJob>(FIREBASE_COLLECTIONS.LAMINATION_JOBS)
  await migrateCollectionDisplayName<FirebaseIncome>(FIREBASE_COLLECTIONS.INCOME)
  console.log("Migration complete.")
}

main().catch((e) => { console.error(e); process.exit(1) })

