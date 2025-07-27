"use client"

import React, { useEffect, useState } from "react"
import { Input } from "./input"
import { Label } from "./label"
import { Calendar, X } from "lucide-react"
import { Button } from "./button"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"
import { Calendar as CalendarComponent } from "./calendar"

import { formatGreekDate, toLocalISOString } from "@/lib/utils"
import { cn } from "@/lib/utils"

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
  const [currentMonth, setCurrentMonth] = useState(new Date())

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (value) {
      const date = new Date(value)
      setDisplayValue(formatGreekDate(date))
      setCurrentMonth(date)
    } else {
      setDisplayValue("")
      // Reset to current month when no date is selected
      setCurrentMonth(new Date())
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

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange("")
    setDisplayValue("")
  }

  const selectedDate = value ? new Date(value) : undefined



  return (
    <div className={cn("", className)}>
      {label && (
        <Label htmlFor={id} className="text-gray-700">
          {label}
        </Label>
      )}
      
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <div className="flex items-center gap-2">
            {displayValue ? (
              // Show selected date with clear button
              <div className="flex items-center gap-2 flex-1">
                <Button
                  variant="outline"
                  className="justify-start text-left font-normal flex-1 h-10"
                  disabled={disabled}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {displayValue}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClear}
                  disabled={disabled}
                  className="h-10 w-10"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              // Show full-width button when no date selected
              <Button
                variant="outline"
                disabled={disabled}
                className="h-10 w-full justify-center"
              >
                <Calendar className="h-4 w-4" />
              </Button>
            )}
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <CalendarComponent
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            month={currentMonth}
            onMonthChange={setCurrentMonth}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  )
} 