// Dummy database that mimics Firebase structure
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
  type: "printing" | "lamination"
  prices: {
    // Printing prices
    a4BW?: number
    a4Color?: number
    a3BW?: number
    a3Color?: number
    scan?: number
    copy?: number
    // Lamination prices
    A3?: number
    A4?: number
    card_small?: number
    card_large?: number
  }
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// Dummy data
const DUMMY_USERS: User[] = [
  {
    uid: "user-408",
    username: "408",
    role: "user",
    displayName: "Χρήστης 408",
    department: "Γραφείο Α",
    email: "user408@example.com",
    createdAt: new Date("2024-01-01"),
  },
  {
    uid: "user-409",
    username: "409",
    role: "user",
    displayName: "Χρήστης 409",
    department: "Γραφείο Β",
    email: "user409@example.com",
    createdAt: new Date("2024-01-01"),
  },
  {
    uid: "admin-001",
    username: "admin",
    role: "admin",
    displayName: "Διαχειριστής",
    department: "Πληροφορική",
    email: "admin@example.com",
    createdAt: new Date("2024-01-01"),
  },
]

const PRINTING_PRICE_TABLE: PriceTable = {
  id: "printing-prices",
  name: "Τιμοκατάλογος Εκτυπώσεων",
  type: "printing",
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
}

const LAMINATION_PRICE_TABLE: PriceTable = {
  id: "lamination-prices",
  name: "Τιμοκατάλογος Πλαστικοποιήσεων",
  type: "lamination",
  prices: {
    A3: 2.0,
    A4: 1.5,
    card_small: 0.5,
    card_large: 1.0,
  },
  isActive: true,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
}

// Generate dummy print jobs
const generatePrintJobs = (): PrintJob[] => {
  const jobs: PrintJob[] = []
  const printerIPs = ["192.168.3.41", "192.168.3.42"]
  const printerNames = ["Canon iR-ADV C3330", "HP LaserJet Pro M404"]

  DUMMY_USERS.filter((u) => u.role === "user").forEach((user, userIndex) => {
    for (let i = 0; i < 25 + userIndex * 10; i++) {
      const daysAgo = Math.floor(Math.random() * 90)
      const timestamp = new Date()
      timestamp.setDate(timestamp.getDate() - daysAgo)

      const pagesA4BW = Math.floor(Math.random() * 20) + 1
      const pagesA4Color = Math.floor(Math.random() * 10)
      const pagesA3BW = Math.floor(Math.random() * 5)
      const pagesA3Color = Math.floor(Math.random() * 3)
      const scans = Math.floor(Math.random() * 5)
      const copies = Math.floor(Math.random() * 8)

      const deviceIndex = Math.floor(Math.random() * printerIPs.length)

      const costA4BW = pagesA4BW * PRINTING_PRICE_TABLE.prices.a4BW!
      const costA4Color = pagesA4Color * PRINTING_PRICE_TABLE.prices.a4Color!
      const costA3BW = pagesA3BW * PRINTING_PRICE_TABLE.prices.a3BW!
      const costA3Color = pagesA3Color * PRINTING_PRICE_TABLE.prices.a3Color!
      const costScans = scans * PRINTING_PRICE_TABLE.prices.scan!
      const costCopies = copies * PRINTING_PRICE_TABLE.prices.copy!

      const totalCost = costA4BW + costA4Color + costA3BW + costA3Color + costScans + costCopies

      jobs.push({
        jobId: `print-job-${user.uid}-${i}`,
        uid: user.uid,
        userDisplayName: user.displayName,
        department: user.department,
        pagesA4BW,
        pagesA4Color,
        pagesA3BW,
        pagesA3Color,
        scans,
        copies,
        deviceIP: printerIPs[deviceIndex],
        deviceName: printerNames[deviceIndex],
        timestamp,
        costA4BW: Number.parseFloat(costA4BW.toFixed(3)),
        costA4Color: Number.parseFloat(costA4Color.toFixed(3)),
        costA3BW: Number.parseFloat(costA3BW.toFixed(3)),
        costA3Color: Number.parseFloat(costA3Color.toFixed(3)),
        costScans: Number.parseFloat(costScans.toFixed(3)),
        costCopies: Number.parseFloat(costCopies.toFixed(3)),
        totalCost: Number.parseFloat(totalCost.toFixed(2)),
        status: "completed",
      })
    }
  })

  return jobs
}

