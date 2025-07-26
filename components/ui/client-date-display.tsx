"use client"

import { useEffect, useState } from "react"

interface ClientDateDisplayProps {
  date: Date | string | number
  options?: Intl.DateTimeFormatOptions
  className?: string
}

export function ClientDateDisplay({ date, options, className }: ClientDateDisplayProps) {
  const [formattedDate, setFormattedDate] = useState<string>("")
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date
    setFormattedDate(dateObj.toLocaleDateString("el-GR", options))
  }, [date, options])

  // Show a placeholder during SSR to prevent hydration mismatch
  if (!isClient) {
    return <span className={className}>--/--/----</span>
  }

  return <span className={className}>{formattedDate}</span>
} 