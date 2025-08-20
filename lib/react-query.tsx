"use client"
import React from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

let client: QueryClient | null = null

export function ReactQueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(() => {
    if (!client) {
      client = new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            gcTime: 10 * 60 * 1000, // 10 minutes
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
    }
    return client
  })
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}


