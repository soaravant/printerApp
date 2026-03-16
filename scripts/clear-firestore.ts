/* eslint-disable no-console */
import { config } from 'dotenv'
import { existsSync } from 'fs'
// Prefer .env.local if present, otherwise fallback to .env
if (existsSync('.env.local')) config({ path: '.env.local' })
else config()
import getAdminDb from "./utils/firebase-admin"
import { FIREBASE_COLLECTIONS } from "../lib/firebase-schema"

const COLLECTIONS_IN_SAFE_ORDER: string[] = [
  FIREBASE_COLLECTIONS.PRINT_JOBS,
  FIREBASE_COLLECTIONS.LAMINATION_JOBS,
  FIREBASE_COLLECTIONS.INCOME,
  FIREBASE_COLLECTIONS.TRANSACTIONS,
  FIREBASE_COLLECTIONS.BILLING,
  FIREBASE_COLLECTIONS.EXCEL_IMPORTS,
  FIREBASE_COLLECTIONS.PRICE_TABLES,
  FIREBASE_COLLECTIONS.SETTINGS,
  FIREBASE_COLLECTIONS.USERS,
  FIREBASE_COLLECTIONS.BANK,
]

async function deleteCollection(collectionPath: string) {
  const db = getAdminDb()
  await db.recursiveDelete(db.collection(collectionPath))
  console.log(`Deleted ${collectionPath}`)
}

export async function main() {
  for (const col of COLLECTIONS_IN_SAFE_ORDER) {
    console.log(`Clearing ${col}...`)
    await deleteCollection(col)
  }
}

if (require.main === module) {
  main()
    .then(() => {
      console.log("Firestore clear completed")
      process.exit(0)
    })
    .catch((err) => {
      console.error(err)
      process.exit(1)
    })
}

