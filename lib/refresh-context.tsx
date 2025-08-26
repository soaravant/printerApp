"use client"

import React, { createContext, useContext, useState, useCallback } from 'react'

interface RefreshContextType {
  refreshTrigger: number
  triggerRefresh: () => void
  loading: boolean
  setLoading: (v: boolean) => void
  loadingLabel?: string
  setLoadingLabel: (label?: string) => void
}

const RefreshContext = createContext<RefreshContextType | undefined>(undefined)

export function RefreshProvider({ children }: { children: React.ReactNode }) {
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [loading, setLoadingState] = useState(false)
  const [loadingLabel, setLoadingLabel] = useState<string | undefined>(undefined)

  const triggerRefresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1)
  }, [])

  const setLoading = useCallback((v: boolean) => {
    setLoadingState(v)
    if (!v) setLoadingLabel(undefined)
  }, [])

  return (
    <RefreshContext.Provider value={{ refreshTrigger, triggerRefresh, loading, setLoading, loadingLabel, setLoadingLabel }}>
      {children}
    </RefreshContext.Provider>
  )
}

export function useRefresh() {
  const context = useContext(RefreshContext)
  if (context === undefined) {
    throw new Error('useRefresh must be used within a RefreshProvider')
  }
  return context
} 