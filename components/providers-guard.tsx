"use client"
import type React from "react"
import Providers from "@/components/providers"
import { AuthProvider } from "@/lib/auth-context"
import { RefreshProvider } from "@/lib/refresh-context"
import { LoaderOverlayBridge } from "@/components/loader-overlay-bridge"
import { Toaster } from "@/components/ui/toaster"
import { usePathname } from "next/navigation"
import { useEffect } from "react"
import { useRefresh } from "@/lib/refresh-context"

// Avoid mounting heavy providers on lightweight public routes like /login
export function ProvidersGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isPublicLightRoute = pathname === "/login"

  // Internal component to run inside RefreshProvider
  function RouteSettle() {
    const { setLoading } = useRefresh()
    const p = usePathname()
    useEffect(() => {
      const rafId = requestAnimationFrame(() => setLoading(false))
      const timeoutId = setTimeout(() => setLoading(false), 1000)
      return () => {
        cancelAnimationFrame(rafId)
        clearTimeout(timeoutId)
      }
    }, [p, setLoading])
    return null
  }

  if (isPublicLightRoute) {
    // Keep login light, but enable global overlay to persist during navigation
    return (
      <RefreshProvider>
        <LoaderOverlayBridge>
          {children}
        </LoaderOverlayBridge>
        <RouteSettle />
        <Toaster />
      </RefreshProvider>
    )
  }

  return (
    <RefreshProvider>
      <LoaderOverlayBridge>
        <Providers>
          {children}
        </Providers>
      </LoaderOverlayBridge>
      <RouteSettle />
      <Toaster />
    </RefreshProvider>
  )
}


