"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { User, Shield } from "lucide-react"

const demoAccounts = [
  {
    email: "admin@demo.com",
    password: "demo123",
    name: "Demo Admin",
    role: "admin",
    department: "IT",
  },
  {
    email: "alice@demo.com",
    password: "demo123",
    name: "Alice Cooper",
    role: "user",
    department: "Marketing",
  },
  {
    email: "bob@demo.com",
    password: "demo123",
    name: "Bob Smith",
    role: "user",
    department: "Engineering",
  },
]

interface DemoLoginProps {
  onLogin: (email: string, password: string) => void
  loading: boolean
}

export function DemoLogin({ onLogin, loading }: DemoLoginProps) {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Demo Accounts</CardTitle>
        <CardDescription>Click to login with pre-configured demo accounts</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {demoAccounts.map((account) => (
          <div key={account.email} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
            <div className="flex items-center gap-3">
              {account.role === "admin" ? (
                <Shield className="h-4 w-4 text-blue-500" />
              ) : (
                <User className="h-4 w-4 text-gray-500" />
              )}
              <div>
                <p className="font-medium text-sm">{account.name}</p>
                <p className="text-xs text-gray-500">{account.department}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={account.role === "admin" ? "default" : "secondary"}>{account.role}</Badge>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onLogin(account.email, account.password)}
                disabled={loading}
              >
                Login
              </Button>
            </div>
          </div>
        ))}
        <div className="text-xs text-gray-500 mt-4 p-2 bg-gray-50 rounded">
          <strong>Note:</strong> These are demo accounts. In production, users would create their own accounts through
          the sign-up process.
        </div>
      </CardContent>
    </Card>
  )
}
