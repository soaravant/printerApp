# Development Lessons & Solutions

## Recent Lessons & Improvements (December 2024)

- **Unhandled Promise Rejection Fix**: Fixed [object Event] error caused by unhandled promise rejections in dynamic imports by adding global error handlers and error boundaries around dynamic components.
- **Hydration Error Fix**: Fixed React hydration error caused by whitespace text nodes in `<colgroup>` elements by removing comments and extra whitespace between `<col>` tags.
- **Print Types Simplification**: Removed scans and copies from the print types to keep only the 4 core types shown in the UI images: A4 Black & White (€0.05), A4 Color (€0.15), A3 Black & White (€0.10), and A3 Color (€0.30). Updated all interfaces, components, and data structures accordingly.
- **Table Sorting Functionality**: Implemented clickable column sorting for all data tables with visual indicators and proper TypeScript support; created reusable sortable table header component and utility functions for consistent sorting behavior across the application.
- **UI/UX Enhancements**: Improved admin tab styling for clarity; added inline editing for price tables with validation and feedback; implemented a dynamic price range filter with histogram and real-time distribution in admin user management.
- **Dummy Data Realism**: Adjusted dummy data generation for more realistic values (fewer jobs, lower page counts, and lamination quantities); added a `reset()` method and UI button for regenerating data with confirmation dialog.
- **Dependency Management**: Added missing `@radix-ui/react-radio-group` for radio buttons; always check for required Radix UI dependencies when adding new shadcn/ui components.
- **React 19 Compatibility**: Updated Radix UI packages to latest versions to resolve React 19 ref errors; always update Radix UI when upgrading React.

## Print Types Simplification (December 2024)

**Problem**: The system included scans and copies as separate services, but the UI images showed only 4 core print types. The system needed to be simplified to match the visual design.

**Solution**: Removed scans and copies from all data structures and UI components, keeping only the 4 core print types:
1. **A4 Ασπρόμαυρο** (A4 Black & White) - €0.05
2. **A4 Έγχρωμο** (A4 Color) - €0.15  
3. **A3 Ασπρόμαυρο** (A3 Black & White) - €0.10
4. **A3 Έγχρωμο** (A3 Color) - €0.30

**Files Updated**:
- `lib/data-store.ts`: Removed scans/copies from PrintJob and PriceTable interfaces
- `lib/dummy-database.ts`: Updated data structures and sample data generation
- `components/cost-calculator.tsx`: Removed scans/copies inputs and calculations
- `components/price-table-manager.tsx`: Updated price table editing interface
- `app/admin/page.tsx`: Removed scans/copies from admin price editing
- `app/admin/populate-data/page.tsx`: Updated dummy data generation
- `python/collect.py`: Updated data collection and cost calculation
- `components/print-jobs-table.tsx`: Removed scans/copies columns
- `app/printing/page.tsx`: Updated printing page tables
- `components/job-table.tsx`: Removed scans column
- `components/user-dashboard.tsx`: Updated dashboard table
- `app/dashboard/page.tsx`: Updated export functionality

**Key Changes**:
- **Data Structures**: Removed `scans`, `copies`, `costScans`, `costCopies` fields from all interfaces
- **UI Components**: Removed scans/copies columns from all tables and input fields
- **Cost Calculations**: Updated to only include the 4 print types
- **Export Functions**: Updated to exclude scans/copies from exported data
- **Python Service**: Updated data collection to only track the 4 print types

**Benefits**:
- **Simplified UI**: Cleaner interface focused on core print services
- **Consistent Pricing**: Matches the visual design shown in the images
- **Reduced Complexity**: Fewer fields to manage and maintain
- **Better UX**: Users see only the services that are actually available

**Migration Notes**:
- Existing data with scans/copies will need to be migrated or cleared
- The dummy data generation now creates more realistic print job distributions
- All cost calculations now focus on the 4 core print types only

## Table Sorting Implementation (December 2024)

**Problem**: Users needed the ability to sort table data by clicking on column headers to better organize and analyze the information in print jobs, lamination jobs, and billing tables.

**Solution**: Implemented a comprehensive sorting system with:
- Reusable `SortableTableHeader` component with visual indicators
- Type-safe sorting utilities that handle different data types
- Consistent sorting behavior across all tables
- Proper handling of computed fields and nested data

