"use client"

import { ProtectedRoute } from "@/components/protected-route"
import { Navigation } from "@/components/navigation"
import { useAuth } from "@/lib/auth-context"
import { useRefresh } from "@/lib/refresh-context"
// import { dummyDB } from "@/lib/dummy-database"
import { multiplyMoney, roundMoney, getDynamicFilterOptions } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { SearchableSelect } from "@/components/searchable-select"
import { GreekDatePicker } from "@/components/ui/greek-date-picker"
import { useState, useEffect } from "react"
import { Plus, CreditCard, Users, Building, Printer, RotateCcw, Euro, Eye, EyeOff } from "lucide-react"
import type { FirebaseUser, FirebaseLaminationJob, FirebaseIncome, FirebasePrintJob } from "@/lib/firebase-schema"
import { FIREBASE_COLLECTIONS } from "@/lib/firebase-schema"
import { getSnapshot, saveSnapshot, makeScopeKey, mergeById, sortByTimestampDesc } from "@/lib/snapshot-store"
import { AdminUsersTab } from "@/components/admin-users-tab"
import { TagInput } from "@/components/ui/tag-input"
import { addPrintJobServer, addLaminationJobServer, addIncomeServer, addUserServer, usePriceTable, useUsers, useUsersMutations, useJobsMutations } from "@/lib/firebase-queries"
import { normalizeGreek } from "@/lib/utils"

