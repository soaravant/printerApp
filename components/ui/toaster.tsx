"use client"

import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { X } from "lucide-react"
import { useEffect, useState } from "react"

// Custom ToastClose component with circular progress animation
function AnimatedToastClose({ onClose, isPaused }: { 
  onClose: () => void
  isPaused: boolean
}) {
  const duration = 4000 // 4 seconds
  const [progress, setProgress] = useState(100)
  const [remainingTime, setRemainingTime] = useState(duration)

  useEffect(() => {
    if (isPaused) return

    const startTime = Date.now()
    const endTime = startTime + remainingTime

    const updateProgress = () => {
      if (isPaused) return

      const now = Date.now()
      const remaining = Math.max(0, endTime - now)
      const newProgress = (remaining / duration) * 100
      setProgress(newProgress)
      setRemainingTime(remaining)

      if (remaining > 0) {
        requestAnimationFrame(updateProgress)
      } else {
        // Add a delay to allow the exit animation to complete
        // The toast uses fade-out-80 and slide-out-to-right-full animations
        // which typically take 150-200ms, so we use 250ms to be safe
        setTimeout(() => {
          onClose()
        }, 250) // 250ms delay to ensure exit animation completes
      }
    }

    const animationId = requestAnimationFrame(updateProgress)
    return () => cancelAnimationFrame(animationId)
  }, [duration, onClose, isPaused, remainingTime])

  const radius = 12
  const circumference = 2 * Math.PI * radius
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <button
      onClick={onClose}
      className="absolute right-2 top-2 rounded-full p-1 text-black opacity-100 transition-opacity hover:bg-gray-100 focus:outline-none focus:ring-2"
    >
      <svg
        className="h-6 w-6 transform -rotate-90"
        viewBox="0 0 32 32"
      >
        {/* Background circle */}
        <circle
          cx="16"
          cy="16"
          r={radius}
          stroke="rgba(0, 0, 0, 0.1)"
          strokeWidth="2"
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx="16"
          cy="16"
          r={radius}
          stroke="black"
          strokeWidth="2"
          fill="none"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>
      <X className="h-4 w-4 absolute inset-0 m-auto" />
    </button>
  )
}

// Custom Toast wrapper with hover pause functionality
function AnimatedToast({ id, title, description, action, variant, onClose, ...props }: any) {
  const [isPaused, setIsPaused] = useState(false)

  const handleMouseEnter = () => {
    setIsPaused(true)
  }

  const handleMouseLeave = () => {
    setIsPaused(false)
  }

  return (
    <Toast 
      variant={variant} 
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      <div className="grid gap-1">
        {title && (
          <div className={
            variant === "success" ? "bg-green-50 -m-6 -mb-0 p-6 pb-2" :
            variant === "destructive" ? "bg-red-50 -m-6 -mb-0 p-6 pb-2" :
            ""
          }>
            <ToastTitle className={
              variant === "success" ? "text-green-800" :
              variant === "destructive" ? "text-red-800" :
              ""
            }>
              {title}
            </ToastTitle>
          </div>
        )}
        {description && (
          <div className={
            variant === "success" ? "bg-white -m-6 mt-0 p-6 pt-2 -mr-8" :
            variant === "destructive" ? "bg-white -m-6 mt-0 p-6 pt-2 -mr-8" :
            ""
          }>
            <ToastDescription className={
              variant === "success" ? "text-black" :
              variant === "destructive" ? "text-black" :
              ""
            }>
              {description}
            </ToastDescription>
          </div>
        )}
      </div>
      {action}
      <AnimatedToastClose onClose={onClose} isPaused={isPaused} />
    </Toast>
  )
}

export function Toaster() {
  const { toasts, dismiss } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        return (
          <AnimatedToast 
            key={id} 
            id={id}
            title={title}
            description={description}
            action={action}
            variant={variant}
            onClose={() => dismiss(id)}
            {...props}
          />
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