**Key Features**:
- **Visual Indicators**: Chevron icons show sort direction (up/down/double for unsorted)
- **Click to Sort**: Click any column header to sort by that field
- **Toggle Direction**: Click again to reverse sort order
- **Type Safety**: Full TypeScript support with proper interfaces
- **Data Type Handling**: Automatic handling of strings, numbers, dates, and null values
- **Greek Locale**: Proper sorting for Greek text using `localeCompare`

**Implementation Components**:

**1. SortableTableHeader Component**:
```tsx
// components/ui/sortable-table-header.tsx
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
        "cursor-pointer select-none hover:bg-gray-50 transition-colors",
        isActive && "bg-blue-50",
        className
      )}
      onClick={() => onSort(sortKey)}
    >
      <div className="flex items-center gap-1">
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
```

**2. Sorting Utilities**:
```tsx
// lib/sort-utils.ts
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

    // Handle string values with Greek locale
    const aString = String(aValue).toLowerCase()
    const bString = String(bValue).toLowerCase()
    
    if (sortConfig.direction === 'asc') {
      return aString.localeCompare(bString, 'el')
    } else {
      return bString.localeCompare(aString, 'el')
    }
  })
}
```

**3. Table Component Integration**:
```tsx
// Example: components/print-jobs-table.tsx
export default function PrintJobsTable({ data, page, pageSize, onPageChange, userRole }: PrintJobsTableProps) {
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null)
  const [sortedData, setSortedData] = useState(data)

  useEffect(() => {
    setSortedData(sortData(data, sortConfig))
  }, [data, sortConfig])

  const handleSort = (key: string) => {
    const newSortConfig = toggleSort(sortConfig, key)
    setSortConfig(newSortConfig)
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <SortableTableHeader
            sortKey="timestamp"
            currentSort={sortConfig}
            onSort={handleSort}
          >
            Ημερομηνία
          </SortableTableHeader>
          {/* ... other sortable headers */}
        </TableRow>
      </TableHeader>
      {/* ... table body with sortedData */}
    </Table>
  )
}
```

**Special Cases Handled**:

**1. Computed Fields**: For the print billing table, implemented custom sorting for computed fields like `responsiblePerson`:
```tsx
const getSortValue = (billing: PrintBilling, key: string): any => {
  switch (key) {
    case 'userRole':
      const userData = dummyDB.getUserById(billing.uid)
      return userData?.userRole || ""
    case 'responsiblePerson':
      const user = dummyDB.getUserById(billing.uid)
      return user?.userRole === "Άτομο" 
        ? user.displayName 
        : user?.responsiblePerson || ""
    case 'lastPayment':
      return billing.lastPayment
    default:
      return (billing as any)[key]
  }
}
```

**2. Type Safety**: Added proper TypeScript interfaces for all table components:
```tsx
interface PrintJobsTableProps {
  data: PrintJob[]
  page: number
  pageSize: number
  onPageChange: (page: number) => void
  userRole: string
}
```

**Tables Updated**:
- Print Jobs Table (`components/print-jobs-table.tsx`)
- Print Billing Table (`components/print-billing-table.tsx`)
- Lamination Jobs Table (`components/lamination-jobs-table.tsx`)
- Lamination Billing Table (`components/lamination-billing-table.tsx`)

**UI/UX Features**:
- **Hover Effects**: Headers show hover state with background color change
- **Active State**: Currently sorted column has blue background
- **Icon States**: Clear visual indicators for sort direction
- **Responsive**: Works on all screen sizes
- **Accessibility**: Proper cursor and select-none for better UX

**Result**: All data tables now support intuitive column sorting with visual feedback, making it much easier for users to organize and analyze their data. The implementation is consistent across all tables and handles edge cases like computed fields and different data types.

## Expanded Dummy Data Generation (December 2024)

**Problem**: Needed more extensive dummy data for testing and demo purposes, with 20 users and hundreds of print/lamination jobs over the last 6 months, but without creating unrealistic debts or values.

**Solution**: Updated the dummy database logic to:
- Create 20 users with unique usernames, display names, and departments.
- Generate print and lamination jobs for each user, spread over the last 6 months.
- For each user, generate 10–20 print jobs and 3–8 lamination jobs per month, with realistic page/quantity values.
- Keep costs and quantities within reasonable, real-world ranges to avoid excessive debts.

