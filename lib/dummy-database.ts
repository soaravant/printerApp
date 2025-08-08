// Enhanced dummy database with additional methods for admin functionality
import { roundMoney, calculatePrintCost, calculatePrintJobTotal, multiplyMoney } from "./utils"

export interface User {
  uid: string
  username: string
  accessLevel: "user" | "admin" | "Υπεύθυνος" // Added Υπεύθυνος access level
  displayName: string
  createdAt: Date
  userRole: "Άτομο" | "Ομάδα" | "Ναός" | "Τομέας" // New field for the role selection
  team?: string // New field for team selection (now dynamic)
  memberOf?: string[] // New field for Άτομο users to show which Ομάδα/Ναός/Τομέας they belong to
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
  type: "A4BW" | "A4Color" | "A3BW" | "A3Color" | "RizochartoA3" | "RizochartoA4" | "ChartoniA3" | "ChartoniA4" | "Autokollito"
  quantity: number
  pricePerUnit: number
  totalCost: number
  deviceIP: string
  deviceName: string
  timestamp: Date
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

export interface Bank {
  bankId: string
  printBank: number // Total money collected for print debt reduction
  laminationBank: number // Total money collected for lamination debt reduction
  timestamp: Date
  lastUpdated: Date
}

class DummyDatabase {
  private users: User[] = []
  private printJobs: PrintJob[] = []
  private laminationJobs: LaminationJob[] = []
  private priceTables: PriceTable[] = []
  private income: Income[] = []
  private bank: Bank

  constructor() {
    this.bank = {
      bankId: "main-bank",
      printBank: 0,
      laminationBank: 0,
      timestamp: new Date(),
      lastUpdated: new Date()
    }
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
      },
      {
        uid: "team-sporiades",
        username: "601",
        accessLevel: "user",
        displayName: "Σποριάδες",
        createdAt: new Date("2024-01-06"),
        userRole: "Ομάδα",
      },
      {
        uid: "team-karpoforoi",
        username: "602",
        accessLevel: "user",
        displayName: "Καρποφόροι",
        createdAt: new Date("2024-01-07"),
        userRole: "Ομάδα",
      },
      {
        uid: "team-olofwtoi",
        username: "603",
        accessLevel: "user",
        displayName: "Ολόφωτοι",
        createdAt: new Date("2024-01-08"),
        userRole: "Ομάδα",
      },
      {
        uid: "team-nikhtes",
        username: "604",
        accessLevel: "user",
        displayName: "Νικητές",
        createdAt: new Date("2024-01-09"),
        userRole: "Ομάδα",
      },
      {
        uid: "team-nikhforoi",
        username: "605",
        accessLevel: "user",
        displayName: "Νικηφόροι",
        createdAt: new Date("2024-01-10"),
        userRole: "Ομάδα",
      },
      {
        uid: "team-floga",
        username: "606",
        accessLevel: "user",
        displayName: "Φλόγα",
        createdAt: new Date("2024-01-11"),
        userRole: "Ομάδα",
      },
      {
        uid: "team-sympsyxoi",
        username: "607",
        accessLevel: "user",
        displayName: "Σύμψυχοι",
        createdAt: new Date("2024-01-12"),
        userRole: "Ομάδα",
      },

