"use client"

import React, { useEffect, useState } from "react"
import { Input } from "./input"
import { Label } from "./label"

interface GreekDateInputProps {
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

export function GreekDateInput({
  id,
  label,
  value,
  onChange,
  className,
  required = false,
  disabled = false,
  min,
  max,
}: GreekDateInputProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <Label htmlFor={id} className="text-sm font-medium">
          {label}
        </Label>
      )}
      <Input
        id={id}
        type="date"
        value={value}
        onChange={handleChange}
        lang="el-GR"
        required={required}
        disabled={disabled}
        min={min}
        max={max}
        className="greek-date-input"
        style={{
          // Force Greek date format display
          direction: 'ltr',
          ...(isClient && {
            // Add custom styling for Greek format
            '--date-format': 'dd/mm/yyyy'
          } as React.CSSProperties)
        }}
      />
    </div>
  )
} 