// Generate dummy lamination jobs
const generateLaminationJobs = (): LaminationJob[] => {
  const jobs: LaminationJob[] = []
  const types: Array<"A3" | "A4" | "card_small" | "card_large"> = ["A3", "A4", "card_small", "card_large"]

  DUMMY_USERS.filter((u) => u.role === "user").forEach((user, userIndex) => {
    for (let i = 0; i < 15 + userIndex * 5; i++) {
      const daysAgo = Math.floor(Math.random() * 90)
      const timestamp = new Date()
      timestamp.setDate(timestamp.getDate() - daysAgo)

      const type = types[Math.floor(Math.random() * types.length)]
      const quantity = Math.floor(Math.random() * 10) + 1
      const pricePerUnit = LAMINATION_PRICE_TABLE.prices[type]!
      const totalCost = quantity * pricePerUnit

      jobs.push({
        jobId: `lamination-job-${user.uid}-${i}`,
        uid: user.uid,
        userDisplayName: user.displayName,
        department: user.department,
        type,
        quantity,
        pricePerUnit,
        totalCost: Number.parseFloat(totalCost.toFixed(2)),
        timestamp,
        status: "completed",
        notes: Math.random() > 0.7 ? "Επείγουσα παραγγελία" : undefined,
      })
    }
  })

  return jobs
}

// Generate billing records
const generatePrintBilling = (printJobs: PrintJob[]): PrintBilling[] => {
  const billingMap = new Map<string, PrintBilling>()

  printJobs.forEach((job) => {
    const date = new Date(job.timestamp)
    const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
    const key = `${job.uid}-${period}`

    if (!billingMap.has(key)) {
      const dueDate = new Date(date.getFullYear(), date.getMonth() + 1, 15)

      billingMap.set(key, {
        billingId: `print-billing-${key}`,
        uid: job.uid,
        userDisplayName: job.userDisplayName,
        department: job.department,
        period,
        totalA4BW: 0,
        totalA4Color: 0,
        totalA3BW: 0,
        totalA3Color: 0,
        totalScans: 0,
        totalCopies: 0,
        totalCost: 0,
        paid: Math.random() > 0.3,
        paidAmount: 0,
        remainingBalance: 0,
        dueDate,
        generatedAt: new Date(),
        lastUpdated: new Date(),
      })
    }

    const billing = billingMap.get(key)!
    billing.totalA4BW += job.pagesA4BW
    billing.totalA4Color += job.pagesA4Color
    billing.totalA3BW += job.pagesA3BW
    billing.totalA3Color += job.pagesA3Color
    billing.totalScans += job.scans
    billing.totalCopies += job.copies
    billing.totalCost += job.totalCost
  })

  return Array.from(billingMap.values()).map((billing) => {
    const finalCost = Number.parseFloat(billing.totalCost.toFixed(2))
    const paidAmount = billing.paid ? finalCost : Number.parseFloat((Math.random() * finalCost).toFixed(2))
    const remainingBalance = finalCost - paidAmount

    return {
      ...billing,
      totalCost: finalCost,
      paidAmount,
      remainingBalance: Number.parseFloat(remainingBalance.toFixed(2)),
      paidDate: billing.paid ? new Date() : undefined,
    }
  })
}

const generateLaminationBilling = (laminationJobs: LaminationJob[]): LaminationBilling[] => {
  const billingMap = new Map<string, LaminationBilling>()

  laminationJobs.forEach((job) => {
    const date = new Date(job.timestamp)
    const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
    const key = `${job.uid}-${period}`

    if (!billingMap.has(key)) {
      const dueDate = new Date(date.getFullYear(), date.getMonth() + 1, 15)

      billingMap.set(key, {
        billingId: `lamination-billing-${key}`,
        uid: job.uid,
        userDisplayName: job.userDisplayName,
        department: job.department,
        period,
        totalA3: 0,
        totalA4: 0,
        totalCardSmall: 0,
        totalCardLarge: 0,
        totalCost: 0,
        paid: Math.random() > 0.4,
        paidAmount: 0,
        remainingBalance: 0,
        dueDate,
        generatedAt: new Date(),
        lastUpdated: new Date(),
      })
    }

    const billing = billingMap.get(key)!
    if (job.type === "A3") billing.totalA3 += job.quantity
    if (job.type === "A4") billing.totalA4 += job.quantity
    if (job.type === "card_small") billing.totalCardSmall += job.quantity
    if (job.type === "card_large") billing.totalCardLarge += job.quantity
    billing.totalCost += job.totalCost
  })

  return Array.from(billingMap.values()).map((billing) => {
    const finalCost = Number.parseFloat(billing.totalCost.toFixed(2))
    const paidAmount = billing.paid ? finalCost : Number.parseFloat((Math.random() * finalCost).toFixed(2))
    const remainingBalance = finalCost - paidAmount

    return {
      ...billing,
      totalCost: finalCost,
      paidAmount,
      remainingBalance: Number.parseFloat(remainingBalance.toFixed(2)),
      paidDate: billing.paid ? new Date() : undefined,
    }
  })
}

