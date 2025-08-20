"use client"

import { useState } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
// import { dummyDB } from "@/lib/dummy-database"
import type { User, PrintJob, LaminationJob } from "@/lib/dummy-database"

export default function PopulateDataPage() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const handlePopulateData = async () => {
    setIsLoading(true)
    try {
      // Create demo users
      const demoUsers: User[] = [
        {
          uid: "user-1",
          username: "user1",
          accessLevel: "Χρήστης",
          displayName: "Χρήστης 1",
          createdAt: new Date("2024-01-01"),
          userRole: "Άτομο",
          team: "Ενωμένοι",
        },
        {
          uid: "user-2",
          username: "user2",
          accessLevel: "Χρήστης",
          displayName: "Χρήστης 2",
          createdAt: new Date("2024-01-02"),
          userRole: "Άτομο",
          team: "Σποριάδες",
        },
        {
          uid: "admin-1",
          username: "admin",
          accessLevel: "Διαχειριστής",
          displayName: "Διαχειριστής",
          createdAt: new Date("2024-01-01"),
          userRole: "Άτομο",
          team: "Ενωμένοι",
        },
      ]

      // Create demo print jobs
      demoUsers.forEach((user) => {
        const job: PrintJob = {
          jobId: `print-${user.uid}-${Date.now()}`,
          uid: user.uid,
          username: user.username,
          userDisplayName: user.displayName,
          pagesA4BW: Math.floor(Math.random() * 50) + 1,
          pagesA4Color: Math.floor(Math.random() * 20) + 1,
          pagesA3BW: Math.floor(Math.random() * 10) + 1,
          pagesA3Color: Math.floor(Math.random() * 5) + 1,
          pagesRizochartoA3: Math.floor(Math.random() * 3) + 1,
          pagesRizochartoA4: Math.floor(Math.random() * 5) + 1,
          pagesChartoniA3: Math.floor(Math.random() * 2) + 1,
          pagesChartoniA4: Math.floor(Math.random() * 3) + 1,
          pagesAutokollito: Math.floor(Math.random() * 2) + 1,
          deviceIP: "192.168.1.100",
          deviceName: "Canon Color",
          timestamp: new Date(),
          costA4BW: 0.05,
          costA4Color: 0.25,
          costA3BW: 0.10,
          costA3Color: 0.50,
          costRizochartoA3: 0.15,
          costRizochartoA4: 0.15,
          costChartoniA3: 0.20,
          costChartoniA4: 0.20,
          costAutokollito: 0.30,
          totalCost: 10.00,
          status: "completed",
        }
        // Deprecated: client-side populate disabled for security
      })

      // Create demo lamination jobs
      demoUsers.forEach((user) => {
        const job: LaminationJob = {
          jobId: `lamination-${user.uid}-${Date.now()}`,
          uid: user.uid,
          username: user.username,
          userDisplayName: user.displayName,
          type: "A4",
          quantity: Math.floor(Math.random() * 10) + 1,
          pricePerUnit: 0.50,
          totalCost: 5.00,
          timestamp: new Date(),
          status: "completed",
        }
        // Deprecated: client-side populate disabled for security
      })

      // Save users to dummy database
      // Deprecated: client-side populate disabled for security

      toast({
        title: "Επιτυχία",
        description: "Τα δεδομένα δημιουργήθηκαν επιτυχώς!",
        variant: "success",
      })
    } catch (error) {
      toast({
        title: "Σφάλμα",
        description: "Αποτυχία δημιουργίας δεδομένων",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClearData = async () => {
    setIsLoading(true)
    try {
      // Clear all data by resetting the dummy database
      // Deprecated: client-side populate disabled for security

      toast({
        title: "Επιτυχία",
        description: "Τα δεδομένα διαγράφηκαν επιτυχώς!",
        variant: "success",
      })
    } catch (error) {
      toast({
        title: "Σφάλμα",
        description: "Αποτυχία διαγραφής δεδομένων",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <ProtectedRoute requireAdmin>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="p-8">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Δημιουργία Δεδομένων</CardTitle>
                <CardDescription>
                  Δημιουργήστε demo δεδομένα για δοκιμές και ανάπτυξη
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={handlePopulateData}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? "Δημιουργία..." : "Δημιουργία Demo Δεδομένων"}
                </Button>
                <Button
                  onClick={handleClearData}
                  disabled={isLoading}
                  variant="destructive"
                  className="w-full"
                >
                  {isLoading ? "Διαγραφή..." : "Διαγραφή Όλων των Δεδομένων"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
