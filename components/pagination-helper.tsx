import { Button } from "@/components/ui/button"

export default function Pagination({ page, total, pageSize, onPageChange }: { page: number; total: number; pageSize: number; onPageChange: (p: number) => void }) {
  const totalPages = Math.ceil(total / pageSize)
  if (totalPages <= 1) return null
  return (
    <div className="flex gap-2 justify-end items-center mt-2">
      <Button size="sm" variant="outline" onClick={() => onPageChange(page - 1)} disabled={page === 1}>&lt;</Button>
      <span className="text-xs">Σελίδα {page} από {totalPages}</span>
      <Button size="sm" variant="outline" onClick={() => onPageChange(page + 1)} disabled={page === totalPages}>&gt;</Button>
    </div>
  )
} 