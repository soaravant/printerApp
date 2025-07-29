// Enhanced dummy database with additional methods for admin functionality
import { roundMoney, calculatePrintCost, calculatePrintJobTotal, multiplyMoney } from "./utils"

export interface User {
  uid: string
  username: string
  accessLevel: "user" | "admin" | "Υπεύθυνος" // Added Υπεύθυνος access level
  displayName: string
  createdAt: Date
  userRole: "Άτομο" | "Ομάδα" | "Ναός" | "Τομέας" // New field for the role selection
  responsiblePerson?: string // New field for responsible person
  team?: string // New field for team selection (now dynamic)
  memberOf?: string[] // New field for Άτομο users to show which Ομάδα/Ναός/Τομέας they belong to
  responsiblePersons?: string[] // New field for Ομάδα/Ναός/Τομέας users to show who is responsible
  responsibleFor?: string[] // New field for Υπεύθυνος users to show which Ομάδα/Ναός/Τομέας they are responsible for
}

export interface PrintJob {
  jobId: string
  uid: string
  username: string
  userDisplayName: string
  pagesA4BW: number
  pagesA4Color: number
  pagesA3BW: number
  pagesA3Color: number
  pagesRizochartoA3: number
  pagesRizochartoA4: number
  pagesChartoniA3: number
  pagesChartoniA4: number
  pagesAutokollito: number
  deviceIP: string
  deviceName: string
  timestamp: Date
  costA4BW: number
  costA4Color: number
  costA3BW: number
  costA3Color: number
  costRizochartoA3: number
  costRizochartoA4: number
  costChartoniA3: number
  costChartoniA4: number
  costAutokollito: number
  totalCost: number
  status: "completed" | "pending" | "failed"
}

export interface LaminationJob {
  jobId: string
  uid: string
  username: string
  userDisplayName: string
  type: "A3" | "A4" | "A5" | "cards" | "spiral" | "colored_cardboard" | "plastic_cover"
  quantity: number
  pricePerUnit: number
  totalCost: number
  timestamp: Date
  status: "completed" | "pending" | "failed"
  notes?: string
}

export interface PrintBilling {
  billingId: string
  uid: string
  userDisplayName: string
  period: string
  totalA4BW: number
  totalA4Color: number
  totalA3BW: number
  totalA3Color: number
  totalRizochartoA3: number
  totalRizochartoA4: number
  totalChartoniA3: number
  totalChartoniA4: number
  totalAutokollito: number
  totalCost: number
  paid: boolean
  paidDate?: Date
  paidAmount: number
  remainingBalance: number
  dueDate: Date
  generatedAt: Date
  lastUpdated: Date
  lastPayment?: Date // New field for last payment
}

export interface LaminationBilling {
  billingId: string
  uid: string
  userDisplayName: string
  period: string
  totalA3: number
  totalA4: number
  totalCardSmall: number
  totalCardLarge: number
  totalCost: number
  paid: boolean
  paidDate?: Date
  paidAmount: number
  remainingBalance: number
  dueDate: Date
  generatedAt: Date
  lastUpdated: Date
  lastPayment?: Date // New field for last payment
}

export interface PriceTable {
  id: string
  name: string
  prices: {
    [key: string]: number
  }
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Transaction {
  transactionId: string
  uid: string
  userDisplayName: string
  amount: number
  timestamp: Date
  type: "payment" | "refund"
  description?: string
  adminId: string
  adminDisplayName: string
}

class DummyDatabase {
  private users: User[] = []
  private printJobs: PrintJob[] = []
  private laminationJobs: LaminationJob[] = []
  private printBilling: PrintBilling[] = []
  private laminationBilling: LaminationBilling[] = []
  private priceTables: PriceTable[] = []
  private transactions: Transaction[] = []

  constructor() {
    this.initializeData()
  }

