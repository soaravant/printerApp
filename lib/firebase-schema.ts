// Firebase Schema for Firestore (single source of truth)
// Central place to define collections and document shapes used by seed/clear scripts

// Keep Timestamp loosely typed to avoid coupling frontend bundle with admin SDK
export type Timestamp = any

// ============================================================================
// FIRESTORE COLLECTION NAMES (align with firestore.rules)
// ============================================================================
export const FIREBASE_COLLECTIONS = {
  USERS: "users",
  PRICE_TABLES: "priceTables",
  PRINT_JOBS: "printJobs",
  LAMINATION_JOBS: "laminationJobs",
  INCOME: "income",
  BANK: "bank",
  TRANSACTIONS: "transactions",
  BILLING: "billing",
  SETTINGS: "settings",
} as const

export type FirebaseCollectionName =
  (typeof FIREBASE_COLLECTIONS)[keyof typeof FIREBASE_COLLECTIONS]

// ============================================================================
// DOCUMENT SHAPES
// ============================================================================

// Users
export interface FirebaseUser {
  uid: string
  username: string
  displayName: string
  createdAt: Timestamp
  userRole: "Άτομο" | "Ομάδα" | "Ναός" | "Τομέας"
  memberOf?: string[]
  responsibleFor?: string[]
  accessLevel: "Χρήστης" | "Διαχειριστής" | "Υπεύθυνος"
  team?: string
  // For compatibility with current firestore.rules which check `role == 'admin'`
  role?: "admin" | "user"
  // Derived fields for convenience in UI
  printDebt?: number
  laminationDebt?: number
  totalDebt?: number
  // Last payment timestamp for quick UI access
  lastPayment?: Timestamp | null
}

// Price tables (current app uses 2: printing, lamination)
export interface FirebasePriceTable {
  id: string
  name: string
  prices: Record<string, number>
  isActive: boolean
  createdAt: Timestamp
  updatedAt: Timestamp
}

// Print job (simplified unified type/quantity structure)
export interface FirebasePrintJob {
  jobId: string
  uid: string
  username: string
  userDisplayName: string
  type:
    | "A4BW"
    | "A4Color"
    | "A3BW"
    | "A3Color"
    | "RizochartoA3"
    | "RizochartoA4"
    | "ChartoniA3"
    | "ChartoniA4"
    | "Autokollito"
  quantity: number
  pricePerUnit: number
  totalCost: number
  deviceIP: string
  deviceName: string
  timestamp: Timestamp
  status: "completed" | "pending" | "failed"
  // Optional printer account credentials used at device (username/password)
  printerAccountUsername?: string
  printerAccountPasswordHash?: string
  // Server-side creation time used for reliable delta syncs
  createdAt?: Timestamp
}

// Lamination job
export interface FirebaseLaminationJob {
  jobId: string
  uid: string
  username: string
  userDisplayName: string
  type: "A3" | "A4" | "A5" | "cards" | "spiral" | "colored_cardboard" | "plastic_cover"
  quantity: number
  pricePerUnit: number
  totalCost: number
  timestamp: Timestamp
  status: "completed" | "pending" | "failed"
  notes?: string
  // Server-side creation time used for reliable delta syncs
  createdAt?: Timestamp
}

// Income (payments)
export interface FirebaseIncome {
  incomeId: string
  uid: string
  username: string
  userDisplayName: string
  amount: number
  timestamp: Timestamp
  // Server-side creation time used for reliable delta syncs
  createdAt?: Timestamp
}

// Bank aggregates
export interface FirebaseBank {
  bankId: string
  printBank: number
  laminationBank: number
  timestamp: Timestamp
  lastUpdated: Timestamp
}

// Payment or other transaction (optional for future use)
export interface FirebaseTransaction {
  id: string
  uid: string
  type: "print" | "lamination" | "payment"
  amount: number
  description?: string
  status: "pending" | "completed" | "failed" | "cancelled"
  createdAt: Timestamp
}

// ============================================================================
// SCHEMA VALIDATION RESULT TYPE
// ============================================================================
export interface SchemaValidationResult {
  isValid: boolean
  errors: string[]
}