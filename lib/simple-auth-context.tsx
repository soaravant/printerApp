"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"

interface User {
  uid: string
  username: string
  role: "user" | "admin"
  displayName: string
  department: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (username: string, password: string) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Hardcoded users for simplicity
const USERS: Record<string, { password: string; user: User }> = {
  "408": {
    password: "08",
    user: {
      uid: "user-408",
      username: "408",
      role: "user",
      displayName: "Χρήστης 408",
      department: "Γραφείο Α",
    },
  },
  "409": {
    password: "09",
    user: {
      uid: "user-409",
      username: "409",
      role: "user",
      displayName: "Χρήστης 409",
      department: "Γραφείο Β",
    },
  },
  admin: {
    password: "admin123",
    user: {
      uid: "admin-001",
      username: "admin",
      role: "admin",
      displayName: "Διαχειριστής",
      department: "Πληροφορική",
    },
  },
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in from localStorage
    if (typeof window !== "undefined") {
      const savedUser = localStorage.getItem("currentUser")
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser))
        } catch (error) {
          localStorage.removeItem("currentUser")
        }
      }
    }
    setLoading(false)
  }, [])

  const signIn = async (username: string, password: string): Promise<boolean> => {
    const userRecord = USERS[username]

    if (userRecord && userRecord.password === password) {
      setUser(userRecord.user)
      if (typeof window !== "undefined") {
        localStorage.setItem("currentUser", JSON.stringify(userRecord.user))
      }
      return true
    }

    return false
  }

  const logout = () => {
    setUser(null)
    if (typeof window !== "undefined") {
      localStorage.removeItem("currentUser")
    }
  }

  return <AuthContext.Provider value={{ user, loading, signIn, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
