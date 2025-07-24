// Enhanced dummy database with additional methods for admin functionality

export interface User {
  uid: string
  username: string
  role: "user" | "admin"
  displayName: string
  department: string
  email?: string
  createdAt: Date
}

export interface PrintJob {
  jobId: string
  uid: string
  userDisplayName: string
  department: string
  pagesA4BW: number
  pagesA4Color: number
  pagesA3BW: number
  pagesA3Color: number
  scans: number
  copies: number
  deviceIP: string
  deviceName: string
  timestamp: Date
  costA4BW: number
  costA4Color: number
  costA3BW: number
  costA3Color: number
  costScans: number
  costCopies: number
  totalCost: number
  status: "completed" | "pending" | "failed"
}

export interface LaminationJob {
  jobId: string
  uid: string
  userDisplayName: string
  department: string
  type: "A3" | "A4" | "card_small" | "card_large"
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
  department: string
  period: string
  totalA4BW: number
  totalA4Color: number
  totalA3BW: number
  totalA3Color: number
  totalScans: number
  totalCopies: number
  totalCost: number
  paid: boolean
  paidDate?: Date
  paidAmount: number
  remainingBalance: number
  dueDate: Date
  generatedAt: Date
  lastUpdated: Date
}

export interface LaminationBilling {
  billingId: string
  uid: string
  userDisplayName: string
  department: string
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
    const departments = [
      "Γραφείο Α", "Γραφείο Β", "Γραφείο Γ", "Γραφείο Δ", "Γραφείο Ε", "Γραφείο ΣΤ", "Γραφείο Ζ", "Γραφείο Η", "Γραφείο Θ", "Γραφείο Ι",
      "Γραφείο Κ", "Γραφείο Λ", "Γραφείο Μ", "Γραφείο Ν", "Γραφείο Ξ", "Γραφείο Ο", "Γραφείο Π", "Γραφείο Ρ", "Γραφείο Σ", "Γραφείο Τ"
    ];
    this.users = [
      {
        uid: "admin-1",
        username: "admin",
        role: "admin",
        displayName: "Διαχειριστής",
        department: "Διοίκηση",
        email: "admin@example.com",
        createdAt: new Date("2024-01-01"),
      },
      ...Array.from({ length: 20 }).map((_, i) => {
        const num = 400 + i;
        return {
          uid: `user-${num}`,
          username: `${num}`,
          role: "user",
          displayName: `Χρήστης ${num}`,
          department: departments[i % departments.length],
          email: `user${num}@example.com`,
          createdAt: new Date(`2024-01-${(i % 28) + 1}`),
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
          a4Color: 0.15,
          a3BW: 0.1,
          a3Color: 0.3,
          scan: 0.02,
          copy: 0.03,
        },
        isActive: true,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
      },
      {
        id: "lamination",
        name: "Πλαστικοποιήσεις",
        prices: {
          A4: 1.5,
          A3: 3.0,
          card_small: 0.5,
          card_large: 1.0,
        },
        isActive: true,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
      },
    ];

    // Generate sample data
    this.generateSampleData();
  }