  private initializeData() {
    // Initialize 20 users
    const userRoles: ("Άτομο" | "Ομάδα" | "Ναός" | "Τομέας")[] = ["Άτομο", "Ομάδα", "Ναός", "Τομέας"];
    const teams: ("Ενωμένοι" | "Σποριάδες" | "Καρποφόροι" | "Ολόφωτοι" | "Νικητές" | "Νικηφόροι" | "Φλόγα" | "Σύμψυχοι")[] = ["Ενωμένοι", "Σποριάδες", "Καρποφόροι", "Ολόφωτοι", "Νικητές", "Νικηφόροι", "Φλόγα", "Σύμψυχοι"];
    
    this.users = [
      {
        uid: "admin-1",
        username: "admin",
        accessLevel: "admin",
        displayName: "Διαχειριστής",
        createdAt: new Date("2024-01-01"),
        userRole: "Άτομο",
        team: "Ενωμένοι",
      },
      // Υπεύθυνοι users
      {
        uid: "user-400",
        username: "400",
        accessLevel: "Υπεύθυνος",
        displayName: "Υπεύθυνος 400",
        createdAt: new Date("2024-01-01"),
        userRole: "Άτομο",
        team: "Ενωμένοι",
        memberOf: ["Ενωμένοι", "Ναός 1"],
        responsibleFor: ["Ενωμένοι", "Καρποφόροι", "Νικητές", "Φλόγα"],
      },
      {
        uid: "user-401",
        username: "401",
        accessLevel: "Υπεύθυνος",
        displayName: "Υπεύθυνος 401",
        createdAt: new Date("2024-01-02"),
        userRole: "Άτομο",
        team: "Σποριάδες",
        memberOf: ["Τομέας 1"],
        responsibleFor: ["Σποριάδες", "Ολόφωτοι", "Νικηφόροι"],
      },
      // Additional Υπεύθυνοι users
      {
        uid: "user-402",
        username: "402",
        accessLevel: "Υπεύθυνος",
        displayName: "Υπεύθυνος 402",
        createdAt: new Date("2024-01-03"),
        userRole: "Άτομο",
        team: "Καρποφόροι",
        memberOf: ["Ναός 2", "Τομέας 2"],
        responsibleFor: ["Καρποφόροι", "Νικητές", "Φλόγα"],
      },
      {
        uid: "user-403",
        username: "403",
        accessLevel: "Υπεύθυνος",
        displayName: "Υπεύθυνος 403",
        createdAt: new Date("2024-01-04"),
        userRole: "Άτομο",
        team: "Ολόφωτοι",
        memberOf: ["Ναός 3", "Τομέας 3"],
        responsibleFor: ["Ολόφωτοι", "Νικηφόροι", "Σύμψυχοι"],
      },
      {
        uid: "user-404",
        username: "404",
        accessLevel: "Υπεύθυνος",
        displayName: "Υπεύθυνος 404",
        createdAt: new Date("2024-01-05"),
        userRole: "Άτομο",
        team: "Νικητές",
        memberOf: ["Ναός 4", "Τομέας 4"],
        responsibleFor: ["Νικητές", "Φλόγα", "Σύμψυχοι"],
      },
      {
        uid: "user-405",
        username: "405",
        accessLevel: "Υπεύθυνος",
        displayName: "Υπεύθυνος 405",
        createdAt: new Date("2024-01-06"),
        userRole: "Άτομο",
        team: "Νικηφόροι",
        memberOf: ["Ναός 5", "Τομέας 5"],
        responsibleFor: ["Νικηφόροι", "Φλόγα", "Σύμψυχοι"],
      },
      {
        uid: "user-406",
        username: "406",
        accessLevel: "Υπεύθυνος",
        displayName: "Υπεύθυνος 406",
        createdAt: new Date("2024-01-07"),
        userRole: "Άτομο",
        team: "Φλόγα",
        memberOf: ["Ναός 1", "Τομέας 1"],
        responsibleFor: ["Φλόγα", "Σύμψυχοι", "Ενωμένοι"],
      },
      {
        uid: "user-407",
        username: "407",
        accessLevel: "Υπεύθυνος",
        displayName: "Υπεύθυνος 407",
        createdAt: new Date("2024-01-08"),
        userRole: "Άτομο",
        team: "Σύμψυχοι",
        memberOf: ["Ναός 2", "Τομέας 2"],
        responsibleFor: ["Σύμψυχοι", "Ενωμένοι", "Καρποφόροι"],
      },
      {
        uid: "user-408",
        username: "408",
        accessLevel: "Υπεύθυνος",
        displayName: "Υπεύθυνος 408",
        createdAt: new Date("2024-01-09"),
        userRole: "Άτομο",
        team: "Ενωμένοι",
        memberOf: ["Ναός 3", "Τομέας 3"],
        responsibleFor: ["Ενωμένοι", "Καρποφόροι", "Νικητές"],
      },
      {
        uid: "user-409",
        username: "409",
        accessLevel: "Υπεύθυνος",
        displayName: "Υπεύθυνος 409",
        createdAt: new Date("2024-01-10"),
        userRole: "Άτομο",
        team: "Σποριάδες",
        memberOf: ["Ναός 4", "Τομέας 4"],
        responsibleFor: ["Σποριάδες", "Ολόφωτοι", "Νικηφόροι"],
      },
      {
        uid: "user-410",
        username: "410",
        accessLevel: "Υπεύθυνος",
        displayName: "Υπεύθυνος 410",
        createdAt: new Date("2024-01-11"),
        userRole: "Άτομο",
        team: "Καρποφόροι",
        memberOf: ["Ναός 5", "Τομέας 5"],
        responsibleFor: ["Καρποφόροι", "Νικητές", "Φλόγα"],
      },
      // Regular Άτομο users
      {
        uid: "user-411",
        username: "411",
        accessLevel: "user",
        displayName: "Χρήστης 411",
        createdAt: new Date("2024-01-12"),
        userRole: "Άτομο",
        team: "Ενωμένοι",
        memberOf: ["Ενωμένοι"],
      },
      {
        uid: "user-412",
        username: "412",
        accessLevel: "user",
        displayName: "Χρήστης 412",
        createdAt: new Date("2024-01-13"),
        userRole: "Άτομο",
        team: "Ολόφωτοι",
        memberOf: ["Ολόφωτοι", "Ναός 1", "Τομέας 1"],
      },
      // Ομάδα accounts for each team
      {
        uid: "team-enwmenoi",
        username: "500",
        accessLevel: "user",
        displayName: "Ενωμένοι",
        createdAt: new Date("2024-01-05"),
        userRole: "Ομάδα",
        responsiblePerson: "Υπεύθυνος 400",
        responsiblePersons: ["Υπεύθυνος 400", "Υπεύθυνος 401"],
      },
      {
        uid: "team-sporiades",
        username: "501",
        accessLevel: "user",
        displayName: "Σποριάδες",
        createdAt: new Date("2024-01-06"),
        userRole: "Ομάδα",
        responsiblePerson: "Υπεύθυνος 401",
        responsiblePersons: ["Υπεύθυνος 401"],
      },
      {
        uid: "team-karpoforoi",
        username: "502",
        accessLevel: "user",
        displayName: "Καρποφόροι",
        createdAt: new Date("2024-01-07"),
        userRole: "Ομάδα",
        responsiblePerson: "Υπεύθυνος 400",
        responsiblePersons: ["Υπεύθυνος 400"],
      },
      {
        uid: "team-olofwtoi",
        username: "503",
        accessLevel: "user",
        displayName: "Ολόφωτοι",
        createdAt: new Date("2024-01-08"),
        userRole: "Ομάδα",
        responsiblePerson: "Υπεύθυνος 401",
        responsiblePersons: ["Υπεύθυνος 401"],
      },
      {
        uid: "team-nikhtes",
        username: "504",
        accessLevel: "user",
        displayName: "Νικητές",
        createdAt: new Date("2024-01-09"),
        userRole: "Ομάδα",
        responsiblePerson: "Υπεύθυνος 400",
        responsiblePersons: ["Υπεύθυνος 400"],
      },
      {
        uid: "team-nikhforoi",
        username: "505",
        accessLevel: "user",
        displayName: "Νικηφόροι",
        createdAt: new Date("2024-01-10"),
        userRole: "Ομάδα",
        responsiblePerson: "Υπεύθυνος 401",
        responsiblePersons: ["Υπεύθυνος 401"],
      },
      {
        uid: "team-floga",
        username: "506",
        accessLevel: "user",
        displayName: "Φλόγα",
        createdAt: new Date("2024-01-11"),
        userRole: "Ομάδα",
        responsiblePerson: "Υπεύθυνος 400",
        responsiblePersons: ["Υπεύθυνος 400"],
      },
      {
        uid: "team-sympsyxoi",
        username: "507",
        accessLevel: "user",
        displayName: "Σύμψυχοι",
        createdAt: new Date("2024-01-12"),
        userRole: "Ομάδα",
        responsiblePerson: "Υπεύθυνος 401",
        responsiblePersons: ["Υπεύθυνος 401"],
      },
      // Ναός accounts (5 total)
      {
        uid: "user-413",
        username: "413",
        accessLevel: "user",
        displayName: "Ναός 1",
        createdAt: new Date("2024-01-14"),
        userRole: "Ναός",
        responsiblePerson: "Υπεύθυνος 400",
        responsiblePersons: ["Υπεύθυνος 400", "Υπεύθυνος 406"],
      },
      {
        uid: "user-414",
        username: "414",
        accessLevel: "user",
        displayName: "Ναός 2",
        createdAt: new Date("2024-01-15"),
        userRole: "Ναός",
        responsiblePerson: "Υπεύθυνος 402",
        responsiblePersons: ["Υπεύθυνος 402", "Υπεύθυνος 407"],
      },
      {
        uid: "user-415",
        username: "415",
        accessLevel: "user",
        displayName: "Ναός 3",
        createdAt: new Date("2024-01-16"),
        userRole: "Ναός",
        responsiblePerson: "Υπεύθυνος 403",
        responsiblePersons: ["Υπεύθυνος 403", "Υπεύθυνος 408"],
      },
      {
        uid: "user-416",
        username: "416",
        accessLevel: "user",
        displayName: "Ναός 4",
        createdAt: new Date("2024-01-17"),
        userRole: "Ναός",
        responsiblePerson: "Υπεύθυνος 404",
        responsiblePersons: ["Υπεύθυνος 404", "Υπεύθυνος 409"],
      },
      {
        uid: "user-417",
        username: "417",
        accessLevel: "user",
        displayName: "Ναός 5",
        createdAt: new Date("2024-01-18"),
        userRole: "Ναός",
        responsiblePerson: "Υπεύθυνος 405",
        responsiblePersons: ["Υπεύθυνος 405", "Υπεύθυνος 410"],
      },
      // Τομέας accounts (5 total)
      {
        uid: "user-418",
        username: "418",
        accessLevel: "user",
        displayName: "Τομέας 1",
        createdAt: new Date("2024-01-19"),
        userRole: "Τομέας",
        responsiblePerson: "Υπεύθυνος 401",
        responsiblePersons: ["Υπεύθυνος 401", "Υπεύθυνος 406"],
      },
      {
        uid: "user-419",
        username: "419",
        accessLevel: "user",
        displayName: "Τομέας 2",
        createdAt: new Date("2024-01-20"),
        userRole: "Τομέας",
        responsiblePerson: "Υπεύθυνος 402",
        responsiblePersons: ["Υπεύθυνος 402", "Υπεύθυνος 407"],
      },
      {
        uid: "user-420",
        username: "420",
        accessLevel: "user",
        displayName: "Τομέας 3",
        createdAt: new Date("2024-01-21"),
        userRole: "Τομέας",
        responsiblePerson: "Υπεύθυνος 403",
        responsiblePersons: ["Υπεύθυνος 403", "Υπεύθυνος 408"],
      },
      {
        uid: "user-421",
        username: "421",
        accessLevel: "user",
        displayName: "Τομέας 4",
        createdAt: new Date("2024-01-22"),
        userRole: "Τομέας",
        responsiblePerson: "Υπεύθυνος 404",
        responsiblePersons: ["Υπεύθυνος 404", "Υπεύθυνος 409"],
      },
      {
        uid: "user-422",
        username: "422",
        accessLevel: "user",
        displayName: "Τομέας 5",
        createdAt: new Date("2024-01-23"),
        userRole: "Τομέας",
        responsiblePerson: "Υπεύθυνος 405",
        responsiblePersons: ["Υπεύθυνος 405", "Υπεύθυνος 410"],
      },
      // Additional Individual Users (Άτομο) - Each belongs to exactly one team, one ναός, and one τομέας
      {
        uid: "user-423",
        username: "423",
        accessLevel: "user",
        displayName: "Χρήστης 423",
        createdAt: new Date("2024-01-24"),
        userRole: "Άτομο",
        memberOf: ["Ενωμένοι", "Ναός 1", "Τομέας 1"],
      },
      {
        uid: "user-424",
        username: "424",
        accessLevel: "user",
        displayName: "Χρήστης 424",
        createdAt: new Date("2024-01-25"),
        userRole: "Άτομο",
        memberOf: ["Σποριάδες", "Ναός 2", "Τομέας 2"],
      },
      {
        uid: "user-425",
        username: "425",
        accessLevel: "user",
        displayName: "Χρήστης 425",
        createdAt: new Date("2024-01-26"),
        userRole: "Άτομο",
        memberOf: ["Καρποφόροι", "Ναός 3", "Τομέας 3"],
      },
      {
        uid: "user-426",
        username: "426",
        accessLevel: "user",
        displayName: "Χρήστης 426",
        createdAt: new Date("2024-01-27"),
        userRole: "Άτομο",
        memberOf: ["Ολόφωτοι", "Ναός 4", "Τομέας 4"],
      },
      {
        uid: "user-427",
        username: "427",
        accessLevel: "user",
        displayName: "Χρήστης 427",
        createdAt: new Date("2024-01-28"),
        userRole: "Άτομο",
        memberOf: ["Νικητές", "Ναός 5", "Τομέας 5"],
      },
      {
        uid: "user-428",
        username: "428",
        accessLevel: "user",
        displayName: "Χρήστης 428",
        createdAt: new Date("2024-01-29"),
        userRole: "Άτομο",
        memberOf: ["Νικηφόροι", "Ναός 1", "Τομέας 2"],
      },
      {
        uid: "user-429",
        username: "429",
        accessLevel: "user",
        displayName: "Χρήστης 429",
        createdAt: new Date("2024-01-30"),
        userRole: "Άτομο",
        memberOf: ["Φλόγα", "Ναός 2", "Τομέας 3"],
      },
      {
        uid: "user-430",
        username: "430",
        accessLevel: "user",
        displayName: "Χρήστης 430",
        createdAt: new Date("2024-01-31"),
        userRole: "Άτομο",
        memberOf: ["Σύμψυχοι", "Ναός 3", "Τομέας 4"],
      },
      {
        uid: "user-431",
        username: "431",
        accessLevel: "user",
        displayName: "Χρήστης 431",
        createdAt: new Date("2024-02-01"),
        userRole: "Άτομο",
        memberOf: ["Ενωμένοι", "Ναός 4", "Τομέας 5"],
      },
      {
        uid: "user-432",
        username: "432",
        accessLevel: "user",
        displayName: "Χρήστης 432",
        createdAt: new Date("2024-02-02"),
        userRole: "Άτομο",
        memberOf: ["Σποριάδες", "Ναός 5", "Τομέας 1"],
      },
      {
        uid: "user-433",
        username: "433",
        accessLevel: "user",
        displayName: "Χρήστης 433",
        createdAt: new Date("2024-02-03"),
        userRole: "Άτομο",
        memberOf: ["Καρποφόροι", "Ναός 1", "Τομέας 3"],
      },
      {
        uid: "user-434",
        username: "434",
        accessLevel: "user",
        displayName: "Χρήστης 434",
        createdAt: new Date("2024-02-04"),
        userRole: "Άτομο",
        memberOf: ["Ολόφωτοι", "Ναός 2", "Τομέας 4"],
      },
      {
        uid: "user-435",
        username: "435",
        accessLevel: "user",
        displayName: "Χρήστης 435",
        createdAt: new Date("2024-02-05"),
        userRole: "Άτομο",
        memberOf: ["Νικητές", "Ναός 3", "Τομέας 5"],
      },
      {
        uid: "user-436",
        username: "436",
        accessLevel: "user",
        displayName: "Χρήστης 436",
        createdAt: new Date("2024-02-06"),
        userRole: "Άτομο",
        memberOf: ["Νικηφόροι", "Ναός 4", "Τομέας 1"],
      },
      {
        uid: "user-437",
        username: "437",
        accessLevel: "user",
        displayName: "Χρήστης 437",
        createdAt: new Date("2024-02-07"),
        userRole: "Άτομο",
        memberOf: ["Φλόγα", "Ναός 5", "Τομέας 2"],
      },
      {
        uid: "user-438",
        username: "438",
        accessLevel: "user",
        displayName: "Χρήστης 438",
        createdAt: new Date("2024-02-08"),
        userRole: "Άτομο",
        memberOf: ["Σύμψυχοι", "Ναός 1", "Τομέας 3"],
      },
      {
        uid: "user-439",
        username: "439",
        accessLevel: "user",
        displayName: "Χρήστης 439",
        createdAt: new Date("2024-02-09"),
        userRole: "Άτομο",
        memberOf: ["Ενωμένοι", "Ναός 2", "Τομέας 4"],
      },
      {
        uid: "user-440",
        username: "440",
        accessLevel: "user",
        displayName: "Χρήστης 440",
        createdAt: new Date("2024-02-10"),
        userRole: "Άτομο",
        memberOf: ["Σποριάδες", "Ναός 3", "Τομέας 5"],
      },
      {
        uid: "user-441",
        username: "441",
        accessLevel: "user",
        displayName: "Χρήστης 441",
        createdAt: new Date("2024-02-11"),
        userRole: "Άτομο",
        memberOf: ["Καρποφόροι", "Ναός 4", "Τομέας 1"],
      },
      {
        uid: "user-442",
        username: "442",
        accessLevel: "user",
        displayName: "Χρήστης 442",
        createdAt: new Date("2024-02-12"),
        userRole: "Άτομο",
        memberOf: ["Ολόφωτοι", "Ναός 5", "Τομέας 2"],
      },
      {
        uid: "user-443",
        username: "443",
        accessLevel: "user",
        displayName: "Χρήστης 443",
        createdAt: new Date("2024-02-13"),
        userRole: "Άτομο",
        memberOf: ["Νικητές", "Ναός 1", "Τομέας 3"],
      },
      {
        uid: "user-444",
        username: "444",
        accessLevel: "user",
        displayName: "Χρήστης 444",
        createdAt: new Date("2024-02-14"),
        userRole: "Άτομο",
        memberOf: ["Νικηφόροι", "Ναός 2", "Τομέας 4"],
      },
      {
        uid: "user-445",
        username: "445",
        accessLevel: "user",
        displayName: "Χρήστης 445",
        createdAt: new Date("2024-02-15"),
        userRole: "Άτομο",
        memberOf: ["Φλόγα", "Ναός 3", "Τομέας 5"],
      },
      {
        uid: "user-446",
        username: "446",
        accessLevel: "user",
        displayName: "Χρήστης 446",
        createdAt: new Date("2024-02-16"),
        userRole: "Άτομο",
        memberOf: ["Σύμψυχοι", "Ναός 4", "Τομέας 1"],
      },
      {
        uid: "user-447",
        username: "447",
        accessLevel: "user",
        displayName: "Χρήστης 447",
        createdAt: new Date("2024-02-17"),
        userRole: "Άτομο",
        memberOf: ["Ενωμένοι", "Ναός 5", "Τομέας 2"],
      },
      {
        uid: "user-448",
        username: "448",
        accessLevel: "user",
        displayName: "Χρήστης 448",
        createdAt: new Date("2024-02-18"),
        userRole: "Άτομο",
        memberOf: ["Σποριάδες", "Ναός 1", "Τομέας 3"],
      },
      {
        uid: "user-449",
        username: "449",
        accessLevel: "user",
        displayName: "Χρήστης 449",
        createdAt: new Date("2024-02-19"),
        userRole: "Άτομο",
        memberOf: ["Καρποφόροι", "Ναός 2", "Τομέας 4"],
      },
      {
        uid: "user-450",
        username: "450",
        accessLevel: "user",
        displayName: "Χρήστης 450",
        createdAt: new Date("2024-02-20"),
        userRole: "Άτομο",
        memberOf: ["Ολόφωτοι", "Ναός 3", "Τομέας 5"],
      },
      {
        uid: "user-451",
        username: "451",
        accessLevel: "user",
        displayName: "Χρήστης 451",
        createdAt: new Date("2024-02-21"),
        userRole: "Άτομο",
        memberOf: ["Νικητές", "Ναός 4", "Τομέας 1"],
      },
      {
        uid: "user-452",
        username: "452",
        accessLevel: "user",
        displayName: "Χρήστης 452",
        createdAt: new Date("2024-02-22"),
        userRole: "Άτομο",
        memberOf: ["Νικηφόροι", "Ναός 5", "Τομέας 2"],
      },
      {
        uid: "user-453",
        username: "453",
        accessLevel: "user",
        displayName: "Χρήστης 453",
        createdAt: new Date("2024-02-23"),
        userRole: "Άτομο",
        memberOf: ["Φλόγα", "Ναός 1", "Τομέας 3"],
      },
      {
        uid: "user-454",
        username: "454",
        accessLevel: "user",
        displayName: "Χρήστης 454",
        createdAt: new Date("2024-02-24"),
        userRole: "Άτομο",
        memberOf: ["Σύμψυχοι", "Ναός 2", "Τομέας 4"],
      },
      {
        uid: "user-455",
        username: "455",
        accessLevel: "user",
        displayName: "Χρήστης 455",
        createdAt: new Date("2024-02-25"),
        userRole: "Άτομο",
        memberOf: ["Ενωμένοι", "Ναός 3", "Τομέας 5"],
      },
      {
        uid: "user-456",
        username: "456",
        accessLevel: "user",
        displayName: "Χρήστης 456",
        createdAt: new Date("2024-02-26"),
        userRole: "Άτομο",
        memberOf: ["Σποριάδες", "Ναός 4", "Τομέας 1"],
      },
      {
        uid: "user-457",
        username: "457",
        accessLevel: "user",
        displayName: "Χρήστης 457",
        createdAt: new Date("2024-02-27"),
        userRole: "Άτομο",
        memberOf: ["Καρποφόροι", "Ναός 5", "Τομέας 2"],
      },
      {
        uid: "user-458",
        username: "458",
        accessLevel: "user",
        displayName: "Χρήστης 458",
        createdAt: new Date("2024-02-28"),
        userRole: "Άτομο",
        memberOf: ["Ολόφωτοι", "Ναός 1", "Τομέας 3"],
      },
      {
        uid: "user-459",
        username: "459",
        accessLevel: "user",
        displayName: "Χρήστης 459",
        createdAt: new Date("2024-02-29"),
        userRole: "Άτομο",
        memberOf: ["Νικητές", "Ναός 2", "Τομέας 4"],
      },
      {
        uid: "user-460",
        username: "460",
        accessLevel: "user",
        displayName: "Χρήστης 460",
        createdAt: new Date("2024-03-01"),
        userRole: "Άτομο",
        memberOf: ["Νικηφόροι", "Ναός 3", "Τομέας 5"],
      },
      {
        uid: "user-461",
        username: "461",
        accessLevel: "user",
        displayName: "Χρήστης 461",
        createdAt: new Date("2024-03-02"),
        userRole: "Άτομο",
        memberOf: ["Φλόγα", "Ναός 4", "Τομέας 1"],
      },
      {
        uid: "user-462",
        username: "462",
        accessLevel: "user",
        displayName: "Χρήστης 462",
        createdAt: new Date("2024-03-03"),
        userRole: "Άτομο",
        memberOf: ["Σύμψυχοι", "Ναός 5", "Τομέας 2"],
      },
      {
        uid: "user-463",
        username: "463",
        accessLevel: "user",
        displayName: "Χρήστης 463",
        createdAt: new Date("2024-03-04"),
        userRole: "Άτομο",
        memberOf: ["Ενωμένοι", "Ναός 1", "Τομέας 3"],
      },
      {
        uid: "user-464",
        username: "464",
        accessLevel: "user",
        displayName: "Χρήστης 464",
        createdAt: new Date("2024-03-05"),
        userRole: "Άτομο",
        memberOf: ["Σποριάδες", "Ναός 2", "Τομέας 4"],
      },
      {
        uid: "user-465",
        username: "465",
        accessLevel: "user",
        displayName: "Χρήστης 465",
        createdAt: new Date("2024-03-06"),
        userRole: "Άτομο",
        memberOf: ["Καρποφόροι", "Ναός 3", "Τομέας 5"],
      },
      {
        uid: "user-466",
        username: "466",
        accessLevel: "user",
        displayName: "Χρήστης 466",
        createdAt: new Date("2024-03-07"),
        userRole: "Άτομο",
        memberOf: ["Ολόφωτοι", "Ναός 4", "Τομέας 1"],
      },
      {
        uid: "user-467",
        username: "467",
        accessLevel: "user",
        displayName: "Χρήστης 467",
        createdAt: new Date("2024-03-08"),
        userRole: "Άτομο",
        memberOf: ["Νικητές", "Ναός 5", "Τομέας 2"],
      },
      {
        uid: "user-468",
        username: "468",
        accessLevel: "user",
        displayName: "Χρήστης 468",
        createdAt: new Date("2024-03-09"),
        userRole: "Άτομο",
        memberOf: ["Νικηφόροι", "Ναός 1", "Τομέας 3"],
      },
      {
        uid: "user-469",
        username: "469",
        accessLevel: "user",
        displayName: "Χρήστης 469",
        createdAt: new Date("2024-03-10"),
        userRole: "Άτομο",
        memberOf: ["Φλόγα", "Ναός 2", "Τομέας 4"],
      },
      {
        uid: "user-470",
        username: "470",
        accessLevel: "user",
        displayName: "Χρήστης 470",
        createdAt: new Date("2024-03-11"),
        userRole: "Άτομο",
        memberOf: ["Σύμψυχοι", "Ναός 3", "Τομέας 5"],
      },
      {
        uid: "user-471",
        username: "471",
        accessLevel: "user",
        displayName: "Χρήστης 471",
        createdAt: new Date("2024-03-12"),
        userRole: "Άτομο",
        memberOf: ["Ενωμένοι", "Ναός 4", "Τομέας 1"],
      },
      {
        uid: "user-472",
        username: "472",
        accessLevel: "user",
        displayName: "Χρήστης 472",
        createdAt: new Date("2024-03-13"),
        userRole: "Άτομο",
        memberOf: ["Σποριάδες", "Ναός 5", "Τομέας 2"],
      },
      {
        uid: "user-473",
        username: "473",
        accessLevel: "user",
        displayName: "Χρήστης 473",
        createdAt: new Date("2024-03-14"),
        userRole: "Άτομο",
        memberOf: ["Καρποφόροι", "Ναός 1", "Τομέας 3"],
      },
      {
        uid: "user-474",
        username: "474",
        accessLevel: "user",
        displayName: "Χρήστης 474",
        createdAt: new Date("2024-03-15"),
        userRole: "Άτομο",
        memberOf: ["Ολόφωτοι", "Ναός 2", "Τομέας 4"],
      },
      {
        uid: "user-475",
        username: "475",
        accessLevel: "user",
        displayName: "Χρήστης 475",
        createdAt: new Date("2024-03-16"),
        userRole: "Άτομο",
        memberOf: ["Νικητές", "Ναός 3", "Τομέας 5"],
      },
      {
        uid: "user-476",
        username: "476",
        accessLevel: "user",
        displayName: "Χρήστης 476",
        createdAt: new Date("2024-03-17"),
        userRole: "Άτομο",
        memberOf: ["Νικηφόροι", "Ναός 4", "Τομέας 1"],
      },
      {
        uid: "user-477",
        username: "477",
        accessLevel: "user",
        displayName: "Χρήστης 477",
        createdAt: new Date("2024-03-18"),
        userRole: "Άτομο",
        memberOf: ["Φλόγα", "Ναός 5", "Τομέας 2"],
      },
      {
        uid: "user-478",
        username: "478",
        accessLevel: "user",
        displayName: "Χρήστης 478",
        createdAt: new Date("2024-03-19"),
        userRole: "Άτομο",
        memberOf: ["Σύμψυχοι", "Ναός 1", "Τομέας 3"],
      },
      {
        uid: "user-479",
        username: "479",
        accessLevel: "user",
        displayName: "Χρήστης 479",
        createdAt: new Date("2024-03-20"),
        userRole: "Άτομο",
        memberOf: ["Ενωμένοι", "Ναός 2", "Τομέας 4"],
      },
      {
        uid: "user-480",
        username: "480",
        accessLevel: "user",
        displayName: "Χρήστης 480",
        createdAt: new Date("2024-03-21"),
        userRole: "Άτομο",
        memberOf: ["Σποριάδες", "Ναός 3", "Τομέας 5"],
      },
      {
        uid: "user-481",
        username: "481",
        accessLevel: "user",
        displayName: "Χρήστης 481",
        createdAt: new Date("2024-03-22"),
        userRole: "Άτομο",
        memberOf: ["Καρποφόροι", "Ναός 4", "Τομέας 1"],
      },
      {
        uid: "user-482",
        username: "482",
        accessLevel: "user",
        displayName: "Χρήστης 482",
        createdAt: new Date("2024-03-23"),
        userRole: "Άτομο",
        memberOf: ["Ολόφωτοι", "Ναός 5", "Τομέας 2"],
      },
      {
        uid: "user-483",
        username: "483",
        accessLevel: "user",
        displayName: "Χρήστης 483",
        createdAt: new Date("2024-03-24"),
        userRole: "Άτομο",
        memberOf: ["Νικητές", "Ναός 1", "Τομέας 3"],
      },
      {
        uid: "user-484",
        username: "484",
        accessLevel: "user",
        displayName: "Χρήστης 484",
        createdAt: new Date("2024-03-25"),
        userRole: "Άτομο",
        memberOf: ["Νικηφόροι", "Ναός 2", "Τομέας 4"],
      },
      {
        uid: "user-485",
        username: "485",
        accessLevel: "user",
        displayName: "Χρήστης 485",
        createdAt: new Date("2024-03-26"),
        userRole: "Άτομο",
        memberOf: ["Φλόγα", "Ναός 3", "Τομέας 5"],
      },
      {
        uid: "user-486",
        username: "486",
        accessLevel: "user",
        displayName: "Χρήστης 486",
        createdAt: new Date("2024-03-27"),
        userRole: "Άτομο",
        memberOf: ["Σύμψυχοι", "Ναός 4", "Τομέας 1"],
      },
      {
        uid: "user-487",
        username: "487",
        accessLevel: "user",
        displayName: "Χρήστης 487",
        createdAt: new Date("2024-03-28"),
        userRole: "Άτομο",
        memberOf: ["Ενωμένοι", "Ναός 5", "Τομέας 2"],
      },
      {
        uid: "user-488",
        username: "488",
        accessLevel: "user",
        displayName: "Χρήστης 488",
        createdAt: new Date("2024-03-29"),
        userRole: "Άτομο",
        memberOf: ["Σποριάδες", "Ναός 1", "Τομέας 3"],
      },
      {
        uid: "user-489",
        username: "489",
        accessLevel: "user",
        displayName: "Χρήστης 489",
        createdAt: new Date("2024-03-30"),
        userRole: "Άτομο",
        memberOf: ["Καρποφόροι", "Ναός 2", "Τομέας 4"],
      },
      {
        uid: "user-490",
        username: "490",
        accessLevel: "user",
        displayName: "Χρήστης 490",
        createdAt: new Date("2024-03-31"),
        userRole: "Άτομο",
        memberOf: ["Ολόφωτοι", "Ναός 3", "Τομέας 5"],
      },
      {
        uid: "user-491",
        username: "491",
        accessLevel: "user",
        displayName: "Χρήστης 491",
        createdAt: new Date("2024-04-01"),
        userRole: "Άτομο",
        memberOf: ["Νικητές", "Ναός 4", "Τομέας 1"],
      },
      {
        uid: "user-492",
        username: "492",
        accessLevel: "user",
        displayName: "Χρήστης 492",
        createdAt: new Date("2024-04-02"),
        userRole: "Άτομο",
        memberOf: ["Νικηφόροι", "Ναός 5", "Τομέας 2"],
      },
      {
        uid: "user-493",
        username: "493",
        accessLevel: "user",
        displayName: "Χρήστης 493",
        createdAt: new Date("2024-04-03"),
        userRole: "Άτομο",
        memberOf: ["Φλόγα", "Ναός 1", "Τομέας 3"],
      },
      {
        uid: "user-494",
        username: "494",
        accessLevel: "user",
        displayName: "Χρήστης 494",
        createdAt: new Date("2024-04-04"),
        userRole: "Άτομο",
        memberOf: ["Σύμψυχοι", "Ναός 2", "Τομέας 4"],
      },
      {
        uid: "user-495",
        username: "495",
        accessLevel: "user",
        displayName: "Χρήστης 495",
        createdAt: new Date("2024-04-05"),
        userRole: "Άτομο",
        memberOf: ["Ενωμένοι", "Ναός 3", "Τομέας 5"],
      },
      {
        uid: "user-496",
        username: "496",
        accessLevel: "user",
        displayName: "Χρήστης 496",
        createdAt: new Date("2024-04-06"),
        userRole: "Άτομο",
        memberOf: ["Σποριάδες", "Ναός 4", "Τομέας 1"],
      },
      {
        uid: "user-497",
        username: "497",
        accessLevel: "user",
        displayName: "Χρήστης 497",
        createdAt: new Date("2024-04-07"),
        userRole: "Άτομο",
        memberOf: ["Καρποφόροι", "Ναός 5", "Τομέας 2"],
      },
      {
        uid: "user-498",
        username: "498",
        accessLevel: "user",
        displayName: "Χρήστης 498",
        createdAt: new Date("2024-04-08"),
        userRole: "Άτομο",
        memberOf: ["Ολόφωτοι", "Ναός 1", "Τομέας 3"],
      },
      {
        uid: "user-499",
        username: "499",
        accessLevel: "user",
        displayName: "Χρήστης 499",
        createdAt: new Date("2024-04-09"),
        userRole: "Άτομο",
        memberOf: ["Νικητές", "Ναός 2", "Τομέας 4"],
      },
    ];

    // Initialize price tables (unchanged)
    this.priceTables = [
      {
        id: "printing",
        name: "Εκτυπώσεις",
        prices: {
          a4BW: 0.05,
          a4Color: 0.25,
          a3BW: 0.1,
          a3Color: 0.5,
          rizochartoA3: 0.2,
          rizochartoA4: 0.15,
          chartoniA3: 0.2,
          chartoniA4: 0.15,
          autokollito: 0.1,
        },
        isActive: true,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
      },
      {
        id: "lamination",
        name: "Πλαστικοποιήσεις",
        prices: {
          A3: 0.4,
          A4: 0.2,
          A5: 0.1,
          cards: 0.02,
          spiral: 0.15,
          colored_cardboard: 0.1,
          plastic_cover: 0.15,
        },
        isActive: true,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
      },
    ];

    // Generate sample data
    this.generateSampleData();
  }

