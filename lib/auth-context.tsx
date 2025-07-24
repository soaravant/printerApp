"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { dummyDB, type User } from "./dummy-database"

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (username: string, password: string) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Hardcoded passwords for demo
const USER_PASSWORDS: Record<string, string> = {
  "408": "08",
  "409": "09",
  admin: "admin123",
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in from localStorage
    if (typeof window !== "undefined") {
      const savedUserId = localStorage.getItem("currentUserId")
      if (savedUserId) {
        const savedUser = dummyDB.getUserById(savedUserId)
        if (savedUser) {
          setUser(savedUser)
        } else {
          localStorage.removeItem("currentUserId")
        }
      }
    }
    setLoading(false)
  }, [])

  const signIn = async (username: string, password: string): Promise<boolean> => {
    const correctPassword = USER_PASSWORDS[username]

    if (correctPassword && correctPassword === password) {
      const user = dummyDB.getUserByUsername(username)
      if (user) {
        setUser(user)
        if (typeof window !== "undefined") {
          localStorage.setItem("currentUserId", user.uid)
        }
        return true
      }
    }

    return false
  }

  const logout = () => {
    setUser(null)
    if (typeof window !== "undefined") {
      localStorage.removeItem("currentUserId")
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
