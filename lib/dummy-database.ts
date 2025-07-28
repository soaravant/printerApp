// Enhanced dummy database with additional methods for admin functionality
import { roundMoney, calculatePrintCost, calculatePrintJobTotal, multiplyMoney } from "./utils"

export interface User {
  uid: string
  username: string
  accessLevel: "user" | "admin"
  displayName: string
  createdAt: Date
  userRole: "Άτομο" | "Ομάδα" | "Ναός" | "Τομέας" // New field for the role selection
  responsiblePerson?: string // New field for responsible person
  team?: "Ενωμένοι" | "Σποριάδες" | "Καρποφόροι" | "Ολόφωτοι" | "Νικητές" | "Νικηφόροι" | "Φλόγα" | "Σύμψυχοι" // New field for team selection
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
  pagesRizocharto: number
  pagesChartoni: number
  pagesAutokollito: number
  deviceIP: string
  deviceName: string
  timestamp: Date
  costA4BW: number
  costA4Color: number
  costA3BW: number
  costA3Color: number
  costRizocharto: number
  costChartoni: number
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
  totalRizocharto: number
  totalChartoni: number
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

class DummyDatabase {
  private users: User[] = []
  private printJobs: PrintJob[] = []
  private laminationJobs: LaminationJob[] = []
  private printBilling: PrintBilling[] = []
  private laminationBilling: LaminationBilling[] = []
  private priceTables: PriceTable[] = []

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
      ...Array.from({ length: 20 }).map((_, i) => {
        const num = 400 + i;
        const userRole = userRoles[i % userRoles.length];
        const isIndividual = userRole === "Άτομο";
        
        return {
          uid: `user-${num}`,
          username: `${num}`,
          accessLevel: "user" as "user",
          displayName: `Χρήστης ${num}`,
          createdAt: new Date(`2024-01-${(i % 28) + 1}`),
          userRole: userRole,
          responsiblePerson: isIndividual ? undefined : `Υπεύθυνος ${num}`,
          team: isIndividual ? teams[i % teams.length] : undefined,
        };
      })
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
          rizocharto: 0.1,
          chartoni: 0.1,
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
    const userIds = this.users.filter((u) => u.accessLevel === "user").map((u) => u.uid);

    // Generate print and lamination jobs for the last 6 months
    for (let monthOffset = 0; monthOffset < 6; monthOffset++) {
      for (const userId of userIds) {
        const user = this.users.find((u) => u.uid === userId)!;
        // 10-20 print jobs per user per month
        const jobsCount = Math.floor(Math.random() * 11) + 10;
        for (let i = 0; i < jobsCount; i++) {
          const jobDate = new Date(now.getFullYear(), now.getMonth() - monthOffset, Math.floor(Math.random() * 28) + 1);
          const printJob: PrintJob = {
            jobId: `print-${userId}-${monthOffset}-${i}`,
            uid: userId,
            username: user.username,
            userDisplayName: user.displayName,
            pagesA4BW: Math.floor(Math.random() * 8) + 1, // 1-8
            pagesA4Color: Math.floor(Math.random() * 4),   // 0-3
            pagesA3BW: Math.floor(Math.random() * 3),      // 0-2
            pagesA3Color: Math.floor(Math.random() * 2),   // 0-1
            pagesRizocharto: Math.floor(Math.random() * 5), // 0-4
            pagesChartoni: Math.floor(Math.random() * 5), // 0-4
            pagesAutokollito: Math.floor(Math.random() * 5), // 0-4
            deviceIP: `192.168.1.${100 + Math.floor(Math.random() * 3)}`,
            deviceName: this.getRandomPrinterName(),
            timestamp: jobDate,
            costA4BW: 0,
            costA4Color: 0,
            costA3BW: 0,
            costA3Color: 0,
            costRizocharto: 0,
            costChartoni: 0,
            costAutokollito: 0,
            totalCost: 0,
            status: "completed",
          };
          // Calculate costs with proper money rounding
          const prices = this.priceTables.find((p) => p.id === "printing")?.prices || {};
          printJob.costA4BW = calculatePrintCost(printJob.pagesA4BW, prices.a4BW || 0);
          printJob.costA4Color = calculatePrintCost(printJob.pagesA4Color, prices.a4Color || 0);
          printJob.costA3BW = calculatePrintCost(printJob.pagesA3BW, prices.a3BW || 0);
          printJob.costA3Color = calculatePrintCost(printJob.pagesA3Color, prices.a3Color || 0);
          printJob.costRizocharto = calculatePrintCost(printJob.pagesRizocharto, prices.rizocharto || 0);
          printJob.costChartoni = calculatePrintCost(printJob.pagesChartoni, prices.chartoni || 0);
          printJob.costAutokollito = calculatePrintCost(printJob.pagesAutokollito, prices.autokollito || 0);
          printJob.totalCost = calculatePrintJobTotal({
            costA4BW: printJob.costA4BW,
            costA4Color: printJob.costA4Color,
            costA3BW: printJob.costA3BW,
            costA3Color: printJob.costA3Color,
            costRizocharto: printJob.costRizocharto,
            costChartoni: printJob.costChartoni,
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
    const userIds = this.users.filter((u) => u.accessLevel === "user").map((u) => u.uid)
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
        const totalRizocharto = monthPrintJobs.reduce((sum, j) => sum + j.pagesRizocharto, 0)
        const totalChartoni = monthPrintJobs.reduce((sum, j) => sum + j.pagesChartoni, 0)
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
          totalRizocharto,
          totalChartoni,
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
      .filter((b) => b.uid === uid && !b.paid)
      .reduce((sum, b) => sum + b.remainingBalance, 0)
    const laminationUnpaid = this.laminationBilling
      .filter((b) => b.uid === uid && !b.paid)
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

  // Reset method to clear all data and regenerate
  reset(): void {
    this.printJobs = []
    this.laminationJobs = []
    this.printBilling = []
    this.laminationBilling = []
    this.initializeData()
  }
}

export const dummyDB = new DummyDatabase()
