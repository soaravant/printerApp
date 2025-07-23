"use client"

import { useEffect, useState } from "react"
import { dataStore } from "@/lib/data-store"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import type { User } from "@/lib/data-store"

export function AdminUserTable() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    // Load users from localStorage
    const allUsers = dataStore.getUsers()
    setUsers(allUsers)
    setLoading(false)
  }, [])

  const toggleUserRole = async (uid: string, currentRole: "user" | "admin") => {
    try {
      const newRole = currentRole === "user" ? "admin" : "user"
      const updatedUsers = users.map((user) => (user.uid === uid ? { ...user, role: newRole } : user))

      dataStore.saveUsers(updatedUsers)
      setUsers(updatedUsers)

      toast({
        title: "Success",
        description: `User role updated to ${newRole}`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return <div className="text-center py-4">Loading users...</div>
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">No users found. Click "Demo Data" to generate test users.</div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Username</TableHead>
          <TableHead>Department</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.uid}>
            <TableCell>{user.displayName}</TableCell>
            <TableCell className="font-mono">{user.username}</TableCell>
            <TableCell>{user.department}</TableCell>
            <TableCell>
              <Badge variant={user.role === "admin" ? "default" : "secondary"}>{user.role}</Badge>
            </TableCell>
            <TableCell>
              <Button size="sm" variant="outline" onClick={() => toggleUserRole(user.uid, user.role)}>
                Make {user.role === "user" ? "Admin" : "User"}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
