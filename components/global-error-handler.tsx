"use client"

import { useEffect } from "react"

export function GlobalErrorHandler() {
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error("Unhandled promise rejection:", event.reason)
      event.preventDefault()
    }

    window.addEventListener("unhandledrejection", handleUnhandledRejection)
    return () => {
      window.removeEventListener("unhandledrejection", handleUnhandledRejection)
    }
  }, [])

  return null
}