  private getRandomPrinterName(): string {
    const printers = ["Canon Colour", "Canon B/W", "Brother"];
    return printers[Math.floor(Math.random() * printers.length)];
  }

  private generateSampleData() {
    const now = new Date();
    const userIds = this.users.filter((u) => u.accessLevel === "user" || u.accessLevel === "Υπεύθυνος").map((u) => u.uid);

    // Generate print and lamination jobs for the last 6 months
    for (let monthOffset = 0; monthOffset < 6; monthOffset++) {
      for (const userId of userIds) {
        const user = this.users.find((u) => u.uid === userId)!;
        // 10-20 print jobs per user per month
        const jobsCount = Math.floor(Math.random() * 11) + 10;
        for (let i = 0; i < jobsCount; i++) {
          const jobDate = new Date(now.getFullYear(), now.getMonth() - monthOffset, Math.floor(Math.random() * 28) + 1);
          const deviceName = this.getRandomPrinterName();
          
          // Initialize print job with device name first
          const printJob: PrintJob = {
            jobId: `print-${userId}-${monthOffset}-${i}`,
            uid: userId,
            username: user.username,
            userDisplayName: user.displayName,
            pagesA4BW: 0,
            pagesA4Color: 0,
            pagesA3BW: 0,
            pagesA3Color: 0,
            pagesRizochartoA3: 0,
            pagesRizochartoA4: 0,
            pagesChartoniA3: 0,
            pagesChartoniA4: 0,
            pagesAutokollito: 0,
            deviceIP: `192.168.1.${100 + Math.floor(Math.random() * 3)}`,
            deviceName: deviceName,
            timestamp: jobDate,
            costA4BW: 0,
            costA4Color: 0,
            costA3BW: 0,
            costA3Color: 0,
            costRizochartoA3: 0,
            costRizochartoA4: 0,
            costChartoniA3: 0,
            costChartoniA4: 0,
            costAutokollito: 0,
            totalCost: 0,
            status: "completed",
          };

          // Generate pages based on printer capabilities
          if (deviceName === "Canon Colour") {
            // Canon Colour can print everything
            printJob.pagesA4BW = Math.floor(Math.random() * 8) + 1; // 1-8
            printJob.pagesA4Color = Math.floor(Math.random() * 4);   // 0-3
            printJob.pagesA3BW = Math.floor(Math.random() * 3);      // 0-2
            printJob.pagesA3Color = Math.floor(Math.random() * 2);   // 0-1
            printJob.pagesRizochartoA3 = Math.floor(Math.random() * 3); // 0-2
            printJob.pagesRizochartoA4 = Math.floor(Math.random() * 4); // 0-3
            printJob.pagesChartoniA3 = Math.floor(Math.random() * 3); // 0-2
            printJob.pagesChartoniA4 = Math.floor(Math.random() * 4); // 0-3
            printJob.pagesAutokollito = Math.floor(Math.random() * 5); // 0-4
          } else if (deviceName === "Canon B/W" || deviceName === "Brother") {
            // Canon B/W and Brother can only print A4 B/W
            printJob.pagesA4BW = Math.floor(Math.random() * 8) + 1; // 1-8
            // All other page types remain 0
          }

          // Calculate costs with proper money rounding
          const prices = this.priceTables.find((p) => p.id === "printing")?.prices || {};
          printJob.costA4BW = calculatePrintCost(printJob.pagesA4BW, prices.a4BW || 0);
          printJob.costA4Color = calculatePrintCost(printJob.pagesA4Color, prices.a4Color || 0);
          printJob.costA3BW = calculatePrintCost(printJob.pagesA3BW, prices.a3BW || 0);
          printJob.costA3Color = calculatePrintCost(printJob.pagesA3Color, prices.a3Color || 0);
          printJob.costRizochartoA3 = calculatePrintCost(printJob.pagesRizochartoA3, prices.rizochartoA3 || 0);
          printJob.costRizochartoA4 = calculatePrintCost(printJob.pagesRizochartoA4, prices.rizochartoA4 || 0);
          printJob.costChartoniA3 = calculatePrintCost(printJob.pagesChartoniA3, prices.chartoniA3 || 0);
          printJob.costChartoniA4 = calculatePrintCost(printJob.pagesChartoniA4, prices.chartoniA4 || 0);
          printJob.costAutokollito = calculatePrintCost(printJob.pagesAutokollito, prices.autokollito || 0);
          printJob.totalCost = calculatePrintJobTotal({
            costA4BW: printJob.costA4BW,
            costA4Color: printJob.costA4Color,
            costA3BW: printJob.costA3BW,
            costA3Color: printJob.costA3Color,
            costRizochartoA3: printJob.costRizochartoA3,
            costRizochartoA4: printJob.costRizochartoA4,
            costChartoniA3: printJob.costChartoniA3,
            costChartoniA4: printJob.costChartoniA4,
            costAutokollito: printJob.costAutokollito
          });
          this.printJobs.push(printJob);
        }
        // 3-8 lamination jobs per user per month
        const laminationJobsCount = Math.floor(Math.random() * 6) + 3;
        for (let i = 0; i < laminationJobsCount; i++) {
          const jobDate = new Date(now.getFullYear(), now.getMonth() - monthOffset, Math.floor(Math.random() * 28) + 1);
          const types: ("A3" | "A4" | "A5" | "cards" | "spiral" | "colored_cardboard" | "plastic_cover")[] = ["A3", "A4", "A5", "cards", "spiral", "colored_cardboard", "plastic_cover"];
          const type = types[Math.floor(Math.random() * types.length)];
          const quantity = Math.floor(Math.random() * 3) + 1; // 1-3
          const prices = this.priceTables.find((p) => p.id === "lamination")?.prices || {};
          const pricePerUnit = prices[type] || 0;
          const laminationJob: LaminationJob = {
            jobId: `lamination-${userId}-${monthOffset}-${i}`,
            uid: userId,
            username: user.username,
            userDisplayName: user.displayName,
            type,
            quantity,
            pricePerUnit,
            totalCost: multiplyMoney(pricePerUnit, quantity),
            timestamp: jobDate,
            status: "completed",
            notes: Math.random() > 0.7 ? "Επείγον" : undefined,
          };
          this.laminationJobs.push(laminationJob);
        }
      }
    }
    // Generate billing records
    this.generateBillingRecords();
  }

