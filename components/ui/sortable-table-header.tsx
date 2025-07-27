import { TableHead } from "@/components/ui/table"
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface SortableTableHeaderProps {
  children: React.ReactNode
  sortKey: string
  currentSort: { key: string; direction: 'asc' | 'desc' } | null
  onSort: (key: string) => void
  className?: string
}

export function SortableTableHeader({ 
  children, 
  sortKey, 
  currentSort, 
  onSort, 
  className 
}: SortableTableHeaderProps) {
  const isActive = currentSort?.key === sortKey
  const direction = currentSort?.direction

  return (
    <TableHead 
      className={cn(
        "cursor-pointer select-none hover:bg-gray-50 transition-colors text-center",
        isActive && "bg-blue-50",
        className
      )}
      onClick={() => onSort(sortKey)}
    >
      <div className="flex items-center justify-center gap-1">
        <span>{children}</span>
        <div className="flex flex-col">
          {!isActive ? (
            <ChevronsUpDown className="h-3 w-3 text-gray-400" />
          ) : direction === 'asc' ? (
            <ChevronUp className="h-3 w-3 text-blue-600" />
          ) : (
            <ChevronDown className="h-3 w-3 text-blue-600" />
          )}
        </div>
      </div>
    </TableHead>
  )
} 