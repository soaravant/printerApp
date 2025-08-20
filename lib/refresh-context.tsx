"use client"

import React, { createContext, useContext, useState, useCallback } from 'react'

interface RefreshContextType {
  refreshTrigger: number
  triggerRefresh: () => void
  loading: boolean
  setLoading: (v: boolean) => void
}

const RefreshContext = createContext<RefreshContextType | undefined>(undefined)

export function RefreshProvider({ children }: { children: React.ReactNode }) {
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [loading, setLoading] = useState(false)

  const triggerRefresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1)
  }, [])

  return (
    <RefreshContext.Provider value={{ refreshTrigger, triggerRefresh, loading, setLoading }}>
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