  private generateBillingRecords() {
    const userIds = this.users.filter((u) => u.accessLevel === "user" || u.accessLevel === "Υπεύθυνος").map((u) => u.uid)
    const now = new Date()

    for (let monthOffset = 0; monthOffset < 3; monthOffset++) {
      const periodDate = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1)
      const period = periodDate.toISOString().slice(0, 7)

      for (const userId of userIds) {
        const user = this.users.find((u) => u.uid === userId)!

        // Print billing
        const monthPrintJobs = this.printJobs.filter(
          (j) => j.uid === userId && j.timestamp.toISOString().slice(0, 7) === period,
        )

        if (monthPrintJobs.length > 0) {
                  const totalA4BW = monthPrintJobs.reduce((sum, j) => sum + j.pagesA4BW, 0)
        const totalA4Color = monthPrintJobs.reduce((sum, j) => sum + j.pagesA4Color, 0)
        const totalA3BW = monthPrintJobs.reduce((sum, j) => sum + j.pagesA3BW, 0)
        const totalA3Color = monthPrintJobs.reduce((sum, j) => sum + j.pagesA3Color, 0)
        const totalRizochartoA3 = monthPrintJobs.reduce((sum, j) => sum + j.pagesRizochartoA3, 0)
        const totalRizochartoA4 = monthPrintJobs.reduce((sum, j) => sum + j.pagesRizochartoA4, 0)
        const totalChartoniA3 = monthPrintJobs.reduce((sum, j) => sum + j.pagesChartoniA3, 0)
        const totalChartoniA4 = monthPrintJobs.reduce((sum, j) => sum + j.pagesChartoniA4, 0)
        const totalAutokollito = monthPrintJobs.reduce((sum, j) => sum + j.pagesAutokollito, 0)
        const totalCost = roundMoney(monthPrintJobs.reduce((sum, j) => sum + j.totalCost, 0))

          const isPaid = Math.random() > 0.75
          const paidAmount = isPaid ? totalCost : roundMoney(Math.random() * totalCost)

          // Always generate a last payment date
          // For paid bills: use the paid date
          // For unpaid bills: use a date when partial payment was made (if any payment was made)
          const hasPartialPayment = paidAmount > 0
          const lastPaymentDate = isPaid 
            ? new Date(periodDate.getTime() + 15 * 24 * 60 * 60 * 1000) // Full payment date
            : hasPartialPayment 
              ? new Date(periodDate.getTime() + 10 * 24 * 60 * 60 * 1000) // Partial payment date
              : new Date(periodDate.getTime() - 30 * 24 * 60 * 60 * 1000) // Previous payment date

          const printBilling: PrintBilling = {
            billingId: `print-billing-${userId}-${period}`,
            uid: userId,
            userDisplayName: user.displayName,
            period,
            totalA4BW,
            totalA4Color,
            totalA3BW,
            totalA3Color,
            totalRizochartoA3,
            totalRizochartoA4,
            totalChartoniA3,
            totalChartoniA4,
            totalAutokollito,
            totalCost,
            paid: isPaid,
            paidDate: isPaid ? new Date(periodDate.getTime() + 15 * 24 * 60 * 60 * 1000) : undefined,
            paidAmount,
            remainingBalance: roundMoney(totalCost - paidAmount),
            dueDate: new Date(periodDate.getTime() + 30 * 24 * 60 * 60 * 1000),
            generatedAt: new Date(periodDate.getTime() + 5 * 24 * 60 * 60 * 1000),
            lastUpdated: new Date(),
            lastPayment: lastPaymentDate,
          }

          this.printBilling.push(printBilling)
        }

        // Lamination billing
        const monthLaminationJobs = this.laminationJobs.filter(
          (j) => j.uid === userId && j.timestamp.toISOString().slice(0, 7) === period,
        )

        if (monthLaminationJobs.length > 0) {
          const totalA3 = monthLaminationJobs.filter((j) => j.type === "A3").reduce((sum, j) => sum + j.quantity, 0)
          const totalA4 = monthLaminationJobs.filter((j) => j.type === "A4").reduce((sum, j) => sum + j.quantity, 0)
          const totalCardSmall = monthLaminationJobs
            .filter((j) => j.type === "cards")
            .reduce((sum, j) => sum + j.quantity, 0)
          const totalCardLarge = monthLaminationJobs
            .filter((j) => j.type === "cards")
            .reduce((sum, j) => sum + j.quantity, 0)
          const totalCost = roundMoney(monthLaminationJobs.reduce((sum, j) => sum + j.totalCost, 0))

          const isPaid = Math.random() > 0.75
          const paidAmount = isPaid ? totalCost : roundMoney(Math.random() * totalCost)

          // Always generate a last payment date
          // For paid bills: use the paid date
          // For unpaid bills: use a date when partial payment was made (if any payment was made)
          const hasPartialPayment = paidAmount > 0
          const lastPaymentDate = isPaid 
            ? new Date(periodDate.getTime() + 15 * 24 * 60 * 60 * 1000) // Full payment date
            : hasPartialPayment 
              ? new Date(periodDate.getTime() + 10 * 24 * 60 * 60 * 1000) // Partial payment date
              : new Date(periodDate.getTime() - 30 * 24 * 60 * 60 * 1000) // Previous payment date

          const laminationBilling: LaminationBilling = {
            billingId: `lamination-billing-${userId}-${period}`,
            uid: userId,
            userDisplayName: user.displayName,
            period,
            totalA3,
            totalA4,
            totalCardSmall,
            totalCardLarge,
            totalCost,
            paid: isPaid,
            paidDate: isPaid ? new Date(periodDate.getTime() + 15 * 24 * 60 * 60 * 1000) : undefined,
            paidAmount,
            remainingBalance: roundMoney(totalCost - paidAmount),
            dueDate: new Date(periodDate.getTime() + 30 * 24 * 60 * 60 * 1000),
            generatedAt: new Date(periodDate.getTime() + 5 * 24 * 60 * 60 * 1000),
            lastUpdated: new Date(),
            lastPayment: lastPaymentDate,
          }

          this.laminationBilling.push(laminationBilling)
        }
      }
    }
  }

