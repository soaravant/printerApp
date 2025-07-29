// Firebase Schema and Populate Script for Printer Management System
// Based on existing data models from dummy-database.ts

import { roundMoney, calculatePrintCost, calculatePrintJobTotal, multiplyMoney } from "./utils"

// Firebase Timestamp type - will be replaced with actual Firebase import when Firebase is installed
type Timestamp = any

// ============================================================================
// FIREBASE SCHEMA DEFINITIONS
// ============================================================================

/**
 * Users Collection Schema
 * Collection: 'users'
 */
export interface FirebaseUser {
  uid: string // Document ID (matches Firebase Auth UID)
  username: string // Login username (400, 401, etc.)
  displayName: string
  createdAt: Timestamp
  userRole: "Άτομο" | "Ομάδα" | "Ναός" | "Τομέας"
  memberOf?: string[] // Team or group memberships
  responsiblePerson?: string // Who is responsible for this user
  responsibleFor?: string[] // Users this person is responsible for
  accessLevel: "user" | "responsible" | "admin"
}

/**
 * Products Collection Schema
 * Collection: 'products'
 */
export interface FirebaseProduct {
  id: string // Document ID
  name: string
  category: "printing" | "lamination" | "bookbinding"
  type: "a4BW" | "a4Color" | "a3BW" | "a3Color" | "rizocharto" | "chartoni" | "autokollito" | "A3" | "A4" | "A5" | "cards" | "spiral" | "colored_cardboard" | "plastic_cover"
  price: number
  isActive: boolean
}

/**
 * Transactions Collection Schema
 * Collection: 'transactions'
 */
export interface FirebaseTransaction {
  id: string // Document ID
  uid: string // Reference to user
  type: "print" | "lamination" | "bookbinding" | "payment"
  amount: number
  description: string
  status: "pending" | "completed" | "failed" | "cancelled"
  createdAt: Timestamp
  completedAt?: Timestamp
  paymentMethod?: "cash" | "card" | "transfer"
  reference?: string // For linking to specific jobs or billing
  notes?: string
}

/**
 * Prints Collection Schema
 * Collection: 'prints'
 */
export interface FirebasePrint {
  id: string // Document ID
  uid: string // Reference to user
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
  costA4BW: number
  costA4Color: number
  costA3BW: number
  costA3Color: number
  costRizocharto: number
  costChartoni: number
  costAutokollito: number
  totalCost: number
  status: "completed" | "pending" | "failed"
  createdAt: Timestamp
  completedAt?: Timestamp
  notes?: string
  transactionId?: string // Reference to transaction
}

/**
 * Laminations Collection Schema
 * Collection: 'laminations'
 */
export interface FirebaseLamination {
  id: string // Document ID
  uid: string // Reference to user
  username: string
  userDisplayName: string
  type: "A3" | "A4" | "A5" | "cards" | "spiral" | "colored_cardboard" | "plastic_cover"
  quantity: number
  pricePerUnit: number
  totalCost: number
  status: "completed" | "pending" | "failed"
  createdAt: Timestamp
  completedAt?: Timestamp
  notes?: string
  transactionId?: string // Reference to transaction
}

// ============================================================================
// FIREBASE COLLECTION NAMES
// ============================================================================

export const FIREBASE_COLLECTIONS = {
  USERS: 'users',
  PRODUCTS: 'products',
  TRANSACTIONS: 'transactions',
  PRINTS: 'prints',
  LAMINATIONS: 'laminations'
} as const

// ============================================================================
// UTILITY TYPES FOR FIREBASE OPERATIONS
// ============================================================================

export type FirebaseCollectionName = typeof FIREBASE_COLLECTIONS[keyof typeof FIREBASE_COLLECTIONS]

export interface FirebaseDocument {
  id: string
  [key: string]: any
}

// ============================================================================
// SCHEMA VALIDATION TYPES
// ============================================================================

export interface SchemaValidationResult {
  isValid: boolean
  errors: string[]
}

// ============================================================================
// SCHEMA COMPLETE
// ============================================================================ 