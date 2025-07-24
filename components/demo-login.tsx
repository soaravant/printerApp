"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Eye, EyeOff, LogIn, Users } from "lucide-react"

export function DemoLogin() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const { toast } = useToast()

  const demoAccounts = [
    { username: "admin", password: "admin", role: "admin", name: "Διαχειριστής" },
    { username: "408", password: "408", role: "user", name: "Χρήστης 408" },
    { username: "409", password: "409", role: "user", name: "Χρήστης 409" },
  ]

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const success = await login(username, password)
      if (success) {
        toast({
          title: "Επιτυχής σύνδεση",
          description: `Καλώς ήρθατε!`,
        })
      } else {
        toast({
          title: "Σφάλμα σύνδεσης",
          description: "Λάθος όνομα χρήστη ή κωδικός πρόσβασης",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Σφάλμα",
        description: "Παρουσιάστηκε σφάλμα κατά τη σύνδεση",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDemoLogin = async (demoUsername: string, demoPassword: string) => {
    setLoading(true)
    try {
      const success = await login(demoUsername, demoPassword)
      if (success) {
        toast({
          title: "Demo σύνδεση επιτυχής",
          description: `Συνδεθήκατε ως ${demoAccounts.find((acc) => acc.username === demoUsername)?.name}`,
        })
      }
    } catch (error) {
      toast({
        title: "Σφάλμα",
        description: "Αποτυχία demo σύνδεσης",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Σύστημα Χρέωσης Εκτυπωτών</h2>
          <p className="mt-2 text-center text-sm text-gray-600">Συνδεθείτε στον λογαριασμό σας</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LogIn className="h-5 w-5" />
              Σύνδεση
            </CardTitle>
            <CardDescription>Εισάγετε τα στοιχεία σας για να συνδεθείτε</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Όνομα Χρήστη</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Εισάγετε το όνομα χρήστη"
                  required
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
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Σύνδεση..." : "Σύνδεση"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Demo Λογαριασμοί
            </CardTitle>
            <CardDescription>Χρησιμοποιήστε έναν από τους παρακάτω λογαριασμούς για δοκιμή</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {demoAccounts.map((account) => (
                <Button
                  key={account.username}
                  variant="outline"
                  className="w-full justify-between bg-transparent"
                  onClick={() => handleDemoLogin(account.username, account.password)}
                  disabled={loading}
                >
                  <span>{account.name}</span>
                  <span className="text-xs text-gray-500">
                    {account.username} / {account.password}
                  </span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-gray-500">
          <p>Για υποστήριξη επικοινωνήστε με τον διαχειριστή</p>
        </div>
      </div>
    </div>
  )
}