export default function AdminPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const { triggerRefresh, setLoading, setLoadingLabel } = useRefresh()
  const [users, setUsers] = useState<FirebaseUser[]>([])
  const [filteredUsers, setFilteredUsers] = useState<FirebaseUser[]>([])
  const [usersTabSearchTerm, setUsersTabSearchTerm] = useState("")

  const [roleFilter, setRoleFilter] = useState("all") // all, Άτομο, Ομάδα, Ναός, Τομέας
  const [teamFilter, setTeamFilter] = useState("all") // all, Ενωμένοι, Σποριάδες, etc.
  const [selectedUser, setSelectedUser] = useState("")
  const [selectedPrinter, setSelectedPrinter] = useState("Canon Color")
  const [laminationType, setLaminationType] = useState<"A3" | "A4" | "A5" | "cards" | "spiral" | "colored_cardboard" | "plastic_cover">("A4")
  const [printingType, setPrintingType] = useState<"A4BW" | "A4Color" | "A3BW" | "A3Color" | "RizochartoA3" | "RizochartoA4" | "ChartoniA3" | "ChartoniA4" | "Autokollito">("A4BW")
  const [quantity, setQuantity] = useState("1")
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [localLoading, setLocalLoading] = useState(false)
  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    displayName: "",
    accessLevel: "Χρήστης" as "Χρήστης" | "Διαχειριστής" | "Υπεύθυνος",
    userRole: "Άτομο" as "Άτομο" | "Ομάδα" | "Ναός" | "Τομέας",
    memberOf: [] as string[],
    responsibleFor: [] as string[],
  })
  const [showPassword, setShowPassword] = useState(false)

  // Printer configuration
  const printerOptions = [
    { value: "Canon Color", label: "Canon Color", ip: "192.168.1.100" },
    { value: "Canon B/W", label: "Canon B/W", ip: "192.168.1.101" },
    { value: "Brother", label: "Brother", ip: "192.168.1.102" },
    { value: "Κυδωνιών", label: "Κυδωνιών", ip: "192.168.1.103" }
  ]

  // Printers that only support A4BW
  const a4BWOnlyPrinters = ["Canon B/W", "Brother", "Κυδωνιών"]

  // Get available print types based on selected printer
  const getAvailablePrintTypes = () => {
    if (a4BWOnlyPrinters.includes(selectedPrinter)) {
      return ["A4BW"]
    }
    return ["A4BW", "A4Color", "A3BW", "A3Color", "RizochartoA3", "RizochartoA4", "ChartoniA3", "ChartoniA4", "Autokollito"]
  }

  // Helper function to map print type to price table property name
  const getPricePropertyName = (printType: string): string => {
    const priceMap: { [key: string]: string } = {
      "A4BW": "a4BW",
      "A4Color": "a4Color", 
      "A3BW": "a3BW",
      "A3Color": "a3Color",
      "RizochartoA3": "rizochartoA3",
      "RizochartoA4": "rizochartoA4",
      "ChartoniA3": "chartoniA3",
      "ChartoniA4": "chartoniA4",
      "Autokollito": "autokollito"
    }
    return priceMap[printType] || printType
  }

  // Debt reduction state
  const [debtReductionUser, setDebtReductionUser] = useState("")
  const [debtReductionAmount, setDebtReductionAmount] = useState("")
  const [debtReductionDate, setDebtReductionDate] = useState(new Date().toISOString().split('T')[0])
  const [debtReductionLoading, setDebtReductionLoading] = useState(false)

  // Get available options for tag system
  const getAvailableMembers = () => {
    const allUsers = users
    return allUsers
      .filter(u => u.userRole !== "Άτομο")
      .map(u => u.displayName)
  }

  const getAvailableResponsiblePersons = () => {
    const allUsers = users
    return allUsers
      .filter(u => u.accessLevel === "Υπεύθυνος" || u.accessLevel === "Διαχειριστής")
      .map(u => u.displayName)
  }

  const getAvailableResponsibleFor = () => {
    const allUsers = users
    return allUsers
      .filter(u => u.userRole !== "Άτομο")
      .map(u => u.displayName)
  }

  const { data: cachedUsers } = useUsers()
  const { invalidate: invalidateUsers } = useUsersMutations()
  const { invalidatePrint, invalidateLam, invalidateInc, invalidateBank } = useJobsMutations()
  useEffect(() => {
    if (cachedUsers) {
      setUsers(cachedUsers as any)
      setFilteredUsers(cachedUsers as any)
    }
  }, [cachedUsers])

  // Filter and sort users based on search term, role filter, and team filter
  useEffect(() => {
    let filtered = [...users]

    // Apply search filter (accent-insensitive)
    if (usersTabSearchTerm) {
      const norm = normalizeGreek(usersTabSearchTerm)
      filtered = filtered.filter((u) =>
        normalizeGreek(u.displayName || "").includes(norm) ||
        normalizeGreek(u.username || "").includes(norm),
      )
    }

    // Apply role filter
    if (roleFilter !== "all") {
      filtered = filtered.filter((u) => u.userRole === roleFilter)
    }

    // Apply team filter (only for Άτομο role or when "all" is selected)
    if (teamFilter !== "all" && (roleFilter === "all" || roleFilter === "Άτομο")) {
      filtered = filtered.filter((u) => {
        // Exclude admin accounts when a specific team is selected
        if (u.accessLevel === "Διαχειριστής") {
          return false
        }
        return u.team === teamFilter
      })
    }

    // Sort users: first by access level, then by role with specific order
    filtered.sort((a, b) => {
      // First sort by access level: Διαχειριστής, Υπεύθυνος, Χρήστης
      const accessLevelOrder = { Διαχειριστής: 0, Υπεύθυνος: 1, Χρήστης: 2 } as const
      const aLevel = accessLevelOrder[a.accessLevel as keyof typeof accessLevelOrder] ?? 3
      const bLevel = accessLevelOrder[b.accessLevel as keyof typeof accessLevelOrder] ?? 3
      
      if (aLevel !== bLevel) {
        return aLevel - bLevel
      }
      
      // If same access level, sort by role: Ομάδα, Τομέας, Ναός, Άτομο
      const roleOrder = { Ομάδα: 0, Τομέας: 1, Ναός: 2, Άτομο: 3 }
      const aRole = roleOrder[a.userRole as keyof typeof roleOrder] ?? 4
      const bRole = roleOrder[b.userRole as keyof typeof roleOrder] ?? 4
      
      return aRole - bRole
    })

    setFilteredUsers(filtered)
  }, [usersTabSearchTerm, roleFilter, teamFilter, users])

  // Auto-set printing type to A4BW when selecting a restricted printer
  useEffect(() => {
    if (a4BWOnlyPrinters.includes(selectedPrinter) && printingType !== "A4BW") {
      setPrintingType("A4BW")
    }
  }, [selectedPrinter, printingType])

  // Set initial date to today when component mounts
  useEffect(() => {
    setSelectedDate(new Date().toISOString().split('T')[0])
  }, [])

  const { data: laminationPriceTable } = usePriceTable("lamination")
  const { data: printingPriceTable } = usePriceTable("printing")
  const laminationPrices = laminationPriceTable?.prices || {}
  const printingPrices = printingPriceTable?.prices || {}

  const handleAddPrinting = async () => {
    if (!selectedUser || !quantity) {
      toast({
        title: "Σφάλμα Επικύρωσης",
        description: "Παρακαλώ επιλέξτε χρήστη και συμπληρώστε την ποσότητα",
        variant: "destructive",
      })
      return
    }

    setLocalLoading(true)
    setLoadingLabel("Καταχώρηση στη βάση...")
    setLoading(true)
    try {
      const selectedUserData = users.find((u) => u.uid === selectedUser)
      if (!selectedUserData) {
        throw new Error("Ο χρήστης δεν βρέθηκε")
      }

      const pricePerUnit = printingPrices[getPricePropertyName(printingType)] || 0
      const totalCost = multiplyMoney(pricePerUnit, Number.parseInt(quantity))

      const selectedPrinterData = printerOptions.find(p => p.value === selectedPrinter)
      const newJob: FirebasePrintJob = {
        jobId: `print-job-${Date.now()}`,
        uid: selectedUser,
        username: selectedUserData.username,
        userDisplayName: selectedUserData.displayName,
        type: printingType,
        quantity: Number.parseInt(quantity),
        pricePerUnit,
        totalCost,
        deviceIP: selectedPrinterData?.ip || "192.168.1.100",
        deviceName: selectedPrinter,
        timestamp: new Date(selectedDate),
        status: "completed",
      }

      const res = await addPrintJobServer(newJob as any)

      toast({
        title: "Επιτυχία",
        description: `Προστέθηκε εκτύπωση για τον χρήστη ${selectedUserData.displayName}`,
        variant: "success",
      })

      // Merge updated user locally; also invalidate shared cache
      if (res?.user) {
        setUsers(prev => {
          const idx = prev.findIndex(u => u.uid === res.user.uid)
          if (idx === -1) return prev
          const next = [...prev]
          next[idx] = { ...next[idx], ...res.user } as any
          return next
        })
        await invalidateUsers()
        // Invalidate jobs caches (both global and per-user) so dashboards stay fresh
        await invalidatePrint()
        await invalidatePrint(selectedUser)
      }
      // Trigger refresh to update dashboard lists lazily
      triggerRefresh()

      // Don't reset any form fields - they persist for convenience
    } catch (error) {
      toast({
        title: "Σφάλμα Συστήματος",
        description: "Αποτυχία προσθήκης εκτύπωσης. Παρακαλώ δοκιμάστε ξανά.",
        variant: "destructive",
      })
    } finally {
      setLocalLoading(false)
      setLoading(false)
    }
  }

  const handleAddLamination = async () => {
    if (!selectedUser || !quantity) {
      toast({
        title: "Σφάλμα Επικύρωσης",
        description: "Παρακαλώ επιλέξτε χρήστη και συμπληρώστε την ποσότητα",
        variant: "destructive",
      })
      return
    }

    setLocalLoading(true)
    setLoadingLabel("Καταχώρηση στη βάση...")
    setLoading(true)
    try {
      const selectedUserData = users.find((u) => u.uid === selectedUser)
      if (!selectedUserData) {
        throw new Error("Ο χρήστης δεν βρέθηκε")
      }

      const pricePerUnit = laminationPrices[laminationType] || 0
      const totalCost = multiplyMoney(pricePerUnit, Number.parseInt(quantity))

      const newJob: FirebaseLaminationJob = {
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

      const res = await addLaminationJobServer(newJob as any)

      toast({
        title: "Επιτυχία",
        description: `Προστέθηκε πλαστικοποίηση για τον χρήστη ${selectedUserData.displayName}`,
        variant: "success",
      })

      // Merge updated user locally and invalidate cache
      if (res?.user) {
        setUsers(prev => {
          const idx = prev.findIndex(u => u.uid === res.user.uid)
          if (idx === -1) return prev
          const next = [...prev]
          next[idx] = { ...next[idx], ...res.user } as any
          return next
        })
        await invalidateUsers()
        await invalidateLam()
        await invalidateLam(selectedUser)
      }
      triggerRefresh()

      // Don't reset any form fields - they persist for convenience
    } catch (error) {
      toast({
        title: "Σφάλμα Συστήματος",
        description: "Αποτυχία προσθήκης πλαστικοποίησης. Παρακαλώ δοκιμάστε ξανά.",
        variant: "destructive",
      })
    } finally {
      setLocalLoading(false)
      setLoading(false)
    }
  }

  const handleDebtReduction = async () => {
    if (!debtReductionUser || !debtReductionAmount || !debtReductionDate) {
      toast({
        title: "Σφάλμα Επικύρωσης",
        description: "Παρακαλώ επιλέξτε χρήστη, συμπληρώστε το ποσό και την ημερομηνία",
        variant: "destructive",
      })
      return
    }

    const amount = parseFloat(debtReductionAmount)
    if (isNaN(amount)) {
      toast({
        title: "Σφάλμα Ποσού",
        description: "Το ποσό πρέπει να είναι έγκυρος αριθμός",
        variant: "destructive",
      })
      return
    }

    if (amount <= 0) {
      toast({
        title: "Σφάλμα Ποσού",
        description: "Το ποσό πρέπει να είναι θετικό",
        variant: "destructive",
      })
      return
    }

    setDebtReductionLoading(true)
    setLoadingLabel("Καταχώρηση στη βάση...")
    setLoading(true)
    try {
      const selectedUserData = users.find((u) => u.uid === debtReductionUser)
      if (!selectedUserData) {
        throw new Error("Ο χρήστης δεν βρέθηκε")
      }

      const newIncome: Income = {
        incomeId: "temp",
        uid: debtReductionUser,
        username: selectedUserData.username,
        userDisplayName: selectedUserData.displayName,
        amount: amount,
        timestamp: new Date(debtReductionDate),
      }

      const res = await addIncomeServer(newIncome as any)

      toast({
        title: "Επιτυχία",
        description: `Προστέθηκε έσοδο €${amount.toFixed(2).replace('.', ',')} για τον χρήστη ${selectedUserData.displayName}`,
        variant: "success",
      })

      // Merge updated user locally and invalidate cache
      if (res?.user) {
        setUsers(prev => {
          const idx = prev.findIndex(u => u.uid === res.user.uid)
          if (idx === -1) return prev
          const next = [...prev]
          next[idx] = { ...next[idx], ...res.user } as any
          return next
        })
        await invalidateUsers()
        await invalidateInc()
        await invalidateInc(debtReductionUser)
        await invalidateBank()
      }
      triggerRefresh()

      // Reset form
      setDebtReductionUser("")
      setDebtReductionAmount("")
      setDebtReductionDate("")
    } catch (error) {
      toast({
        title: "Σφάλμα Συστήματος",
        description: "Αποτυχία προσθήκης εσόδου. Παρακαλώ δοκιμάστε ξανά.",
        variant: "destructive",
      })
    } finally {
      setDebtReductionLoading(false)
      setLoading(false)
    }
  }

  // Function to validate that all Τομείς and Ναοί have Υπεύθυνοι
  const validateResponsiblePersons = (userRole: string, responsiblePersons: string[]) => {
    if ((userRole === "Τομέας" || userRole === "Ναός") && responsiblePersons.length === 0) {
      return {
        isValid: false,
        message: `Οι ${userRole === "Τομέας" ? "Τομείς" : "Ναοί"} πρέπει να έχουν τουλάχιστον έναν Υπεύθυνο`
      }
    }
    return { isValid: true }
  }

  // Function to get available Υπεύθυνοι for assignment
  const getAvailableYpefthynoi = () => {
    return users
      .filter(u => u.accessLevel === "Υπεύθυνος")
      .map(u => u.displayName)
  }

  // Function to dynamically compute responsible persons for Ομάδα/Ναός/Τομέας
  const getDynamicResponsiblePersons = (userData: any) => {
    const responsibleUsers: string[] = []
    
    // Only compute for Ομάδα, Ναός, and Τομέας
    if (userData.userRole === "Ομάδα" || userData.userRole === "Ναός" || userData.userRole === "Τομέας") {
      const ypefthynoiUsers = users.filter((user: any) => user.accessLevel === "Υπεύθυνος")
      
      ypefthynoiUsers.forEach((ypefthynos: any) => {
        if (ypefthynos.responsibleFor && ypefthynos.responsibleFor.length > 0) {
          const isResponsible = ypefthynos.responsibleFor.some((responsibleFor: string) => {
            return responsibleFor === userData.displayName
          })
          
          if (isResponsible) {
            responsibleUsers.push(ypefthynos.displayName)
          }
        }
      })
    }
    
    return responsibleUsers
  }

  // Function to check if all Τομείς and Ναοί have Υπεύθυνοι
  const checkResponsiblePersonsCompliance = () => {
    const tomeisWithoutYpefthynos = users.filter(u => 
      u.userRole === "Τομέας" && getDynamicResponsiblePersons(u).length === 0
    )
    const naoiWithoutYpefthynos = users.filter(u => 
      u.userRole === "Ναός" && getDynamicResponsiblePersons(u).length === 0
    )
    
    return {
      tomeisWithoutYpefthynos,
      naoiWithoutYpefthynos,
      hasIssues: tomeisWithoutYpefthynos.length > 0 || naoiWithoutYpefthynos.length > 0
    }
  }

  // Function to check if all Άτομο users have proper team assignments
  const checkTeamAssignments = () => {
    const { teams } = getDynamicFilterOptions(users)
    
    const atomoUsersWithoutTeam = users.filter(u => 
      u.userRole === "Άτομο" && u.accessLevel === "Χρήστης" && 
      (!u.memberOf || !u.memberOf.some(member => teams.includes(member)))
    )
    
    const atomoUsersWithMultipleTeams = users.filter(u => 
      u.userRole === "Άτομο" && u.accessLevel === "Χρήστης" && 
      u.memberOf && u.memberOf.filter(member => teams.includes(member)).length > 1
    )
    
    return {
      atomoUsersWithoutTeam,
      atomoUsersWithMultipleTeams,
      hasIssues: atomoUsersWithoutTeam.length > 0 || atomoUsersWithMultipleTeams.length > 0
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

    // Validate username format based on access level
    if (newUser.accessLevel === "Διαχειριστής") {
      if (newUser.username !== "admin") {
        toast({
          title: "Σφάλμα Username",
          description: "Ο διαχειριστής πρέπει να έχει username 'admin'",
          variant: "destructive",
        })
        return
      }
    } else {
      // For non-admin users, username must be numeric
      if (!/^\d+$/.test(newUser.username)) {
        toast({
          title: "Σφάλμα Username",
          description: "Το username πρέπει να είναι αριθμός (π.χ. 401, 402, 403)",
          variant: "destructive",
        })
        return
      }
    }

    // Ensure users with "user" access level have a team assigned through memberOf field
    if (newUser.accessLevel === "Χρήστης" && newUser.memberOf.length === 0) {
      toast({
        title: "Σφάλμα Επικύρωσης",
        description: "Παρακαλώ επιλέξτε τουλάχιστον μία ομάδα/ναό/τομέα για χρήστες με επίπεδο πρόσβασης 'Χρήστης'",
        variant: "destructive",
      })
      return
    }

    // Ensure Άτομο users have exactly one team in their members array
    if (newUser.userRole === "Άτομο" && newUser.accessLevel === "Χρήστης") {
      const { teams } = getDynamicFilterOptions(users)
      const teamsInMembers = newUser.memberOf.filter(member => teams.includes(member))
      
      if (teamsInMembers.length === 0) {
        toast({
          title: "Σφάλμα Επικύρωσης",
          description: "Οι χρήστες τύπου 'Άτομο' πρέπει να ανήκουν σε ακριβώς μία ομάδα",
          variant: "destructive",
        })
        return
      }
      
      if (teamsInMembers.length > 1) {
        toast({
          title: "Σφάλμα Επικύρωσης",
          description: "Οι χρήστες τύπου 'Άτομο' μπορούν να ανήκουν μόνο σε μία ομάδα",
          variant: "destructive",
        })
        return
      }
    }

    // Enforce role restrictions for admin and Υπεύθυνος
    if ((newUser.accessLevel === "Διαχειριστής" || newUser.accessLevel === "Υπεύθυνος") && newUser.userRole !== "Άτομο") {
      toast({
        title: "Σφάλμα Ρόλου",
        description: "Διαχειριστές και Υπεύθυνοι μπορούν να έχουν μόνο ρόλο 'Άτομο'",
        variant: "destructive",
      })
      return
    }

    // Validate that Τομείς and Ναοί have Υπεύθυνοι assigned
    const responsibleValidation = validateResponsiblePersons(newUser.userRole, [])
    if (!responsibleValidation.isValid) {
      toast({
        title: "Σφάλμα Επικύρωσης",
        description: responsibleValidation.message,
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
      // Auto-assign team field based on members array for Άτομο users
      let teamField: string | undefined = undefined
      if (newUser.userRole === "Άτομο" && newUser.accessLevel === "Χρήστης") {
        const { teams } = getDynamicFilterOptions(users)
        const teamInMembers = newUser.memberOf.find(member => teams.includes(member))
        if (teamInMembers) {
          teamField = teamInMembers
        }
      }

      const userToAdd: User = {
        uid: `user-${Date.now()}`,
        username: newUser.username,
        accessLevel: newUser.accessLevel,
        displayName: newUser.displayName,
        createdAt: new Date(),
        userRole: newUser.userRole,
        team: teamField,
        memberOf: newUser.memberOf,
        responsibleFor: newUser.responsibleFor,
      }

      await addUserServer(userToAdd as any)
      await invalidateUsers()

      toast({
        title: "Επιτυχία",
        description: `Ο χρήστης ${newUser.displayName} προστέθηκε επιτυχώς`,
        variant: "success",
      })

      // Reset form
      setNewUser({ username: "", password: "", displayName: "", accessLevel: "Χρήστης", userRole: "Άτομο", memberOf: [], responsibleFor: [] })
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

  const handleResetUsersFilters = () => {
    setUsersTabSearchTerm("")
    setRoleFilter("all")
    setTeamFilter("all")
  }

  const handleResetUserForm = () => {
    setNewUser({
      username: "",
      password: "",
      displayName: "",
      accessLevel: "Χρήστης" as "Χρήστης" | "Διαχειριστής" | "Υπεύθυνος",
      userRole: "Άτομο" as "Άτομο" | "Ομάδα" | "Ναός" | "Τομέας",
      memberOf: [] as string[],
      responsibleFor: [] as string[],
    })
    setShowPassword(false)
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
              <TabsList className="grid w-full grid-cols-4 bg-white mb-8 p-2 h-16">
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
                <TabsTrigger 
                  value="debt-reduction" 
                  className="flex items-center gap-3 border-b-2 border-transparent data-[state=active]:border-yellow-500 data-[state=active]:text-yellow-700 data-[state=active]:bg-transparent hover:bg-yellow-50 hover:text-yellow-700 transition-colors text-base font-medium py-3"
                >
                  <Euro className="h-5 w-5" />
                  Ξεχρέωση
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
                            setSelectedPrinter("Canon Color")
                            setPrintingType("A4BW")
                            setQuantity("1")
                            setSelectedDate(new Date().toISOString().split('T')[0])
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
      .filter((u) => u.accessLevel === "Χρήστης")
                            .map((user) => ({
                              value: user.uid,
                              label: user.displayName,
                              description: `${user.displayName} (${user.username})`
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

                    {/* Row 2: Printer, Type, Quantity */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <Label htmlFor="printer" className="text-gray-700">Εκτυπωτής</Label>
                        <Select value={selectedPrinter} onValueChange={setSelectedPrinter}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {printerOptions.map((printer) => (
                              <SelectItem key={printer.value} value={printer.value}>
                                {printer.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="type" className="text-gray-700">Τύπος Εκτύπωσης</Label>
                        <Select 
                          value={printingType} 
                          onValueChange={(value: any) => setPrintingType(value)}
                          disabled={a4BWOnlyPrinters.includes(selectedPrinter)}
                        >
                          <SelectTrigger className={a4BWOnlyPrinters.includes(selectedPrinter) ? "bg-gray-100 text-gray-500" : ""}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                                             {getAvailablePrintTypes().map((type) => {
                   const isDisabled = a4BWOnlyPrinters.includes(selectedPrinter) && type !== "A4BW"
                   return (
                     <SelectItem
                       key={type}
                       value={type}
                       disabled={isDisabled}
                       className={isDisabled ? "text-gray-400" : ""}
                     >
                       {type === "A4BW" && `A4 Ασπρόμαυρο (${formatPrice(printingPrices[getPricePropertyName(type)])})`}
                       {type === "A4Color" && `A4 Έγχρωμο (${formatPrice(printingPrices[getPricePropertyName(type)])})`}
                       {type === "A3BW" && `A3 Ασπρόμαυρο (${formatPrice(printingPrices[getPricePropertyName(type)])})`}
                       {type === "A3Color" && `A3 Έγχρωμο (${formatPrice(printingPrices[getPricePropertyName(type)])})`}
                       {type === "RizochartoA3" && `Ριζόχαρτο A3 (${formatPrice(printingPrices[getPricePropertyName(type)])})`}
                       {type === "RizochartoA4" && `Ριζόχαρτο A4 (${formatPrice(printingPrices[getPricePropertyName(type)])})`}
                       {type === "ChartoniA3" && `Χαρτόνι A3 (${formatPrice(printingPrices[getPricePropertyName(type)])})`}
                       {type === "ChartoniA4" && `Χαρτόνι A4 (${formatPrice(printingPrices[getPricePropertyName(type)])})`}
                       {type === "Autokollito" && `Αυτοκόλλητο (${formatPrice(printingPrices[getPricePropertyName(type)])})`}
                     </SelectItem>
                   )
                 })}
                          </SelectContent>
                        </Select>
                        {a4BWOnlyPrinters.includes(selectedPrinter) && (
                          <p className="text-xs text-gray-500 mt-1">
                            Αυτός ο εκτυπωτής υποστηρίζει μόνο A4 Ασπρόμαυρο
                          </p>
                        )}
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
                        {formatPrice((printingPrices[getPricePropertyName(printingType)] || 0) * Number.parseInt(quantity || "0"))}
                      </div>
                    </div>

                    <Button onClick={handleAddPrinting} disabled={localLoading} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                      {localLoading ? "Προσθήκη..." : "Προσθήκη Χρέους ΤΟ. ΦΩ."}
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
      .filter((u) => u.accessLevel === "Χρήστης")
                            .map((user) => ({
                              value: user.uid,
                              label: user.displayName,
                              description: `${user.displayName} (${user.username})`
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

                    <Button onClick={handleAddLamination} disabled={localLoading} className="w-full bg-green-600 hover:bg-green-700 text-white">
                      {localLoading ? "Προσθήκη..." : "Προσθήκη Χρέους Πλαστικοποιητή"}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="debt-reduction" className="mt-8">
                <Card className="border-yellow-200">
                  <CardHeader className="bg-yellow-100">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <Euro className="h-6 w-6 text-yellow-800 flex-shrink-0" />
                        <div>
                          <CardTitle className="text-yellow-800">
                            Ξεχρέωση Χρήστη
                          </CardTitle>
                          <CardDescription className="text-yellow-600">Προσθέστε πληρωμή για μείωση χρέους χρήστη</CardDescription>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          aria-label="Επαναφορά φόρμας"
                          className="w-10 h-10 rounded-full border border-yellow-300 bg-white hover:bg-yellow-50 transition flex items-center justify-center"
                          onClick={() => {
                            setDebtReductionUser("")
                            setDebtReductionAmount("")
                            setDebtReductionDate(new Date().toISOString().split('T')[0])
                          }}
                        >
                          <RotateCcw className="h-4 w-4 text-yellow-600" />
                        </button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    {/* Row 1: User, Amount, Date */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                      <div>
                        <Label htmlFor="debt-user" className="text-gray-700">Χρήστης</Label>
                        <SearchableSelect
                          options={users
                            .filter((u) => u.accessLevel !== "Διαχειριστής")
                            .map((user) => ({
                              value: user.uid,
                              label: user.displayName,
                              description: `${user.displayName} (${user.username})`
                            }))}
                          value={debtReductionUser}
                          onValueChange={setDebtReductionUser}
                          placeholder="Επιλέξτε χρήστη"
                          searchPlaceholder="Αναζήτηση χρήστη..."
                        />
                      </div>

                      <div>
                        <Label htmlFor="debt-amount" className="text-gray-700">Ποσό Πληρωμής (€)</Label>
                        <Input
                          id="debt-amount"
                          type="number"
                           step="1"
                          min="0"
                          value={debtReductionAmount}
                          onChange={(e) => setDebtReductionAmount(e.target.value)}
                          placeholder="0,00"
                        />
                      </div>

                      <div>
                        <GreekDatePicker
                          id="debt-date"
                          label="Ημερομηνία Πληρωμής"
                          value={debtReductionDate}
                          onChange={setDebtReductionDate}
                        />
                      </div>
                    </div>

                    {/* Row 3: Current Debt Info (if user selected) */}
                    {debtReductionUser && (() => {
                      const selectedUserData = users.find((u) => u.uid === debtReductionUser)
                      const currentPrintDebt = selectedUserData?.printDebt || 0
                      const currentLaminationDebt = selectedUserData?.laminationDebt || 0
                      const currentTotalDebt = selectedUserData?.totalDebt || 0
                      const paymentAmount = parseFloat(debtReductionAmount) || 0
                      
                       // Calculate remaining debt after payment
                       // Start from current category debts and any existing credit (negative total)
                       let remainingLamination = Math.max(0, currentLaminationDebt)
                       let remainingPrint = Math.max(0, currentPrintDebt)
                       let extraCredit = currentTotalDebt < 0 ? Math.abs(currentTotalDebt) : 0
                      
                      if (paymentAmount > 0) {
                        // Apply payment to debts (lamination first, then printing)
                        let remainingPayment = paymentAmount
                        
                        // First pay lamination debt
                        if (remainingLamination > 0) {
                          const laminationPayment = Math.min(remainingPayment, remainingLamination)
                          remainingLamination -= laminationPayment
                          remainingPayment -= laminationPayment
                        }
                        
                        // Then pay printing debt with remaining amount
                        if (remainingPayment > 0 && remainingPrint > 0) {
                          const printPayment = Math.min(remainingPayment, remainingPrint)
                          remainingPrint -= printPayment
                          remainingPayment -= printPayment
                        }
                        
                         // If there's still payment remaining, increase credit (affects only total)
                         if (remainingPayment > 0) {
                           extraCredit += remainingPayment
                         }
                      }
                      
                       const remainingTotal = remainingLamination + remainingPrint - extraCredit
                      
                      return (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <Label className="text-gray-700 mb-2 block">
                            {paymentAmount !== 0 ? "Υπολειπόμενο Χρέος μετά την Πληρωμή" : "Τρέχον Χρέος"}
                          </Label>
                          <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                              <div className="text-sm text-gray-600">Εκτυπώσεις</div>
                              <div className={`text-lg font-bold ${remainingPrint <= 0 ? "text-green-600" : "text-red-600"}`}>
                                {formatPrice(remainingPrint)}
                              </div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-600">Πλαστικοποιήσεις</div>
                              <div className={`text-lg font-bold ${remainingLamination <= 0 ? "text-green-600" : "text-red-600"}`}>
                                {formatPrice(remainingLamination)}
                              </div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-600">Σύνολο</div>
                              <div className={`text-xl font-bold ${remainingTotal <= 0 ? "text-green-600" : "text-red-600"}`}>
                                {formatPrice(remainingTotal)}
                              </div>
                            </div>
                          </div>

                        </div>
                      )
                    })()}

                    <Button onClick={handleDebtReduction} disabled={debtReductionLoading} className="w-full bg-yellow-500 hover:bg-yellow-600 text-black">
                      {debtReductionLoading ? "Προσθήκη..." : "Προσθήκη Πληρωμής"}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="users" className="mt-8">
                {/* Compliance Warnings - Only show when there are issues */}
                {(() => {
                  const compliance = checkResponsiblePersonsCompliance()
                  const teamIssues = checkTeamAssignments()
                  
      if (compliance.hasIssues || teamIssues.hasIssues) {
        return (
          <div className="mb-6 space-y-4">
            {compliance.hasIssues && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-red-800">
                      Προσοχή: Λείπουν Υπεύθυνοι
                    </h3>
                    <div className="mt-2 text-sm text-red-700">
                      {compliance.tomeisWithoutYpefthynos.length > 0 && (
                        <div className="mb-2">
                          <strong>Τομείς χωρίς Υπεύθυνο:</strong>
                          <ul className="ml-4 mt-1">
                            {compliance.tomeisWithoutYpefthynos.map(user => (
                              <li key={user.uid}>• {user.displayName}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {compliance.naoiWithoutYpefthynos.length > 0 && (
                        <div>
                          <strong>Ναοί χωρίς Υπεύθυνο:</strong>
                          <ul className="ml-4 mt-1">
                            {compliance.naoiWithoutYpefthynos.map(user => (
                              <li key={user.uid}>• {user.displayName}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {teamIssues.hasIssues && (
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-orange-800">
                      Προσοχή: Προβλήματα με Ομάδες
                    </h3>
                    <div className="mt-2 text-sm text-orange-700">
                      {teamIssues.atomoUsersWithoutTeam.length > 0 && (
                        <div className="mb-2">
                          <strong>Άτομα χωρίς ομάδα:</strong>
                          <ul className="ml-4 mt-1">
                            {teamIssues.atomoUsersWithoutTeam.map(user => (
                              <li key={user.uid}>• {user.displayName}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {teamIssues.atomoUsersWithMultipleTeams.length > 0 && (
                        <div>
                          <strong>Άτομα με πολλαπλές ομάδες:</strong>
                          <ul className="ml-4 mt-1">
                            {teamIssues.atomoUsersWithMultipleTeams.map(user => (
                              <li key={user.uid}>• {user.displayName}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      }
      return null
    })()}
                
                {/* User Registration Form Card */}
                <Card className="border-yellow-200 mb-6">
                  <CardHeader className="bg-yellow-100">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <Users className="h-6 w-6 text-yellow-800 flex-shrink-0" />
                        <div>
                          <CardTitle className="text-yellow-800">
                            Προσθήκη Χρήστη
                          </CardTitle>
                          <CardDescription className="text-yellow-600">Συμπληρώστε τα στοιχεία του νέου χρήστη</CardDescription>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          aria-label="Επαναφορά φόρμας"
                          className="w-10 h-10 rounded-full border border-yellow-300 bg-white hover:bg-yellow-50 transition flex items-center justify-center"
                          onClick={handleResetUserForm}
                        >
                          <RotateCcw className="h-4 w-4 text-yellow-600" />
                        </button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="username">Username</Label>
                        <Input 
                          id="username" 
                          value={newUser.username} 
                          onChange={e => setNewUser({ ...newUser, username: e.target.value })} 
                          placeholder="Εισάγετε το username"
                        />
                      </div>
                      <div>
                        <Label htmlFor="password">Password</Label>
                        <div className="relative">
                          <Input 
                            id="password" 
                            type={showPassword ? "text" : "password"} 
                            value={newUser.password} 
                            onChange={e => setNewUser({ ...newUser, password: e.target.value })} 
                            placeholder="Εισάγετε τον κωδικό πρόσβασης"
                          />
                          <button
                            type="button"
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-gray-400" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-400" />
                            )}
                          </button>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="displayName">Όνομα</Label>
                        <Input id="displayName" value={newUser.displayName} onChange={e => setNewUser({ ...newUser, displayName: e.target.value })} placeholder="Εισάγετε το όνομα" />
                      </div>
                    </div>

                    <div className={`grid grid-cols-1 gap-4 ${
                      (newUser.userRole === "Άτομο" && newUser.accessLevel === "Υπεύθυνος") ? "md:grid-cols-4" : 
                      (newUser.userRole === "Άτομο" && newUser.accessLevel === "Διαχειριστής") ? "md:grid-cols-2" :
                      (newUser.userRole === "Άτομο" || newUser.accessLevel === "Υπεύθυνος") ? "md:grid-cols-3" : 
                      "md:grid-cols-2"
                    }`}>
                      <div>
                         <Label htmlFor="role">Επίπεδο Πρόσβασης</Label>
                        <Select value={newUser.accessLevel} onValueChange={accessLevel => {
                          const newAccessLevel = accessLevel as "Χρήστης" | "Διαχειριστής" | "Υπεύθυνος"
                          setNewUser({ 
                            ...newUser, 
                            accessLevel: newAccessLevel,
                            // Automatically set role to "Άτομο" for admin and Υπεύθυνος
                            userRole: (newAccessLevel === "Διαχειριστής" || newAccessLevel === "Υπεύθυνος") ? "Άτομο" : newUser.userRole
                          })
                        }}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                           <SelectItem value="Χρήστης">Χρήστης</SelectItem>
                            <SelectItem value="Υπεύθυνος">Υπεύθυνος</SelectItem>
                           <SelectItem value="Διαχειριστής">Διαχειριστής</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="userRole">Ρόλος</Label>
                        <Select 
                          value={newUser.userRole} 
                          onValueChange={userRole => setNewUser({ ...newUser, userRole: userRole as "Άτομο" | "Ομάδα" | "Ναός" | "Τομέας" })}
                          disabled={newUser.accessLevel === "Διαχειριστής" || newUser.accessLevel === "Υπεύθυνος"}
                        >
                          <SelectTrigger className={newUser.accessLevel === "Διαχειριστής" || newUser.accessLevel === "Υπεύθυνος" ? "bg-gray-100 text-gray-500" : ""}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Άτομο">Άτομο</SelectItem>
                            <SelectItem value="Ομάδα">Ομάδα</SelectItem>
                            <SelectItem value="Ναός">Ναός</SelectItem>
                            <SelectItem value="Τομέας">Τομέας</SelectItem>
                          </SelectContent>
                        </Select>
                        {(newUser.accessLevel === "Διαχειριστής" || newUser.accessLevel === "Υπεύθυνος") && (
                          <p className="text-xs text-gray-500 mt-1">
                            Ρόλος κλειδωμένος σε "Άτομο" για Διαχειριστές και Υπεύθυνους
                          </p>
                        )}
                      </div>

                      {newUser.userRole === "Άτομο" && newUser.accessLevel !== "Διαχειριστής" && (
                        <div>
                          <Label>Μέλος (Ομάδα/Ναός/Τομέας)</Label>
                          <TagInput
                            tags={newUser.memberOf}
                            onTagsChange={(memberOf) => setNewUser({ ...newUser, memberOf })}
                            placeholder="Προσθήκη Ομάδας/Ναού/Τομέα..."
                            availableOptions={getAvailableMembers()}
                            maxTags={5}
                          />
                        </div>
                      )}
                      
                      {newUser.accessLevel === "Υπεύθυνος" && (
                        <div>
                          <Label>Υπεύθυνος για:</Label>
                          <TagInput
                            tags={newUser.responsibleFor}
                            onTagsChange={(responsibleFor) => setNewUser({ ...newUser, responsibleFor })}
                            placeholder="Προσθήκη Ομάδας/Ναού/Τομέα..."
                            availableOptions={getAvailableResponsibleFor()}
                            maxTags={5}
                          />
                        </div>
                      )}
                    </div>
                    
                    {(newUser.userRole === "Τομέας" || newUser.userRole === "Ναός" || newUser.userRole === "Ομάδα") && (
                      <div>
                        <Label className="flex items-center gap-2">
                          Υπεύθυνοι
                          <span className="text-red-500">*</span>
                        </Label>
                        <div className="text-xs text-gray-500 mt-1 space-y-1">
                          <div>1) Οι {newUser.userRole === "Τομέας" ? "Τομείς" : newUser.userRole === "Ναός" ? "Ναοί" : "Ομάδες"} πρέπει να έχουν τουλάχιστον έναν Υπεύθυνο.</div>
                          <div>2) Οι Υπεύθυνοι πρέπει να έχουν αυτόν τον {newUser.userRole === "Τομέας" ? "Τομέα" : newUser.userRole === "Ναός" ? "Ναό" : "Ομάδα"} στη λίστα "Υπεύθυνος για".</div>
                        </div>
                      </div>
                    )}

                    <Button onClick={handleAddUser} className="w-full bg-yellow-500 hover:bg-yellow-600 text-black">
                      Προσθήκη Χρήστη
                    </Button>
                  </CardContent>
                </Card>
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
                />
              </TabsContent>


            </Tabs>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
