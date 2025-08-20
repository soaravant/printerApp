"use client"

import { ProtectedRoute } from "@/components/protected-route"
import { Navigation } from "@/components/navigation"
import { useAuth } from "@/lib/auth-context"
// import { dummyDB } from "@/lib/dummy-database"
import { useState } from "react"
import { usePriceTable } from "@/lib/firebase-queries"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Printer, CreditCard, Calculator, Plus, Minus, X, RotateCcw } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

export default function PricesPage() {
  const { user } = useAuth()
  const { toast } = useToast()

  // Calculator state
  const [calculatorItems, setCalculatorItems] = useState<Array<{
    id: string
    type: 'printing' | 'lamination'
    service: string
    quantity: number
    price: number
  }>>([])

  const useFirestore = process.env.NEXT_PUBLIC_USE_FIRESTORE === "true"
  const { data: lamTable } = usePriceTable("lamination")
  const { data: printTable } = usePriceTable("printing")
  const laminationPrices = lamTable?.prices || {}
  const printingPrices = printTable?.prices || {}

  // Utility function to format prices with comma as decimal separator
  const formatPrice = (price: number | undefined): string => {
    if (price === undefined || price === null) return "€0"
    // Always round to two decimals for display
    const rounded = Math.round((price + Number.EPSILON) * 100) / 100
    // Convert to string with 2 decimals, replace dot with comma
    const formatted = rounded.toFixed(2).replace(".", ",")
    return `€${formatted}`
  }

  // Calculator functions
  const addCalculatorItem = () => {
    const newItem = {
      id: Date.now().toString(),
      type: 'printing' as const,
      service: 'a4BW',
      quantity: 1,
      price: printingPrices.a4BW || 0
    }
    setCalculatorItems(prev => [...prev, newItem])
  }

  const addLaminationItem = () => {
    const newItem = {
      id: Date.now().toString(),
      type: 'lamination' as const,
      service: 'A4',
      quantity: 1,
      price: laminationPrices.A4 || 0
    }
    setCalculatorItems(prev => [...prev, newItem])
  }

  const removeCalculatorItem = (id: string) => {
    setCalculatorItems(prev => prev.filter(item => item.id !== id))
  }

  const updateCalculatorItem = (id: string, field: string, value: any) => {
    setCalculatorItems(prev => prev.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value }
        
        // Update price based on service selection
        if (field === 'type' || field === 'service') {
          // Set default service when type changes
          if (field === 'type') {
            if (value === 'lamination') {
              updatedItem.service = 'A4'
              updatedItem.price = laminationPrices.A4 || 0
            } else if (value === 'printing') {
              updatedItem.service = 'a4BW'
              updatedItem.price = printingPrices.a4BW || 0
            }
          } else {
            // Update price based on current type and service
            const prices = updatedItem.type === 'lamination' ? laminationPrices : printingPrices
            const serviceKey = field === 'service' ? value : updatedItem.service
            updatedItem.price = prices[serviceKey] || 0
          }
        }
        
        return updatedItem
      }
      return item
    }))
  }

  const getServiceOptions = (type: 'printing' | 'lamination') => {
    if (type === 'printing') {
      return [
        { value: 'a4BW', label: 'A4 Ασπρόμαυρο' },
        { value: 'a4Color', label: 'A4 Έγχρωμο' },
        { value: 'a3BW', label: 'A3 Ασπρόμαυρο' },
        { value: 'a3Color', label: 'A3 Έγχρωμο' },
        { value: 'rizochartoA3', label: 'Ριζόχαρτο A3' },
        { value: 'rizochartoA4', label: 'Ριζόχαρτο A4' },
        { value: 'chartoniA3', label: 'Χαρτόνι A3' },
        { value: 'chartoniA4', label: 'Χαρτόνι A4' },
        { value: 'autokollito', label: 'Αυτοκόλλητο' },
      ]
    } else {
      return [
        { value: 'A3', label: 'A3' },
        { value: 'A4', label: 'A4' },
        { value: 'A5', label: 'A5' },
        { value: 'cards', label: 'Κάρτες' },
        { value: 'spiral', label: 'Σπιράλ' },
        { value: 'colored_cardboard', label: 'Χρωματιστά Χαρτόνια' },
        { value: 'plastic_cover', label: 'Πλαστικό Κάλυμμα' },
      ]
    }
  }

  const calculateTotal = () => {
    return calculatorItems.reduce((total, item) => {
      return total + (item.price * item.quantity)
    }, 0)
  }

  const clearCalculator = () => {
    setCalculatorItems([])
  }



  return (
    <ProtectedRoute requireAdmin>
      <div className="min-h-screen bg-gray-50">
        <Navigation />

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="mb-8">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Τιμοκατάλογος</h1>
                  <p className="text-gray-600">Τιμές εκτυπώσεων & πλαστικοποιήσεων</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Printing Prices */}
              <Card className="border-blue-200">
                <CardHeader className="bg-blue-100 border-b border-blue-200">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <Printer className="h-5 w-5 text-blue-800" />
                      <div>
                        <CardTitle className="text-blue-800">
                          Τιμοκατάλογος Εκτυπώσεων
                        </CardTitle>
                        <CardDescription className="text-blue-600">
                          Τρέχουσες τιμές για τους διαφορετικούς τύπους εκτυπώσεων
                        </CardDescription>
                      </div>
                    </div>

                  </div>
                </CardHeader>
                <CardContent className="pt-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3 border border-blue-200 rounded-lg bg-blue-100 shadow-sm">
                      <h3 className="font-medium text-blue-900 text-sm">A4 Ασπρόμαυρο</h3>
                      <p className="text-xl font-bold text-blue-600">{formatPrice(printingPrices.a4BW)}</p>
                    </div>
                    <div className="p-3 border border-blue-200 rounded-lg bg-blue-100 shadow-sm">
                      <h3 className="font-medium text-blue-900 text-sm">A4 Έγχρωμο</h3>
                      <p className="text-xl font-bold text-blue-600">{formatPrice(printingPrices.a4Color)}</p>
                    </div>
                    <div className="p-3 border border-blue-200 rounded-lg bg-blue-100 shadow-sm">
                      <h3 className="font-medium text-blue-900 text-sm">A3 Ασπρόμαυρο</h3>
                      <p className="text-xl font-bold text-blue-600">{formatPrice(printingPrices.a3BW)}</p>
                    </div>
                    <div className="p-3 border border-blue-200 rounded-lg bg-blue-100 shadow-sm">
                      <h3 className="font-medium text-blue-900 text-sm">A3 Έγχρωμο</h3>
                      <p className="text-xl font-bold text-blue-600">{formatPrice(printingPrices.a3Color)}</p>
                    </div>
                    <div className="p-3 border border-blue-200 rounded-lg bg-blue-100 shadow-sm">
                      <h3 className="font-medium text-blue-900 text-sm">Ριζόχαρτο A3</h3>
                      <p className="text-xl font-bold text-blue-600">{formatPrice(printingPrices.rizochartoA3)}</p>
                    </div>
                    <div className="p-3 border border-blue-200 rounded-lg bg-blue-100 shadow-sm">
                      <h3 className="font-medium text-blue-900 text-sm">Ριζόχαρτο A4</h3>
                      <p className="text-xl font-bold text-blue-600">{formatPrice(printingPrices.rizochartoA4)}</p>
                    </div>
                    <div className="p-3 border border-blue-200 rounded-lg bg-blue-100 shadow-sm">
                      <h3 className="font-medium text-blue-900 text-sm">Χαρτόνι A3</h3>
                      <p className="text-xl font-bold text-blue-600">{formatPrice(printingPrices.chartoniA3)}</p>
                    </div>
                    <div className="p-3 border border-blue-200 rounded-lg bg-blue-100 shadow-sm">
                      <h3 className="font-medium text-blue-900 text-sm">Χαρτόνι A4</h3>
                      <p className="text-xl font-bold text-blue-600">{formatPrice(printingPrices.chartoniA4)}</p>
                    </div>
                    <div className="p-3 border border-blue-200 rounded-lg bg-blue-100 shadow-sm">
                      <h3 className="font-medium text-blue-900 text-sm">Αυτοκόλλητο</h3>
                      <p className="text-xl font-bold text-blue-600">{formatPrice(printingPrices.autokollito)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Lamination Prices */}
              <Card className="border-green-200">
                <CardHeader className="bg-green-100 border-b border-green-200">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-5 w-5 text-green-800" />
                      <div>
                        <CardTitle className="text-green-800">
                          Τιμοκατάλογος Πλαστικοποιήσεων
                        </CardTitle>
                        <CardDescription className="text-green-600">
                          Τρέχουσες τιμές για τους διαφορετικούς τύπους πλαστικοποίησης
                        </CardDescription>
                      </div>
                    </div>

                  </div>
                </CardHeader>
                <CardContent className="pt-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3 border border-green-200 rounded-lg bg-green-100 shadow-sm">
                      <h3 className="font-medium text-green-900 text-sm">A3</h3>
                      <p className="text-xl font-bold text-green-600">{formatPrice(laminationPrices.A3)}</p>
                    </div>
                    <div className="p-3 border border-green-200 rounded-lg bg-green-100 shadow-sm">
                      <h3 className="font-medium text-green-900 text-sm">A4</h3>
                      <p className="text-xl font-bold text-green-600">{formatPrice(laminationPrices.A4)}</p>
                    </div>
                    <div className="p-3 border border-green-200 rounded-lg bg-green-100 shadow-sm">
                      <h3 className="font-medium text-green-900 text-sm">A5</h3>
                      <p className="text-xl font-bold text-green-600">{formatPrice(laminationPrices.A5)}</p>
                    </div>
                    <div className="p-3 border border-green-200 rounded-lg bg-green-100 shadow-sm">
                      <h3 className="font-medium text-green-900 text-sm">Κάρτες</h3>
                      <p className="text-xl font-bold text-green-600">
                        {formatPrice(laminationPrices.cards)}
                      </p>
                    </div>
                    <div className="p-3 border border-green-200 rounded-lg bg-green-100 shadow-sm">
                      <h3 className="font-medium text-green-900 text-sm">Σπιράλ</h3>
                      <p className="text-xl font-bold text-green-600">
                        {formatPrice(laminationPrices.spiral)}
                      </p>
                    </div>
                    <div className="p-3 border border-green-200 rounded-lg bg-green-100 shadow-sm">
                      <h3 className="font-medium text-green-900 text-sm">Χρωματιστά Χαρτόνια</h3>
                      <p className="text-xl font-bold text-green-600">
                        {formatPrice(laminationPrices.colored_cardboard)}
                      </p>
                    </div>
                    <div className="p-3 border border-green-200 rounded-lg bg-green-100 shadow-sm">
                      <h3 className="font-medium text-green-900 text-sm">Πλαστικό Κάλυμμα</h3>
                      <p className="text-xl font-bold text-green-600">
                        {formatPrice(laminationPrices.plastic_cover)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Price Calculator - Only show for non-admin users */}
            {user && user.accessLevel !== "Διαχειριστής" && (
              <Card className="border-yellow-200">
                <CardHeader className="bg-yellow-100 border-b border-yellow-200">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <Calculator className="h-5 w-5 text-yellow-800" />
                      <div>
                        <CardTitle className="text-yellow-800">
                          Υπολογιστής Τιμών
                        </CardTitle>
                        <CardDescription className="text-yellow-600">
                          Υπολογίστε το κόστος για εκτυπώσεις και πλαστικοποιήσεις
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={addCalculatorItem} 
                        variant="outline" 
                        size="sm"
                        className="bg-white border-blue-300 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Προσθήκη Εκτύπωσης
                      </Button>
                      <Button 
                        onClick={addLaminationItem} 
                        variant="outline" 
                        size="sm"
                        className="bg-white border-green-300 text-green-700 hover:bg-green-50 hover:text-green-800"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Προσθήκη Πλαστικοποίησης
                      </Button>
                      <Button 
                        onClick={clearCalculator} 
                        variant="outline" 
                        size="sm"
                        className="bg-white border-yellow-300 text-yellow-700 hover:bg-yellow-50"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  {calculatorItems.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Calculator className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>Προσθέστε εκτύπωση ή πλαστικοποίηση για να ξεκινήσετε τον υπολογισμό</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {calculatorItems.map((item) => (
                        <div key={item.id} className="flex items-center gap-4">
                          <div className={`flex-1 flex items-center gap-4 p-4 border rounded-lg ${
                            item.type === 'printing' 
                              ? 'border-blue-200 bg-blue-100' 
                              : 'border-green-200 bg-green-100'
                          }`}>
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                              <div>
                                <Label className="text-sm font-medium text-gray-700">Τύπος</Label>
                                <Select
                                  value={item.type}
                                  onValueChange={(value) => updateCalculatorItem(item.id, 'type', value)}
                                >
                                  <SelectTrigger className={`w-full ${
                                    item.type === 'printing' 
                                      ? 'border-blue-300 focus:border-blue-500 focus:ring-blue-500' 
                                      : 'border-green-300 focus:border-green-500 focus:ring-green-500'
                                  }`}>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="printing">Εκτύπωση</SelectItem>
                                    <SelectItem value="lamination">Πλαστικοποίηση</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label className="text-sm font-medium text-gray-700">Υπηρεσία</Label>
                                <Select
                                  value={item.service}
                                  onValueChange={(value) => updateCalculatorItem(item.id, 'service', value)}
                                >
                                  <SelectTrigger className={`w-full ${
                                    item.type === 'printing' 
                                      ? 'border-blue-300 focus:border-blue-500 focus:ring-blue-500' 
                                      : 'border-green-300 focus:border-green-500 focus:ring-green-500'
                                  }`}>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {getServiceOptions(item.type).map((option) => (
                                      <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <div className="w-10"></div>
                                  <div className="w-16 flex justify-center">
                                    <Label className="text-sm font-medium text-gray-700">Ποσότητα</Label>
                                  </div>
                                  <div className="w-10"></div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => updateCalculatorItem(item.id, 'quantity', Math.max(1, item.quantity - 1))}
                                    className={`h-10 w-10 p-0 bg-white hover:bg-gray-50 ${
                                      item.type === 'printing' 
                                        ? 'border-blue-300 text-blue-700' 
                                        : 'border-green-300 text-green-700'
                                    }`}
                                  >
                                    <Minus className="h-4 w-4" />
                                  </Button>
                                  <Input
                                    type="number"
                                    min="1"
                                    value={item.quantity}
                                    onChange={(e) => updateCalculatorItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                                    className="w-16 h-10 text-center [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                  />
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => updateCalculatorItem(item.id, 'quantity', item.quantity + 1)}
                                    className={`h-10 w-10 p-0 bg-white hover:bg-gray-50 ${
                                      item.type === 'printing' 
                                        ? 'border-blue-300 text-blue-700' 
                                        : 'border-green-300 text-green-700'
                                    }`}
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                              <div>
                                <Label className="text-sm font-medium text-gray-700">Τιμή ανά μονάδα</Label>
                                <p className={`text-lg font-bold ${
                                  item.type === 'printing' 
                                    ? 'text-blue-600' 
                                    : 'text-green-600'
                                }`}>{formatPrice(item.price)}</p>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <div className="text-right">
                                <p className="text-sm text-gray-600">Κόστος</p>
                                <p className="text-xl font-bold text-red-600">{formatPrice(item.price * item.quantity)}</p>
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeCalculatorItem(item.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      
                      {calculatorItems.length > 0 && (
                        <div className="flex justify-between items-center p-4 border-t border-yellow-200 bg-yellow-50 rounded-lg">
                          <div>
                            <p className="text-sm text-gray-600">Συνολικό κόστος για {calculatorItems.length} υπηρεσίες</p>
                          </div>
                          <div className="text-right">
                            <p className="text-3xl font-bold text-yellow-800">{formatPrice(calculateTotal())}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
} 