"use client"

import type React from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAdmin?: boolean
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login")
        return
      }

      if (requireAdmin && user.accessLevel !== "Διαχειριστής" && user.accessLevel !== "Υπεύθυνος") {
        router.push("/dashboard")
        return
      }
    }
  }, [user, loading, requireAdmin, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!user || (requireAdmin && user.accessLevel !== "Διαχειριστής" && user.accessLevel !== "Υπεύθυνος")) {
    return null
  }

  return <>{children}</>
}