  // User methods
  getUsers(): User[] {
    return [...this.users]
  }

  saveUsers(users: User[]): void {
    this.users = [...users]
  }

  getUserByUsername(username: string): User | undefined {
    return this.users.find((u) => u.username === username)
  }

  getUserById(uid: string): User | undefined {
    return this.users.find((u) => u.uid === uid)
  }

  // Print job methods
  getPrintJobs(uid?: string): PrintJob[] {
    if (uid) {
      return this.printJobs.filter((job) => job.uid === uid)
    }
    return [...this.printJobs]
  }

  getAllPrintJobs(): PrintJob[] {
    return [...this.printJobs]
  }

  addPrintJob(job: PrintJob): void {
    this.printJobs.push(job)
  }

  // Lamination job methods
  getLaminationJobs(uid?: string): LaminationJob[] {
    if (uid) {
      return this.laminationJobs.filter((job) => job.uid === uid)
    }
    return [...this.laminationJobs]
  }

  getAllLaminationJobs(): LaminationJob[] {
    return [...this.laminationJobs]
  }

  addLaminationJob(job: LaminationJob): void {
    this.laminationJobs.push(job)
  }

  // Billing methods
  getPrintBilling(uid?: string): PrintBilling[] {
    if (uid) {
      return this.printBilling.filter((billing) => billing.uid === uid)
    }
    return [...this.printBilling]
  }