      // Ναός accounts (8 total) - using same user pairs as teams
      {
        uid: "naos-1",
        username: "700",
        accessLevel: "user",
        displayName: "Ναός 1",
        createdAt: new Date("2024-01-14"),
        userRole: "Ναός",
      },
      {
        uid: "naos-2",
        username: "701",
        accessLevel: "user",
        displayName: "Ναός 2",
        createdAt: new Date("2024-01-15"),
        userRole: "Ναός",
      },
      {
        uid: "naos-3",
        username: "703",
        accessLevel: "user",
        displayName: "Ναός 3",
        createdAt: new Date("2024-01-16"),
        userRole: "Ναός",
      },
      {
        uid: "naos-4",
        username: "704",
        accessLevel: "user",
        displayName: "Ναός 4",
        createdAt: new Date("2024-01-17"),
        userRole: "Ναός",
      },
      {
        uid: "naos-5",
        username: "705",
        accessLevel: "user",
        displayName: "Ναός 5",
        createdAt: new Date("2024-01-18"),
        userRole: "Ναός",
      },
      {
        uid: "naos-6",
        username: "706",
        accessLevel: "user",
        displayName: "Ναός 6",
        createdAt: new Date("2024-01-19"),
        userRole: "Ναός",
      },
      {
        uid: "naos-7",
        username: "707",
        accessLevel: "user",
        displayName: "Ναός 7",
        createdAt: new Date("2024-01-20"),
        userRole: "Ναός",
      },
      {
        uid: "naos-8",
        username: "708",
        accessLevel: "user",
        displayName: "Ναός 8",
        createdAt: new Date("2024-01-21"),
        userRole: "Ναός",
      },

