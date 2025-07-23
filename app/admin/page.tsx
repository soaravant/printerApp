"use client"

import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/lib/simple-auth-context"
import { AdminUserTable } from "@/components/admin-user-table"
import { BillingManagement } from "@/components/billing-management"
import { PriceTableManager } from "@/components/price-table-manager"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function AdminPage() {
  const { logout } = useAuth()

  return (
    <ProtectedRoute requireAdmin>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Διαχείριση Συστήματος</h1>
                <p className="text-gray-600">Διαχειριστείτε χρήστες, χρεώσεις και τιμοκαταλόγους</p>
              </div>
              <div className="flex items-center space-x-4">
                <Button variant="outline" onClick={() => (window.location.href = "/admin/populate-data")}>
                  Δεδομένα Demo
                </Button>
                <Button variant="outline" onClick={() => (window.location.href = "/dashboard")}>
                  Dashboard
                </Button>
                <Button onClick={logout}>Αποσύνδεση</Button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <Tabs defaultValue="billing" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="billing">Χρεώσεις</TabsTrigger>
                <TabsTrigger value="users">Χρήστες</TabsTrigger>
                <TabsTrigger value="prices">Τιμοκατάλογοι</TabsTrigger>
                <TabsTrigger value="reports">Αναφορές</TabsTrigger>
              </TabsList>

              <TabsContent value="billing" className="mt-6">
                <BillingManagement />
              </TabsContent>

              <TabsContent value="users" className="mt-6">
                <AdminUserTable />
              </TabsContent>

              <TabsContent value="prices" className="mt-6">
                <PriceTableManager />
              </TabsContent>

              <TabsContent value="reports" className="mt-6">
                <div className="text-center py-8 text-gray-500">Οι αναφορές θα προστεθούν σύντομα...</div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