  getAllPrintBilling(): PrintBilling[] {
    return [...this.printBilling]
  }

  getLaminationBilling(uid?: string): LaminationBilling[] {
    if (uid) {
      return this.laminationBilling.filter((billing) => billing.uid === uid)
    }
    return [...this.laminationBilling]
  }

  getAllLaminationBilling(): LaminationBilling[] {
    return [...this.laminationBilling]
  }

  updatePrintBilling(billingId: string, updates: Partial<PrintBilling>): void {
    const index = this.printBilling.findIndex((b) => b.billingId === billingId)
    if (index !== -1) {
      this.printBilling[index] = { ...this.printBilling[index], ...updates, lastUpdated: new Date() }
    }
  }

  updateLaminationBilling(billingId: string, updates: Partial<LaminationBilling>): void {
    const index = this.laminationBilling.findIndex((b) => b.billingId === billingId)
    if (index !== -1) {
      this.laminationBilling[index] = { ...this.laminationBilling[index], ...updates, lastUpdated: new Date() }
    }
  }

  // Price table methods
  getPriceTables(): PriceTable[] {
    return [...this.priceTables]
  }

  getPriceTable(id: string): PriceTable | undefined {
    return this.priceTables.find((table) => table.id === id)
  }

  updatePriceTable(id: string, updates: Partial<PriceTable>): void {
    const index = this.priceTables.findIndex((table) => table.id === id)
    if (index !== -1) {
      this.priceTables[index] = { ...this.priceTables[index], ...updates, updatedAt: new Date() }
    }
  }