      // Τομέας accounts (8 total) - using same user pairs as teams
      {
        uid: "tomeas-1",
        username: "800",
        accessLevel: "user",
        displayName: "Τομέας 1",
        createdAt: new Date("2024-01-22"),
        userRole: "Τομέας",
      },
      {
        uid: "tomeas-2",
        username: "801",
        accessLevel: "user",
        displayName: "Τομέας 2",
        createdAt: new Date("2024-01-23"),
        userRole: "Τομέας",
      },
      {
        uid: "tomeas-3",
        username: "802",
        accessLevel: "user",
        displayName: "Τομέας 3",
        createdAt: new Date("2024-01-24"),
        userRole: "Τομέας",
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
      },
      {
        uid: "tomeas-6",
        username: "805",
        accessLevel: "user",
        displayName: "Τομέας 6",
        createdAt: new Date("2024-01-27"),
        userRole: "Τομέας",
      },
      {
        uid: "tomeas-7",
        username: "806",
        accessLevel: "user",
        displayName: "Τομέας 7",
        createdAt: new Date("2024-01-28"),
        userRole: "Τομέας",
      },
      {
        uid: "tomeas-8",
        username: "807",
        accessLevel: "user",
        displayName: "Τομέας 8",
        createdAt: new Date("2024-01-29"),
        userRole: "Τομέας",
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
          
          // Generate print jobs based on printer capabilities
          const printTypes: ("A4BW" | "A4Color" | "A3BW" | "A3Color" | "RizochartoA3" | "RizochartoA4" | "ChartoniA3" | "ChartoniA4" | "Autokollito")[] = [];
          
          if (deviceName === "Canon Color") {
            // Canon Color can print everything
            printTypes.push("A4BW", "A4Color", "A3BW", "A3Color", "RizochartoA3", "RizochartoA4", "ChartoniA3", "ChartoniA4", "Autokollito");
          } else if (deviceName === "Κυδωνιών" || deviceName === "Canon B/W" || deviceName === "Brother") {
            // These can only print A4 B/W
            printTypes.push("A4BW");
          }

          // Generate 1-3 print jobs per session
          const numJobs = Math.floor(Math.random() * 3) + 1;
          for (let j = 0; j < numJobs; j++) {
            const type = printTypes[Math.floor(Math.random() * printTypes.length)];
            const quantity = Math.floor(Math.random() * 8) + 1; // 1-8 pages
            const prices = this.priceTables.find((p) => p.id === "printing")?.prices || {};
            
            let pricePerUnit = 0;
            switch (type) {
              case "A4BW": pricePerUnit = prices.a4BW || 0; break;
              case "A4Color": pricePerUnit = prices.a4Color || 0; break;
              case "A3BW": pricePerUnit = prices.a3BW || 0; break;
              case "A3Color": pricePerUnit = prices.a3Color || 0; break;
              case "RizochartoA3": pricePerUnit = prices.rizochartoA3 || 0; break;
              case "RizochartoA4": pricePerUnit = prices.rizochartoA4 || 0; break;
              case "ChartoniA3": pricePerUnit = prices.chartoniA3 || 0; break;
              case "ChartoniA4": pricePerUnit = prices.chartoniA4 || 0; break;
              case "Autokollito": pricePerUnit = prices.autokollito || 0; break;
            }

            const printJob: PrintJob = {
              jobId: `print-${userId}-${monthOffset}-${i}-${j}`,
              uid: userId,
              username: user.username,
              userDisplayName: user.displayName,
              type,
              quantity,
              pricePerUnit,
              totalCost: multiplyMoney(pricePerUnit, quantity),
              deviceIP: `192.168.1.${100 + Math.floor(Math.random() * 3)}`,
              deviceName: deviceName,
              timestamp: jobDate,
              status: "completed",
            };
            
            this.printJobs.push(printJob);
          }
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
    
    // Generate income history based on jobs
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
      
      // Get all jobs for this period
      const monthPrintJobs = this.printJobs.filter(j => j.timestamp.toISOString().slice(0, 7) === period)
      const monthLaminationJobs = this.laminationJobs.filter(j => j.timestamp.toISOString().slice(0, 7) === period)
      
      // Generate income for each user with jobs in this period
      const usersWithJobs = new Set([
        ...monthPrintJobs.map(j => j.uid),
        ...monthLaminationJobs.map(j => j.uid)
      ])
      
      for (const userId of usersWithJobs) {
        const user = this.users.find(u => u.uid === userId)!
        const userPrintJobs = monthPrintJobs.filter(j => j.uid === userId)
        const userLaminationJobs = monthLaminationJobs.filter(j => j.uid === userId)
        
        // Calculate total debt for this user in this period
        const totalPrintDebt = userPrintJobs.reduce((sum, j) => sum + j.totalCost, 0)
        const totalLaminationDebt = userLaminationJobs.reduce((sum, j) => sum + j.totalCost, 0)
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

  updateUser(updatedUser: User): void {
    const index = this.users.findIndex(user => user.uid === updatedUser.uid)
    if (index !== -1) {
      this.users[index] = { ...updatedUser }
    }
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
    const printUnpaid = this.printJobs
      .filter((j) => j.uid === uid)
      .reduce((sum, j) => sum + j.totalCost, 0)
    const laminationUnpaid = this.laminationJobs
      .filter((j) => j.uid === uid)
      .reduce((sum, j) => sum + j.totalCost, 0)

    return {
      print: printUnpaid,
      lamination: laminationUnpaid,
      total: printUnpaid + laminationUnpaid,
    }
  }

  // New method to get net debt (sequential, credit first on total)
  // Rule:
  // - Keep category debts (print/lamination) never negative. Any overpayment becomes credit on total only (negative total).
  // - When new job is added and there is credit, consume credit first (reduce negative total toward 0),
  //   then add any remainder to the respective category.
  getNetDebtForUser(uid: string): { print: number; lamination: number; total: number } {
    // Collect user events (print jobs, lamination jobs, incomes) and process chronologically
    const printJobs = this.printJobs.filter(j => j.uid === uid)
    const laminationJobs = this.laminationJobs.filter(j => j.uid === uid)
    const incomes = this.income.filter(i => i.uid === uid)

    type Event = { kind: "print" | "lamination" | "income"; amount: number; timestamp: Date }
    const events: Event[] = []
    for (const j of printJobs) {
      events.push({ kind: "print", amount: j.totalCost, timestamp: j.timestamp })
    }
    for (const j of laminationJobs) {
      events.push({ kind: "lamination", amount: j.totalCost, timestamp: j.timestamp })
    }
    for (const inc of incomes) {
      events.push({ kind: "income", amount: inc.amount, timestamp: inc.timestamp })
    }

    // Sort by time ascending
    events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())

    let printDebt = 0
    let laminationDebt = 0
    let totalCredit = 0 // positive number representing credit; total debt = print + lamination - credit

    for (const e of events) {
      if (e.kind === "print") {
        if (totalCredit > 0) {
          if (e.amount <= totalCredit) {
            totalCredit -= e.amount
          } else {
            const remainder = e.amount - totalCredit
            totalCredit = 0
            printDebt += remainder
          }
        } else {
          printDebt += e.amount
        }
      } else if (e.kind === "lamination") {
        if (totalCredit > 0) {
          if (e.amount <= totalCredit) {
            totalCredit -= e.amount
          } else {
            const remainder = e.amount - totalCredit
            totalCredit = 0
            laminationDebt += remainder
          }
        } else {
          laminationDebt += e.amount
        }
      } else {
        // income: pay lamination first, then print; leftover increases credit
        let remaining = e.amount
        if (laminationDebt > 0) {
          const payL = Math.min(remaining, laminationDebt)
          laminationDebt -= payL
          remaining -= payL
        }
        if (remaining > 0 && printDebt > 0) {
          const payP = Math.min(remaining, printDebt)
          printDebt -= payP
          remaining -= payP
        }
        if (remaining > 0) {
          totalCredit += remaining
        }
      }
    }

    const total = printDebt + laminationDebt - totalCredit
    return { print: printDebt, lamination: laminationDebt, total }
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
    // Add income record first
    this.income.push(incomeRecord)
    
    // Update banks based on current debts at the time of payment (lamination first then print)
    this.applyDebtReduction(incomeRecord.uid, incomeRecord.amount)

    // Recalculate user debt fields sequentially with the new income
    this.updateUserDebtFields(incomeRecord.uid)
  }

  // New method to apply debt reduction with the specified logic
  private applyDebtReduction(uid: string, amount: number): void {
    // Only update banks here based on current state; actual debt fields are recalculated elsewhere
    const user = this.users.find(u => u.uid === uid)
    if (!user) return

    let remainingAmount = amount
    let printBankIncrease = 0
    let laminationBankIncrease = 0

    const currentLaminationDebt = Math.max(0, user.laminationDebt || 0)
    const laminationPayment = Math.min(remainingAmount, currentLaminationDebt)
    laminationBankIncrease += laminationPayment
    remainingAmount -= laminationPayment

    const currentPrintDebt = Math.max(0, user.printDebt || 0)
    const printPayment = Math.min(remainingAmount, currentPrintDebt)
    printBankIncrease += printPayment
    remainingAmount -= printPayment

    // Allocate any remaining (excess) income to lamination bank as per business rule
    if (remainingAmount > 0) {
      laminationBankIncrease += remainingAmount
      remainingAmount = 0
    }

    this.bank.printBank += printBankIncrease
    this.bank.laminationBank += laminationBankIncrease
    this.bank.lastUpdated = new Date()
  }

  // Bank methods
  getBank(): Bank {
    return { ...this.bank }
  }

  getBankAmounts(): { printBank: number; laminationBank: number } {
    return {
      printBank: this.bank.printBank,
      laminationBank: this.bank.laminationBank
    }
  }

  // Bank reset methods
  resetPrintBank(): void {
    this.bank.printBank = 0
    this.bank.lastUpdated = new Date()
  }

  resetLaminationBank(): void {
    this.bank.laminationBank = 0
    this.bank.lastUpdated = new Date()
  }

  // Public method to refresh all user debt fields
  refreshAllUserDebtFields(): void {
    this.initializeUserDebtFields()
  }
  
  private updateUserDebtFields(uid: string): void {
    const user = this.users.find(u => u.uid === uid)
    if (!user) return
    
    // Recalculate debts using sequential rule
    const netDebt = this.getNetDebtForUser(uid)
    user.printDebt = roundMoney(netDebt.print)
    user.laminationDebt = roundMoney(netDebt.lamination)
    user.totalDebt = roundMoney(netDebt.total)
  }



  // Reset method to clear all data and regenerate
  reset(): void {
    this.printJobs = []
    this.laminationJobs = []
    this.income = []
    this.bank = {
      bankId: "main-bank",
      printBank: 0,
      laminationBank: 0,
      timestamp: new Date(),
      lastUpdated: new Date()
    }
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
