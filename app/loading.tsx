"use client"
import { useEffect } from "react"
import { AppLoader } from "@/components/ui/app-loader"
import { useRefresh } from "@/lib/refresh-context"

export default function Loading() {
  const { setLoading } = useRefresh()
  useEffect(() => {
    // When the route-level loader appears, hide the navigation overlay
    setLoading(false)
  }, [setLoading])
  return <AppLoader />
}


