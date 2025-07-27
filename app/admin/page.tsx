"use client"

import { ProtectedRoute } from "@/components/protected-route"
import { Navigation } from "@/components/navigation"
import { useAuth } from "@/lib/auth-context"
import { useRefresh } from "@/lib/refresh-context"
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
import { Slider } from "@/components/ui/slider"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
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
import { Plus, CreditCard, Users, Settings, User, Building, Printer, Search, Download, Edit, Save, X, ArrowRight, RotateCcw } from "lucide-react"
import type { User as UserType, LaminationJob, PriceTable } from "@/lib/dummy-database"
import { AdminUsersTab } from "@/components/admin-users-tab"
import * as XLSX from "xlsx"

export default function AdminPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const { triggerRefresh } = useRefresh()
  const [users, setUsers] = useState<UserType[]>([])
  const [filteredUsers, setFilteredUsers] = useState<UserType[]>([])
  const [usersTabSearchTerm, setUsersTabSearchTerm] = useState("")
  const [debtFilter, setDebtFilter] = useState("all") // all, print, lamination, both
  const [amountFilter, setAmountFilter] = useState("all") // all, under10, 10to50, over50
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100])
  const [priceRangeInputs, setPriceRangeInputs] = useState<[string, string]>(["0", "100"])
  const [selectedUser, setSelectedUser] = useState("")
  const [laminationType, setLaminationType] = useState<"A3" | "A4" | "A5" | "cards" | "spiral" | "colored_cardboard" | "plastic_cover">("A4")
  const [quantity, setQuantity] = useState("1")
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const [showAddUserDialog, setShowAddUserDialog] = useState(false)
  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    displayName: "",
    department: "",
    email: "",
    role: "user" as "user" | "admin",
    userRole: "Άτομο" as "Άτομο" | "Ομάδα" | "Ναός" | "Τομέας",
    responsiblePerson: "",
  })

  // Price editing state
  const [editingPrices, setEditingPrices] = useState<{
    printing: { [key: string]: string }
    lamination: { [key: string]: string }
  }>({
    printing: {},
    lamination: {},
  })
  const [isEditingPrinting, setIsEditingPrinting] = useState(false)
  const [isEditingLamination, setIsEditingLamination] = useState(false)

  useEffect(() => {
    const allUsers = dummyDB.getUsers()
    setUsers(allUsers)
    setFilteredUsers(allUsers)
  }, [])

  // Calculate price distribution for dynamic range
  const calculatePriceDistribution = () => {
    const allAmounts: number[] = []
    
    users.forEach((userData) => {
      const printBilling = dummyDB.getPrintBilling(userData.uid)
      const laminationBilling = dummyDB.getLaminationBilling(userData.uid)
      const printUnpaid = printBilling.filter((b) => !b.paid).reduce((sum, b) => sum + b.remainingBalance, 0)
      const laminationUnpaid = laminationBilling
        .filter((b) => !b.paid)
        .reduce((sum, b) => sum + b.remainingBalance, 0)
      const totalUnpaid = printUnpaid + laminationUnpaid
      
      if (totalUnpaid > 0) {
        allAmounts.push(totalUnpaid)
      }
    })

    if (allAmounts.length === 0) {
      return {
        min: 0,
        max: 100,
        distribution: {
          "0-20": 0,
          "20-35": 0,
          "35-90": 0,
          "90+": 0
        }
      }
    }

    const min = Math.min(...allAmounts)
    const max = Math.max(...allAmounts)
    
    // Create distribution buckets
    const distribution = {
      "0-20": allAmounts.filter(amount => amount <= 20).length,
      "20-35": allAmounts.filter(amount => amount > 20 && amount <= 35).length,
      "35-90": allAmounts.filter(amount => amount > 35 && amount <= 90).length,
      "90+": allAmounts.filter(amount => amount > 90).length
    }

    return { min, max, distribution }
  }

  const priceDistribution = calculatePriceDistribution()

  // Filter users based on search term, debt filter and price range filter
  useEffect(() => {
    let filtered = [...users]

    // Apply search filter
    if (usersTabSearchTerm) {
      filtered = filtered.filter(
        (u) =>
          u.displayName.toLowerCase().includes(usersTabSearchTerm.toLowerCase()) ||
          u.username.toLowerCase().includes(usersTabSearchTerm.toLowerCase()) ||
          u.department.toLowerCase().includes(usersTabSearchTerm.toLowerCase()) ||
          u.email?.toLowerCase().includes(usersTabSearchTerm.toLowerCase()),
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

    // Apply price range filter
    if (priceRange[0] !== priceDistribution.min || priceRange[1] !== priceDistribution.max) {
      filtered = filtered.filter((u) => {
        const printBilling = dummyDB.getPrintBilling(u.uid)
        const laminationBilling = dummyDB.getLaminationBilling(u.uid)
        const printUnpaid = printBilling.filter((b) => !b.paid).reduce((sum, b) => sum + b.remainingBalance, 0)
        const laminationUnpaid = laminationBilling
          .filter((b) => !b.paid)
          .reduce((sum, b) => sum + b.remainingBalance, 0)
        const totalUnpaid = printUnpaid + laminationUnpaid

        return totalUnpaid >= priceRange[0] && totalUnpaid <= priceRange[1]
      })
    }

    setFilteredUsers(filtered)
  }, [usersTabSearchTerm, debtFilter, priceRange, users, priceDistribution.min, priceDistribution.max])

  // Update price range when distribution changes
  useEffect(() => {
    setPriceRange([0, priceDistribution.max])
    setPriceRangeInputs(["0", priceDistribution.max.toString()])
  }, [priceDistribution.max])

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
      const totalCost = Number.parseInt(quantity) * pricePerUnit

      const newJob: LaminationJob = {
        jobId: `lamination-job-${Date.now()}`,
        uid: selectedUser,
        username: selectedUserData.username,
        userDisplayName: selectedUserData.displayName,
        department: selectedUserData.department,
        type: laminationType,
        quantity: Number.parseInt(quantity),
        pricePerUnit,
        totalCost: Number.parseFloat(totalCost.toFixed(2)),
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
      const userToAdd: UserType = {
        uid: `user-${Date.now()}`,
        username: newUser.username,
        role: newUser.role,
        displayName: newUser.displayName,
        department: newUser.department || "Γενικό",
        email: newUser.email || undefined,
        createdAt: new Date(),
        userRole: newUser.userRole,
        responsiblePerson: newUser.userRole === "Άτομο" ? undefined : newUser.responsiblePerson,
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
      setNewUser({ username: "", password: "", displayName: "", department: "", email: "", role: "user", userRole: "Άτομο", responsiblePerson: "" })
      setShowAddUserDialog(false)
    } catch (error) {
      toast({
        title: "Σφάλμα",
        description: "Αποτυχία προσθήκης χρήστη",
        variant: "destructive",
      })
    }
  }

  const exportUsersXLSX = () => {
    const headers = ["Username", "Name", "Email", "Print Debt (€)", "Lamination Debt (€)", "Total Debt (€)"]
    const worksheetData = [
      headers,
      ...filteredUsers.map((userData) => {
        const printBilling = dummyDB.getPrintBilling(userData.uid)
        const laminationBilling = dummyDB.getLaminationBilling(userData.uid)
        const printUnpaid = printBilling.filter((b) => !b.paid).reduce((sum, b) => sum + b.remainingBalance, 0)
        const laminationUnpaid = laminationBilling.filter((b) => !b.paid).reduce((sum, b) => sum + b.remainingBalance, 0)
        const totalUnpaid = printUnpaid + laminationUnpaid
        return [
          userData.username,
          userData.displayName,
          userData.email || "",
          printUnpaid.toFixed(2),
          laminationUnpaid.toFixed(2),
          totalUnpaid.toFixed(2),
        ]
      })
    ]
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)
    
    // Style the header row (make it bold and add background color)
    const headerRange = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
    for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col })
      if (!worksheet[cellAddress]) {
        worksheet[cellAddress] = { v: headers[col] }
      }
      worksheet[cellAddress].s = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "4472C4" } },
        alignment: { horizontal: "center", vertical: "center" }
      }
    }
    
    // Set column widths
    const columnWidths = headers.map(header => Math.max(header.length * 1.2, 12))
    worksheet['!cols'] = columnWidths.map(width => ({ width }))
    
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1")
    XLSX.writeFile(workbook, `users_export_${new Date().toISOString().split("T")[0]}.xlsx`)
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

  // Price editing functions
  const startEditingPrinting = () => {
    setIsEditingPrinting(true)
    setEditingPrices(prev => ({
      ...prev,
      printing: {
        a4BW: printingPrices.a4BW?.toString() || "",
        a4Color: printingPrices.a4Color?.toString() || "",
        a3BW: printingPrices.a3BW?.toString() || "",
        a3Color: printingPrices.a3Color?.toString() || "",
      }
    }))
  }

  const startEditingLamination = () => {
    setIsEditingLamination(true)
    setEditingPrices(prev => ({
      ...prev,
      lamination: {
        A3: laminationPrices.A3?.toString() || "",
        A4: laminationPrices.A4?.toString() || "",
        A5: laminationPrices.A5?.toString() || "",
        cards: laminationPrices.cards?.toString() || "",
        spiral: laminationPrices.spiral?.toString() || "",
        colored_cardboard: laminationPrices.colored_cardboard?.toString() || "",
        plastic_cover: laminationPrices.plastic_cover?.toString() || "",
      }
    }))
  }

  const savePrintingPrices = () => {
    try {
      const newPrices: { [key: string]: number } = {}
      Object.entries(editingPrices.printing).forEach(([key, value]) => {
        const numValue = parseFloat(value)
        if (isNaN(numValue) || numValue < 0) {
          throw new Error(`Μη έγκυρη τιμή για ${key}`)
        }
        newPrices[key] = numValue
      })

      dummyDB.updatePriceTable("printing", { prices: newPrices })
      setIsEditingPrinting(false)
      setEditingPrices(prev => ({ ...prev, printing: {} }))

      toast({
        title: "Επιτυχία",
        description: "Οι τιμές εκτυπώσεων ενημερώθηκαν επιτυχώς",
        variant: "success",
      })
    } catch (error) {
      toast({
        title: "Σφάλμα Επικύρωσης Τιμών",
        description: error instanceof Error ? error.message : "Αποτυχία ενημέρωσης τιμών εκτυπώσεων",
        variant: "destructive",
      })
    }
  }

  const saveLaminationPrices = () => {
    try {
      const newPrices: { [key: string]: number } = {}
      Object.entries(editingPrices.lamination).forEach(([key, value]) => {
        const numValue = parseFloat(value)
        if (isNaN(numValue) || numValue < 0) {
          throw new Error(`Μη έγκυρη τιμή για ${key}`)
        }
        newPrices[key] = numValue
      })

      dummyDB.updatePriceTable("lamination", { prices: newPrices })
      setIsEditingLamination(false)
      setEditingPrices(prev => ({ ...prev, lamination: {} }))

      toast({
        title: "Επιτυχία",
        description: "Οι τιμές πλαστικοποιήσεων ενημερώθηκαν επιτυχώς",
        variant: "success",
      })
    } catch (error) {
      toast({
        title: "Σφάλμα Επικύρωσης Τιμών",
        description: error instanceof Error ? error.message : "Αποτυχία ενημέρωσης τιμών πλαστικοποιήσεων",
        variant: "destructive",
      })
    }
  }

  const cancelEditingPrinting = () => {
    setIsEditingPrinting(false)
    setEditingPrices(prev => ({ ...prev, printing: {} }))
  }

  const cancelEditingLamination = () => {
    setIsEditingLamination(false)
    setEditingPrices(prev => ({ ...prev, lamination: {} }))
  }

  const handleResetData = () => {
    if (confirm("Είστε σίγουροι ότι θέλετε να επαναφέρετε όλα τα δεδομένα; Αυτή η ενέργεια δεν μπορεί να αναιρεθεί.")) {
      dummyDB.reset()
      const allUsers = dummyDB.getUsers()
      setUsers(allUsers)
      setFilteredUsers(allUsers)
      toast({
        title: "Επιτυχία",
        description: "Τα δεδομένα επαναφέρθηκαν επιτυχώς",
        variant: "success",
      })
    }
  }

  const handleResetLaminationForm = () => {
    setSelectedUser("")
    setLaminationType("A4")
    setQuantity("1")
    setSelectedDate(new Date().toISOString().split('T')[0])
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
                  className="flex items-center gap-3 border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-blue-700 data-[state=active]:bg-transparent hover:bg-blue-50 hover:text-blue-700 transition-colors text-base font-medium py-3"
                >
                  <Users className="h-5 w-5" />
                  Χρήστες
                </TabsTrigger>
                <TabsTrigger 
                  value="lamination" 
                  className="flex items-center gap-3 border-b-2 border-transparent data-[state=active]:border-green-500 data-[state=active]:text-green-700 data-[state=active]:bg-transparent hover:bg-green-50 hover:text-green-700 transition-colors text-base font-medium py-3"
                >
                  <CreditCard className="h-5 w-5" />
                  Πλαστικοποιήσεις
                </TabsTrigger>
                <TabsTrigger 
                  value="settings" 
                  className="flex items-center gap-3 border-b-2 border-transparent data-[state=active]:border-yellow-500 data-[state=active]:text-yellow-700 data-[state=active]:bg-transparent hover:bg-yellow-50 hover:text-yellow-700 transition-colors text-base font-medium py-3"
                >
                  <Settings className="h-5 w-5" />
                  Τιμές
                </TabsTrigger>
              </TabsList>

              <TabsContent value="lamination" className="mt-8">
                <Card className="border-green-200">
                  <CardHeader className="bg-green-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2 text-green-800">
                          <CreditCard className="h-5 w-5" />
                          Προσθήκη Χρέους Πλαστικοποιητή
                        </CardTitle>
                        <CardDescription className="text-green-600">Προσθέστε χρέωση πλαστικοποίησης σε χρήστη</CardDescription>
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
                  <CardContent className="space-y-6">
                    {/* Row 1: User, Date */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="user">Χρήστης</Label>
                        <SearchableSelect
                          options={users
                            .filter((u) => u.role === "user")
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

                      <div className="space-y-2">
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
                      <div className="space-y-2">
                        <Label htmlFor="type">Τύπος Πλαστικοποίησης</Label>
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
                    </div>

                    {/* Row 3: Total Cost (full width) */}
                    <div className="space-y-2 text-center">
                      <Label>Συνολικό Κόστος</Label>
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
                          <Label htmlFor="department">Τμήμα</Label>
                          <Input id="department" value={newUser.department} onChange={e => setNewUser({ ...newUser, department: e.target.value })} />
                        </div>
                        <div>
                          <Label htmlFor="email">Email</Label>
                          <Input id="email" type="email" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} />
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
                        <div>
                          <Label htmlFor="role">Ρόλος Συστήματος</Label>
                          <Select value={newUser.role} onValueChange={role => setNewUser({ ...newUser, role: role as "user" | "admin" })}>
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
                  debtFilter={debtFilter}
                  setDebtFilter={setDebtFilter}
                  priceRange={priceRange}
                  setPriceRange={setPriceRange}
                  priceRangeInputs={priceRangeInputs}
                  setPriceRangeInputs={setPriceRangeInputs}
                  priceDistribution={priceDistribution}
                  filteredUsers={filteredUsers}
                  formatPrice={formatPrice}
                  dummyDB={dummyDB}
                />
              </TabsContent>

              <TabsContent value="settings" className="mt-8">
                <div className="space-y-6">
                  {/* Printing Prices */}
                  <Card className="border-blue-200">
                    <CardHeader className="bg-blue-50">
                      <div className="flex justify-between items-center">
                        <div>
                          <CardTitle className="flex items-center gap-2 text-blue-800">
                            <Printer className="h-5 w-5" />
                            Τιμοκατάλογος Εκτυπώσεων
                          </CardTitle>
                          <CardDescription className="text-blue-600">
                            Τρέχουσες τιμές για τους διαφορετικούς τύπους εκτυπώσεων
                          </CardDescription>
                        </div>
                        {!isEditingPrinting ? (
                          <Button onClick={startEditingPrinting} variant="outline" size="sm">
                            <Edit className="h-4 w-4 mr-2" />
                            Επεξεργασία
                          </Button>
                        ) : (
                          <div className="flex gap-2">
                            <Button onClick={savePrintingPrices} size="sm" className="bg-yellow-500 hover:bg-yellow-600 text-black">
                              <Save className="h-4 w-4 mr-2" />
                              Αποθήκευση
                            </Button>
                            <Button onClick={cancelEditingPrinting} variant="outline" size="sm">
                              <X className="h-4 w-4 mr-2" />
                              Ακύρωση
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
                          <h3 className="font-medium text-blue-800">A4 Ασπρόμαυρο</h3>
                          {isEditingPrinting ? (
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-blue-600">€</span>
                              <Input
                                type="number"
                                step="0.001"
                                min="0"
                                value={editingPrices.printing.a4BW || ""}
                                onChange={(e) => setEditingPrices(prev => ({
                                  ...prev,
                                  printing: { ...prev.printing, a4BW: e.target.value }
                                }))}
                                className="w-20 h-8 text-sm"
                              />
                            </div>
                          ) : (
                            <p className="text-2xl font-bold text-blue-600">{formatPrice(printingPrices.a4BW)}</p>
                          )}
                        </div>
                        <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
                          <h3 className="font-medium text-blue-800">A4 Έγχρωμο</h3>
                          {isEditingPrinting ? (
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-blue-600">€</span>
                              <Input
                                type="number"
                                step="0.001"
                                min="0"
                                value={editingPrices.printing.a4Color || ""}
                                onChange={(e) => setEditingPrices(prev => ({
                                  ...prev,
                                  printing: { ...prev.printing, a4Color: e.target.value }
                                }))}
                                className="w-20 h-8 text-sm"
                              />
                            </div>
                          ) : (
                            <p className="text-2xl font-bold text-blue-600">{formatPrice(printingPrices.a4Color)}</p>
                          )}
                        </div>
                        <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
                          <h3 className="font-medium text-blue-800">A3 Ασπρόμαυρο</h3>
                          {isEditingPrinting ? (
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-blue-600">€</span>
                              <Input
                                type="number"
                                step="0.001"
                                min="0"
                                value={editingPrices.printing.a3BW || ""}
                                onChange={(e) => setEditingPrices(prev => ({
                                  ...prev,
                                  printing: { ...prev.printing, a3BW: e.target.value }
                                }))}
                                className="w-20 h-8 text-sm"
                              />
                            </div>
                          ) : (
                            <p className="text-2xl font-bold text-blue-600">{formatPrice(printingPrices.a3BW)}</p>
                          )}
                        </div>
                        <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
                          <h3 className="font-medium text-blue-800">A3 Έγχρωμο</h3>
                          {isEditingPrinting ? (
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-blue-600">€</span>
                              <Input
                                type="number"
                                step="0.001"
                                min="0"
                                value={editingPrices.printing.a3Color || ""}
                                onChange={(e) => setEditingPrices(prev => ({
                                  ...prev,
                                  printing: { ...prev.printing, a3Color: e.target.value }
                                }))}
                                className="w-20 h-8 text-sm"
                              />
                            </div>
                          ) : (
                            <p className="text-2xl font-bold text-blue-600">{formatPrice(printingPrices.a3Color)}</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Lamination Prices */}
                  <Card className="border-green-200">
                    <CardHeader className="bg-green-50">
                      <div className="flex justify-between items-center">
                        <div>
                          <CardTitle className="flex items-center gap-2 text-green-800">
                            <CreditCard className="h-5 w-5" />
                            Τιμοκατάλογος Πλαστικοποιήσεων
                          </CardTitle>
                          <CardDescription className="text-green-600">
                            Τρέχουσες τιμές για τους διαφορετικούς τύπους πλαστικοποίησης
                          </CardDescription>
                        </div>
                        {!isEditingLamination ? (
                          <Button onClick={startEditingLamination} variant="outline" size="sm">
                            <Edit className="h-4 w-4 mr-2" />
                            Επεξεργασία
                          </Button>
                        ) : (
                          <div className="flex gap-2">
                            <Button onClick={saveLaminationPrices} size="sm" className="bg-yellow-500 hover:bg-yellow-600 text-black">
                              <Save className="h-4 w-4 mr-2" />
                              Αποθήκευση
                            </Button>
                            <Button onClick={cancelEditingLamination} variant="outline" size="sm">
                              <X className="h-4 w-4 mr-2" />
                              Ακύρωση
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="p-4 border border-green-200 rounded-lg bg-green-50">
                          <h3 className="font-medium text-green-800">A3</h3>
                          {isEditingLamination ? (
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-green-600">€</span>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={editingPrices.lamination.A3 || ""}
                                onChange={(e) => setEditingPrices(prev => ({
                                  ...prev,
                                  lamination: { ...prev.lamination, A3: e.target.value }
                                }))}
                                className="w-20 h-8 text-sm"
                              />
                            </div>
                          ) : (
                            <p className="text-2xl font-bold text-green-600">{formatPrice(laminationPrices.A3)}</p>
                          )}
                        </div>
                        <div className="p-4 border border-green-200 rounded-lg bg-green-50">
                          <h3 className="font-medium text-green-800">A4</h3>
                          {isEditingLamination ? (
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-green-600">€</span>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={editingPrices.lamination.A4 || ""}
                                onChange={(e) => setEditingPrices(prev => ({
                                  ...prev,
                                  lamination: { ...prev.lamination, A4: e.target.value }
                                }))}
                                className="w-20 h-8 text-sm"
                              />
                            </div>
                          ) : (
                            <p className="text-2xl font-bold text-green-600">{formatPrice(laminationPrices.A4)}</p>
                          )}
                        </div>
                        <div className="p-4 border border-green-200 rounded-lg bg-green-50">
                          <h3 className="font-medium text-green-800">A5</h3>
                          {isEditingLamination ? (
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-green-600">€</span>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={editingPrices.lamination.A5 || ""}
                                onChange={(e) => setEditingPrices(prev => ({
                                  ...prev,
                                  lamination: { ...prev.lamination, A5: e.target.value }
                                }))}
                                className="w-20 h-8 text-sm"
                              />
                            </div>
                          ) : (
                            <p className="text-2xl font-bold text-green-600">{formatPrice(laminationPrices.A5)}</p>
                          )}
                        </div>
                        <div className="p-4 border border-green-200 rounded-lg bg-green-50">
                          <h3 className="font-medium text-green-800">Κάρτες</h3>
                          {isEditingLamination ? (
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-green-600">€</span>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={editingPrices.lamination.cards || ""}
                                onChange={(e) => setEditingPrices(prev => ({
                                  ...prev,
                                  lamination: { ...prev.lamination, cards: e.target.value }
                                }))}
                                className="w-20 h-8 text-sm"
                              />
                            </div>
                          ) : (
                            <p className="text-2xl font-bold text-green-600">
                              {formatPrice(laminationPrices.cards)}
                            </p>
                          )}
                        </div>
                        <div className="p-4 border border-green-200 rounded-lg bg-green-50">
                          <h3 className="font-medium text-green-800">Σπιράλ</h3>
                          {isEditingLamination ? (
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-green-600">€</span>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={editingPrices.lamination.spiral || ""}
                                onChange={(e) => setEditingPrices(prev => ({
                                  ...prev,
                                  lamination: { ...prev.lamination, spiral: e.target.value }
                                }))}
                                className="w-20 h-8 text-sm"
                              />
                            </div>
                          ) : (
                            <p className="text-2xl font-bold text-green-600">
                              {formatPrice(laminationPrices.spiral)}
                            </p>
                          )}
                        </div>
                        <div className="p-4 border border-green-200 rounded-lg bg-green-50">
                          <h3 className="font-medium text-green-800">Χρωματιστά Χαρτόνια</h3>
                          {isEditingLamination ? (
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-green-600">€</span>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={editingPrices.lamination.colored_cardboard || ""}
                                onChange={(e) => setEditingPrices(prev => ({
                                  ...prev,
                                  lamination: { ...prev.lamination, colored_cardboard: e.target.value }
                                }))}
                                className="w-20 h-8 text-sm"
                              />
                            </div>
                          ) : (
                            <p className="text-2xl font-bold text-green-600">
                              {formatPrice(laminationPrices.colored_cardboard)}
                            </p>
                          )}
                        </div>
                        <div className="p-4 border border-green-200 rounded-lg bg-green-50">
                          <h3 className="font-medium text-green-800">Πλαστικό Κάλυμμα</h3>
                          {isEditingLamination ? (
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-green-600">€</span>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={editingPrices.lamination.plastic_cover || ""}
                                onChange={(e) => setEditingPrices(prev => ({
                                  ...prev,
                                  lamination: { ...prev.lamination, plastic_cover: e.target.value }
                                }))}
                                className="w-20 h-8 text-sm"
                              />
                            </div>
                          ) : (
                            <p className="text-2xl font-bold text-green-600">
                              {formatPrice(laminationPrices.plastic_cover)}
                            </p>
                          )}
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
