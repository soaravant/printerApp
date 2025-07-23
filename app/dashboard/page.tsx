"use client"

import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/lib/simple-auth-context"
import { UserDashboard } from "@/components/user-dashboard"
import { Button } from "@/components/ui/button"

export default function DashboardPage() {
  const { user, logout } = useAuth()

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Πίνακας Ελέγχου</h1>
                <p className="text-gray-600">Καλώς ήρθατε, {user?.displayName}</p>
              </div>
              <div className="flex items-center space-x-4">
                {user?.role === "admin" && (
                  <Button variant="outline" onClick={() => (window.location.href = "/admin")}>
                    Διαχείριση
                  </Button>
                )}
                <Button variant="outline" onClick={() => (window.location.href = "/profile")}>
                  Προφίλ
                </Button>
                <Button onClick={logout}>Αποσύνδεση</Button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <UserDashboard />
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
