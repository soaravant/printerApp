import { Badge } from "@/components/ui/badge"

interface RoleBadgeProps {
  accessLevel: "user" | "admin" | "Υπεύθυνος"
  className?: string
}

export function RoleBadge({ accessLevel, className = "" }: RoleBadgeProps) {
  const getBadgeText = () => {
    switch (accessLevel) {
      case "admin":
        return "Διαχειριστής"
      case "Υπεύθυνος":
        return "Υπεύθυνος"
      default:
        return "Χρήστης"
    }
  }

  const getBadgeClassName = () => {
    switch (accessLevel) {
      case "admin":
        return "bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
      case "Υπεύθυνος":
        return "bg-black text-white hover:bg-gray-800"
      default:
        return "bg-gray-500 text-white hover:bg-gray-600"
    }
  }
  
  return (
    <Badge 
      className={`text-sm px-3 py-1 ${getBadgeClassName()} ${className}`}
    >
      {getBadgeText()}
    </Badge>
  )
} 