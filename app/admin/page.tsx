"use client"

import { ProtectedRoute } from "@/components/protected-route"
import { Navigation } from "@/components/navigation"
import { useAuth } from "@/lib/auth-context"
import { useRefresh } from "@/lib/refresh-context"
import { dummyDB } from "@/lib/dummy-database"
import { multiplyMoney, roundMoney } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { SearchableSelect } from "@/components/searchable-select"
import { GreekDatePicker } from "@/components/ui/greek-date-picker"
import { useState, useEffect } from "react"
import { Plus, CreditCard, Users, Building, Printer, RotateCcw } from "lucide-react"
import type { User, LaminationJob } from "@/lib/dummy-database"
import { AdminUsersTab } from "@/components/admin-users-tab"

export default function AdminPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const { triggerRefresh } = useRefresh()
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [usersTabSearchTerm, setUsersTabSearchTerm] = useState("")

  const [roleFilter, setRoleFilter] = useState("all") // all, Άτομο, Ομάδα, Ναός, Τομέας
  const [teamFilter, setTeamFilter] = useState("all") // all, Ενωμένοι, Σποριάδες, etc.
  const [selectedUser, setSelectedUser] = useState("")
  const [laminationType, setLaminationType] = useState<"A3" | "A4" | "A5" | "cards" | "spiral" | "colored_cardboard" | "plastic_cover">("A4")
  const [printingType, setPrintingType] = useState<"a4BW" | "a4Color" | "a3BW" | "a3Color" | "rizocharto" | "chartoni" | "autokollito">("a4BW")
  const [quantity, setQuantity] = useState("1")
  const [selectedDate, setSelectedDate] = useState("")
  const [loading, setLoading] = useState(false)
  const [showAddUserDialog, setShowAddUserDialog] = useState(false)
  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    displayName: "",
    accessLevel: "user" as "user" | "admin",
    userRole: "Άτομο" as "Άτομο" | "Ομάδα" | "Ναός" | "Τομέας",
    responsiblePerson: "",
    team: "" as "" | "Ενωμένοι" | "Σποριάδες" | "Καρποφόροι" | "Ολόφωτοι" | "Νικητές" | "Νικηφόροι" | "Φλόγα" | "Σύμψυχοι",
  })

  useEffect(() => {
    const allUsers = dummyDB.getUsers()
    setUsers(allUsers)
    setFilteredUsers(allUsers)
  }, [])

  // Filter users based on search term, role filter, and team filter
  useEffect(() => {
    let filtered = [...users]

    // Apply search filter
    if (usersTabSearchTerm) {
      filtered = filtered.filter(
        (u) =>
          u.displayName.toLowerCase().includes(usersTabSearchTerm.toLowerCase()) ||
          u.username.toLowerCase().includes(usersTabSearchTerm.toLowerCase()),
      )
    }

    // Apply role filter
    if (roleFilter !== "all") {
      filtered = filtered.filter((u) => u.userRole === roleFilter)
    }

    // Apply team filter (only for Άτομο role or when "all" is selected)
    if (teamFilter !== "all" && (roleFilter === "all" || roleFilter === "Άτομο")) {
      filtered = filtered.filter((u) => u.team === teamFilter)
    }

    setFilteredUsers(filtered)
  }, [usersTabSearchTerm, roleFilter, teamFilter, users])

  const laminationPrices = dummyDB.getPriceTable("lamination")?.prices || {}
  const printingPrices = dummyDB.getPriceTable("printing")?.prices || {}

  const handleAddLamination = async () => {
    if (!selectedUser || !quantity) {
      toast({
        title: "Σφάλμα Επικύρωσης",
        description: "Παρακαλώ επιλέξτε χρήστη και συμπληρώστε την ποσότητα",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const selectedUserData = users.find((u) => u.uid === selectedUser)
      if (!selectedUserData) return

      const pricePerUnit = laminationPrices[laminationType] || 0
      const totalCost = multiplyMoney(pricePerUnit, Number.parseInt(quantity))

      const newJob: LaminationJob = {
        jobId: `lamination-job-${Date.now()}`,
        uid: selectedUser,
        username: selectedUserData.username,
        userDisplayName: selectedUserData.displayName,

        type: laminationType,
        quantity: Number.parseInt(quantity),
        pricePerUnit,
        totalCost,
        timestamp: new Date(selectedDate),
        status: "completed",
      }

      dummyDB.addLaminationJob(newJob)

      toast({
        title: "Επιτυχία",
        description: `Προστέθηκε πλαστικοποίηση για τον χρήστη ${selectedUserData.displayName}`,
        variant: "success",
      })

      // Trigger refresh to update dashboard
      triggerRefresh()

      // Don't reset any form fields - they persist for convenience
    } catch (error) {
      toast({
        title: "Σφάλμα Συστήματος",
        description: "Αποτυχία προσθήκης πλαστικοποίησης. Παρακαλώ δοκιμάστε ξανά.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddUser = async () => {
    if (!newUser.username || !newUser.password || !newUser.displayName) {
      toast({
        title: "Σφάλμα Επικύρωσης",
        description: "Παρακαλώ συμπληρώστε username, password και όνομα",
        variant: "destructive",
      })
      return
    }

    // Check if username already exists
    if (users.find((u) => u.username === newUser.username)) {
      toast({
        title: "Σφάλμα Διπλότυπου",
        description: "Το Username υπάρχει ήδη. Παρακαλώ επιλέξτε διαφορετικό username",
        variant: "destructive",
      })
      return
    }

    try {
      const userToAdd: User = {
        uid: `user-${Date.now()}`,
        username: newUser.username,
        accessLevel: newUser.accessLevel,
        displayName: newUser.displayName,
        createdAt: new Date(),
        userRole: newUser.userRole,
        responsiblePerson: newUser.userRole === "Άτομο" ? undefined : newUser.responsiblePerson,
        team: newUser.userRole === "Άτομο" ? (newUser.team || undefined) : undefined,
      }

      const updatedUsers = [...users, userToAdd]
      dummyDB.saveUsers(updatedUsers)
      setUsers(updatedUsers)

      toast({
        title: "Επιτυχία",
        description: `Ο χρήστης ${newUser.displayName} προστέθηκε επιτυχώς`,
        variant: "success",
      })

      // Reset form and close dialog
      setNewUser({ username: "", password: "", displayName: "", accessLevel: "user", userRole: "Άτομο", responsiblePerson: "", team: "" })
      setShowAddUserDialog(false)
    } catch (error) {
      toast({
        title: "Σφάλμα",
        description: "Αποτυχία προσθήκης χρήστη",
        variant: "destructive",
      })
    }
  }



  const getLaminationTypeLabel = (type: string) => {
    switch (type) {
      case "A3":
        return "A3"
      case "A4":
        return "A4"
      case "A5":
        return "A5"
      case "cards":
        return "Κάρτες"
      case "spiral":
        return "Σπιράλ"
      case "colored_cardboard":
        return "Χρωματιστά Χαρτόνια"
      case "plastic_cover":
        return "Πλαστικό Κάλυμμα"
      default:
        return type
    }
  }

  // Utility function to format prices with comma as decimal separator
  const formatPrice = (price: number | undefined): string => {
    if (price === undefined || price === null) return "€0"
    // Always round to two decimals for display
    const rounded = Math.round((price + Number.EPSILON) * 100) / 100
    // Convert to string with 2 decimals, replace dot with comma
    const formatted = rounded.toFixed(2).replace(".", ",")
    return `€${formatted}`
  }

  const handleResetLaminationForm = () => {
    setSelectedUser("")
    setLaminationType("A4")
    setQuantity("1")
    setSelectedDate("")
  }

  const handleTestToasts = () => {
    // Show success toast
    toast({
      title: "Επιτυχία",
      description: "Η πλαστικοποίηση προστέθηκε επιτυχώς για τον χρήστη Χρήστης 400",
      variant: "success",
    })

    // Show failure toast after a short delay
    setTimeout(() => {
      toast({
        title: "Σφάλμα Επικύρωσης",
        description: "Παρακαλώ συμπληρώστε όλα τα απαιτούμενα πεδία πριν συνεχίσετε",
        variant: "destructive",
      })
    }, 500)
  }

  return (
    <ProtectedRoute requireAdmin>
      <div className="min-h-screen bg-gray-50">
        <Navigation />

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="mb-8">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Διαχείριση Συστήματος</h1>
                  <p className="text-gray-600">Διαχειριστείτε χρήστες και προσθέστε χρεώσεις</p>
                </div>

              </div>
            </div>

            <Tabs defaultValue="users" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-white mb-8 p-2 h-16">
                <TabsTrigger 
                  value="users" 
                  className="flex items-center gap-3 border-b-2 border-transparent data-[state=active]:border-yellow-500 data-[state=active]:text-yellow-700 data-[state=active]:bg-transparent hover:bg-yellow-50 hover:text-yellow-700 transition-colors text-base font-medium py-3"
                >
                  <Users className="h-5 w-5" />
                  Χρήστες
                </TabsTrigger>
                <TabsTrigger 
                  value="printing" 
                  className="flex items-center gap-3 border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-blue-700 data-[state=active]:bg-transparent hover:bg-blue-50 hover:text-blue-700 transition-colors text-base font-medium py-3"
                >
                  <Printer className="h-5 w-5" />
                  Χρέωση ΤΟ. ΦΩ.
                </TabsTrigger>
                <TabsTrigger 
                  value="lamination" 
                  className="flex items-center gap-3 border-b-2 border-transparent data-[state=active]:border-green-500 data-[state=active]:text-green-700 data-[state=active]:bg-transparent hover:bg-green-50 hover:text-green-700 transition-colors text-base font-medium py-3"
                >
                  <CreditCard className="h-5 w-5" />
                  Χρέωση ΠΛΑ. ΤΟ.
                </TabsTrigger>

              </TabsList>

              <TabsContent value="printing" className="mt-8">
                <Card className="border-blue-200">
                  <CardHeader className="bg-blue-100">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <Printer className="h-6 w-6 text-blue-800 flex-shrink-0" />
                        <div>
                          <CardTitle className="text-blue-800">
                            Προσθήκη Χρέους ΤΟ. ΦΩ.
                          </CardTitle>
                          <CardDescription className="text-blue-600">Προσθέστε χρέωση εκτύπωσης σε χρήστη</CardDescription>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          aria-label="Επαναφορά φόρμας"
                          className="w-10 h-10 rounded-full border border-blue-300 bg-white hover:bg-blue-50 transition flex items-center justify-center"
                          onClick={() => {
                            // Reset printing form
                            setSelectedUser("")
                            setPrintingType("a4BW")
                            setQuantity("1")
                            setSelectedDate("")
                          }}
                        >
                          <RotateCcw className="h-4 w-4 text-blue-600" />
                        </button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    {/* Row 1: User, Date */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                      <div>
                        <Label htmlFor="user" className="text-gray-700">Χρήστης</Label>
                        <SearchableSelect
                          options={users
                            .filter((u) => u.accessLevel === "user")
                            .map((user) => ({
                              value: user.uid,
                              label: user.displayName,
                              description: `${user.department} - ${user.username}`
                            }))}
                          value={selectedUser}
                          onValueChange={setSelectedUser}
                          placeholder="Επιλέξτε χρήστη"
                          searchPlaceholder="Αναζήτηση χρήστη..."
                        />
                      </div>

                      <div>
                        <GreekDatePicker
                          id="date"
                          label="Ημερομηνία"
                          value={selectedDate}
                          onChange={setSelectedDate}
                        />
                      </div>
                    </div>

                    {/* Row 2: Type, Quantity */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="type" className="text-gray-700">Τύπος Εκτύπωσης</Label>
                        <Select value={printingType} onValueChange={(value: any) => setPrintingType(value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                                            <SelectItem value="a4BW">A4 Ασπρόμαυρο ({formatPrice(printingPrices.a4BW)})</SelectItem>
                <SelectItem value="a4Color">A4 Έγχρωμο ({formatPrice(printingPrices.a4Color)})</SelectItem>
                <SelectItem value="a3BW">A3 Ασπρόμαυρο ({formatPrice(printingPrices.a3BW)})</SelectItem>
                <SelectItem value="a3Color">A3 Έγχρωμο ({formatPrice(printingPrices.a3Color)})</SelectItem>
                <SelectItem value="rizocharto">Ριζόχαρτο ({formatPrice(printingPrices.rizocharto)})</SelectItem>
                <SelectItem value="chartoni">Χαρτόνι ({formatPrice(printingPrices.chartoni)})</SelectItem>
                <SelectItem value="autokollito">Αυτοκόλλητο ({formatPrice(printingPrices.autokollito)})</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="quantity" className="text-gray-700">Ποσότητα</Label>
                        <Input
                          id="quantity"
                          type="number"
                          min="1"
                          value={quantity}
                          onChange={(e) => setQuantity(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Row 3: Total Cost (full width) */}
                    <div className="text-center">
                      <Label className="text-gray-700">Συνολικό Κόστος</Label>
                      <div className="text-2xl font-bold text-blue-600">
                        {formatPrice((printingPrices[printingType] || 0) * Number.parseInt(quantity || "0"))}
                      </div>
                    </div>

                    <Button onClick={() => {
                      // Handle printing charge addition
                      toast({
                        title: "Επιτυχία",
                        description: "Η χρέωση εκτύπωσης προστέθηκε επιτυχώς",
                        variant: "success",
                      })
                    }} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                      {loading ? "Προσθήκη..." : "Προσθήκη Χρέους ΤΟ. ΦΩ."}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="lamination" className="mt-8">
                <Card className="border-green-200">
                  <CardHeader className="bg-green-100">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-6 w-6 text-green-800 flex-shrink-0" />
                        <div>
                          <CardTitle className="text-green-800">
                            Προσθήκη Χρέους Πλαστικοποιητή
                          </CardTitle>
                          <CardDescription className="text-green-600">Προσθέστε χρέωση πλαστικοποίησης σε χρήστη</CardDescription>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          aria-label="Δοκιμή Toast"
                          className="px-4 py-2 rounded-full border border-gray-300 bg-white hover:bg-gray-50 transition flex items-center justify-center hidden"
                          onClick={handleTestToasts}
                        >
                          <span className="text-gray-700 text-xs font-bold">TEST</span>
                        </button>
                        <button
                          type="button"
                          aria-label="Επαναφορά φόρμας"
                          className="w-10 h-10 rounded-full border border-green-300 bg-white hover:bg-green-50 transition flex items-center justify-center"
                          onClick={handleResetLaminationForm}
                        >
                          <RotateCcw className="h-4 w-4 text-green-600" />
                        </button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    {/* Row 1: User, Date */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                      <div>
                        <Label htmlFor="user" className="text-gray-700">Χρήστης</Label>
                        <SearchableSelect
                          options={users
                            .filter((u) => u.accessLevel === "user")
                            .map((user) => ({
                              value: user.uid,
                              label: user.displayName,
                              description: `${user.department} - ${user.username}`
                            }))}
                          value={selectedUser}
                          onValueChange={setSelectedUser}
                          placeholder="Επιλέξτε χρήστη"
                          searchPlaceholder="Αναζήτηση χρήστη..."
                        />
                      </div>

                      <div>
                        <GreekDatePicker
                          id="date"
                          label="Ημερομηνία"
                          value={selectedDate}
                          onChange={setSelectedDate}
                        />
                      </div>
                    </div>

                    {/* Row 2: Type, Quantity */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="type" className="text-gray-700">Τύπος Πλαστικοποίησης</Label>
                        <Select value={laminationType} onValueChange={(value: any) => setLaminationType(value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="A3">A3 ({formatPrice(laminationPrices.A3)})</SelectItem>
                            <SelectItem value="A4">A4 ({formatPrice(laminationPrices.A4)})</SelectItem>
                            <SelectItem value="A5">A5 ({formatPrice(laminationPrices.A5)})</SelectItem>
                            <SelectItem value="cards">Κάρτες ({formatPrice(laminationPrices.cards)})</SelectItem>
                            <SelectItem value="spiral">Σπιράλ ({formatPrice(laminationPrices.spiral)})</SelectItem>
                            <SelectItem value="colored_cardboard">Χρωματιστά Χαρτόνια ({formatPrice(laminationPrices.colored_cardboard)})</SelectItem>
                            <SelectItem value="plastic_cover">Πλαστικό Κάλυμμα ({formatPrice(laminationPrices.plastic_cover)})</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="quantity" className="text-gray-700">Ποσότητα</Label>
                        <Input
                          id="quantity"
                          type="number"
                          min="1"
                          value={quantity}
                          onChange={(e) => setQuantity(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Row 3: Total Cost (full width) */}
                    <div className="text-center">
                      <Label className="text-gray-700">Συνολικό Κόστος</Label>
                      <div className="text-2xl font-bold text-green-600">
                        {formatPrice((laminationPrices[laminationType] || 0) * Number.parseInt(quantity || "0"))}
                      </div>
                    </div>

                    <Button onClick={handleAddLamination} disabled={loading} className="w-full bg-green-600 hover:bg-green-700 text-white">
                      {loading ? "Προσθήκη..." : "Προσθήκη Χρέους Πλαστικοποιητή"}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="users" className="mt-8">
                <div className="flex justify-start mb-4">
                  <Dialog open={showAddUserDialog} onOpenChange={setShowAddUserDialog}>
                    <DialogTrigger asChild>
                      <Button
                        onClick={() => setShowAddUserDialog(true)}
                        className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold flex items-center gap-2"
                      >
                        Προσθήκη Χρήστη <Plus className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Προσθήκη Χρήστη</DialogTitle>
                        <DialogDescription>Συμπληρώστε τα στοιχεία του νέου χρήστη.</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="username">Username</Label>
                          <Input id="username" value={newUser.username} onChange={e => setNewUser({ ...newUser, username: e.target.value })} />
                        </div>
                        <div>
                          <Label htmlFor="password">Password</Label>
                          <Input id="password" type="password" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} />
                        </div>
                        <div>
                          <Label htmlFor="displayName">Όνομα</Label>
                          <Input id="displayName" value={newUser.displayName} onChange={e => setNewUser({ ...newUser, displayName: e.target.value })} />
                        </div>

                        <div>
                          <Label htmlFor="userRole">Ρόλος</Label>
                          <Select value={newUser.userRole} onValueChange={userRole => setNewUser({ ...newUser, userRole: userRole as "Άτομο" | "Ομάδα" | "Ναός" | "Τομέας" })}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Άτομο">Άτομο</SelectItem>
                              <SelectItem value="Ομάδα">Ομάδα</SelectItem>
                              <SelectItem value="Ναός">Ναός</SelectItem>
                              <SelectItem value="Τομέας">Τομέας</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {newUser.userRole !== "Άτομο" && (
                          <div>
                            <Label htmlFor="responsiblePerson">Υπεύθυνος</Label>
                            <Input 
                              id="responsiblePerson" 
                              value={newUser.responsiblePerson} 
                              onChange={e => setNewUser({ ...newUser, responsiblePerson: e.target.value })} 
                              placeholder="Εισάγετε το όνομα του υπευθύνου"
                            />
                          </div>
                        )}
                        {newUser.userRole === "Άτομο" && (
                          <div>
                            <Label htmlFor="team">Ομάδα</Label>
                            <Select value={newUser.team} onValueChange={team => setNewUser({ ...newUser, team: team as "Ενωμένοι" | "Σποριάδες" | "Καρποφόροι" | "Ολόφωτοι" | "Νικητές" | "Νικηφόροι" | "Φλόγα" | "Σύμψυχοι" })}>
                              <SelectTrigger>
                                <SelectValue placeholder="Επιλέξτε ομάδα" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Ενωμένοι">Ενωμένοι</SelectItem>
                                <SelectItem value="Σποριάδες">Σποριάδες</SelectItem>
                                <SelectItem value="Καρποφόροι">Καρποφόροι</SelectItem>
                                <SelectItem value="Ολόφωτοι">Ολόφωτοι</SelectItem>
                                <SelectItem value="Νικητές">Νικητές</SelectItem>
                                <SelectItem value="Νικηφόροι">Νικηφόροι</SelectItem>
                                <SelectItem value="Φλόγα">Φλόγα</SelectItem>
                                <SelectItem value="Σύμψυχοι">Σύμψυχοι</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                        <div>
                          <Label htmlFor="role">Access Level</Label>
                          <Select value={newUser.accessLevel} onValueChange={accessLevel => setNewUser({ ...newUser, accessLevel: accessLevel as "user" | "admin" })}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">Χρήστης</SelectItem>
                              <SelectItem value="admin">Διαχειριστής</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button onClick={handleAddUser} className="w-full">Προσθήκη</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                <AdminUsersTab
                  users={users}
                  usersTabSearchTerm={usersTabSearchTerm}
                  setUsersTabSearchTerm={setUsersTabSearchTerm}
                  roleFilter={roleFilter}
                  setRoleFilter={setRoleFilter}
                  teamFilter={teamFilter}
                  setTeamFilter={setTeamFilter}
                  filteredUsers={filteredUsers}
                  formatPrice={formatPrice}
                  dummyDB={dummyDB}
                />
              </TabsContent>


            </Tabs>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
