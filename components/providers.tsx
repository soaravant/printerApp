"use client"
import type React from "react"
import { AuthProvider } from "@/lib/auth-context"
import { ReactQueryProvider } from "@/lib/react-query"
import { GlobalErrorHandler } from "@/components/global-error-handler"

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ReactQueryProvider>
        <GlobalErrorHandler />
        {children}
      </ReactQueryProvider>
    </AuthProvider>
  )
}


