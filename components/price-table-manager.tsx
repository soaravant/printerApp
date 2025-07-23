"use client"

import { useState, useEffect } from "react"
import { dataStore } from "@/lib/data-store"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Calculator, Save, Edit } from "lucide-react"
import type { PriceTable } from "@/lib/data-store"

export function PriceTableManager() {
  const [priceTables, setPriceTables] = useState<PriceTable[]>([])
  const [editingTable, setEditingTable] = useState<PriceTable | null>(null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const tables = dataStore.getPriceTables()
    setPriceTables(tables)
  }, [])

  const createDefaultPriceTable = () => {
    setEditingTable({
      id: `price-table-${Date.now()}`,
      name: "Νέος Τιμοκατάλογος",
      prices: {
        a4BW: 0.05,
        a4Color: 0.15,
        a3BW: 0.1,
        a3Color: 0.3,
        scan: 0.02,
        copy: 0.03,
      },
      isActive: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  }

  const savePriceTable = async () => {
    if (!editingTable) return

    setLoading(true)
    try {
      if (priceTables.find((t) => t.id === editingTable.id)) {
        // Update existing
        dataStore.updatePriceTable(editingTable.id, editingTable)
      } else {
        // Add new
        dataStore.addPriceTable(editingTable)
      }

      // Refresh tables
      const updatedTables = dataStore.getPriceTables()
      setPriceTables(updatedTables)

      toast({
        title: "Επιτυχία",
        description: "Ο τιμοκατάλογος αποθηκεύτηκε επιτυχώς",
      })

      setEditingTable(null)
    } catch (error) {
      toast({
        title: "Σφάλμα",
        description: "Αποτυχία αποθήκευσης τιμοκαταλόγου",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const activatePriceTable = async (tableId: string) => {
    try {
      // Deactivate all tables
      const tables = dataStore.getPriceTables()
      const updatedTables = tables.map((table) => ({
        ...table,
        isActive: table.id === tableId,
      }))

      dataStore.savePriceTables(updatedTables)
      setPriceTables(updatedTables)

      toast({
        title: "Επιτυχία",
        description: "Ο τιμοκατάλογος ενεργοποιήθηκε",
      })
    } catch (error) {
      toast({
        title: "Σφάλμα",
        description: "Αποτυχία ενεργοποίησης τιμοκαταλόγου",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Διαχείριση Τιμοκαταλόγων
          </CardTitle>
          <CardDescription>Ορίστε τις τιμές για όλους τους τύπους εκτυπώσεων</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Ενεργοί Τιμοκατάλογοι</h3>
            <Button onClick={createDefaultPriceTable}>Νέος Τιμοκατάλογος</Button>
          </div>

          {priceTables.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Δεν υπάρχουν τιμοκατάλογοι. Κάντε κλικ στο "Δεδομένα Demo" για να δημιουργήσετε έναν βασικό τιμοκατάλογο.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Όνομα</TableHead>
                  <TableHead>A4 Α/Μ</TableHead>
                  <TableHead>A4 Έγχρωμο</TableHead>
                  <TableHead>A3 Α/Μ</TableHead>
                  <TableHead>A3 Έγχρωμο</TableHead>
                  <TableHead>Σάρωση</TableHead>
                  <TableHead>Φωτοαντίγραφο</TableHead>
                  <TableHead>Κατάσταση</TableHead>
                  <TableHead>Ενέργειες</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {priceTables.map((table) => (
                  <TableRow key={table.id}>
                    <TableCell className="font-medium">{table.name}</TableCell>
                    <TableCell>€{table.prices.a4BW.toFixed(3)}</TableCell>
                    <TableCell>€{table.prices.a4Color.toFixed(3)}</TableCell>
                    <TableCell>€{table.prices.a3BW.toFixed(3)}</TableCell>
                    <TableCell>€{table.prices.a3Color.toFixed(3)}</TableCell>
                    <TableCell>€{table.prices.scan.toFixed(3)}</TableCell>
                    <TableCell>€{table.prices.copy.toFixed(3)}</TableCell>
                    <TableCell>
                      <Badge variant={table.isActive ? "default" : "secondary"}>
                        {table.isActive ? "Ενεργός" : "Ανενεργός"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => setEditingTable(table)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        {!table.isActive && (
                          <Button size="sm" onClick={() => activatePriceTable(table.id)}>
                            Ενεργοποίηση
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {editingTable && (
        <Card>
          <CardHeader>
            <CardTitle>
              {priceTables.find((t) => t.id === editingTable.id) ? "Επεξεργασία Τιμοκαταλόγου" : "Νέος Τιμοκατάλογος"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="tableName">Όνομα Τιμοκαταλόγου</Label>
              <Input
                id="tableName"
                value={editingTable.name}
                onChange={(e) => setEditingTable({ ...editingTable, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="a4bw">A4 Ασπρόμαυρο (€)</Label>
                <Input
                  id="a4bw"
                  type="number"
                  step="0.001"
                  value={editingTable.prices.a4BW}
                  onChange={(e) =>
                    setEditingTable({
                      ...editingTable,
                      prices: { ...editingTable.prices, a4BW: Number.parseFloat(e.target.value) },
                    })
                  }
                />
              </div>

              <div>
                <Label htmlFor="a4color">A4 Έγχρωμο (€)</Label>
                <Input
                  id="a4color"
                  type="number"
                  step="0.001"
                  value={editingTable.prices.a4Color}
                  onChange={(e) =>
                    setEditingTable({
                      ...editingTable,
                      prices: { ...editingTable.prices, a4Color: Number.parseFloat(e.target.value) },
                    })
                  }
                />
              </div>

              <div>
                <Label htmlFor="a3bw">A3 Ασπρόμαυρο (€)</Label>
                <Input
                  id="a3bw"
                  type="number"
                  step="0.001"
                  value={editingTable.prices.a3BW}
                  onChange={(e) =>
                    setEditingTable({
                      ...editingTable,
                      prices: { ...editingTable.prices, a3BW: Number.parseFloat(e.target.value) },
                    })
                  }
                />
              </div>

              <div>
                <Label htmlFor="a3color">A3 Έγχρωμο (€)</Label>
                <Input
                  id="a3color"
                  type="number"
                  step="0.001"
                  value={editingTable.prices.a3Color}
                  onChange={(e) =>
                    setEditingTable({
                      ...editingTable,
                      prices: { ...editingTable.prices, a3Color: Number.parseFloat(e.target.value) },
                    })
                  }
                />
              </div>

              <div>
                <Label htmlFor="scan">Σάρωση (€)</Label>
                <Input
                  id="scan"
                  type="number"
                  step="0.001"
                  value={editingTable.prices.scan}
                  onChange={(e) =>
                    setEditingTable({
                      ...editingTable,
                      prices: { ...editingTable.prices, scan: Number.parseFloat(e.target.value) },
                    })
                  }
                />
              </div>

              <div>
                <Label htmlFor="copy">Φωτοαντίγραφο (€)</Label>
                <Input
                  id="copy"
                  type="number"
                  step="0.001"
                  value={editingTable.prices.copy}
                  onChange={(e) =>
                    setEditingTable({
                      ...editingTable,
                      prices: { ...editingTable.prices, copy: Number.parseFloat(e.target.value) },
                    })
                  }
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={savePriceTable} disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? "Αποθήκευση..." : "Αποθήκευση"}
              </Button>
              <Button variant="outline" onClick={() => setEditingTable(null)}>
                Ακύρωση
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