  // Statistics methods
  getTotalUnpaidForUser(uid: string): { print: number; lamination: number; total: number } {
    const printUnpaid = this.printBilling
      .filter((b) => b.uid === uid)
      .reduce((sum, b) => sum + b.remainingBalance, 0)
    const laminationUnpaid = this.laminationBilling
      .filter((b) => b.uid === uid)
      .reduce((sum, b) => sum + b.remainingBalance, 0)

    return {
      print: printUnpaid,
      lamination: laminationUnpaid,
      total: printUnpaid + laminationUnpaid,
    }
  }

  getJobCountsForUser(uid: string): { print: number; lamination: number } {
    return {
      print: this.printJobs.filter((j) => j.uid === uid).length,
      lamination: this.laminationJobs.filter((j) => j.uid === uid).length,
    }
  }

  // Transaction methods
  getTransactions(uid?: string): Transaction[] {
    if (uid) {
      return this.transactions.filter((t) => t.uid === uid)
    }
    return [...this.transactions]
  }

  addTransaction(transaction: Transaction): void {
    this.transactions.push(transaction)
    
    // Update billing records to reflect the payment
    const userPrintBilling = this.printBilling.filter(b => b.uid === transaction.uid)
    const userLaminationBilling = this.laminationBilling.filter(b => b.uid === transaction.uid)
    
    let remainingAmount = transaction.amount
    
    if (remainingAmount > 0) {
      // Positive payment - reduce debt
      // First, apply payment to print billing
      for (const billing of userPrintBilling) {
        if (remainingAmount <= 0) break
        
        const paymentAmount = Math.min(remainingAmount, billing.remainingBalance)
        billing.paidAmount += paymentAmount
        billing.remainingBalance -= paymentAmount
        billing.lastPayment = transaction.timestamp
        
        if (billing.remainingBalance <= 0) {
          billing.paid = true
          billing.paidDate = transaction.timestamp
        }
        
        remainingAmount -= paymentAmount
      }
      
      // Then, apply remaining payment to lamination billing
      for (const billing of userLaminationBilling) {
        if (remainingAmount <= 0) break
        
        const paymentAmount = Math.min(remainingAmount, billing.remainingBalance)
        billing.paidAmount += paymentAmount
        billing.remainingBalance -= paymentAmount
        billing.lastPayment = transaction.timestamp
        
        if (billing.remainingBalance <= 0) {
          billing.paid = true
          billing.paidDate = transaction.timestamp
        }
        
        remainingAmount -= paymentAmount
      }
    } else if (remainingAmount < 0) {
      // Negative payment - create credit (negative balance)
      const creditAmount = Math.abs(remainingAmount)
      
      // Create a credit by reducing the remaining balance (making it negative)
      // Apply to lamination billing first, then print billing
      if (userLaminationBilling.length > 0) {
        userLaminationBilling[0].remainingBalance -= creditAmount
        userLaminationBilling[0].lastPayment = transaction.timestamp
      } else if (userPrintBilling.length > 0) {
        userPrintBilling[0].remainingBalance -= creditAmount
        userPrintBilling[0].lastPayment = transaction.timestamp
      }
    }
  }

  // Reset method to clear all data and regenerate
  reset(): void {
    this.printJobs = []
    this.laminationJobs = []
    this.printBilling = []
    this.laminationBilling = []
    this.transactions = []
    this.initializeData()
  }
}

export const dummyDB = new DummyDatabase()
