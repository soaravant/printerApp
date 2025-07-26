import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/lib/auth-context"
import { RefreshProvider } from "@/lib/refresh-context"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Σύστημα Χρέωσης Εκτυπωτών",
  description: "Παρακολούθηση και χρέωση χρήσης εκτυπωτών και πλαστικοποιήσεων",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Add global error handler for unhandled promise rejections
  if (typeof window !== "undefined") {
    window.addEventListener("unhandledrejection", (event) => {
      console.error("Unhandled promise rejection:", event.reason)
      event.preventDefault()
    })
  }

  return (
    <html lang="el">
      <body className={inter.className}>
        <AuthProvider>
          <RefreshProvider>
            {children}
            <Toaster />
          </RefreshProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
