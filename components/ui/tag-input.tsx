"use client"

import React, { useState, useRef, useEffect } from "react"
import { X, Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"

interface TagInputProps {
  tags: string[]
  onTagsChange: (tags: string[]) => void
  placeholder?: string
  availableOptions: string[]
  maxTags?: number
  disabled?: boolean
}

export function TagInput({
  tags,
  onTagsChange,
  placeholder = "Προσθήκη ετικέτας...",
  availableOptions,
  maxTags = 10,
  disabled = false,
}: TagInputProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const filteredOptions = availableOptions.filter(
    (option) =>
      !tags.includes(option) &&
      option.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const addTag = (tag: string) => {
    if (!tags.includes(tag) && tags.length < maxTags) {
      onTagsChange([...tags, tag])
      setSearchTerm("")
      setIsOpen(false)
    }
  }

  const removeTag = (tagToRemove: string) => {
    onTagsChange(tags.filter((tag) => tag !== tagToRemove))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && searchTerm.trim()) {
      e.preventDefault()
      addTag(searchTerm.trim())
    } else if (e.key === "Backspace" && !searchTerm && tags.length > 0) {
      removeTag(tags[tags.length - 1])
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    if (!isOpen) setIsOpen(true)
  }

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 min-h-[40px] p-2 border border-gray-200 rounded-md bg-white">
        {tags.map((tag) => (
          <Badge
            key={tag}
            variant="secondary"
            className="flex items-center gap-1 px-2 py-1 text-sm"
          >
            {tag}
            {!disabled && (
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-gray-200"
                onClick={() => removeTag(tag)}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </Badge>
        ))}
        
        {tags.length < maxTags && !disabled && (
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-6 px-2 text-xs border-dashed"
              >
                <Plus className="h-3 w-3 mr-1" />
                Προσθήκη
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="start">
              <div className="p-3 border-b">
                <Input
                  ref={inputRef}
                  placeholder={placeholder}
                  value={searchTerm}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  className="border-0 focus-visible:ring-0 p-0 h-8"
                />
              </div>
              <ScrollArea className="h-48">
                <div className="p-1">
                  {filteredOptions.length > 0 ? (
                    filteredOptions.map((option) => (
                      <Button
                        key={option}
                        variant="ghost"
                        className="w-full justify-start text-left h-8 px-2 text-sm"
                        onClick={() => addTag(option)}
                      >
                        {option}
                      </Button>
                    ))
                  ) : (
                    <div className="p-2 text-sm text-gray-500 text-center">
                      Δεν βρέθηκαν αποτελέσματα
                    </div>
                  )}
                </div>
              </ScrollArea>
            </PopoverContent>
          </Popover>
        )}
      </div>
      
      {tags.length >= maxTags && (
        <p className="text-xs text-gray-500">
          Μέγιστος αριθμός ετικετών: {maxTags}
        </p>
      )}
    </div>
  )
} 