import { cert, getApps, initializeApp, applicationDefault } from "firebase-admin/app"
import { getAuth } from "firebase-admin/auth"
import { getFirestore } from "firebase-admin/firestore"
import { existsSync, readFileSync } from "fs"

export function getAdminApp() {
  if (!getApps().length) {
    const base64 = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
    const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
    if (base64) {
      const json = JSON.parse(Buffer.from(base64, "base64").toString("utf8"))
      initializeApp({ credential: cert(json) })
    } else if (credentialsPath && existsSync(credentialsPath)) {
      const json = JSON.parse(readFileSync(credentialsPath, "utf8"))
      initializeApp({ credential: cert(json) })
    } else {
      initializeApp({ credential: applicationDefault() })
    }
  }
}

export function getAdminDb() {
  getAdminApp()
  return getFirestore()
}

export function getAdminAuth() {
  getAdminApp()
  return getAuth()
}
