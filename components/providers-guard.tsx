"use client"
import type React from "react"
import Providers from "@/components/providers"
import { AuthProvider } from "@/lib/auth-context"
import { RefreshProvider } from "@/lib/refresh-context"
import { LoaderOverlayBridge } from "@/components/loader-overlay-bridge"
import { Toaster } from "@/components/ui/toaster"
import { usePathname } from "next/navigation"

// Avoid mounting heavy providers on lightweight public routes like /login
export function ProvidersGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isPublicLightRoute = pathname === "/login"

  if (isPublicLightRoute) {
    // Keep login light, but enable global overlay to persist during navigation
    return (
      <RefreshProvider>
        <LoaderOverlayBridge>
          {children}
        </LoaderOverlayBridge>
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
      <Toaster />
    </RefreshProvider>
  )
}


