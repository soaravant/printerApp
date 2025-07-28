import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
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
  costRizocharto: number
  costChartoni: number
  costAutokollito: number
}): number {
  return addMoney(
    costs.costA4BW,
    costs.costA4Color,
    costs.costA3BW,
    costs.costA3Color,
    costs.costRizocharto,
    costs.costChartoni,
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
