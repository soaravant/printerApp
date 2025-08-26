import { TableHead } from "@/components/ui/table"
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface SortableTableHeaderProps {
  children: React.ReactNode
  sortKey: string
  currentSort: { key: string; direction: 'asc' | 'desc' } | null
  onSort: (key: string) => void
  className?: string
  /**
   * Visual variant to color the active header and arrow
   * - "yellow": debt & income tables
   * - "blue": print table
   * - "green": lamination table
   */
  variant?: "yellow" | "blue" | "green"
}

export function SortableTableHeader({ 
  children, 
  sortKey, 
  currentSort, 
  onSort, 
  className,
  variant = "blue",
}: SortableTableHeaderProps) {
  const isActive = currentSort?.key === sortKey
  const direction = currentSort?.direction
  const activeBgClass = variant === "yellow" ? "bg-yellow-50" : variant === "green" ? "bg-green-50" : "bg-blue-50"
  const activeIconClass = variant === "yellow" ? "text-yellow-600" : variant === "green" ? "text-green-600" : "text-blue-600"

  return (
    <TableHead 
      className={cn(
        "cursor-pointer select-none hover:bg-gray-50 transition-colors text-center",
        isActive && activeBgClass,
        className
      )}
      onClick={() => onSort(sortKey)}
    >
      <div className="flex items-center justify-center gap-1 relative">
        <span className="text-center">{children}</span>
        <div className="flex flex-col absolute right-1">
          {!isActive ? (
            <ChevronsUpDown className="h-3 w-3 text-gray-400" />
          ) : direction === 'asc' ? (
            <ChevronUp className={cn("h-3 w-3", activeIconClass)} />
          ) : (
            <ChevronDown className={cn("h-3 w-3", activeIconClass)} />
          )}
        </div>
      </div>
    </TableHead>
  )
} 