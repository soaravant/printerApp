import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Normalize Greek text by removing diacritics (τόνοι) and lowercasing
// Example: "Άγγελος" -> "αγγελος"
export function normalizeGreek(input: string): string {
  return input
    .normalize("NFD")
    .replace(/\p{Diacritic}+/gu, "")
    .toLowerCase()
}

/**
 * Formats a date in Greek locale (el-GR)
 * @param date - Date to format
 * @param options - Intl.DateTimeFormatOptions for custom formatting
 * @returns Formatted date string in Greek format
 */
export function formatGreekDate(date: Date | string | number, options?: Intl.DateTimeFormatOptions): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date
  return dateObj.toLocaleDateString("el-GR", options)
}

/**
 * Formats a date in Greek locale with time
 * @param date - Date to format
 * @param options - Intl.DateTimeFormatOptions for custom formatting
 * @returns Formatted date and time string in Greek format
 */
export function formatGreekDateTime(date: Date | string | number, options?: Intl.DateTimeFormatOptions): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date
  return dateObj.toLocaleString("el-GR", options)
}

/**
 * Converts a date to ISO date string (YYYY-MM-DD) without timezone issues
 * @param date - Date to convert
 * @returns ISO date string in local timezone
 */
export function toLocalISOString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Money calculation utilities to prevent floating-point precision errors
 * and ensure consistent 2-decimal place rounding for currency values.
 */

/**
 * Rounds a number to exactly 2 decimal places for money calculations.
 * This prevents floating-point precision errors that can cause 1 cent overflows.
 * 
 * @param value - The number to round
 * @returns The number rounded to 2 decimal places
 */
export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

/**
 * Adds multiple money values together with proper rounding to prevent precision errors.
 * 
 * @param values - Array of money values to add
 * @returns The sum rounded to 2 decimal places
 */
export function addMoney(...values: number[]): number {
  const sum = values.reduce((acc, val) => acc + val, 0)
  return roundMoney(sum)
}

/**
 * Multiplies a money value by a quantity with proper rounding.
 * 
 * @param price - The price per unit
 * @param quantity - The quantity
 * @returns The total cost rounded to 2 decimal places
 */
export function multiplyMoney(price: number, quantity: number): number {
  return roundMoney(price * quantity)
}

/**
 * Subtracts one money value from another with proper rounding.
 * 
 * @param total - The total amount
 * @param paid - The amount paid
 * @returns The remaining balance rounded to 2 decimal places
 */
export function subtractMoney(total: number, paid: number): number {
  return roundMoney(total - paid)
}

/**
 * Formats a money value for display with proper Greek formatting.
 * 
 * @param value - The money value to format
 * @returns Formatted string with € symbol and comma as decimal separator
 */
export function formatMoney(value: number): string {
  return `€${roundMoney(value).toFixed(2).replace('.', ',')}`
}

/**
 * Calculates the total cost for a print job with proper rounding.
 * 
 * @param costs - Object containing individual cost components
 * @returns The total cost rounded to 2 decimal places
 */
export function calculatePrintJobTotal(costs: {
  costA4BW: number
  costA4Color: number
  costA3BW: number
  costA3Color: number
  costRizochartoA3: number
  costRizochartoA4: number
  costChartoniA3: number
  costChartoniA4: number
  costAutokollito: number
}): number {
  return addMoney(
    costs.costA4BW,
    costs.costA4Color,
    costs.costA3BW,
    costs.costA3Color,
    costs.costRizochartoA3,
    costs.costRizochartoA4,
    costs.costChartoniA3,
    costs.costChartoniA4,
    costs.costAutokollito
  )
}

/**
 * Calculates individual costs for print job components with proper rounding.
 * 
 * @param pages - Number of pages
 * @param pricePerPage - Price per page
 * @returns The cost rounded to 2 decimal places
 */
export function calculatePrintCost(pages: number, pricePerPage: number): number {
  return multiplyMoney(pricePerPage, pages)
}

// Utility functions for dynamic filter options
export const getDynamicFilterOptions = (users: any[]) => {
  const teams = new Set<string>()
  const naoi = new Set<string>()
  const tomeis = new Set<string>()

  users.forEach(user => {
    // Extract teams from user data
    if (user.team) {
      teams.add(user.team)
    }
    
    // Extract τμήματα from user data (users with userRole "Τμήμα")
    if (user.userRole === "Τμήμα") {
      naoi.add(user.displayName)
    }
    
    // Extract τομείς from user data (users with userRole "Τομέας")
    if (user.userRole === "Τομέας") {
      tomeis.add(user.displayName)
    }
    
    // Also extract from memberOf arrays for individual users
    if (user.memberOf && Array.isArray(user.memberOf)) {
      user.memberOf.forEach((member: string) => {
        if (member.includes("Ναός") || member.includes("Τμήμα")) {
          naoi.add(member)
        } else if (member.includes("Τομέας")) {
          tomeis.add(member)
        } else {
          // Assume it's a team if it doesn't contain "Ναός"/"Τμήμα" or "Τομέας"
          teams.add(member)
        }
      })
    }
  })

  // Define the specific order for teams
  const teamOrder = [
    "Ομάδα 1",
    "Ομάδα 2",
    "Ομάδα 3",
    "Ομάδα 4",
    "Ομάδα 5",
    "Ομάδα 6",
    "Ομάδα 7",
    "Ομάδα 8",
  ]

  // Sort teams according to the predefined order, with any additional teams at the end
  const sortedTeams = Array.from(teams).sort((a, b) => {
    const aIndex = teamOrder.indexOf(a)
    const bIndex = teamOrder.indexOf(b)
    
    // If both teams are in the predefined order, sort by their position
    if (aIndex !== -1 && bIndex !== -1) {
      return aIndex - bIndex
    }
    
    // If only one team is in the predefined order, prioritize it
    if (aIndex !== -1) return -1
    if (bIndex !== -1) return 1
    
    // If neither team is in the predefined order, sort alphabetically
    return a.localeCompare(b)
  })

  return {
    teams: sortedTeams,
    naoi: Array.from(naoi).sort(),
    tomeis: Array.from(tomeis).sort()
  }
}
