export type SortDirection = 'asc' | 'desc'

export interface SortConfig {
  key: string
  direction: SortDirection
}

export function sortData<T>(data: T[], sortConfig: SortConfig | null): T[] {
  if (!sortConfig) return data

  return [...data].sort((a, b) => {
    const aValue = getNestedValue(a, sortConfig.key)
    const bValue = getNestedValue(b, sortConfig.key)

    // Handle null/undefined values
    if (aValue == null && bValue == null) return 0
    if (aValue == null) return sortConfig.direction === 'asc' ? -1 : 1
    if (bValue == null) return sortConfig.direction === 'asc' ? 1 : -1

    // Handle different data types
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue
    }

    if (aValue instanceof Date && bValue instanceof Date) {
      return sortConfig.direction === 'asc' 
        ? aValue.getTime() - bValue.getTime() 
        : bValue.getTime() - aValue.getTime()
    }

    // Handle string values
    const aString = String(aValue).toLowerCase()
    const bString = String(bValue).toLowerCase()
    
    if (sortConfig.direction === 'asc') {
      return aString.localeCompare(bString, 'el')
    } else {
      return bString.localeCompare(aString, 'el')
    }
  })
}

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : null
  }, obj)
}

export function toggleSort(currentSort: SortConfig | null, newKey: string): SortConfig {
  if (currentSort?.key === newKey) {
    return {
      key: newKey,
      direction: currentSort.direction === 'asc' ? 'desc' : 'asc'
    }
  }
  
  // Date columns should default to descending order (latest first)
  const dateColumns = ['timestamp', 'period', 'dueDate', 'lastPayment']
  const isDateColumn = dateColumns.includes(newKey)
  
  // Money amount columns should default to descending order (largest first)
  const moneyColumns = ['totalCost', 'remainingBalance', 'paidAmount', 'amount', 'cost']
  const isMoneyColumn = moneyColumns.includes(newKey)
  
  return {
    key: newKey,
    direction: (isDateColumn || isMoneyColumn) ? 'desc' : 'asc'
  }
} 