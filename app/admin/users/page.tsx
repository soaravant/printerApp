"use client"

import { ProtectedRoute } from "@/components/protected-route"
import { Navigation } from "@/components/navigation"
import { useAuth } from "@/lib/auth-context"
import { dummyDB } from "@/lib/dummy-database"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useState, useEffect } from "react"
import { User, Building, CreditCard, Printer } from "lucide-react"
import type { User as UserType } from "@/lib/dummy-database"

export default function AdminUsersPage() {
  const { user } = useAuth()
  const [users, setUsers] = useState<UserType[]>([])

  useEffect(() => {
    setUsers(dummyDB.getUsers())
  }, [])

  if (!user) return null

  return (
    <ProtectedRoute requireAdmin>
      <div className="min-h-screen bg-gray-50">
        <Navigation />

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Διαχείριση Χρηστών</h1>
              <p className="text-gray-600">Προβολή και διαχείριση όλων των χρηστών του συστήματος</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {users.map((userData) => {
                const printBilling = dummyDB.getPrintBilling(userData.uid)
                const laminationBilling = dummyDB.getLaminationBilling(userData.uid)
                const printJobs = dummyDB.getPrintJobs(userData.uid)
                const laminationJobs = dummyDB.getLaminationJobs(userData.uid)

                const printUnpaid = printBilling.filter((b) => !b.paid).reduce((sum, b) => sum + b.remainingBalance, 0)
                const laminationUnpaid = laminationBilling
                  .filter((b) => !b.paid)
                  .reduce((sum, b) => sum + b.remainingBalance, 0)
                const totalUnpaid = printUnpaid + laminationUnpaid

                return (
                  <Card key={userData.uid} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <User className="h-5 w-5" />
                          {userData.displayName}
                        </div>
                        <Badge variant={userData.role === "admin" ? "default" : "secondary"}>
                          {userData.role === "admin" ? "Admin" : "User"}
                        </Badge>
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        {userData.department}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-sm space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Κωδικός:</span>
                          <span className="font-mono">{userData.username}</span>
                        </div>
                        {userData.email && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Email:</span>
                            <span className="text-sm">{userData.email}</span>
                          </div>
                        )}
                      </div>

                      {userData.role === "user" && (
                        <>
                          <div className="border-t pt-4">
                            <h4 className="font-medium text-sm text-gray-700 mb-2">Οφειλές</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between items-center">
                                <span className="flex items-center gap-1">
                                  <Printer className="h-3 w-3" />
                                  Εκτυπώσεις:
                                </span>
                                <span className={printUnpaid > 0 ? "text-red-600 font-semibold" : "text-green-600"}>
                                  €{printUnpaid.toFixed(2)}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="flex items-center gap-1">
                                  <CreditCard className="h-3 w-3" />
                                  Πλαστικοποιήσεις:
                                </span>
                                <span
                                  className={laminationUnpaid > 0 ? "text-red-600 font-semibold" : "text-green-600"}
                                >
                                  €{laminationUnpaid.toFixed(2)}
                                </span>
                              </div>
                              <div className="flex justify-between items-center border-t pt-2">
                                <span className="font-medium">Σύνολο:</span>
                                <span
                                  className={totalUnpaid > 0 ? "text-red-600 font-bold" : "text-green-600 font-bold"}
                                >
                                  €{totalUnpaid.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="border-t pt-4">
                            <h4 className="font-medium text-sm text-gray-700 mb-2">Στατιστικά</h4>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="text-center p-2 bg-gray-50 rounded">
                                <div className="font-semibold">{printJobs.length}</div>
                                <div className="text-gray-600">Εκτυπώσεις</div>
                              </div>
                              <div className="text-center p-2 bg-gray-50 rounded">
                                <div className="font-semibold">{laminationJobs.length}</div>
                                <div className="text-gray-600">Πλαστικοποιήσεις</div>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