// Initialize dummy data
const DUMMY_PRINT_JOBS = generatePrintJobs()
const DUMMY_LAMINATION_JOBS = generateLaminationJobs()
const DUMMY_PRINT_BILLING = generatePrintBilling(DUMMY_PRINT_JOBS)
const DUMMY_LAMINATION_BILLING = generateLaminationBilling(DUMMY_LAMINATION_JOBS)

// Database class
export class DummyDatabase {
  private users: User[] = [...DUMMY_USERS]
  private printJobs: PrintJob[] = [...DUMMY_PRINT_JOBS]
  private laminationJobs: LaminationJob[] = [...DUMMY_LAMINATION_JOBS]
  private printBilling: PrintBilling[] = [...DUMMY_PRINT_BILLING]
  private laminationBilling: LaminationBilling[] = [...DUMMY_LAMINATION_BILLING]
  private priceTables: PriceTable[] = [PRINTING_PRICE_TABLE, LAMINATION_PRICE_TABLE]

  // Users
  getUsers(): User[] {
    return [...this.users]
  }

  getUserById(uid: string): User | null {
    return this.users.find((u) => u.uid === uid) || null
  }

  getUserByUsername(username: string): User | null {
    return this.users.find((u) => u.username === username) || null
  }

  // Print Jobs
  getPrintJobs(uid?: string): PrintJob[] {
    if (uid) {
      return this.printJobs.filter((job) => job.uid === uid)
    }
    return [...this.printJobs]
  }

  addPrintJob(job: PrintJob): void {
    this.printJobs.push(job)
  }

  // Lamination Jobs
  getLaminationJobs(uid?: string): LaminationJob[] {
    if (uid) {
      return this.laminationJobs.filter((job) => job.uid === uid)
    }
    return [...this.laminationJobs]
  }

  addLaminationJob(job: LaminationJob): void {
    this.laminationJobs.push(job)
  }

  // Print Billing
  getPrintBilling(uid?: string): PrintBilling[] {
    if (uid) {
      return this.printBilling.filter((billing) => billing.uid === uid)
    }
    return [...this.printBilling]
  }

  updatePrintBilling(billingId: string, updates: Partial<PrintBilling>): void {
    const index = this.printBilling.findIndex((b) => b.billingId === billingId)
    if (index !== -1) {
      this.printBilling[index] = { ...this.printBilling[index], ...updates, lastUpdated: new Date() }
    }
  }

  // Lamination Billing
  getLaminationBilling(uid?: string): LaminationBilling[] {
    if (uid) {
      return this.laminationBilling.filter((billing) => billing.uid === uid)
    }
    return [...this.laminationBilling]
  }

  updateLaminationBilling(billingId: string, updates: Partial<LaminationBilling>): void {
    const index = this.laminationBilling.findIndex((b) => b.billingId === billingId)
    if (index !== -1) {
      this.laminationBilling[index] = { ...this.laminationBilling[index], ...updates, lastUpdated: new Date() }
    }
  }

  // Price Tables
  getPriceTables(): PriceTable[] {
    return [...this.priceTables]
  }

  getPriceTable(type: "printing" | "lamination"): PriceTable | null {
    return this.priceTables.find((pt) => pt.type === type && pt.isActive) || null
  }

  updatePriceTable(id: string, updates: Partial<PriceTable>): void {
    const index = this.priceTables.findIndex((pt) => pt.id === id)
    if (index !== -1) {
      this.priceTables[index] = { ...this.priceTables[index], ...updates, updatedAt: new Date() }
    }
  }
}

export const dummyDB = new DummyDatabase()