  private generateSampleData() {
    const now = new Date();
    const userIds = this.users.filter((u) => u.role === "user").map((u) => u.uid);

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
            userDisplayName: user.displayName,
            department: user.department,
            pagesA4BW: Math.floor(Math.random() * 8) + 1, // 1-8
            pagesA4Color: Math.floor(Math.random() * 4),   // 0-3
            pagesA3BW: Math.floor(Math.random() * 3),      // 0-2
            pagesA3Color: Math.floor(Math.random() * 2),   // 0-1
            scans: Math.floor(Math.random() * 3),          // 0-2
            copies: Math.floor(Math.random() * 5),         // 0-4
            deviceIP: `192.168.1.${100 + Math.floor(Math.random() * 10)}`,
            deviceName: `Printer-${Math.floor(Math.random() * 3) + 1}`,
            timestamp: jobDate,
            costA4BW: 0,
            costA4Color: 0,
            costA3BW: 0,
            costA3Color: 0,
            costScans: 0,
            costCopies: 0,
            totalCost: 0,
            status: "completed",
          };
          // Calculate costs
          const prices = this.priceTables.find((p) => p.id === "printing")?.prices || {};
          printJob.costA4BW = printJob.pagesA4BW * (prices.a4BW || 0);
          printJob.costA4Color = printJob.pagesA4Color * (prices.a4Color || 0);
          printJob.costA3BW = printJob.pagesA3BW * (prices.a3BW || 0);
          printJob.costA3Color = printJob.pagesA3Color * (prices.a3Color || 0);
          printJob.costScans = printJob.scans * (prices.scan || 0);
          printJob.costCopies = printJob.copies * (prices.copy || 0);
          printJob.totalCost =
            printJob.costA4BW +
            printJob.costA4Color +
            printJob.costA3BW +
            printJob.costA3Color +
            printJob.costScans +
            printJob.costCopies;
          this.printJobs.push(printJob);
        }
        // 3-8 lamination jobs per user per month
        const laminationJobsCount = Math.floor(Math.random() * 6) + 3;
        for (let i = 0; i < laminationJobsCount; i++) {
          const jobDate = new Date(now.getFullYear(), now.getMonth() - monthOffset, Math.floor(Math.random() * 28) + 1);
          const types: ("A3" | "A4" | "card_small" | "card_large")[] = ["A3", "A4", "card_small", "card_large"];
          const type = types[Math.floor(Math.random() * types.length)];
          const quantity = Math.floor(Math.random() * 3) + 1; // 1-3
          const prices = this.priceTables.find((p) => p.id === "lamination")?.prices || {};
          const pricePerUnit = prices[type] || 0;
          const laminationJob: LaminationJob = {
            jobId: `lamination-${userId}-${monthOffset}-${i}`,
            uid: userId,
            userDisplayName: user.displayName,
            department: user.department,
            type,
            quantity,
            pricePerUnit,
            totalCost: quantity * pricePerUnit,
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
    const userIds = this.users.filter((u) => u.role === "user").map((u) => u.uid)
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
          const totalScans = monthPrintJobs.reduce((sum, j) => sum + j.scans, 0)
          const totalCopies = monthPrintJobs.reduce((sum, j) => sum + j.copies, 0)
          const totalCost = monthPrintJobs.reduce((sum, j) => sum + j.totalCost, 0)

          const isPaid = Math.random() > 0.3
          const paidAmount = isPaid ? totalCost : Math.random() * totalCost

          const printBilling: PrintBilling = {
            billingId: `print-billing-${userId}-${period}`,
            uid: userId,
            userDisplayName: user.displayName,
            department: user.department,
            period,
            totalA4BW,
            totalA4Color,
            totalA3BW,
            totalA3Color,
            totalScans,
            totalCopies,
            totalCost,
            paid: isPaid,
            paidDate: isPaid ? new Date(periodDate.getTime() + 15 * 24 * 60 * 60 * 1000) : undefined,
            paidAmount,
            remainingBalance: totalCost - paidAmount,
            dueDate: new Date(periodDate.getTime() + 30 * 24 * 60 * 60 * 1000),
            generatedAt: new Date(periodDate.getTime() + 5 * 24 * 60 * 60 * 1000),
            lastUpdated: new Date(),
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
            .filter((j) => j.type === "card_small")
            .reduce((sum, j) => sum + j.quantity, 0)
          const totalCardLarge = monthLaminationJobs
            .filter((j) => j.type === "card_large")
            .reduce((sum, j) => sum + j.quantity, 0)
          const totalCost = monthLaminationJobs.reduce((sum, j) => sum + j.totalCost, 0)

          const isPaid = Math.random() > 0.4
          const paidAmount = isPaid ? totalCost : Math.random() * totalCost

          const laminationBilling: LaminationBilling = {
            billingId: `lamination-billing-${userId}-${period}`,
            uid: userId,
            userDisplayName: user.displayName,
            department: user.department,
            period,
            totalA3,
            totalA4,
            totalCardSmall,
            totalCardLarge,
            totalCost,
            paid: isPaid,
            paidDate: isPaid ? new Date(periodDate.getTime() + 15 * 24 * 60 * 60 * 1000) : undefined,
            paidAmount,
            remainingBalance: totalCost - paidAmount,
            dueDate: new Date(periodDate.getTime() + 30 * 24 * 60 * 60 * 1000),
            generatedAt: new Date(periodDate.getTime() + 5 * 24 * 60 * 60 * 1000),
            lastUpdated: new Date(),
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
