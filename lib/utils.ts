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