**Implementation**:
```typescript
// In lib/dummy-database.ts
// 20 users, 6 months, 10–20 print jobs and 3–8 lamination jobs per user per month
for (let monthOffset = 0; monthOffset < 6; monthOffset++) {
  for (const userId of userIds) {
    // ...
    const jobsCount = Math.floor(Math.random() * 11) + 10; // 10–20 print jobs
    // ...
    const laminationJobsCount = Math.floor(Math.random() * 6) + 3; // 3–8 lamination jobs
    // ...
  }
}
```

**Result**: The system now provides a much richer dataset for testing and demo, with realistic values and no excessive debts, supporting better UI/UX and analytics development.

---

This document contains solutions and lessons learned during the development of the Printer Billing Application.

## UI/UX Improvements

### Tab Styling Enhancement (December 2024)

**Problem**: Tab buttons in the admin page were not visually distinct enough from the background, making navigation less intuitive.

**Solution**: Enhanced tab styling with better visual separation:
- Added white background with border and shadow to `TabsList`
- Applied active state styling with blue background, text color, and border
- Added proper spacing with `mb-6` for better visual hierarchy

**Implementation**:
```tsx
<TabsList className="grid w-full grid-cols-3 bg-white border border-gray-200 shadow-sm rounded-lg p-1 mb-6">
  <TabsTrigger 
    value="lamination" 
    className="flex items-center gap-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-blue-200"
  >
    <CreditCard className="h-4 w-4" />
    Πλαστικοποιήσεις
  </TabsTrigger>
  // ... other tabs
</TabsList>
```

**Result**: Much more visible and intuitive tab navigation with clear active states.

### Price Table Editing Functionality (December 2024)

**Problem**: Admins needed the ability to edit pricing directly from the admin interface without manual database updates.

**Solution**: Implemented inline editing for both printing and lamination price tables:
- Added edit/save/cancel buttons for each price table
- Implemented state management for editing mode
- Added input validation for price values
- Integrated with existing dummy database update methods

**Key Features**:
- **Inline Editing**: Click edit button to modify prices directly in the interface
- **Validation**: Ensures all values are valid numbers >= 0
- **Save/Cancel**: Clear actions to save changes or cancel editing
- **Visual Feedback**: Toast notifications for success/error states
- **Responsive Design**: Compact input fields that fit within existing card layout

**Implementation Highlights**:
```tsx
// State management for editing
const [editingPrices, setEditingPrices] = useState<{
  printing: { [key: string]: string }
  lamination: { [key: string]: string }
}>({
  printing: {},
  lamination: {},
})
const [isEditingPrinting, setIsEditingPrinting] = useState(false)
const [isEditingLamination, setIsEditingLamination] = useState(false)

// Save function with validation
const savePrintingPrices = () => {
  try {
    const newPrices: { [key: string]: number } = {}
    Object.entries(editingPrices.printing).forEach(([key, value]) => {
      const numValue = parseFloat(value)
      if (isNaN(numValue) || numValue < 0) {
        throw new Error(`Μη έγκυρη τιμή για ${key}`)
      }
      newPrices[key] = numValue
    })

    dummyDB.updatePriceTable("printing", { prices: newPrices })
    setIsEditingPrinting(false)
    setEditingPrices(prev => ({ ...prev, printing: {} }))

    toast({
      title: "Επιτυχία",
      description: "Οι τιμές εκτυπώσεων ενημερώθηκαν επιτυχώς",
    })
  } catch (error) {
    toast({
      title: "Σφάλμα",
      description: error instanceof Error ? error.message : "Αποτυχία ενημέρωσης τιμών",
      variant: "destructive",
    })
  }
}
```

**UI Components**:
- Edit button with pencil icon
- Save button with green styling and save icon
- Cancel button with X icon
- Compact number inputs with euro symbol prefix
- Conditional rendering based on editing state

**Result**: Full CRUD functionality for price management with excellent user experience and proper error handling.

### Price Range Filter with Dynamic Distribution (December 2024)

**Problem**: The amount filter in the admin user management was too basic and didn't provide a good user experience for filtering users by their outstanding balances.

