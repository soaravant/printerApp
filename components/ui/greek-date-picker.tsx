"use client"

import React, { useEffect, useState } from "react"
import { Input } from "./input"
import { Label } from "./label"
import { Calendar } from "lucide-react"
import { Button } from "./button"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"
import { Calendar as CalendarComponent } from "./calendar"
import { formatGreekDate, toLocalISOString } from "@/lib/utils"

interface GreekDatePickerProps {
  id: string
  label?: string
  value: string
  onChange: (value: string) => void
  className?: string
  required?: boolean
  disabled?: boolean
  min?: string
  max?: string
}

export function GreekDatePicker({
  id,
  label,
  value,
  onChange,
  className,
  required = false,
  disabled = false,
  min,
  max,
}: GreekDatePickerProps) {
  const [isClient, setIsClient] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [displayValue, setDisplayValue] = useState("")

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (value) {
      const date = new Date(value)
      setDisplayValue(formatGreekDate(date))
    } else {
      setDisplayValue("")
    }
  }, [value])

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      // Use local date formatting to avoid timezone issues
      const isoDate = toLocalISOString(date)
      onChange(isoDate)
      setIsOpen(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    setDisplayValue(inputValue)
    
    // Try to parse the Greek format input
    const parts = inputValue.split('/')
    if (parts.length === 3) {
      const [dayStr, monthStr, yearStr] = parts
      const date = new Date(parseInt(yearStr), parseInt(monthStr) - 1, parseInt(dayStr))
      if (!isNaN(date.getTime())) {
        // Use local date formatting to avoid timezone issues
        const isoDate = toLocalISOString(date)
        onChange(isoDate)
      }
    }
  }

  const selectedDate = value ? new Date(value) : undefined

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <Label htmlFor={id} className="text-sm font-medium">
          {label}
        </Label>
      )}
      
      <div className="flex gap-2">
        <Input
          id={id}
          type="text"
          value={displayValue}
          onChange={handleInputChange}
          placeholder="ηη/μμ/εεεε"
          required={required}
          disabled={disabled}
          className="flex-1"
          style={{ direction: 'ltr' }}
        />
        
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              disabled={disabled}
              className="shrink-0"
            >
              <Calendar className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <CalendarComponent
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
} 