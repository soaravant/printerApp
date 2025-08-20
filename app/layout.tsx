import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/lib/auth-context"
import { RefreshProvider } from "@/lib/refresh-context"
import { Toaster } from "@/components/ui/toaster"
import { ReactQueryProvider } from "@/lib/react-query"
import { GlobalErrorHandler } from "@/components/global-error-handler"
import { LoaderOverlayBridge } from "@/components/loader-overlay-bridge"

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
  return (
    <html lang="el" suppressHydrationWarning>
      <body className={inter.className}>
        <AuthProvider>
          <ReactQueryProvider>
            <RefreshProvider>
              <GlobalErrorHandler />
              <LoaderOverlayBridge>
                {children}
              </LoaderOverlayBridge>
              <Toaster />
            </RefreshProvider>
          </ReactQueryProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