**Solution**: Implemented a comprehensive price range filter with:
- Dynamic slider with histogram visualization
- Input fields for precise range selection
- Radio buttons for quick range selection
- Real-time distribution calculation based on actual user data

**Key Features**:
- **Dynamic Range**: Automatically calculates min/max values from actual user debt data
- **Histogram Visualization**: Shows distribution of user amounts with visual bars
- **Dual Input Controls**: Both slider and number inputs for precise control
- **Quick Selection**: Radio buttons for common ranges (0-20€, 20-35€, 35-90€, 90€+)
- **Real-time Updates**: Filter updates immediately as range changes
- **Reset Functionality**: Arrow button to reset to full range

**Implementation Highlights**:
```tsx
// Calculate price distribution for dynamic range
const calculatePriceDistribution = () => {
  const allAmounts: number[] = []
  
  users.forEach((userData) => {
    const printBilling = dummyDB.getPrintBilling(userData.uid)
    const laminationBilling = dummyDB.getLaminationBilling(userData.uid)
    const printUnpaid = printBilling.filter((b) => !b.paid).reduce((sum, b) => sum + b.remainingBalance, 0)
    const laminationUnpaid = laminationBilling
      .filter((b) => !b.paid)
      .reduce((sum, b) => sum + b.remainingBalance, 0)
    const totalUnpaid = printUnpaid + laminationUnpaid
    
    if (totalUnpaid > 0) {
      allAmounts.push(totalUnpaid)
    }
  })

  const min = Math.min(...allAmounts)
  const max = Math.max(...allAmounts)
  
  // Create distribution buckets
  const distribution = {
    "0-20": allAmounts.filter(amount => amount <= 20).length,
    "20-35": allAmounts.filter(amount => amount > 20 && amount <= 35).length,
    "35-90": allAmounts.filter(amount => amount > 35 && amount <= 90).length,
    "90+": allAmounts.filter(amount => amount > 90).length
  }

  return { min, max, distribution }
}
```

**UI Components**:
- **Histogram**: Visual representation of amount distribution using CSS bars
- **Slider**: Range slider with dual handles for min/max selection
- **Input Fields**: Number inputs with euro symbols for precise control
- **Radio Buttons**: Quick selection with count display for each range
- **Reset Button**: Circular button with arrow icon to reset to full range

**State Management**:
```tsx
const [priceRange, setPriceRange] = useState<[number, number]>([0, 100])
const [priceRangeInputs, setPriceRangeInputs] = useState<[string, string]>(["0", "100"])
```

**Filtering Logic**:
```tsx
// Apply price range filter
if (priceRange[0] !== priceDistribution.min || priceRange[1] !== priceDistribution.max) {
  filtered = filtered.filter((u) => {
    const printBilling = dummyDB.getPrintBilling(u.uid)
    const laminationBilling = dummyDB.getLaminationBilling(u.uid)
    const printUnpaid = printBilling.filter((b) => !b.paid).reduce((sum, b) => sum + b.remainingBalance, 0)
    const laminationUnpaid = laminationBilling
      .filter((b) => !b.paid)
      .reduce((sum, b) => sum + b.remainingBalance, 0)
    const totalUnpaid = printUnpaid + laminationUnpaid

    return totalUnpaid >= priceRange[0] && totalUnpaid <= priceRange[1]
  })
}
```

**Result**: Much more intuitive and powerful filtering system that provides visual feedback and precise control over user filtering based on outstanding balances.

### Missing Radix UI Dependencies (December 2024)

**Problem**: When implementing the price range filter with radio buttons, the application failed to build with the error:
```
Module not found: Can't resolve '@radix-ui/react-radio-group'
```

**Solution**: The `@radix-ui/react-radio-group` dependency was missing from the project dependencies.

**Fix**:
```bash
pnpm add @radix-ui/react-radio-group
```

**Root Cause**: The radio-group component was available in the UI components directory but the underlying Radix UI dependency wasn't installed. This is a common issue when adding new shadcn/ui components that require additional Radix UI primitives.

