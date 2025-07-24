import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Pagination from "./pagination-helper"
import { Calendar } from "lucide-react"

export default function PrintJobsTable({ data, page, pageSize, onPageChange, userRole }) {
  const formatPrice = (price) => `€${price.toFixed(2).replace('.', ',')}`
  return (
    <div className="border rounded-lg" style={{ maxHeight: "400px", overflowY: "auto" }}>
      <Table>
        <TableHeader className="sticky top-0 bg-white z-10">
          <TableRow>
            <TableHead>Ημερομηνία</TableHead>
            {userRole === "admin" && <TableHead>Χρήστης</TableHead>}
            {userRole === "admin" && <TableHead>Τμήμα</TableHead>}
            <TableHead>Εκτυπωτής</TableHead>
            <TableHead>A4 Α/Μ</TableHead>
            <TableHead>A4 Έγχρωμο</TableHead>
            <TableHead>A3 Α/Μ</TableHead>
            <TableHead>A3 Έγχρωμο</TableHead>
            <TableHead>Σαρώσεις</TableHead>
            <TableHead>Φωτοαντίγραφα</TableHead>
            <TableHead>Κόστος</TableHead>
            <TableHead>Κατάσταση</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={userRole === "admin" ? 12 : 10} className="text-center py-8 text-gray-500">
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
                  <Badge variant="outline">{job.deviceName}</Badge>
                </TableCell>
                <TableCell>{job.pagesA4BW}</TableCell>
                <TableCell>{job.pagesA4Color}</TableCell>
                <TableCell>{job.pagesA3BW}</TableCell>
                <TableCell>{job.pagesA3Color}</TableCell>
                <TableCell>{job.scans}</TableCell>
                <TableCell>{job.copies}</TableCell>
                <TableCell>{formatPrice(job.totalCost)}</TableCell>
                <TableCell>
                  <Badge variant={job.status === "completed" ? "default" : "secondary"}>
                    {job.status === "completed" ? "Ολοκληρώθηκε" : job.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <Pagination page={page} total={data.length} pageSize={pageSize} onPageChange={onPageChange} />
    </div>
  )
} 