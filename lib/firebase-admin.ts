import { cert, getApps, initializeApp, applicationDefault } from "firebase-admin/app"
import { getAuth } from "firebase-admin/auth"
import { getFirestore } from "firebase-admin/firestore"
import { existsSync, readFileSync } from "fs"

export function getAdminApp() {
  if (!getApps().length) {
    const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
    const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
    if (key) {
      let jsonStr = key
      // Support both base64-encoded and raw JSON in env var
      try {
        // If it's base64, decode to JSON string
        const decoded = Buffer.from(key, "base64").toString("utf8")
        // Heuristic: if decoding produced a JSON object, use it
        if (decoded.trim().startsWith("{") && decoded.trim().endsWith("}")) {
          jsonStr = decoded
        }
      } catch {
        // Ignore, fall back to using the original string
      }
      const json = JSON.parse(jsonStr)
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
