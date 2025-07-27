"use client"

import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { useRouter, usePathname } from "next/navigation"
import { Printer, Settings, LogOut, UserIcon } from "lucide-react"
import Link from "next/link"
import { RoleBadge } from "@/components/role-badge"

export function Navigation() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  if (!user) return null

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  const navItems = [
    {
      href: "/dashboard",
      label: "Πίνακας Ελέγχου",
      icon: Printer,
      roles: ["user", "admin"],
    },
    {
      href: "/admin",
      label: "Διαχείριση",
      icon: Settings,
      roles: ["admin"],
    },
    {
      href: "/profile",
      label: "Προφίλ",
      icon: UserIcon,
      roles: ["user", "admin"],
    },
  ]

  const visibleItems = navItems.filter((item) => item.roles.includes(user.accessLevel))

  // Truncate username if too long
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + "..."
  }

  const displayUsername = truncateText(user.username, 8)
  const displayName = user.displayName && user.displayName !== user.username ? truncateText(user.displayName, 12) : null

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left: Title */}
          <div className="flex items-center">
            <Printer className="h-8 w-8 text-blue-600" />
            <span className="ml-2 text-xl font-bold text-gray-900 whitespace-nowrap">Σύστημα Χρέωσης</span>
          </div>

          {/* Center: Navigation Links */}
          <div className="hidden md:flex items-center space-x-4">
            {visibleItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                    isActive ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              )
            })}
          </div>

          {/* Right: User Information */}
          <div className="flex items-center space-x-4">
            <div className="flex flex-col items-end">
              <div className="flex items-center space-x-2">
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-700">{displayUsername}</div>
                  {displayName && <div className="text-xs text-gray-500">{displayName}</div>}
                </div>
                <RoleBadge accessLevel={user.accessLevel} className="text-xs" />
              </div>
            </div>

            <Button onClick={handleLogout} variant="outline" size="sm" className="whitespace-nowrap bg-transparent">
              <LogOut className="h-4 w-4 mr-2" />
              Αποσύνδεση
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
