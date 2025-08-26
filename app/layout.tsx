import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ProvidersGuard } from "@/components/providers-guard"

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
        <ProvidersGuard>
          {children}
        </ProvidersGuard>
      </body>
    </html>
  )
}
