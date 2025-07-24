import { Badge } from "@/components/ui/badge"

interface RoleBadgeProps {
  role: "user" | "admin"
  className?: string
}

export function RoleBadge({ role, className = "" }: RoleBadgeProps) {
  const isAdmin = role === "admin"
  
  return (
    <Badge 
      className={`text-sm px-3 py-1 ${
        isAdmin 
          ? "bg-yellow-500 hover:bg-yellow-600 text-black" 
          : "bg-gray-500 hover:bg-gray-600 text-white"
      } ${className}`}
    >
      {isAdmin ? "Διαχειριστής" : "Χρήστης"}
    </Badge>
  )
} 