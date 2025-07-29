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
  printDebt?: number // Current print debt (can be negative for credit)
  laminationDebt?: number // Current lamination debt (can be negative for credit)
  totalDebt?: number // Total debt (can be negative for credit)
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

export interface Income {
  incomeId: string
  uid: string
  username: string
  userDisplayName: string
  amount: number
  timestamp: Date
}

class DummyDatabase {
  private users: User[] = []
  private printJobs: PrintJob[] = []
  private laminationJobs: LaminationJob[] = []
  private printBilling: PrintBilling[] = []
  private laminationBilling: LaminationBilling[] = []
  private priceTables: PriceTable[] = []
  private income: Income[] = []

  constructor() {
    this.initializeData()
  }

  private initializeData() {
    // Initialize 24 users (8 teams × 3 members each)
    const teams: ("Ενωμένοι" | "Σποριάδες" | "Καρποφόροι" | "Ολόφωτοι" | "Νικητές" | "Νικηφόροι" | "Φλόγα" | "Σύμψυχοι")[] = ["Ενωμένοι", "Σποριάδες", "Καρποφόροι", "Ολόφωτοι", "Νικητές", "Νικηφόροι", "Φλόγα", "Σύμψυχοι"];
    
    this.users = [
      // Admin user
      {
        uid: "admin-1",
        username: "admin",
        accessLevel: "admin",
        displayName: "Διαχειριστής",
        createdAt: new Date("2024-01-01"),
        userRole: "Άτομο",
        team: "Ενωμένοι",
      },
      
      // Team 1: Ενωμένοι (3 members)
      {
        uid: "user-401",
        username: "401",
        accessLevel: "Υπεύθυνος",
        displayName: "Υπεύθυνος 401",
        createdAt: new Date("2024-01-01"),
        userRole: "Άτομο",
        team: "Ενωμένοι",
        memberOf: ["Ενωμένοι", "Ναός 1", "Τομέας 1"],
        responsibleFor: ["Ενωμένοι", "Ναός 1", "Τομέας 1"],
      },
      {
        uid: "user-501",
        username: "501",
        accessLevel: "user",
        displayName: "Χρήστης 501",
        createdAt: new Date("2024-01-02"),
        userRole: "Άτομο",
        team: "Ενωμένοι",
        memberOf: ["Ενωμένοι", "Ναός 1", "Τομέας 1"],
      },
      {
        uid: "user-502",
        username: "502",
        accessLevel: "user",
        displayName: "Χρήστης 502",
        createdAt: new Date("2024-01-03"),
        userRole: "Άτομο",
        team: "Ενωμένοι",
        memberOf: ["Ενωμένοι", "Ναός 1", "Τομέας 1"],
      },

      // Team 2: Σποριάδες (3 members)
      {
        uid: "user-402",
        username: "402",
        accessLevel: "Υπεύθυνος",
        displayName: "Υπεύθυνος 402",
        createdAt: new Date("2024-01-04"),
        userRole: "Άτομο",
        team: "Σποριάδες",
        memberOf: ["Σποριάδες", "Ναός 2", "Τομέας 2"],
        responsibleFor: ["Σποριάδες", "Ναός 2", "Τομέας 2"],
      },
      {
        uid: "user-503",
        username: "503",
        accessLevel: "user",
        displayName: "Χρήστης 503",
        createdAt: new Date("2024-01-05"),
        userRole: "Άτομο",
        team: "Σποριάδες",
        memberOf: ["Σποριάδες", "Ναός 2", "Τομέας 2"],
      },
      {
        uid: "user-504",
        username: "504",
        accessLevel: "user",
        displayName: "Χρήστης 504",
        createdAt: new Date("2024-01-06"),
        userRole: "Άτομο",
        team: "Σποριάδες",
        memberOf: ["Σποριάδες", "Ναός 2", "Τομέας 2"],
      },

      // Team 3: Καρποφόροι (3 members)
      {
        uid: "user-403",
        username: "403",
        accessLevel: "Υπεύθυνος",
        displayName: "Υπεύθυνος 403",
        createdAt: new Date("2024-01-07"),
        userRole: "Άτομο",
        team: "Καρποφόροι",
        memberOf: ["Καρποφόροι", "Ναός 3", "Τομέας 3"],
        responsibleFor: ["Καρποφόροι", "Ναός 3", "Τομέας 3"],
      },
      {
        uid: "user-505",
        username: "505",
        accessLevel: "user",
        displayName: "Χρήστης 505",
        createdAt: new Date("2024-01-08"),
        userRole: "Άτομο",
        team: "Καρποφόροι",
        memberOf: ["Καρποφόροι", "Ναός 3", "Τομέας 3"],
      },
      {
        uid: "user-506",
        username: "506",
        accessLevel: "user",
        displayName: "Χρήστης 506",
        createdAt: new Date("2024-01-09"),
        userRole: "Άτομο",
        team: "Καρποφόροι",
        memberOf: ["Καρποφόροι", "Ναός 3", "Τομέας 3"],
      },

      // Team 4: Ολόφωτοι (3 members)
      {
        uid: "user-404",
        username: "404",
        accessLevel: "Υπεύθυνος",
        displayName: "Υπεύθυνος 404",
        createdAt: new Date("2024-01-10"),
        userRole: "Άτομο",
        team: "Ολόφωτοι",
        memberOf: ["Ολόφωτοι", "Ναός 4", "Τομέας 4"],
        responsibleFor: ["Ολόφωτοι", "Ναός 4", "Τομέας 4"],
      },
      {
        uid: "user-507",
        username: "507",
        accessLevel: "user",
        displayName: "Χρήστης 507",
        createdAt: new Date("2024-01-11"),
        userRole: "Άτομο",
        team: "Ολόφωτοι",
        memberOf: ["Ολόφωτοι", "Ναός 4", "Τομέας 4"],
      },
      {
        uid: "user-508",
        username: "508",
        accessLevel: "user",
        displayName: "Χρήστης 508",
        createdAt: new Date("2024-01-12"),
        userRole: "Άτομο",
        team: "Ολόφωτοι",
        memberOf: ["Ολόφωτοι", "Ναός 4", "Τομέας 4"],
      },

      // Team 5: Νικητές (3 members)
      {
        uid: "user-405",
        username: "405",
        accessLevel: "Υπεύθυνος",
        displayName: "Υπεύθυνος 405",
        createdAt: new Date("2024-01-13"),
        userRole: "Άτομο",
        team: "Νικητές",
        memberOf: ["Νικητές", "Ναός 5", "Τομέας 5"],
        responsibleFor: ["Νικητές", "Ναός 5", "Τομέας 5"],
      },
      {
        uid: "user-509",
        username: "509",
        accessLevel: "user",
        displayName: "Χρήστης 509",
        createdAt: new Date("2024-01-14"),
        userRole: "Άτομο",
        team: "Νικητές",
        memberOf: ["Νικητές", "Ναός 5", "Τομέας 5"],
      },
      {
        uid: "user-510",
        username: "510",
        accessLevel: "user",
        displayName: "Χρήστης 510",
        createdAt: new Date("2024-01-15"),
        userRole: "Άτομο",
        team: "Νικητές",
        memberOf: ["Νικητές", "Ναός 5", "Τομέας 5"],
      },

      // Team 6: Νικηφόροι (3 members)
      {
        uid: "user-406",
        username: "406",
        accessLevel: "Υπεύθυνος",
        displayName: "Υπεύθυνος 406",
        createdAt: new Date("2024-01-16"),
        userRole: "Άτομο",
        team: "Νικηφόροι",
        memberOf: ["Νικηφόροι", "Ναός 6", "Τομέας 6"],
        responsibleFor: ["Νικηφόροι", "Ναός 6", "Τομέας 6"],
      },
      {
        uid: "user-511",
        username: "511",
        accessLevel: "user",
        displayName: "Χρήστης 511",
        createdAt: new Date("2024-01-17"),
        userRole: "Άτομο",
        team: "Νικηφόροι",
        memberOf: ["Νικηφόροι", "Ναός 6", "Τομέας 6"],
      },
      {
        uid: "user-512",
        username: "512",
        accessLevel: "user",
        displayName: "Χρήστης 512",
        createdAt: new Date("2024-01-18"),
        userRole: "Άτομο",
        team: "Νικηφόροι",
        memberOf: ["Νικηφόροι", "Ναός 6", "Τομέας 6"],
      },

      // Team 7: Φλόγα (3 members)
      {
        uid: "user-407",
        username: "407",
        accessLevel: "Υπεύθυνος",
        displayName: "Υπεύθυνος 407",
        createdAt: new Date("2024-01-19"),
        userRole: "Άτομο",
        team: "Φλόγα",
        memberOf: ["Φλόγα", "Ναός 7", "Τομέας 7"],
        responsibleFor: ["Φλόγα", "Ναός 7", "Τομέας 7"],
      },
      {
        uid: "user-513",
        username: "513",
        accessLevel: "user",
        displayName: "Χρήστης 513",
        createdAt: new Date("2024-01-20"),
        userRole: "Άτομο",
        team: "Φλόγα",
        memberOf: ["Φλόγα", "Ναός 7", "Τομέας 7"],
      },
      {
        uid: "user-514",
        username: "514",
        accessLevel: "user",
        displayName: "Χρήστης 514",
        createdAt: new Date("2024-01-21"),
        userRole: "Άτομο",
        team: "Φλόγα",
        memberOf: ["Φλόγα", "Ναός 7", "Τομέας 7"],
      },

      // Team 8: Σύμψυχοι (3 members)
      {
        uid: "user-408",
        username: "408",
        accessLevel: "Υπεύθυνος",
        displayName: "Υπεύθυνος 408",
        createdAt: new Date("2024-01-22"),
        userRole: "Άτομο",
        team: "Σύμψυχοι",
        memberOf: ["Σύμψυχοι", "Ναός 8", "Τομέας 8"],
        responsibleFor: ["Σύμψυχοι", "Ναός 8", "Τομέας 8"],
      },
      {
        uid: "user-515",
        username: "515",
        accessLevel: "user",
        displayName: "Χρήστης 515",
        createdAt: new Date("2024-01-23"),
        userRole: "Άτομο",
        team: "Σύμψυχοι",
        memberOf: ["Σύμψυχοι", "Ναός 8", "Τομέας 8"],
      },
      {
        uid: "user-516",
        username: "516",
        accessLevel: "user",
        displayName: "Χρήστης 516",
        createdAt: new Date("2024-01-24"),
        userRole: "Άτομο",
        team: "Σύμψυχοι",
        memberOf: ["Σύμψυχοι", "Ναός 8", "Τομέας 8"],
      },

      // Ομάδα accounts for each team (8 total)
      {
        uid: "team-enwmenoi",
        username: "600",
        accessLevel: "user",
        displayName: "Ενωμένοι",
        createdAt: new Date("2024-01-05"),
        userRole: "Ομάδα",
        responsiblePerson: "Υπεύθυνος 401",
        responsiblePersons: ["Υπεύθυνος 401"],
      },
      {
        uid: "team-sporiades",
        username: "601",
        accessLevel: "user",
        displayName: "Σποριάδες",
        createdAt: new Date("2024-01-06"),
        userRole: "Ομάδα",
        responsiblePerson: "Υπεύθυνος 402",
        responsiblePersons: ["Υπεύθυνος 402"],
      },
      {
        uid: "team-karpoforoi",
        username: "602",
        accessLevel: "user",
        displayName: "Καρποφόροι",
        createdAt: new Date("2024-01-07"),
        userRole: "Ομάδα",
        responsiblePerson: "Υπεύθυνος 403",
        responsiblePersons: ["Υπεύθυνος 403"],
      },
      {
        uid: "team-olofwtoi",
        username: "603",
        accessLevel: "user",
        displayName: "Ολόφωτοι",
        createdAt: new Date("2024-01-08"),
        userRole: "Ομάδα",
        responsiblePerson: "Υπεύθυνος 404",
        responsiblePersons: ["Υπεύθυνος 404"],
      },
      {
        uid: "team-nikhtes",
        username: "604",
        accessLevel: "user",
        displayName: "Νικητές",
        createdAt: new Date("2024-01-09"),
        userRole: "Ομάδα",
        responsiblePerson: "Υπεύθυνος 405",
        responsiblePersons: ["Υπεύθυνος 405"],
      },
      {
        uid: "team-nikhforoi",
        username: "605",
        accessLevel: "user",
        displayName: "Νικηφόροι",
        createdAt: new Date("2024-01-10"),
        userRole: "Ομάδα",
        responsiblePerson: "Υπεύθυνος 406",
        responsiblePersons: ["Υπεύθυνος 406"],
      },
      {
        uid: "team-floga",
        username: "606",
        accessLevel: "user",
        displayName: "Φλόγα",
        createdAt: new Date("2024-01-11"),
        userRole: "Ομάδα",
        responsiblePerson: "Υπεύθυνος 407",
        responsiblePersons: ["Υπεύθυνος 407"],
      },
      {
        uid: "team-sympsyxoi",
        username: "607",
        accessLevel: "user",
        displayName: "Σύμψυχοι",
        createdAt: new Date("2024-01-12"),
        userRole: "Ομάδα",
        responsiblePerson: "Υπεύθυνος 408",
        responsiblePersons: ["Υπεύθυνος 408"],
      },

      // Ναός accounts (8 total) - using same user pairs as teams
      {
        uid: "naos-1",
        username: "700",
        accessLevel: "user",
        displayName: "Ναός 1",
        createdAt: new Date("2024-01-14"),
        userRole: "Ναός",
        responsiblePerson: "Υπεύθυνος 401",
        responsiblePersons: ["Υπεύθυνος 401"],
      },
      {
        uid: "naos-2",
        username: "701",
        accessLevel: "user",
        displayName: "Ναός 2",
        createdAt: new Date("2024-01-15"),
        userRole: "Ναός",
        responsiblePerson: "Υπεύθυνος 402",
        responsiblePersons: ["Υπεύθυνος 402"],
      },
      {
        uid: "naos-3",
        username: "703",
        accessLevel: "user",
        displayName: "Ναός 3",
        createdAt: new Date("2024-01-16"),
        userRole: "Ναός",
        responsiblePerson: "Υπεύθυνος 403",
        responsiblePersons: ["Υπεύθυνος 403"],
      },
      {
        uid: "naos-4",
        username: "704",
        accessLevel: "user",
        displayName: "Ναός 4",
        createdAt: new Date("2024-01-17"),
        userRole: "Ναός",
        responsiblePerson: "Υπεύθυνος 404",
        responsiblePersons: ["Υπεύθυνος 404"],
      },
      {
        uid: "naos-5",
        username: "705",
        accessLevel: "user",
        displayName: "Ναός 5",
        createdAt: new Date("2024-01-18"),
        userRole: "Ναός",
        responsiblePerson: "Υπεύθυνος 405",
        responsiblePersons: ["Υπεύθυνος 405"],
      },
      {
        uid: "naos-6",
        username: "706",
        accessLevel: "user",
        displayName: "Ναός 6",
        createdAt: new Date("2024-01-19"),
        userRole: "Ναός",
        responsiblePerson: "Υπεύθυνος 406",
        responsiblePersons: ["Υπεύθυνος 406"],
      },
      {
        uid: "naos-7",
        username: "707",
        accessLevel: "user",
        displayName: "Ναός 7",
        createdAt: new Date("2024-01-20"),
        userRole: "Ναός",
        responsiblePerson: "Υπεύθυνος 407",
        responsiblePersons: ["Υπεύθυνος 407"],
      },
      {
        uid: "naos-8",
        username: "708",
        accessLevel: "user",
        displayName: "Ναός 8",
        createdAt: new Date("2024-01-21"),
        userRole: "Ναός",
        responsiblePerson: "Υπεύθυνος 408",
        responsiblePersons: ["Υπεύθυνος 408"],
      },

      // Τομέας accounts (8 total) - using same user pairs as teams
      {
        uid: "tomeas-1",
        username: "800",
        accessLevel: "user",
        displayName: "Τομέας 1",
        createdAt: new Date("2024-01-22"),
        userRole: "Τομέας",
        responsiblePerson: "Υπεύθυνος 401",
        responsiblePersons: ["Υπεύθυνος 401"],
      },
      {
        uid: "tomeas-2",
        username: "801",
        accessLevel: "user",
        displayName: "Τομέας 2",
        createdAt: new Date("2024-01-23"),
        userRole: "Τομέας",
        responsiblePerson: "Υπεύθυνος 402",
        responsiblePersons: ["Υπεύθυνος 402"],
      },
      {
        uid: "tomeas-3",
        username: "802",
        accessLevel: "user",
        displayName: "Τομέας 3",
        createdAt: new Date("2024-01-24"),
        userRole: "Τομέας",
        responsiblePerson: "Υπεύθυνος 403",
        responsiblePersons: ["Υπεύθυνος 403"],
        printDebt: 14.22,
        laminationDebt: 1.33,
        totalDebt: 15.55,
      },
      {
        uid: "tomeas-4",
        username: "803",
        accessLevel: "user",
        displayName: "Τομέας 4",
        createdAt: new Date("2024-01-25"),
        userRole: "Τομέας",
        responsiblePerson: "Υπεύθυνος 404",
        responsiblePersons: ["Υπεύθυνος 404"],
        printDebt: 14.86,
        laminationDebt: 3.41,
        totalDebt: 18.27,
      },
      {
        uid: "tomeas-5",
        username: "804",
        accessLevel: "user",
        displayName: "Τομέας 5",
        createdAt: new Date("2024-01-26"),
        userRole: "Τομέας",
        responsiblePerson: "Υπεύθυνος 405",
        responsiblePersons: ["Υπεύθυνος 405"],
      },
      {
        uid: "tomeas-6",
        username: "805",
        accessLevel: "user",
        displayName: "Τομέας 6",
        createdAt: new Date("2024-01-27"),
        userRole: "Τομέας",
        responsiblePerson: "Υπεύθυνος 406",
        responsiblePersons: ["Υπεύθυνος 406"],
      },
      {
        uid: "tomeas-7",
        username: "806",
        accessLevel: "user",
        displayName: "Τομέας 7",
        createdAt: new Date("2024-01-28"),
        userRole: "Τομέας",
        responsiblePerson: "Υπεύθυνος 407",
        responsiblePersons: ["Υπεύθυνος 407"],
      },
      {
        uid: "tomeas-8",
        username: "807",
        accessLevel: "user",
        displayName: "Τομέας 8",
        createdAt: new Date("2024-01-29"),
        userRole: "Τομέας",
        responsiblePerson: "Υπεύθυνος 408",
        responsiblePersons: ["Υπεύθυνος 408"],
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
    const printers = ["Canon Color", "Canon B/W", "Brother", "Κυδωνιών"];
    return printers[Math.floor(Math.random() * printers.length)];
  }

  private generateSampleData() {
    const now = new Date();
    // Include all users except admin in job generation (including Ομάδα, Ναός, Τομέας accounts)
    const userIds = this.users.filter((u) => u.accessLevel !== "admin").map((u) => u.uid);

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
          if (deviceName === "Canon Color") {
            // Canon Color can print everything
            printJob.pagesA4BW = Math.floor(Math.random() * 8) + 1; // 1-8
            printJob.pagesA4Color = Math.floor(Math.random() * 4);   // 0-3
            printJob.pagesA3BW = Math.floor(Math.random() * 3);      // 0-2
            printJob.pagesA3Color = Math.floor(Math.random() * 2);   // 0-1
            printJob.pagesRizochartoA3 = Math.floor(Math.random() * 3); // 0-2
            printJob.pagesRizochartoA4 = Math.floor(Math.random() * 4); // 0-3
            printJob.pagesChartoniA3 = Math.floor(Math.random() * 3); // 0-2
            printJob.pagesChartoniA4 = Math.floor(Math.random() * 4); // 0-3
            printJob.pagesAutokollito = Math.floor(Math.random() * 5); // 0-4
          } else if (deviceName === "Κυδωνιών") {
            // Κυδωνιών can only print A4 B/W
            printJob.pagesA4BW = Math.floor(Math.random() * 8) + 1; // 1-8
            // All other page types remain 0
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
    
    // Generate income history based on billing records
    this.generateIncomeHistory()
    
    // Initialize debt fields for all users
    this.initializeUserDebtFields()
  }
  
  private initializeUserDebtFields(): void {
    for (const user of this.users) {
      this.updateUserDebtFields(user.uid)
    }
  }

  private generateIncomeHistory() {
    
    // Generate income for the last 6 months
    const now = new Date()
    
    for (let monthOffset = 0; monthOffset < 6; monthOffset++) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1)
      const period = monthDate.toISOString().slice(0, 7)
      
      // Get all billing records for this period
      const monthPrintBilling = this.printBilling.filter(b => b.period === period)
      const monthLaminationBilling = this.laminationBilling.filter(b => b.period === period)
      
      // Generate income for each user with billing in this period
      const usersWithBilling = new Set([
        ...monthPrintBilling.map(b => b.uid),
        ...monthLaminationBilling.map(b => b.uid)
      ])
      
      for (const userId of usersWithBilling) {
        const user = this.users.find(u => u.uid === userId)!
        const userPrintBilling = monthPrintBilling.filter(b => b.uid === userId)
        const userLaminationBilling = monthLaminationBilling.filter(b => b.uid === userId)
        
        // Calculate total debt for this user in this period
        const totalPrintDebt = userPrintBilling.reduce((sum, b) => sum + b.totalCost, 0)
        const totalLaminationDebt = userLaminationBilling.reduce((sum, b) => sum + b.totalCost, 0)
        const totalDebt = totalPrintDebt + totalLaminationDebt
        
        if (totalDebt === 0) continue
        
        // Generate income pattern based on user role and debt amount
        const incomePattern = this.generateIncomePattern(user, totalDebt, monthDate)
        
        // Create income records based on income pattern
        for (const income of incomePattern) {
          const incomeRecord: Income = {
            incomeId: `income-${userId}-${period}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            uid: userId,
            username: user.username,
            userDisplayName: user.displayName,
            amount: income.amount,
            timestamp: income.timestamp,
          }
          
          this.income.push(incomeRecord)
        }
      }
    }
    
    // Sort income by timestamp (newest first)
    this.income.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }
  
  private generateIncomePattern(user: User, totalDebt: number, billingDate: Date): Array<{
    amount: number
    timestamp: Date
  }> {
    const income: Array<{ amount: number; timestamp: Date }> = []
    
    // Different income patterns based on user role and debt amount
    const userRole = user.userRole
    const isHighDebt = totalDebt > 50
    const isLowDebt = totalDebt < 10
    
    // Base income probability and timing
    let incomeProbability = 0.8 // 80% chance of income
    let incomeDelay = 15 // Average days after billing
    
    // Adjust based on user role
    switch (userRole) {
      case "Άτομο":
        incomeProbability = 0.9 // Individuals pay more reliably
        incomeDelay = 10
        break
      case "Ομάδα":
        incomeProbability = 0.7
        incomeDelay = 20
        break
      case "Ναός":
        incomeProbability = 0.6
        incomeDelay = 25
        break
      case "Τομέας":
        incomeProbability = 0.5
        incomeDelay = 30
        break
    }
    
    // Adjust based on debt amount
    if (isHighDebt) {
      incomeProbability *= 0.8 // Less likely to receive high amounts immediately
      incomeDelay += 10
    } else if (isLowDebt) {
      incomeProbability *= 1.2 // More likely to receive small amounts
      incomeDelay -= 5
    }
    
    // Generate income scenarios
    if (Math.random() < incomeProbability) {
      // Full income scenario
      if (Math.random() < 0.7) {
        // Single full payment
        const incomeDate = new Date(billingDate.getTime() + (incomeDelay + Math.random() * 10) * 24 * 60 * 60 * 1000)
        income.push({
          amount: totalDebt,
          timestamp: incomeDate,
        })
      } else {
        // Multiple partial payments
        const numPayments = Math.floor(Math.random() * 3) + 2 // 2-4 payments
        let remainingDebt = totalDebt
        
        for (let i = 0; i < numPayments && remainingDebt > 0; i++) {
          const incomeAmount = i === numPayments - 1 
            ? remainingDebt 
            : roundMoney(remainingDebt * (0.3 + Math.random() * 0.4)) // 30-70% of remaining
          
          const incomeDate = new Date(billingDate.getTime() + (incomeDelay + i * 7 + Math.random() * 5) * 24 * 60 * 60 * 1000)
          
          income.push({
            amount: incomeAmount,
            timestamp: incomeDate,
          })
          
          remainingDebt -= incomeAmount
        }
      }
    } else {
      // No income or late income scenario
      if (Math.random() < 0.3) {
        // Late income (after 60+ days)
        const lateIncomeDate = new Date(billingDate.getTime() + (60 + Math.random() * 30) * 24 * 60 * 60 * 1000)
        const lateIncomeAmount = roundMoney(totalDebt * (0.5 + Math.random() * 0.3)) // 50-80% of debt
        
        income.push({
          amount: lateIncomeAmount,
          timestamp: lateIncomeDate,
        })
      }
      // 70% chance of no income at all
    }
    
    // Sort income by timestamp
    income.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
    
    return income
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
    // Update user's debt fields after adding a job
    this.updateUserDebtFields(job.uid)
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
    // Update user's debt fields after adding a job
    this.updateUserDebtFields(job.uid)
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

  // Income methods
  getIncome(uid?: string): Income[] {
    if (uid) {
      return this.income.filter((i) => i.uid === uid)
    }
    return [...this.income]
  }

  addIncome(incomeRecord: Income): void {
    this.income.push(incomeRecord)
    
    // Update billing records to reflect the income
    const userPrintBilling = this.printBilling.filter(b => b.uid === incomeRecord.uid)
    const userLaminationBilling = this.laminationBilling.filter(b => b.uid === incomeRecord.uid)
    
    let remainingAmount = incomeRecord.amount
    
    if (remainingAmount > 0) {
      // Positive income - reduce debt
      // First, apply income to lamination billing
      for (const billing of userLaminationBilling) {
        if (remainingAmount <= 0) break
        
        const incomeAmount = Math.min(remainingAmount, billing.remainingBalance)
        billing.paidAmount += incomeAmount
        billing.remainingBalance -= incomeAmount
        billing.lastPayment = incomeRecord.timestamp
        
        if (billing.remainingBalance <= 0) {
          billing.paid = true
          billing.paidDate = incomeRecord.timestamp
        }
        
        remainingAmount -= incomeAmount
      }
      
      // Then, apply remaining income to print billing
      for (const billing of userPrintBilling) {
        if (remainingAmount <= 0) break
        
        const incomeAmount = Math.min(remainingAmount, billing.remainingBalance)
        billing.paidAmount += incomeAmount
        billing.remainingBalance -= incomeAmount
        billing.lastPayment = incomeRecord.timestamp
        
        if (billing.remainingBalance <= 0) {
          billing.paid = true
          billing.paidDate = incomeRecord.timestamp
        }
        
        remainingAmount -= incomeAmount
      }
      
      // If there's still remaining amount, create credit by reducing remaining balance further
      if (remainingAmount > 0) {
        // Apply remaining amount as credit to lamination billing first
        if (userLaminationBilling.length > 0) {
          userLaminationBilling[0].remainingBalance -= remainingAmount
          userLaminationBilling[0].lastPayment = incomeRecord.timestamp
        } else if (userPrintBilling.length > 0) {
          userPrintBilling[0].remainingBalance -= remainingAmount
          userPrintBilling[0].lastPayment = incomeRecord.timestamp
        }
      }
    }
    
    // Update user's debt fields
    this.updateUserDebtFields(incomeRecord.uid)
  }
  
  private updateUserDebtFields(uid: string): void {
    const user = this.users.find(u => u.uid === uid)
    if (!user) return
    
    const userDebt = this.getTotalUnpaidForUser(uid)
    
    user.printDebt = userDebt.print
    user.laminationDebt = userDebt.lamination
    user.totalDebt = userDebt.total
  }



  // Reset method to clear all data and regenerate
  reset(): void {
    this.printJobs = []
    this.laminationJobs = []
    this.printBilling = []
    this.laminationBilling = []
    this.income = []
    this.initializeData()
  }

  // Method to regenerate income data dynamically
  regenerateIncome(): void {
    // Store manually added income records (those with recent timestamps)
    const now = new Date()
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const manuallyAddedIncome = this.income.filter(income => 
      income.timestamp > oneDayAgo
    )
    
    this.income = []
    this.generateIncomeHistory()
    
    // Restore manually added income records
    this.income.push(...manuallyAddedIncome)
    
    // Sort by timestamp (newest first)
    this.income.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  // Method to get fresh income data (regenerates if needed)
  getFreshIncome(uid?: string): Income[] {
    // Regenerate income to ensure fresh data
    this.regenerateIncome()
    return this.getIncome(uid)
  }
}

export const dummyDB = new DummyDatabase()
