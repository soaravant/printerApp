"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/lib/simple-auth-context"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Printer, AlertCircle } from "lucide-react"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const { signIn } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const success = await signIn(username, password)
      if (success) {
        router.push("/dashboard")
      } else {
        setError("Λάθος κωδικός χρήστη ή κωδικός πρόσβασης")
      }
    } catch (error) {
      setError("Σφάλμα σύνδεσης")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-6">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Printer className="h-12 w-12 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">Σύστημα Χρέωσης Εκτυπωτών</CardTitle>
            <CardDescription>Εισάγετε τα στοιχεία σας για σύνδεση</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Κωδικός Χρήστη</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="π.χ. 408"
                  required
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Κωδικός Πρόσβασης</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Εισάγετε τον κωδικό σας"
                  required
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Σύνδεση..." : "Σύνδεση"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Demo credentials card */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-lg text-blue-800">Στοιχεία Demo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">Χρήστης 1:</span>
                <span className="font-mono">408 / 08</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Χρήστης 2:</span>
                <span className="font-mono">409 / 09</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Διαχειριστής:</span>
                <span className="font-mono">admin / admin123</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
