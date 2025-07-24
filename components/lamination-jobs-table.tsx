import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Pagination from "./pagination-helper"

export default function LaminationJobsTable({ data, page, pageSize, onPageChange, userRole }) {
  const getLaminationTypeLabel = (type) => {
    switch (type) {
      case "A3": return "A3"
      case "A4": return "A4"
      case "card_small": return "Κάρτα Μικρή"
      case "card_large": return "Κάρτα Μεγάλη"
      default: return type
    }
  }
  const formatPrice = (price) => `€${price.toFixed(2).replace('.', ',')}`
  return (
    <div className="border rounded-lg" style={{ maxHeight: "400px", overflowY: "auto" }}>
      <Table>
        <TableHeader className="sticky top-0 bg-white z-10">
          <TableRow>
            <TableHead>Ημερομηνία</TableHead>
            {userRole === "admin" && <TableHead>Χρήστης</TableHead>}
            {userRole === "admin" && <TableHead>Τμήμα</TableHead>}
            <TableHead>Τύπος</TableHead>
            <TableHead>Ποσότητα</TableHead>
            <TableHead>Τιμή/Μονάδα</TableHead>
            <TableHead>Συνολικό Κόστος</TableHead>
            <TableHead>Κατάσταση</TableHead>
            <TableHead>Σημειώσεις</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={userRole === "admin" ? 9 : 7} className="text-center py-8 text-gray-500">
                Δεν βρέθηκαν αποτελέσματα
              </TableCell>
            </TableRow>
          ) : (
            data.slice((page-1)*pageSize, page*pageSize).map((job) => (
              <TableRow key={job.jobId}>
                <TableCell>{job.timestamp.toLocaleDateString("el-GR")}</TableCell>
                {userRole === "admin" && <TableCell>{job.userDisplayName}</TableCell>}
                {userRole === "admin" && <TableCell>{job.department}</TableCell>}
                <TableCell>
                  <Badge variant="outline">{getLaminationTypeLabel(job.type)}</Badge>
                </TableCell>
                <TableCell>{job.quantity}</TableCell>
                <TableCell>€{job.pricePerUnit.toFixed(2)}</TableCell>
                <TableCell>{formatPrice(job.totalCost)}</TableCell>
                <TableCell>
                  <Badge variant={job.status === "completed" ? "default" : "secondary"}>
                    {job.status === "completed" ? "Ολοκληρώθηκε" : job.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-gray-500">{job.notes || "-"}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <Pagination page={page} total={data.length} pageSize={pageSize} onPageChange={onPageChange} />
    </div>
  )
} 