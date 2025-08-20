import { cert, getApps, initializeApp, applicationDefault } from "firebase-admin/app"
import { getFirestore, Firestore } from "firebase-admin/firestore"
import { readFileSync, existsSync } from "fs"

export function getAdminDb(): Firestore {
  if (!getApps().length) {
    const base64 = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
    const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
    if (base64) {
      const json = JSON.parse(Buffer.from(base64, "base64").toString("utf8"))
      initializeApp({ credential: cert(json) })
    } else if (credentialsPath && existsSync(credentialsPath)) {
      const json = JSON.parse(readFileSync(credentialsPath, "utf8"))
      initializeApp({ credential: cert(json) })
    } else if (process.env.FIRESTORE_EMULATOR_HOST) {
      initializeApp({ credential: applicationDefault() })
    } else {
      throw new Error(
        "Missing admin credentials. Set FIREBASE_SERVICE_ACCOUNT_KEY (base64 of service account JSON) or GOOGLE_APPLICATION_CREDENTIALS (path to JSON)."
      )
    }
  }
  return getFirestore()
}

export default getAdminDb


