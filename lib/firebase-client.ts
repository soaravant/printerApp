import { app } from "./firebase-app"
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore"
import { auth } from "./firebase-app"

const isBrowser = typeof window !== "undefined"

if (isBrowser && app) {
  try {
    initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    })
  } catch {}
}

export const db = app ? getFirestore(app) : (undefined as unknown as ReturnType<typeof getFirestore>)
export { auth }
