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
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useState, useEffect } from "react"
import { Plus, CreditCard, Users, Settings, User, Building, Printer, Search, Download } from "lucide-react"
import type { User as UserType, LaminationJob } from "@/lib/dummy-database"

export default function AdminPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [users, setUsers] = useState<UserType[]>([])
  const [filteredUsers, setFilteredUsers] = useState<UserType[]>([])
  const [userSearchTerm, setUserSearchTerm] = useState("")
  const [debtFilter, setDebtFilter] = useState("all") // all, print, lamination, both
  const [amountFilter, setAmountFilter] = useState("all") // all, under10, 10to50, over50
  const [selectedUser, setSelectedUser] = useState("")
  const [laminationType, setLaminationType] = useState<"A3" | "A4" | "card_small" | "card_large">("A4")
  const [quantity, setQuantity] = useState("1")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const [showAddUserDialog, setShowAddUserDialog] = useState(false)
  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    displayName: "",
    department: "",
    email: "",
    role: "user" as "user" | "admin",
  })

  useEffect(() => {
    const allUsers = dummyDB.getUsers()
    setUsers(allUsers)
    setFilteredUsers(allUsers)
  }, [])

  // Filter users based on search term, debt filter, and amount filter
  useEffect(() => {
    let filtered = [...users]

    // Apply search filter
    if (userSearchTerm) {
      filtered = filtered.filter(
        (u) =>
          u.displayName.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
          u.username.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
          u.department.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
          u.email?.toLowerCase().includes(userSearchTerm.toLowerCase()),
      )
    }

    // Apply debt filter
    if (debtFilter !== "all") {
      filtered = filtered.filter((u) => {
        const printBilling = dummyDB.getPrintBilling(u.uid)
        const laminationBilling = dummyDB.getLaminationBilling(u.uid)
        const printUnpaid = printBilling.filter((b) => !b.paid).reduce((sum, b) => sum + b.remainingBalance, 0)
        const laminationUnpaid = laminationBilling
          .filter((b) => !b.paid)
          .reduce((sum, b) => sum + b.remainingBalance, 0)

        switch (debtFilter) {
          case "print":
            return printUnpaid > 0
          case "lamination":
            return laminationUnpaid > 0
          case "both":
            return printUnpaid > 0 && laminationUnpaid > 0
          default:
            return true
        }
      })
    }

    // Apply amount filter
    if (amountFilter !== "all") {
      filtered = filtered.filter((u) => {
        const printBilling = dummyDB.getPrintBilling(u.uid)
        const laminationBilling = dummyDB.getLaminationBilling(u.uid)
        const printUnpaid = printBilling.filter((b) => !b.paid).reduce((sum, b) => sum + b.remainingBalance, 0)
        const laminationUnpaid = laminationBilling
          .filter((b) => !b.paid)
          .reduce((sum, b) => sum + b.remainingBalance, 0)
        const totalUnpaid = printUnpaid + laminationUnpaid

        switch (amountFilter) {
          case "under10":
            return totalUnpaid > 0 && totalUnpaid < 10
          case "10to50":
            return totalUnpaid >= 10 && totalUnpaid <= 50
          case "over50":
            return totalUnpaid > 50
          default:
            return true
        }
      })
    }

    setFilteredUsers(filtered)
  }, [userSearchTerm, debtFilter, amountFilter, users])

  const laminationPrices = dummyDB.getPriceTable("lamination")?.prices || {}
  const printingPrices = dummyDB.getPriceTable("printing")?.prices || {}

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

  const handleAddUser = async () => {
    if (!newUser.username || !newUser.password || !newUser.displayName) {
      toast({
        title: "Σφάλμα",
        description: "Παρακαλώ συμπληρώστε όλα τα απαιτούμενα πεδία",
        variant: "destructive",
      })
      return
    }

    // Check if username already exists
    if (users.find((u) => u.username === newUser.username)) {
      toast({
        title: "Σφάλμα",
        description: "Το Username υπάρχει ήδη",
        variant: "destructive",
      })
      return
    }

    try {
      const userToAdd: UserType = {
        uid: `user-${Date.now()}`,
        username: newUser.username,
        role: newUser.role,
        displayName: newUser.displayName,
        department: newUser.department || "Γενικό",
        email: newUser.email || undefined,
        createdAt: new Date(),
      }

      const updatedUsers = [...users, userToAdd]
      dummyDB.saveUsers(updatedUsers)
      setUsers(updatedUsers)

      toast({
        title: "Επιτυχία",
        description: `Ο χρήστης ${newUser.displayName} προστέθηκε επιτυχώς`,
      })

      // Reset form and close dialog
      setNewUser({ username: "", password: "", displayName: "", department: "", email: "", role: "user" })
      setShowAddUserDialog(false)
    } catch (error) {
      toast({
        title: "Σφάλμα",
        description: "Αποτυχία προσθήκης χρήστη",
        variant: "destructive",
      })
    }
  }

  const exportUsersCSV = () => {
    const csvData = filteredUsers.map((userData) => {
      const printBilling = dummyDB.getPrintBilling(userData.uid)
      const laminationBilling = dummyDB.getLaminationBilling(userData.uid)
      const printUnpaid = printBilling.filter((b) => !b.paid).reduce((sum, b) => sum + b.remainingBalance, 0)
      const laminationUnpaid = laminationBilling.filter((b) => !b.paid).reduce((sum, b) => sum + b.remainingBalance, 0)
      const totalUnpaid = printUnpaid + laminationUnpaid

      return {
        username: userData.username,
        name: userData.displayName,
        email: userData.email || "",
        printDebt: printUnpaid.toFixed(2),
        laminationDebt: laminationUnpaid.toFixed(2),
        totalDebt: totalUnpaid.toFixed(2),
      }
    })

    const headers = ["Username", "Name", "Email", "Print Debt (€)", "Lamination Debt (€)", "Total Debt (€)"]
    const csvContent = [
      headers.join(","),
      ...csvData.map((row) =>
        [row.username, row.name, row.email, row.printDebt, row.laminationDebt, row.totalDebt].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `users_export_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
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
                        <div className="space-y-2">
                          <Input
                            placeholder="Αναζήτηση χρήστη..."
                            value={userSearchTerm}
                            onChange={(e) => setUserSearchTerm(e.target.value)}
                          />
                          <Select value={selectedUser} onValueChange={setSelectedUser}>
                            <SelectTrigger>
                              <SelectValue placeholder="Επιλέξτε χρήστη" />
                            </SelectTrigger>
                            <SelectContent>
                              {filteredUsers
                                .filter((u) => u.role === "user")
                                .map((user) => (
                                  <SelectItem key={user.uid} value={user.uid}>
                                    {user.displayName} ({user.department}) - {user.username}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
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
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle>Διαχείριση Χρηστών</CardTitle>
                        <CardDescription>Προβολή και διαχείριση όλων των χρηστών του συστήματος</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={exportUsersCSV} variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Εξαγωγή CSV
                        </Button>
                        <Dialog open={showAddUserDialog} onOpenChange={setShowAddUserDialog}>
                          <DialogTrigger asChild>
                            <Button className="bg-yellow-500 hover:bg-yellow-600 text-black">
                              Πρόσθεσε Χρήστη
                              <Plus className="h-4 w-4 ml-2" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Προσθήκη Νέου Χρήστη</DialogTitle>
                              <DialogDescription>Δημιουργήστε έναν νέο λογαριασμό χρήστη</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label htmlFor="newUsername">Username *</Label>
                                <Input
                                  id="newUsername"
                                  value={newUser.username}
                                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                                  placeholder="π.χ. 410"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="newPassword">Κωδικός *</Label>
                                <Input
                                  id="newPassword"
                                  type="password"
                                  value={newUser.password}
                                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                  placeholder="Κωδικός πρόσβασης"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="newDisplayName">Όνομα *</Label>
                                <Input
                                  id="newDisplayName"
                                  value={newUser.displayName}
                                  onChange={(e) => setNewUser({ ...newUser, displayName: e.target.value })}
                                  placeholder="π.χ. Χρήστης 410"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="newEmail">Email</Label>
                                <Input
                                  id="newEmail"
                                  type="email"
                                  value={newUser.email}
                                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                  placeholder="π.χ. user410@example.com"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="newDepartment">Τμήμα (προαιρετικό)</Label>
                                <Input
                                  id="newDepartment"
                                  value={newUser.department}
                                  onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                                  placeholder="π.χ. Γραφείο Γ"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="newRole">Ρόλος</Label>
                                <Select
                                  value={newUser.role}
                                  onValueChange={(value: "user" | "admin") => setNewUser({ ...newUser, role: value })}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="user">User</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="flex gap-2">
                                <Button onClick={handleAddUser} className="flex-1">
                                  Δημιουργία Χρήστη
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => setShowAddUserDialog(false)}
                                  className="flex-1"
                                >
                                  Ακύρωση
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4 space-y-4">
                      <div className="flex gap-4">
                        <div className="flex-1">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <Input
                              placeholder="Αναζήτηση χρηστών..."
                              value={userSearchTerm}
                              onChange={(e) => setUserSearchTerm(e.target.value)}
                              className="pl-10"
                            />
                          </div>
                        </div>
                        <div className="w-48">
                          <Select value={debtFilter} onValueChange={setDebtFilter}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Όλοι οι χρήστες</SelectItem>
                              <SelectItem value="print">Με οφειλές εκτυπώσεων</SelectItem>
                              <SelectItem value="lamination">Με οφειλές πλαστικοποιήσεων</SelectItem>
                              <SelectItem value="both">Με οφειλές και στα δύο</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="w-48">
                          <Select value={amountFilter} onValueChange={setAmountFilter}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Όλα τα ποσά</SelectItem>
                              <SelectItem value="under10">Κάτω από €10</SelectItem>
                              <SelectItem value="10to50">€10 - €50</SelectItem>
                              <SelectItem value="over50">Πάνω από €50</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600">
                        Εμφανίζονται {filteredUsers.length} από {users.length} χρήστες
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                      {filteredUsers.map((userData) => {
                        const printBilling = dummyDB.getPrintBilling(userData.uid)
                        const laminationBilling = dummyDB.getLaminationBilling(userData.uid)
                        const printJobs = dummyDB.getPrintJobs(userData.uid)
                        const laminationJobs = dummyDB.getLaminationJobs(userData.uid)

                        const printUnpaid = printBilling
                          .filter((b) => !b.paid)
                          .reduce((sum, b) => sum + b.remainingBalance, 0)
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
                                  <span className="text-gray-600">Username:</span>
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
                                        <span
                                          className={printUnpaid > 0 ? "text-red-600 font-semibold" : "text-green-600"}
                                        >
                                          €{printUnpaid.toFixed(2)}
                                        </span>
                                      </div>
                                      <div className="flex justify-between items-center">
                                        <span className="flex items-center gap-1">
                                          <CreditCard className="h-3 w-3" />
                                          Πλαστικοποιήσεις:
                                        </span>
                                        <span
                                          className={
                                            laminationUnpaid > 0 ? "text-red-600 font-semibold" : "text-green-600"
                                          }
                                        >
                                          €{laminationUnpaid.toFixed(2)}
                                        </span>
                                      </div>
                                      <div className="flex justify-between items-center border-t pt-2">
                                        <span className="font-medium">Σύνολο:</span>
                                        <span
                                          className={
                                            totalUnpaid > 0 ? "text-red-600 font-bold" : "text-green-600 font-bold"
                                          }
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
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="settings" className="mt-6">
                <div className="space-y-6">
                  {/* Printing Prices */}
                  <Card className="border-blue-200">
                    <CardHeader className="bg-blue-50">
                      <CardTitle className="flex items-center gap-2 text-blue-800">
                        <Printer className="h-5 w-5" />
                        Τιμοκατάλογος Εκτυπώσεων
                      </CardTitle>
                      <CardDescription className="text-blue-600">
                        Τρέχουσες τιμές για τους διαφορετικούς τύπους εκτυπώσεων
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
                          <h3 className="font-medium text-blue-800">A4 Ασπρόμαυρο</h3>
                          <p className="text-2xl font-bold text-blue-600">€{printingPrices.a4BW?.toFixed(3)}</p>
                        </div>
                        <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
                          <h3 className="font-medium text-blue-800">A4 Έγχρωμο</h3>
                          <p className="text-2xl font-bold text-blue-600">€{printingPrices.a4Color?.toFixed(3)}</p>
                        </div>
                        <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
                          <h3 className="font-medium text-blue-800">A3 Ασπρόμαυρο</h3>
                          <p className="text-2xl font-bold text-blue-600">€{printingPrices.a3BW?.toFixed(3)}</p>
                        </div>
                        <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
                          <h3 className="font-medium text-blue-800">A3 Έγχρωμο</h3>
                          <p className="text-2xl font-bold text-blue-600">€{printingPrices.a3Color?.toFixed(3)}</p>
                        </div>
                        <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
                          <h3 className="font-medium text-blue-800">Σάρωση</h3>
                          <p className="text-2xl font-bold text-blue-600">€{printingPrices.scan?.toFixed(3)}</p>
                        </div>
                        <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
                          <h3 className="font-medium text-blue-800">Φωτοαντίγραφο</h3>
                          <p className="text-2xl font-bold text-blue-600">€{printingPrices.copy?.toFixed(3)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Lamination Prices */}
                  <Card className="border-green-200">
                    <CardHeader className="bg-green-50">
                      <CardTitle className="flex items-center gap-2 text-green-800">
                        <CreditCard className="h-5 w-5" />
                        Τιμοκατάλογος Πλαστικοποιήσεων
                      </CardTitle>
                      <CardDescription className="text-green-600">
                        Τρέχουσες τιμές για τους διαφορετικούς τύπους πλαστικοποίησης
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 border border-green-200 rounded-lg bg-green-50">
                          <h3 className="font-medium text-green-800">A4</h3>
                          <p className="text-2xl font-bold text-green-600">€{laminationPrices.A4?.toFixed(2)}</p>
                        </div>
                        <div className="p-4 border border-green-200 rounded-lg bg-green-50">
                          <h3 className="font-medium text-green-800">A3</h3>
                          <p className="text-2xl font-bold text-green-600">€{laminationPrices.A3?.toFixed(2)}</p>
                        </div>
                        <div className="p-4 border border-green-200 rounded-lg bg-green-50">
                          <h3 className="font-medium text-green-800">Κάρτα Μικρή</h3>
                          <p className="text-2xl font-bold text-green-600">
                            €{laminationPrices.card_small?.toFixed(2)}
                          </p>
                        </div>
                        <div className="p-4 border border-green-200 rounded-lg bg-green-50">
                          <h3 className="font-medium text-green-800">Κάρτα Μεγάλη</h3>
                          <p className="text-2xl font-bold text-green-600">
                            €{laminationPrices.card_large?.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
