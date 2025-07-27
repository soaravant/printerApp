"use client"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { dataStore } from "@/lib/data-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Database, CheckCircle, AlertCircle } from "lucide-react"
import type { User, PrintJob, BillingRecord, PriceTable } from "@/lib/data-store"

export default function PopulateDataPage() {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
  const [message, setMessage] = useState("")

  // Χρήστες που ταιριάζουν με το auth σύστημα
  const demoUsers: User[] = [
    {
      uid: "user-408",
      username: "408",
      role: "user",
      displayName: "Χρήστης 408",
      department: "Γραφείο Α",
    },
    {
      uid: "user-409",
      username: "409",
      role: "user",
      displayName: "Χρήστης 409",
      department: "Γραφείο Β",
    },
    {
      uid: "admin-001",
      username: "admin",
      role: "admin",
      displayName: "Διαχειριστής",
      department: "Πληροφορική",
    },
  ]

  const priceTable: PriceTable = {
    id: "default-prices",
    name: "Βασικός Τιμοκατάλογος",
    prices: {
      a4BW: 0.05,
      a4Color: 0.15,
      a3BW: 0.1,
      a3Color: 0.3,
    },
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const generateRandomJobs = (user: User, count: number): PrintJob[] => {
    const jobs: PrintJob[] = []
    const printerIPs = ["192.168.3.41", "192.168.3.42"]
    const printerNames = ["Canon iR-ADV C3330", "HP LaserJet Pro M404"]

    for (let i = 0; i < count; i++) {
      const daysAgo = Math.floor(Math.random() * 90)
      const timestamp = new Date()
      timestamp.setDate(timestamp.getDate() - daysAgo)

      const pagesA4BW = Math.floor(Math.random() * 30) + 1
      const pagesA4Color = Math.floor(Math.random() * 15)
      const pagesA3BW = Math.floor(Math.random() * 5)
      const pagesA3Color = Math.floor(Math.random() * 3)

      const deviceIndex = Math.floor(Math.random() * printerIPs.length)

      const costA4BW = pagesA4BW * priceTable.prices.a4BW
      const costA4Color = pagesA4Color * priceTable.prices.a4Color
      const costA3BW = pagesA3BW * priceTable.prices.a3BW
      const costA3Color = pagesA3Color * priceTable.prices.a3Color

      const totalCost = costA4BW + costA4Color + costA3BW + costA3Color

      jobs.push({
        jobId: `job-${user.uid}-${i}-${Date.now()}`,
        uid: user.uid,
        username: user.username,
        userDisplayName: user.displayName,
        department: user.department,
        pagesA4BW,
        pagesA4Color,
        pagesA3BW,
        pagesA3Color,
        deviceIP: printerIPs[deviceIndex],
        deviceName: printerNames[deviceIndex],
        timestamp: timestamp,
        costA4BW: Number.parseFloat(costA4BW.toFixed(3)),
        costA4Color: Number.parseFloat(costA4Color.toFixed(3)),
        costA3BW: Number.parseFloat(costA3BW.toFixed(3)),
        costA3Color: Number.parseFloat(costA3Color.toFixed(3)),
        totalCost: Number.parseFloat(totalCost.toFixed(2)),
        status: "completed",
      })
    }

    return jobs
  }

  const generateBillingRecords = (user: User, jobs: PrintJob[]): BillingRecord[] => {
    const billingMap = new Map<string, BillingRecord>()

    jobs.forEach((job) => {
      const date = new Date(job.timestamp)
      const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`

      if (!billingMap.has(period)) {
        const dueDate = new Date(date.getFullYear(), date.getMonth() + 1, 15) // 15η του επόμενου μήνα

        billingMap.set(period, {
          billingId: `${user.uid}-${period}`,
          uid: user.uid,
          userDisplayName: user.displayName,
          department: user.department,
          period,
          totalA4BW: 0,
          totalA4Color: 0,
          totalA3BW: 0,
          totalA3Color: 0,
          totalCost: 0,
          paid: Math.random() > 0.4, // 60% πιθανότητα να είναι πληρωμένο
          paidAmount: 0,
          remainingBalance: 0,
          dueDate,
          generatedAt: new Date(),
          lastUpdated: new Date(),
        })
      }

      const billing = billingMap.get(period)!
      billing.totalA4BW += job.pagesA4BW
      billing.totalA4Color += job.pagesA4Color
      billing.totalA3BW += job.pagesA3BW
      billing.totalA3Color += job.pagesA3Color
      billing.totalCost += job.totalCost
    })

    return Array.from(billingMap.values()).map((billing) => {
      const finalCost = Number.parseFloat(billing.totalCost.toFixed(2))
      const paidAmount = billing.paid ? finalCost : Number.parseFloat((Math.random() * finalCost).toFixed(2))
      const remainingBalance = finalCost - paidAmount

      return {
        ...billing,
        totalCost: finalCost,
        paidAmount,
        remainingBalance: Number.parseFloat(remainingBalance.toFixed(2)),
        paidDate: billing.paid ? new Date() : undefined,
      }
    })
  }

  const populateDatabase = async () => {
    setLoading(true)
    setStatus("idle")
    setMessage("Έναρξη δημιουργίας δεδομένων...")

    try {
      // Προσθήκη τιμοκαταλόγου
      setMessage("Προσθήκη τιμοκαταλόγου...")
      dataStore.addPriceTable(priceTable)

      // Προσθήκη χρηστών
      setMessage("Προσθήκη χρηστών...")
      dataStore.saveUsers(demoUsers)

      // Δημιουργία εκτυπώσεων για κανονικούς χρήστες μόνο
      setMessage("Προσθήκη εκτυπώσεων...")
      const allJobs: PrintJob[] = []
      const allBilling: BillingRecord[] = []

      for (const user of demoUsers) {
        if (user.role === "admin") continue // Παράλειψη admin χρήστη για εκτυπώσεις

        const jobCount = Math.floor(Math.random() * 40) + 20 // 20-60 εκτυπώσεις ανά χρήστη
        const userJobs = generateRandomJobs(user, jobCount)
        allJobs.push(...userJobs)

        // Δημιουργία χρεώσεων
        const billingRecords = generateBillingRecords(user, userJobs)
        allBilling.push(...billingRecords)
      }

      setMessage("Προσθήκη χρεώσεων...")
      dataStore.savePrintJobs(allJobs)
      dataStore.saveBillingRecords(allBilling)

      setStatus("success")
      setMessage(
        `Επιτυχής προσθήκη: ${demoUsers.length} χρήστες, ${allJobs.length} εκτυπώσεις, ${allBilling.length} χρεώσεις, και τιμοκατάλογος!`,
      )
    } catch (error) {
      setStatus("error")
      setMessage(`Σφάλμα: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const clearAllData = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("users")
      localStorage.removeItem("printJobs")
      localStorage.removeItem("billingRecords")
      localStorage.removeItem("priceTables")

      setStatus("success")
      setMessage("Όλα τα δεδομένα διαγράφηκαν επιτυχώς!")
    }
  }

  // Αυτόματη δημιουργία δεδομένων αν δεν υπάρχουν
  useEffect(() => {
    const existingJobs = dataStore.getPrintJobs()
    const existingBilling = dataStore.getBillingRecords()
    const existingPrices = dataStore.getPriceTables()

    if (existingJobs.length === 0 && existingBilling.length === 0 && existingPrices.length === 0) {
      // Αυτόματη δημιουργία δεδομένων
      populateDatabase()
    }
  }, [])

  return (
    <ProtectedRoute requireAdmin>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Διαχείριση Δεδομένων Demo</h1>
                <p className="text-gray-600">Δημιουργία και διαχείριση δεδομένων δοκιμής</p>
              </div>
              <Button variant="outline" onClick={() => (window.location.href = "/admin")}>
                Επιστροφή στη Διαχείριση
              </Button>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Δημιουργία Νέων Δεδομένων
                </CardTitle>
                <CardDescription>Δημιουργία νέων demo δεδομένων για τους χρήστες 408, 409 και admin.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Χρήστες:</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>
                      • <strong>408</strong> (κωδικός: 08) - Χρήστης 408, Γραφείο Α
                    </li>
                    <li>
                      • <strong>409</strong> (κωδικός: 09) - Χρήστης 409, Γραφείο Β
                    </li>
                    <li>
                      • <strong>admin</strong> (κωδικός: admin123) - Διαχειριστής
                    </li>
                  </ul>

                  <h3 className="text-lg font-semibold">Δεδομένα που θα δημιουργηθούν:</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• 40-120 τυχαίες εκτυπώσεις για κάθε χρήστη (τελευταίοι 3 μήνες)</li>
                    <li>• Λεπτομερείς χρεώσεις A4/A3, ασπρόμαυρο/έγχρωμο</li>
                    <li>• Μηνιαίες χρεώσεις με ημερομηνίες εξόφλησης</li>
                    <li>• Βασικός τιμοκατάλογος με ελληνικές τιμές</li>
                    <li>• Τυχαία κατάσταση πληρωμών (60% πληρωμένα)</li>
                  </ul>
                </div>

                {status !== "idle" && (
                  <Alert className={status === "success" ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                    {status === "success" ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    )}
                    <AlertDescription className={status === "success" ? "text-green-800" : "text-red-800"}>
                      {message}
                    </AlertDescription>
                  </Alert>
                )}

                {loading && (
                  <Alert className="border-blue-200 bg-blue-50">
                    <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                    <AlertDescription className="text-blue-800">{message}</AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-4">
                  <Button onClick={populateDatabase} disabled={loading} className="flex items-center gap-2">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
                    {loading ? "Δημιουργία..." : "Δημιουργία Νέων Δεδομένων"}
                  </Button>

                  <Button variant="destructive" onClick={clearAllData} disabled={loading}>
                    Διαγραφή Όλων των Δεδομένων
                  </Button>

                  {status === "success" && (
                    <Button variant="outline" onClick={() => (window.location.href = "/dashboard")}>
                      Προβολή Dashboard
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Στατιστικά υπαρχόντων δεδομένων */}
            <Card>
              <CardHeader>
                <CardTitle>Τρέχοντα Δεδομένα</CardTitle>
                <CardDescription>Επισκόπηση των υπαρχόντων δεδομένων στο σύστημα</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{dataStore.getUsers().length}</div>
                    <div className="text-sm text-gray-500">Χρήστες</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{dataStore.getPrintJobs().length}</div>
                    <div className="text-sm text-gray-500">Εκτυπώσεις</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{dataStore.getBillingRecords().length}</div>
                    <div className="text-sm text-gray-500">Χρεώσεις</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{dataStore.getPriceTables().length}</div>
                    <div className="text-sm text-gray-500">Τιμοκατάλογοι</div>
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
