import { cert, getApps, initializeApp } from "firebase-admin/app"
import { getFirestore, Firestore } from "firebase-admin/firestore"

export function getAdminDb(): Firestore {
  if (!getApps().length) {
    const base64 = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
    if (!base64) {
      throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY is not set in environment")
    }
    const json = JSON.parse(Buffer.from(base64, "base64").toString("utf8"))
    initializeApp({ credential: cert(json) })
  }
  return getFirestore()
}

export default getAdminDb


