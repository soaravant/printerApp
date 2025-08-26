import React from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

type ClearableInputProps = React.ComponentPropsWithoutRef<typeof Input> & {
  onClear?: () => void
  hasValue?: boolean
}

export const ClearableInput = React.forwardRef<HTMLInputElement, ClearableInputProps>(
  ({ value, onClear, className, hasValue, ...props }, ref) => {
    const computedHasValue =
      typeof hasValue === "boolean"
        ? hasValue
        : typeof value === "string"
          ? value.length > 0
          : value !== undefined && value !== null && String(value).length > 0

    const handleClear = React.useCallback(() => {
      if (onClear) {
        onClear()
      } else if (props.onChange) {
        const event = { target: { value: "" } } as React.ChangeEvent<HTMLInputElement>
        props.onChange(event)
      }
      if (ref && typeof ref !== "function") {
        try {
          ref.current?.focus()
        } catch {}
      }
    }, [onClear, props, ref])

    return (
      <div className="relative">
        <Input
          ref={ref}
          {...props}
          value={value as any}
          className={`${className || ""} ${computedHasValue ? "pr-10" : ""}`}
        />
        {computedHasValue && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100"
            onClick={handleClear}
            aria-label="Clear input"
            tabIndex={-1}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    )
  }
)

ClearableInput.displayName = "ClearableInput"


