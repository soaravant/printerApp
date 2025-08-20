"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import type { FirebaseUser } from "./firebase-schema"
import { fetchUserById } from "./firebase-queries"
import { auth } from "./firebase-client"
// Lazy-load firebase/auth to keep client bundle light and avoid SSR type issues
// We will dynamically import needed functions at runtime
type FirebaseAuthUser = {
  uid: string
} | null

interface AuthContextType {
  user: FirebaseUser | null
  loading: boolean
  signIn: (username: string, password: string) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Hardcoded passwords for demo
const USER_PASSWORDS: Record<string, string> = {
  // Admin
  admin: "admin123",
  
  // Υπεύθυνοι (400-410)
  "400": "400", // Υπεύθυνος 400
  "401": "401", // Υπεύθυνος 401
  "402": "402", // Υπεύθυνος 402
  "403": "403", // Υπεύθυνος 403
  "404": "404", // Υπεύθυνος 404
  "405": "405", // Υπεύθυνος 405
  "406": "406", // Υπεύθυνος 406
  "407": "407", // Υπεύθυνος 407
  "408": "408", // Υπεύθυνος 408
  "409": "409", // Υπεύθυνος 409
  "410": "410", // Υπεύθυνος 410
  
  // Regular Users (411-412)
  "411": "411", // Χρήστης 411
  "412": "412", // Χρήστης 412
  
  // Ναοί (413-417)
  "413": "413", // Ναός 1
  "414": "414", // Ναός 2
  "415": "415", // Ναός 3
  "416": "416", // Ναός 4
  "417": "417", // Ναός 5
  
  // Τομείς (418-422)
  "418": "418", // Τομέας 1
  "419": "419", // Τομέας 2
  "420": "420", // Τομέας 3
  "421": "421", // Τομέας 4
  "422": "422", // Τομέας 5
  
  // Individual Users (423-499)
  "423": "423", // Χρήστης 423
  "424": "424", // Χρήστης 424
  "425": "425", // Χρήστης 425
  "426": "426", // Χρήστης 426
  "427": "427", // Χρήστης 427
  "428": "428", // Χρήστης 428
  "429": "429", // Χρήστης 429
  "430": "430", // Χρήστης 430
  "431": "431", // Χρήστης 431
  "432": "432", // Χρήστης 432
  "433": "433", // Χρήστης 433
  "434": "434", // Χρήστης 434
  "435": "435", // Χρήστης 435
  "436": "436", // Χρήστης 436
  "437": "437", // Χρήστης 437
  "438": "438", // Χρήστης 438
  "439": "439", // Χρήστης 439
  "440": "440", // Χρήστης 440
  "441": "441", // Χρήστης 441
  "442": "442", // Χρήστης 442
  "443": "443", // Χρήστης 443
  "444": "444", // Χρήστης 444
  "445": "445", // Χρήστης 445
  "446": "446", // Χρήστης 446
  "447": "447", // Χρήστης 447
  "448": "448", // Χρήστης 448
  "449": "449", // Χρήστης 449
  "450": "450", // Χρήστης 450
  "451": "451", // Χρήστης 451
  "452": "452", // Χρήστης 452
  "453": "453", // Χρήστης 453
  "454": "454", // Χρήστης 454
  "455": "455", // Χρήστης 455
  "456": "456", // Χρήστης 456
  "457": "457", // Χρήστης 457
  "458": "458", // Χρήστης 458
  "459": "459", // Χρήστης 459
  "460": "460", // Χρήστης 460
  "461": "461", // Χρήστης 461
  "462": "462", // Χρήστης 462
  "463": "463", // Χρήστης 463
  "464": "464", // Χρήστης 464
  "465": "465", // Χρήστης 465
  "466": "466", // Χρήστης 466
  "467": "467", // Χρήστης 467
  "468": "468", // Χρήστης 468
  "469": "469", // Χρήστης 469
  "470": "470", // Χρήστης 470
  "471": "471", // Χρήστης 471
  "472": "472", // Χρήστης 472
  "473": "473", // Χρήστης 473
  "474": "474", // Χρήστης 474
  "475": "475", // Χρήστης 475
  "476": "476", // Χρήστης 476
  "477": "477", // Χρήστης 477
  "478": "478", // Χρήστης 478
  "479": "479", // Χρήστης 479
  "480": "480", // Χρήστης 480
  "481": "481", // Χρήστης 481
  "482": "482", // Χρήστης 482
  "483": "483", // Χρήστης 483
  "484": "484", // Χρήστης 484
  "485": "485", // Χρήστης 485
  "486": "486", // Χρήστης 486
  "487": "487", // Χρήστης 487
  "488": "488", // Χρήστης 488
  "489": "489", // Χρήστης 489
  "490": "490", // Χρήστης 490
  "491": "491", // Χρήστης 491
  "492": "492", // Χρήστης 492
  "493": "493", // Χρήστης 493
  "494": "494", // Χρήστης 494
  "495": "495", // Χρήστης 495
  "496": "496", // Χρήστης 496
  "497": "497", // Χρήστης 497
  "498": "498", // Χρήστης 498
  "499": "499", // Χρήστης 499
  
  // Ομάδες (500-507)
  "500": "500", // Ομάδα Ενωμένοι
  "501": "501", // Ομάδα Σποριάδες
  "502": "502", // Ομάδα Καρποφόροι
  "503": "503", // Ομάδα Ολόφωτοι
  "504": "504", // Ομάδα Νικητές
  "505": "505", // Ομάδα Νικηφόροι
  "506": "506", // Ομάδα Φλόγα
  "507": "507", // Ομάδα Σύμψυχοι
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let unsub: (() => void) | undefined
    ;(async () => {
      const { onAuthStateChanged } = await import("./firebase-auth")
      unsub = onAuthStateChanged(auth, async (fbUser: FirebaseAuthUser) => {
        try {
          if (fbUser?.uid) {
            const u = await fetchUserById(fbUser.uid)
            if (u) setUser(u as any)
            else setUser(null)
          } else {
            setUser(null)
          }
        } catch (e) {
          console.error(e)
        } finally {
          setLoading(false)
        }
      })
    })()

    return () => { if (unsub) unsub() }
  }, [])

  const signIn = async (username: string, password: string): Promise<boolean> => {
    // Call our API to verify legacy credentials and receive a custom token
    const res = await fetch("/api/auth/custom-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    })
    if (!res.ok) return false
    const { token, uid } = await res.json()
    const { signInWithCustomToken } = await import("./firebase-auth")
    await signInWithCustomToken(auth, token)
    const u = await fetchUserById(uid)
    if (u) { setUser(u as any); return true }
    return false
  }

  const logout = async () => {
    setUser(null)
    try {
      const { signOut } = await import("./firebase-auth")
      await signOut(auth)
    } catch {}
  }

  return <AuthContext.Provider value={{ user, loading, signIn, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
