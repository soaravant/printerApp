"use client"

import type React from "react"

import { useState } from "react"
import { performLogin } from "@/lib/light-login"
import { useRefresh } from "@/lib/refresh-context"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
// overlay handled globally via RefreshProvider

export default function LoginPage() {
  const IconEye = (props: any) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
  const IconEyeOff = (props: any) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a21.8 21.8 0 0 1 5.06-6.94" />
      <path d="M1 1l22 22" />
    </svg>
  )
  const IconPrinter = (props: any) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M6 9V2h12v7" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <path d="M6 14h12v8H6z" />
    </svg>
  )
  const IconAlertCircle = (props: any) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  )
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const { setLoading: setGlobalLoading, setLoadingLabel } = useRefresh()
  const router = useRouter()

  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    try { (e as any)?.preventDefault?.() } catch {}
    setLoading(true)
    setError("")

    try {
      // Perform the quickest possible login path to reduce TTI
      const result = await performLogin(username, password)
      if (result.ok) {
        // End button spinner, then show global overlay on the next frame and navigate
        setLoading(false)
        requestAnimationFrame(() => {
          setLoadingLabel("Μετάβαση στη σελίδα...")
          setGlobalLoading(true)
          router.push("/dashboard")
        })
      } else {
        const code = result.code
        const messages: Record<string, string> = {
          missing_credentials: "Συμπληρώστε χρήστη και κωδικό.",
          user_not_found: "Ο χρήστης δεν βρέθηκε.",
          invalid_password: "Λάθος κωδικός πρόσβασης.",
          permission_denied: "Δεν έχετε δικαίωμα πρόσβασης.",
          service_unavailable: "Η υπηρεσία είναι προσωρινά μη διαθέσιμη. Δοκιμάστε ξανά αργότερα.",
          server_error: "Σφάλμα συστήματος. Προσπαθήστε ξανά.",
          user_record_missing: "Δεν βρέθηκαν στοιχεία χρήστη.",
        }
        setError(messages[code] || "Αποτυχία σύνδεσης.")
      }
    } catch (error) {
      setError("Σφάλμα σύνδεσης")
    } finally {
      // If navigation did not start, end local loading
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-6">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <IconPrinter className="h-12 w-12 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">Σύστημα Χρέωσης</CardTitle>
            <CardDescription>Εκτυπώσεις & Πλαστικοποιήσεις</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} action="#" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Χρήστης</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Εισάγετε το χρήστη"
                  required
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Κωδικός Πρόσβασης</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Εισάγετε τον κωδικό πρόσβασης"
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <IconEyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <IconEye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <IconAlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="button" onClick={handleSubmit} className="w-full" loading={loading}>
                {loading ? "Σύνδεση..." : "Σύνδεση"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Demo credentials helper below the login card */}
        <div className="text-center text-sm text-gray-600 px-4">
          <p className="font-medium">Παραδείγματα σύνδεσης</p>
          <div className="mt-2 space-y-1">
            <p>
              <span className="font-medium">Διαχειριστής:</span>
              <span className="ml-1">Χρήστης</span>
              <span className="mx-1 font-mono bg-gray-100 px-1 rounded">admin</span>
              <span>Κωδικός</span>
              <span className="ml-1 font-mono bg-gray-100 px-1 rounded">admin123</span>
            </p>
            <p>
              <span className="font-medium">Υπεύθυνος:</span>
              <span className="ml-1 font-mono bg-gray-100 px-1 rounded">401</span>
              <span>/</span>
              <span className="ml-1 font-mono bg-gray-100 px-1 rounded">401</span>
            </p>
            <p>
              <span className="font-medium">Χρήστης:</span>
              <span className="ml-1 font-mono bg-gray-100 px-1 rounded">501</span>
              <span>/</span>
              <span className="ml-1 font-mono bg-gray-100 px-1 rounded">501</span>
            </p>
          </div>
        </div>
      </div>
      {/* Global overlay shows after spinner ends and until dashboard is ready */}
    </div>
  )
}