**Prevention**: When adding new shadcn/ui components, always check if the required Radix UI dependencies are installed in package.json. Common missing dependencies include:
- `@radix-ui/react-radio-group` for radio buttons
- `@radix-ui/react-checkbox` for checkboxes  
- `@radix-ui/react-switch` for switches
- `@radix-ui/react-slider` for sliders

**Note**: The warnings about peer dependencies (React 19 vs React 16-18) are expected and don't affect functionality.

### React 19 Compatibility with Radix UI (December 2024)

**Problem**: After implementing the price range filter, the application started showing React 19 compatibility errors:
```
Error: Accessing element.ref was removed in React 19. ref is now a regular prop. It will be removed from the JSX Element type in a future release.
```

**Solution**: Updated the Radix UI packages to their latest versions to get React 19 compatibility fixes.

**Fix**:
```bash
pnpm update @radix-ui/react-toast @radix-ui/react-slot
```

**Updated Versions**:
- `@radix-ui/react-slot`: 1.0.2 → 1.2.3
- `@radix-ui/react-toast`: 1.1.5 → 1.2.14

**Root Cause**: React 19 introduced breaking changes to how refs are handled. The older versions of Radix UI components were using the deprecated `element.ref` pattern that was removed in React 19.

**Prevention**: When upgrading to React 19, always update all Radix UI dependencies to their latest versions to ensure compatibility.

**Result**: The application now runs without React 19 compatibility errors, and all UI components (toast notifications, radio buttons, sliders) work correctly.

## Technical Patterns

### State Management for Complex Forms
When dealing with complex editing states, use separate state variables for:
- Editing mode flags (`isEditingPrinting`, `isEditingLamination`)
- Form data (`editingPrices`)
- This separation makes the code more maintainable and easier to debug.

### Validation Patterns
Always validate user input before saving:
- Check for valid numbers using `parseFloat()` and `isNaN()`
- Ensure values meet business rules (e.g., non-negative prices)
- Provide clear error messages in the user's language

### UI/UX Best Practices
- Use consistent iconography (Edit, Save, X icons)
- Provide visual feedback for all actions (toast notifications)
- Maintain responsive design across all screen sizes
- Use appropriate input types (number inputs for prices)
- Include proper step values for decimal precision

## Future Enhancements

### Potential Improvements
1. **Bulk Price Updates**: Allow updating multiple prices at once
2. **Price History**: Track changes to prices over time
3. **Price Templates**: Save and load price configurations
4. **Validation Rules**: More sophisticated validation (e.g., maximum prices)
5. **Audit Trail**: Log all price changes for compliance

### Code Organization
Consider extracting price editing logic into a custom hook:
```tsx
const usePriceEditing = (priceTableId: string) => {
  // Price editing logic
  return {
    isEditing,
    editingPrices,
    startEditing,
    savePrices,
    cancelEditing
  }
}
```

This would make the component cleaner and the logic reusable.

## Data Generation Issues

### Unrealistic Sample Data Values (December 2024)

**Problem**: The admin panel was showing extremely high monetary values (€23.387, €12.427, €35.814, etc.) that didn't make sense for a printing/lamination system. Users were seeing debts in the thousands of euros instead of reasonable amounts.

**Root Cause**: The dummy database was generating too much sample data:
- 6 months of data instead of a reasonable timeframe
- Too many jobs per month (5-15 print jobs, 2-7 lamination jobs)
- High page counts per job (up to 20 A4 BW pages, 10 color pages, etc.)
- High quantities for lamination (up to 10 items per job)

**Solution**: Reduced the sample data generation to more realistic levels:
- Reduced from 6 months to 3 months of data
- Reduced print jobs from 5-15 to 1-4 per month
- Reduced page counts: A4 BW (1-9), A4 Color (1-5), A3 BW (1-3), A3 Color (1-2)
- Reduced lamination jobs from 2-7 to 1-3 per month
- Reduced lamination quantities from 1-11 to 1-4 items

**Implementation**:
```typescript
// Before: 6 months, 5-15 jobs per month
for (let monthOffset = 0; monthOffset < 6; monthOffset++) {
  const jobsCount = Math.floor(Math.random() * 10) + 5
  pagesA4BW: Math.floor(Math.random() * 20)
  pagesA4Color: Math.floor(Math.random() * 10)
  // ... high values

// After: 3 months, 1-4 jobs per month  
for (let monthOffset = 0; monthOffset < 3; monthOffset++) {
  const jobsCount = Math.floor(Math.random() * 3) + 1
  pagesA4BW: Math.floor(Math.random() * 8) + 1
  pagesA4Color: Math.floor(Math.random() * 4) + 1
  // ... realistic values
```

