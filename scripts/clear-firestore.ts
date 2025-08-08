/* eslint-disable no-console */
import getAdminDb from "./utils/firebase-admin"
import { FIREBASE_COLLECTIONS } from "../lib/firebase-schema"

const COLLECTIONS_IN_SAFE_ORDER: string[] = [
  FIREBASE_COLLECTIONS.PRINT_JOBS,
  FIREBASE_COLLECTIONS.LAMINATION_JOBS,
  FIREBASE_COLLECTIONS.TRANSACTIONS,
  FIREBASE_COLLECTIONS.BILLING,
  FIREBASE_COLLECTIONS.PRICE_TABLES,
  FIREBASE_COLLECTIONS.SETTINGS,
  FIREBASE_COLLECTIONS.USERS,
]

async function deleteCollection(collectionPath: string, batchSize = 300) {
  const db = getAdminDb()
  let deleted = 0
  while (true) {
    const snapshot = await db.collection(collectionPath).limit(batchSize).get()
    if (snapshot.empty) break
    const batch = db.batch()
    snapshot.docs.forEach((doc) => batch.delete(doc.ref))
    await batch.commit()
    deleted += snapshot.size
    console.log(`Deleted ${snapshot.size} from ${collectionPath} (total ${deleted})`)
    if (snapshot.size < batchSize) break
  }
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


