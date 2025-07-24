"use client"

import { ProtectedRoute } from "@/components/protected-route"
import { Navigation } from "@/components/navigation"
import { useAuth } from "@/lib/auth-context"
import { dummyDB } from "@/lib/dummy-database"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState, useEffect } from "react"
import { Plus, CreditCard, Users, Settings } from "lucide-react"
import type { User, LaminationJob } from "@/lib/dummy-database"

export default function AdminPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState("")
  const [laminationType, setLaminationType] = useState<"A3" | "A4" | "card_small" | "card_large">("A4")
  const [quantity, setQuantity] = useState("1")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setUsers(dummyDB.getUsers().filter((u) => u.role === "user"))
  }, [])

  const laminationPrices = dummyDB.getPriceTable("lamination")?.prices || {}

  const handleAddLamination = async () => {
    if (!selectedUser || !quantity) {
      toast({
        title: "Σφάλμα",
        description: "Παρακαλώ συμπληρώστε όλα τα απαιτούμενα πεδία",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const selectedUserData = users.find((u) => u.uid === selectedUser)
      if (!selectedUserData) return

      const pricePerUnit = laminationPrices[laminationType] || 0
      const totalCost = Number.parseInt(quantity) * pricePerUnit

      const newJob: LaminationJob = {
        jobId: `lamination-job-${Date.now()}`,
        uid: selectedUser,
        userDisplayName: selectedUserData.displayName,
        department: selectedUserData.department,
        type: laminationType,
        quantity: Number.parseInt(quantity),
        pricePerUnit,
        totalCost: Number.parseFloat(totalCost.toFixed(2)),
        timestamp: new Date(),
        status: "completed",
        notes: notes || undefined,
      }

      dummyDB.addLaminationJob(newJob)

      toast({
        title: "Επιτυχία",
        description: `Προστέθηκε πλαστικοποίηση για τον χρήστη ${selectedUserData.displayName}`,
      })

      // Reset form
      setSelectedUser("")
      setLaminationType("A4")
      setQuantity("1")
      setNotes("")
    } catch (error) {
      toast({
        title: "Σφάλμα",
        description: "Αποτυχία προσθήκης πλαστικοποίησης",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getLaminationTypeLabel = (type: string) => {
    switch (type) {
      case "A3":
        return "A3"
      case "A4":
        return "A4"
      case "card_small":
        return "Κάρτα Μικρή"
      case "card_large":
        return "Κάρτα Μεγάλη"
      default:
        return type
    }
  }

  return (
    <ProtectedRoute requireAdmin>
      <div className="min-h-screen bg-gray-50">
        <Navigation />

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Διαχείριση Συστήματος</h1>
              <p className="text-gray-600">Διαχειριστείτε χρήστες και προσθέστε χρεώσεις</p>
            </div>

            <Tabs defaultValue="lamination" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="lamination" className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Πλαστικοποιήσεις
                </TabsTrigger>
                <TabsTrigger value="users" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Χρήστες
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Ρυθμίσεις
                </TabsTrigger>
              </TabsList>

              <TabsContent value="lamination" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Plus className="h-5 w-5" />
                      Προσθήκη Χρέους Πλαστικοποιητή
                    </CardTitle>
                    <CardDescription>Προσθέστε χρέωση πλαστικοποίησης σε χρήστη</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="user">Χρήστης</Label>
                        <Select value={selectedUser} onValueChange={setSelectedUser}>
                          <SelectTrigger>
                            <SelectValue placeholder="Επιλέξτε χρήστη" />
                          </SelectTrigger>
                          <SelectContent>
                            {users.map((user) => (
                              <SelectItem key={user.uid} value={user.uid}>
                                {user.displayName} ({user.department})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="type">Τύπος Πλαστικοποίησης</Label>
                        <Select value={laminationType} onValueChange={(value: any) => setLaminationType(value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="A4">A4 (€{laminationPrices.A4?.toFixed(2)})</SelectItem>
                            <SelectItem value="A3">A3 (€{laminationPrices.A3?.toFixed(2)})</SelectItem>
                            <SelectItem value="card_small">
                              Κάρτα Μικρή (€{laminationPrices.card_small?.toFixed(2)})
                            </SelectItem>
                            <SelectItem value="card_large">
                              Κάρτα Μεγάλη (€{laminationPrices.card_large?.toFixed(2)})
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="quantity">Ποσότητα</Label>
                        <Input
                          id="quantity"
                          type="number"
                          min="1"
                          value={quantity}
                          onChange={(e) => setQuantity(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Συνολικό Κόστος</Label>
                        <div className="text-2xl font-bold text-green-600">
                          €{((laminationPrices[laminationType] || 0) * Number.parseInt(quantity || "0")).toFixed(2)}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes">Σημειώσεις (προαιρετικό)</Label>
                      <Textarea
                        id="notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Προσθέστε σημειώσεις για την πλαστικοποίηση..."
                      />
                    </div>

                    <Button onClick={handleAddLamination} disabled={loading} className="w-full">
                      {loading ? "Προσθήκη..." : "Προσθήκη Χρέους Πλαστικοποιητή"}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="users" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Διαχείριση Χρηστών</CardTitle>
                    <CardDescription>Προβολή και διαχείριση χρηστών του συστήματος</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {users.map((user) => (
                        <div key={user.uid} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <h3 className="font-medium">{user.displayName}</h3>
                            <p className="text-sm text-gray-500">{user.department}</p>
                            <p className="text-xs text-gray-400">Κωδικός: {user.username}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">
                              Οφειλές Πλαστικοποιήσεων: €
                              {dummyDB
                                .getLaminationBilling(user.uid)
                                .filter((b) => !b.paid)
                                .reduce((sum, b) => sum + b.remainingBalance, 0)
                                .toFixed(2)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {dummyDB.getLaminationJobs(user.uid).length} συνολικές πλαστικοποιήσεις
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="settings" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Τιμοκατάλογος Πλαστικοποιήσεων</CardTitle>
                    <CardDescription>Τρέχουσες τιμές για τους διαφορετικούς τύπους πλαστικοποίησης</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 border rounded-lg">
                        <h3 className="font-medium">A4</h3>
                        <p className="text-2xl font-bold text-green-600">€{laminationPrices.A4?.toFixed(2)}</p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <h3 className="font-medium">A3</h3>
                        <p className="text-2xl font-bold text-green-600">€{laminationPrices.A3?.toFixed(2)}</p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <h3 className="font-medium">Κάρτα Μικρή</h3>
                        <p className="text-2xl font-bold text-green-600">€{laminationPrices.card_small?.toFixed(2)}</p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <h3 className="font-medium">Κάρτα Μεγάλη</h3>
                        <p className="text-2xl font-bold text-green-600">€{laminationPrices.card_large?.toFixed(2)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