**Additional Improvements**:
- Added a `reset()` method to the dummy database for easy data regeneration
- Added a "Reset Data" button in the admin interface
- Added confirmation dialog to prevent accidental data reset

**Reset Method**:
```typescript
reset(): void {
  this.printJobs = []
  this.laminationJobs = []
  this.printBilling = []
  this.laminationBilling = []
  this.initializeData()
}
```

**UI Integration**:
```tsx
const handleResetData = () => {
  if (confirm("Είστε σίγουροι ότι θέλετε να επαναφέρετε όλα τα δεδομένα;")) {
    dummyDB.reset()
    const allUsers = dummyDB.getUsers()
    setUsers(allUsers)
    setFilteredUsers(allUsers)
    toast({
      title: "Επιτυχία",
      description: "Τα δεδομένα επαναφέρθηκαν επιτυχώς",
    })
  }
}
```

**Result**: Now the system shows realistic monetary values:
- Print debts: €0.50 - €15.00 range
- Lamination debts: €1.50 - €25.00 range
- Total debts: €2.00 - €40.00 range

**Lesson Learned**: When generating sample data for testing, always consider realistic usage patterns and reasonable monetary values. Excessive data generation can make the application appear broken or unrealistic to users. 

## Hydration Error Fix (December 2024)

**Problem**: React hydration error occurred due to whitespace text nodes in `<colgroup>` elements. The error message indicated that whitespace text nodes cannot be children of `<colgroup>` elements.

**Error Message**:
```
Error: In HTML, whitespace text nodes cannot be a child of <colgroup>. Make sure you don't have any extra whitespace between tags on each line of your source code.
This will cause a hydration error.
```

**Root Cause**: The `PrintJobsColGroup` component had comments and line breaks between `<col>` elements, which created text nodes in the DOM. HTML `<colgroup>` elements can only contain `<col>` elements directly.

**Solution**: Removed all comments and extra whitespace between `<col>` elements in the `PrintJobsColGroup` component.

**Before (Problematic)**:
```tsx
function PrintJobsColGroup({ userRole }: { userRole: string }) {
  return (
    <colgroup>
      <col className="w-[100px]" /> {/* Date */}
      {userRole === "admin" && <col className="w-[120px]" />} {/* User */}
      {userRole === "admin" && <col className="w-[120px]" />} {/* Department */}
      <col className="w-[120px]" /> {/* Printer */}
      <col className="w-[80px]" /> {/* A4 BW */}
      <col className="w-[80px]" /> {/* A4 Color */}
      <col className="w-[80px]" /> {/* A3 BW */}
      <col className="w-[80px]" /> {/* A3 Color */}
      <col className="w-[80px]" /> {/* Cost */}
      <col className="w-[100px]" /> {/* Status */}
    </colgroup>
  )
}
```

**After (Fixed)**:
```tsx
function PrintJobsColGroup({ userRole }: { userRole: string }) {
  return (
    <colgroup>
      <col className="w-[100px]" />
      {userRole === "admin" && <col className="w-[120px]" />}
      {userRole === "admin" && <col className="w-[120px]" />}
      <col className="w-[120px]" />
      <col className="w-[80px]" />
      <col className="w-[80px]" />
      <col className="w-[80px]" />
      <col className="w-[80px]" />
      <col className="w-[80px]" />
      <col className="w-[100px]" />
    </colgroup>
  )
}
```

**Key Points**:
- **HTML Restrictions**: `<colgroup>` elements can only contain `<col>` elements
- **Whitespace Handling**: Any whitespace between elements creates text nodes
- **Hydration Mismatch**: Server and client rendering differ when text nodes are present
- **Solution**: Remove all comments and ensure no whitespace between `<col>` elements

**Prevention**:
- Always ensure `<colgroup>` contains only `<col>` elements
- Avoid comments and whitespace between `<col>` tags
- Use ESLint rules to catch similar issues
- Test with React Strict Mode to catch hydration issues early 