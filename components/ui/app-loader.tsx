import React from "react"

type AppLoaderProps = {
  label?: string
}

export function AppLoader({ label = "Φόρτωση εφαρμογής..." }: AppLoaderProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-white to-slate-100 dark:from-slate-900 dark:to-slate-950">
      <div role="status" aria-live="polite" className="flex flex-col items-center gap-5">
        <div className="relative flex h-16 w-16 items-center justify-center">
          <svg className="h-14 w-14 text-primary/20" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
          </svg>
          <svg className="absolute h-14 w-14 animate-spin text-primary" viewBox="0 0 24 24">
            <path fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
          </svg>
        </div>
        <div className="flex flex-col items-center">
          <p className="text-sm font-medium text-foreground/80">{label}</p>
          <div className="mt-3 flex items-end gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-primary/80 [animation-delay:-0.2s] animate-bounce"></span>
            <span className="h-2 w-2 rounded-full bg-primary animate-bounce"></span>
            <span className="h-1.5 w-1.5 rounded-full bg-primary/80 [animation-delay:0.2s] animate-bounce"></span>
          </div>
        </div>
      </div>
    </div>
  )
}


