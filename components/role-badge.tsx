import { Badge } from "@/components/ui/badge"

interface RoleBadgeProps {
  accessLevel: "user" | "admin"
  className?: string
}

export function RoleBadge({ accessLevel, className = "" }: RoleBadgeProps) {
  const isAdmin = accessLevel === "admin"
  
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