"use client"
import React from "react"
import { OverlayLoader } from "@/components/ui/overlay-loader"
import { useRefresh } from "@/lib/refresh-context"

export function LoaderOverlayBridge({ children }: { children: React.ReactNode }) {
  const { loading, loadingLabel } = useRefresh()
  return (
    <>
      {children}
      <OverlayLoader show={loading} label={loadingLabel} />
    </>
  )
}


