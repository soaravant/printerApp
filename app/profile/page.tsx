"use client"

import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/lib/simple-auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function ProfilePage() {
  const { user, logout } = useAuth()

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Προφίλ Χρήστη</h1>
                <p className="text-gray-600">Διαχείριση στοιχείων λογαριασμού</p>
              </div>
              <div className="flex items-center space-x-4">
                <Button variant="outline" onClick={() => (window.location.href = "/dashboard")}>
                  Πίνακας Ελέγχου
                </Button>
                <Button onClick={logout}>Αποσύνδεση</Button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <Card>
              <CardHeader>
                <CardTitle>Στοιχεία Λογαριασμού</CardTitle>
                <CardDescription>Τα στοιχεία του προφίλ σας</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Κωδικός Χρήστη</label>
                  <p className="mt-1 text-sm text-gray-900 font-mono">{user?.username}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Όνομα</label>
                  <p className="mt-1 text-sm text-gray-900">{user?.displayName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Τμήμα</label>
                  <p className="mt-1 text-sm text-gray-900">{user?.department}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Ρόλος</label>
                  <p className="mt-1 text-sm text-gray-900 capitalize">
                    {user?.role === "admin" ? "Διαχειριστής" : "Χρήστης"}
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
