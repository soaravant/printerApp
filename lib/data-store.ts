// Simple in-memory data store for demo purposes
// In production, this would be replaced with a real database

export interface User {
  uid: string
  username: string
  role: "user" | "admin"
  displayName: string
  department: string
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

export interface BillingRecord {
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
  paidAmount?: number
  remainingBalance: number
  dueDate: Date
  generatedAt: Date
  lastUpdated: Date
}

export interface PriceTable {
  id: string
  name: string
  prices: {
    a4BW: number
    a4Color: number
    a3BW: number
    a3Color: number
    scan: number
    copy: number
  }
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// Simple data storage using localStorage
class DataStore {
  private getFromStorage<T>(key: string): T[] {
    if (typeof window === "undefined") return []
    const data = localStorage.getItem(key)
    return data
      ? JSON.parse(data, (key, value) => {
          // Convert date strings back to Date objects
          if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
            return new Date(value)
          }
          return value
        })
      : []
  }

  private saveToStorage<T>(key: string, data: T[]): void {
    if (typeof window === "undefined") return
    localStorage.setItem(key, JSON.stringify(data))
  }

  // Users
  getUsers(): User[] {
    return this.getFromStorage<User>("users")
  }

  saveUsers(users: User[]): void {
    this.saveToStorage("users", users)
  }

  // Print Jobs
  getPrintJobs(): PrintJob[] {
    return this.getFromStorage<PrintJob>("printJobs")
  }

  savePrintJobs(jobs: PrintJob[]): void {
    this.saveToStorage("printJobs", jobs)
  }

  addPrintJob(job: PrintJob): void {
    const jobs = this.getPrintJobs()
    jobs.push(job)
    this.savePrintJobs(jobs)
  }

  // Billing Records
  getBillingRecords(): BillingRecord[] {
    return this.getFromStorage<BillingRecord>("billingRecords")
  }

  saveBillingRecords(records: BillingRecord[]): void {
    this.saveToStorage("billingRecords", records)
  }

  updateBillingRecord(billingId: string, updates: Partial<BillingRecord>): void {
    const records = this.getBillingRecords()
    const index = records.findIndex((r) => r.billingId === billingId)
    if (index !== -1) {
      records[index] = { ...records[index], ...updates, lastUpdated: new Date() }
      this.saveBillingRecords(records)
    }
  }

  // Price Tables
  getPriceTables(): PriceTable[] {
    return this.getFromStorage<PriceTable>("priceTables")
  }

  savePriceTables(tables: PriceTable[]): void {
    this.saveToStorage("priceTables", tables)
  }

  addPriceTable(table: PriceTable): void {
    const tables = this.getPriceTables()
    // Αν υπάρχει ήδη τιμοκατάλογος με το ίδιο ID, αντικατάστησέ τον
    const existingIndex = tables.findIndex((t) => t.id === table.id)
    if (existingIndex !== -1) {
      tables[existingIndex] = table
    } else {
      tables.push(table)
    }
    this.savePriceTables(tables)
  }

  updatePriceTable(id: string, updates: Partial<PriceTable>): void {
    const tables = this.getPriceTables()
    const index = tables.findIndex((t) => t.id === id)
    if (index !== -1) {
      tables[index] = { ...tables[index], ...updates, updatedAt: new Date() }
      this.savePriceTables(tables)
    }
  }

  // Βοηθητικές μέθοδοι για στατιστικά
  getTotalCostForUser(uid: string): number {
    const jobs = this.getPrintJobs().filter((job) => job.uid === uid)
    return jobs.reduce((total, job) => total + job.totalCost, 0)
  }

  getUnpaidAmountForUser(uid: string): number {
    const billingRecords = this.getBillingRecords().filter((record) => record.uid === uid && !record.paid)
    return billingRecords.reduce((total, record) => total + record.remainingBalance, 0)
  }

  getJobsCountForUser(uid: string): number {
    return this.getPrintJobs().filter((job) => job.uid === uid).length
  }

  // Καθαρισμός όλων των δεδομένων
  clearAllData(): void {
    if (typeof window === "undefined") return
    localStorage.removeItem("users")
    localStorage.removeItem("printJobs")
    localStorage.removeItem("billingRecords")
    localStorage.removeItem("priceTables")
  }
}

export const dataStore = new DataStore()
