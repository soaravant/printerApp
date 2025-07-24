"use client"

import { ProtectedRoute } from "@/components/protected-route"
import { Navigation } from "@/components/navigation"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { User, Shield, Mail } from "lucide-react"

export default function ProfilePage() {
  const { user } = useAuth()

  if (!user) return null

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Navigation />

        <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Προφίλ Χρήστη</h1>
              <p className="text-gray-600">Διαχείριση στοιχείων λογαριασμού</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Στοιχεία Λογαριασμού
                </CardTitle>
                <CardDescription>Τα στοιχεία του προφίλ σας</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Username
                      </label>
                      <p className="mt-1 text-lg font-mono bg-gray-50 p-2 rounded">{user.username}</p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700">Όνομα</label>
                      <p className="mt-1 text-lg">{user.displayName}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Ρόλος
                      </label>
                      <div className="mt-1">
                        <Badge variant={user.role === "admin" ? "default" : "secondary"} className="text-sm">
                          {user.role === "admin" ? "Διαχειριστής" : "Χρήστης"}
                        </Badge>
                      </div>
                    </div>

                    {user.email && (
                      <div>
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          Email
                        </label>
                        <p className="mt-1 text-lg">{user.email}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-500">
                    Λογαριασμός δημιουργήθηκε: {user.createdAt.toLocaleDateString("el-GR")}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
