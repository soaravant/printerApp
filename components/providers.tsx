"use client"
import React from "react"
import { AuthProvider } from "@/lib/auth-context"
import { ReactQueryProvider } from "@/lib/react-query"
import { GlobalErrorHandler } from "@/components/global-error-handler"

export default function Providers({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    if (typeof window === "undefined") return
    const idle = (cb: () => void) => {
      // Prefer idle time; fallback to a short timeout
      const ric: any = (window as any).requestIdleCallback
      if (typeof ric === "function") {
        ric(cb)
      } else {
        setTimeout(cb, 500)
      }
    }
    idle(() => {
      // Preload heavy dashboard tables to avoid loading spinners on route return
      import("@/components/print-jobs-table")
      import("@/components/income-table")
      import("@/components/lamination-jobs-table")
      import("@/components/debt-table")
    })
  }, [])
  return (
    <AuthProvider>
      <ReactQueryProvider>
        <GlobalErrorHandler />
        {children}
      </ReactQueryProvider>
    </AuthProvider>
  )
}


