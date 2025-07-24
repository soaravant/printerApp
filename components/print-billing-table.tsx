import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Pagination from "./pagination-helper"
import { Calendar } from "lucide-react"

export default function PrintBillingTable({ data, page, pageSize, onPageChange, userRole }) {
  const formatPrice = (price) => `€${price.toFixed(2).replace('.', ',')}`
  return (
    <div className="border rounded-lg" style={{ maxHeight: "400px", overflowY: "auto" }}>
      <Table>
        <TableHeader className="sticky top-0 bg-white z-10">
          <TableRow>
            <TableHead className="font-medium">Περίοδος</TableHead>
            {userRole === "admin" && <TableHead>Χρήστης</TableHead>}
            {userRole === "admin" && <TableHead>Τμήμα</TableHead>}
            <TableHead>A4 Α/Μ</TableHead>
            <TableHead>A4 Έγχρωμο</TableHead>
            <TableHead>A3 Α/Μ</TableHead>
            <TableHead>A3 Έγχρωμο</TableHead>
            <TableHead>Σαρώσεις</TableHead>
            <TableHead>Συνολικό Κόστος</TableHead>
            <TableHead>Πληρωμένο</TableHead>
            <TableHead>Υπόλοιπο</TableHead>
            <TableHead>Ημ. Εξόφλησης</TableHead>
            <TableHead>Κατάσταση</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={userRole === "admin" ? 13 : 11} className="text-center py-8 text-gray-500">
                Δεν βρέθηκαν αποτελέσματα
              </TableCell>
            </TableRow>
          ) : (
            data.slice((page-1)*pageSize, page*pageSize).map((billing) => (
              <TableRow key={billing.billingId}>
                <TableCell className="font-medium">{billing.period}</TableCell>
                {userRole === "admin" && <TableCell>{billing.userDisplayName}</TableCell>}
                {userRole === "admin" && <TableCell>{billing.department}</TableCell>}
                <TableCell>{billing.totalA4BW}</TableCell>
                <TableCell>{billing.totalA4Color}</TableCell>
                <TableCell>{billing.totalA3BW}</TableCell>
                <TableCell>{billing.totalA3Color}</TableCell>
                <TableCell>{billing.totalScans}</TableCell>
                <TableCell>{formatPrice(billing.totalCost)}</TableCell>
                <TableCell>{formatPrice(billing.paidAmount)}</TableCell>
                <TableCell className={billing.remainingBalance > 0 ? "text-red-600 font-semibold" : "text-green-600"}>
                  {formatPrice(billing.remainingBalance)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {billing.dueDate.toLocaleDateString("el-GR")}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={billing.paid ? "default" : "destructive"}>
                    {billing.paid ? "Πληρωμένο" : "Απλήρωτο"}
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