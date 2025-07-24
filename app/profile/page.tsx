"use client"

import { ProtectedRoute } from "@/components/protected-route"
import { Navigation } from "@/components/navigation"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RoleBadge } from "@/components/role-badge"
import { User, Mail, Building, Shield } from "lucide-react"

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
              <p className="text-gray-600">Προβολή των στοιχείων του λογαριασμού σας</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Στοιχεία Χρήστη</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                      <User className="h-4 w-4" />
                      Username
                    </div>
                    <div className="text-lg font-mono bg-gray-50 p-3 rounded-lg">{user.username}</div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                      <Shield className="h-4 w-4" />
                      Ρόλος
                    </div>
                    <div className="text-lg">
                      <RoleBadge role={user.role} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                      <User className="h-4 w-4" />
                      Όνομα
                    </div>
                    <div className="text-lg bg-gray-50 p-3 rounded-lg">{user.displayName}</div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                      <Mail className="h-4 w-4" />
                      Email
                    </div>
                    <div className="text-lg bg-gray-50 p-3 rounded-lg">{user.email || "Δεν έχει οριστεί"}</div>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                      <Building className="h-4 w-4" />
                      Τμήμα
                    </div>
                    <div className="text-lg bg-gray-50 p-3 rounded-lg">{user.department}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
