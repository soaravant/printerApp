"use client"

import { useEffect, useState } from "react"
import { dataStore } from "@/lib/data-store"
import { useAuth } from "@/lib/auth-context"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import type { PrintJob } from "@/lib/data-store"

export function JobTable() {
  const [jobs, setJobs] = useState<PrintJob[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    if (!user) return

    // Load jobs from localStorage
    const allJobs = dataStore.getPrintJobs()
    const userJobs = allJobs.filter((job) => job.uid === user.uid)
    setJobs(userJobs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()))
    setLoading(false)
  }, [user])

  if (loading) {
    return <div className="text-center py-4">Loading print jobs...</div>
  }

  if (jobs.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        No print jobs found. Click "Demo Data" in the admin panel to generate test data.
      </div>
    )
  }

  return (
    <Table>
              <TableHeader className="bg-gray-100">
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Printer</TableHead>
          <TableHead>A4 B&W</TableHead>
          <TableHead>A4 Color</TableHead>
          <TableHead>A3 B&W</TableHead>
          <TableHead>A3 Color</TableHead>
          <TableHead>Cost</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {jobs.map((job) => (
          <TableRow key={job.jobId}>
            <TableCell>{new Date(job.timestamp).toLocaleDateString("el-GR")}</TableCell>
            <TableCell>
              <Badge variant="outline">{job.deviceName || job.deviceIP}</Badge>
            </TableCell>
            <TableCell>{job.pagesA4BW || 0}</TableCell>
            <TableCell>{job.pagesA4Color || 0}</TableCell>
            <TableCell>{job.pagesA3BW || 0}</TableCell>
            <TableCell>{job.pagesA3Color || 0}</TableCell>
            <TableCell>€{job.totalCost.toFixed(2)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
