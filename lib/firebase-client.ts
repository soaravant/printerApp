export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY as string,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN as string,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID as string,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET as string,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID as string,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID as string,
}

import { getApps, initializeApp } from "firebase/app"
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore"
import { getAuth } from "firebase/auth"

const isBrowser = typeof window !== "undefined"
const shouldUseFirestore = true

let app: ReturnType<typeof initializeApp> | undefined
if (isBrowser && shouldUseFirestore) {
  app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)
  try {
    initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    })
  } catch {}
}

export const db = app ? getFirestore(app) : (undefined as unknown as ReturnType<typeof getFirestore>)
export const auth = app ? getAuth(app) : (undefined as unknown as ReturnType<typeof getAuth>)
