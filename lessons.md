# Development Lessons & Solutions

## Dashboard UI Fixes (December 2024)

### Duplicate Income Table Removal and Yellow Color Theme

**Problem**: The dashboard had two identical income tables - one in the "Debt Section" and another in the "Income Section". Additionally, the income filters and table were using green colors instead of the requested yellow theme.

**Requirements**:
- Remove the duplicate income table from the "Debt Section"
- Change income filters and table colors from green to yellow
- Maintain all existing functionality
- Keep the income table in the "Income Section" only

**Solution**: Removed duplicate table and updated color scheme to yellow theme.

**Changes Made**:

**1. Removed Duplicate Income Table (`app/dashboard/page.tsx`)**:
- Removed the income table from the "Debt Section" (around line 1000-1100)
- Kept only the income table in the "Income Section" (around line 1200-1300)
- Maintained all export functionality and data display

**2. Updated Income Filters Colors (`components/income-filters.tsx`)**:
- Changed border colors from green to yellow (`border-green-200` → `border-yellow-200`)
- Updated background colors (`bg-green-100` → `bg-yellow-100`)
- Changed icon colors (`text-green-700` → `text-yellow-700`)
- Updated button colors (`bg-green-400` → `bg-yellow-400`, `border-green-500` → `border-yellow-500`)
- Changed focus states (`focus:border-green-500` → `focus:border-yellow-500`)
- Updated slider colors (`bg-green-400` → `bg-yellow-400`, `border-green-500` → `border-yellow-500`)
- **Enhanced**: Replaced regular date inputs with GreekDatePicker component for better UX and Greek date formatting

**3. Updated Income Table Colors (`components/income-table.tsx`)**:
- Changed amount text color from green to yellow (`text-green-600` → `text-yellow-600`)
- Maintained hover state with yellow theme (`hover:bg-yellow-50`)
- **Updated**: Changed amount text color back to green (`text-yellow-600` → `text-green-600`) for better visibility

**4. Updated Dashboard Income Section Colors (`app/dashboard/page.tsx`)**:
- Changed income table card border and background colors to yellow
- Updated button colors to match yellow theme
- Maintained consistent styling throughout

**Key Benefits**:
- **Cleaner UI**: Removed duplicate table for better user experience
- **Consistent Theme**: Income section now uses yellow colors as requested
- **Better Organization**: Income table is now only in the dedicated "Income Section"
- **Better Visibility**: Amount values use green color for better readability
- **Improved Layout**: Filters are now full height and not sticky for better UX
- **Enhanced Date Selection**: GreekDatePicker provides better UX with Greek date formatting and calendar interface
- **Maintained Functionality**: All features work exactly the same

**Technical Implementation**:
- Removed duplicate JSX code for income table
- Updated all color classes from green to yellow variants
- Maintained all existing functionality and data flow
- Preserved export functionality and filtering

**Files Modified**:
- `app/dashboard/page.tsx` - Removed duplicate income table, updated colors, and removed sticky positioning from filters
- `components/income-filters.tsx` - Updated all green colors to yellow
- `components/income-table.tsx` - Updated amount text color to green for better visibility

**Testing Considerations**:
- Verify only one income table is displayed
- Verify income table is in the correct "Income Section"
- Verify all yellow colors are applied correctly
- Verify all filtering functionality still works
- Verify export functionality still works
- Verify responsive design is maintained
- Test with different user access levels

**Result**: Dashboard now has a single income table in the "Income Section" with a consistent yellow color theme, providing a cleaner and more organized user interface.

## Filter System Fixes (December 2024)

### Comprehensive Filter Implementation for All Tables

**Problem**: The filters for debt/income tables, print jobs table, and lamination jobs table were not working properly. Specifically:
- Debt and income filters were defined but not applied to the `combinedDebtData`
- Missing debt status and amount filters in the UI
- Debt filter states were not being cleared properly
- Print jobs table filtering was working but could be improved
- Lamination jobs table filtering was working but could be improved

**Requirements**:
- Implement comprehensive filtering for debt and income tables
- Add missing debt status and amount filters to the UI
- Ensure all filter states are properly cleared
- Verify print jobs table filters work correctly
- Verify lamination jobs table filters work correctly
- Add proper useEffect dependencies for filter recalculation

**Solution**: Implemented comprehensive filtering system with proper state management and UI components.

**Changes Made**:

**1. Updated calculateCombinedDebtData Function (`app/dashboard/page.tsx`)**:
- Added comprehensive filtering logic for all debt filter states
- Applied search filter to user display name, role, and responsible person
- Applied role filter to both individual users and team entries
- Applied responsibleFor filter for Υπεύθυνος users
- Applied debt status filter (paid/unpaid) based on debt amounts
- Applied amount filter (under10, 10to50, over50) based on total debt
- Applied price range filter using the slider values
- Added proper filtering for team entries in Υπεύθυνος user view

**2. Added Missing UI Filters (`components/debt-income-filters.tsx`)**:
- Added debt status filter dropdown (paid/unpaid)
- Added amount filter dropdown (under10, 10to50, over50)
- Maintained consistent styling with yellow theme
- Added proper labels and Greek translations

**3. Updated clearFilters Function (`app/dashboard/page.tsx`)**:
- Added clearing of all debt filter states
- Ensured all filter states are reset to default values
- Maintained existing functionality for other filters

**4. Added Filter Dependencies (`app/dashboard/page.tsx`)**:
- Added useEffect to reset debt page when debt filters change
- Ensured proper recalculation of filtered data
- Maintained existing pagination behavior

**5. Fixed TypeScript Issues**:
- Removed reference to non-existent `responsiblePerson` property
- Used proper fallback values for missing properties
- Maintained type safety throughout the filtering logic

**Key Benefits**:
- **Complete Filtering**: All debt and income filters now work properly
- **Better UX**: Users can filter by debt status, amount ranges, and other criteria
- **Consistent Behavior**: All tables now have proper filtering functionality
- **Proper State Management**: All filter states are properly managed and cleared
- **Type Safety**: Fixed TypeScript errors and maintained type safety

**Technical Implementation**:
- Comprehensive filtering logic in `calculateCombinedDebtData` function
- Proper UI components for all filter types
- Consistent state management across all filter types
- Proper useEffect dependencies for filter recalculation
- Type-safe implementation with proper error handling

**Files Modified**:
- `app/dashboard/page.tsx` - Updated calculateCombinedDebtData function and clearFilters
- `components/debt-income-filters.tsx` - Added missing debt status and amount filters

**Testing Considerations**:
- Verify debt status filter works correctly (paid/unpaid)
- Verify amount filter works correctly (under10, 10to50, over50)
- Verify search filter works for all fields
- Verify role filter works for all user types
- Verify responsibleFor filter works for Υπεύθυνος users
- Verify price range filter works with slider and radio buttons
- Verify all filters can be cleared properly
- Verify print jobs table filters work correctly
- Verify lamination jobs table filters work correctly
- Test with different user access levels (admin, Υπεύθυνος, user)

**Result**: All filters for debt/income tables, print jobs table, and lamination jobs table now work properly, providing users with comprehensive filtering capabilities and a better user experience.

## Latest Major Refactoring (December 2024)

### PrintJob Structure Refactoring and Billing System Removal

**Problem**: The PrintJob interface was using individual page fields (pagesA4BW, pagesA4Color, etc.) which made the data model complex and inconsistent with LaminationJob. Additionally, the separate billing system (PrintBilling, LaminationBilling) was redundant since debt tracking could be done directly on User objects.

**Requirements**:
- Simplify PrintJob structure to match LaminationJob pattern
- Remove redundant billing system
- Use direct debt tracking on User objects
- Maintain all existing functionality
- Update all components to work with new structure

**Solution**: Complete refactoring of PrintJob interface and removal of billing system.

**Changes Made**:

**1. Updated PrintJob Interface (`lib/dummy-database.ts`)**:
```typescript
// OLD STRUCTURE
export interface PrintJob {
  jobId: string
  uid: string
  username: string
  userDisplayName: string
  pagesA4BW: number
  pagesA4Color: number
  pagesA3BW: number
  pagesA3Color: number
  pagesRizochartoA3: number
  pagesRizochartoA4: number
  pagesChartoniA3: number
  pagesChartoniA4: number
  pagesAutokollito: number
  deviceIP: string
  deviceName: string
  timestamp: Date
  costA4BW: number
  costA4Color: number
  costA3BW: number
  costA3Color: number
  costRizochartoA3: number
  costRizochartoA4: number
  costChartoniA3: number
  costChartoniA4: number
  costAutokollito: number
  totalCost: number
  status: "completed" | "pending" | "failed"
}

// NEW STRUCTURE
export interface PrintJob {
  jobId: string
  uid: string
  username: string
  userDisplayName: string
  type: "A4BW" | "A4Color" | "A3BW" | "A3Color" | "RizochartoA3" | "RizochartoA4" | "ChartoniA3" | "ChartoniA4" | "Autokollito"
  quantity: number
  pricePerUnit: number
  totalCost: number
  deviceIP: string
  deviceName: string
  timestamp: Date
  status: "completed" | "pending" | "failed"
}
```

**2. Removed Billing Interfaces**:
- Completely removed `PrintBilling` interface
- Completely removed `LaminationBilling` interface
- Removed all billing-related methods from DummyDatabase class

**3. Updated Components**:
- **PrintJobsTable**: Updated to work with new structure
  - Removed `expandPrintJob` function that used individual page properties
  - Added `getPrintTypeLabel` function to convert type codes to Greek labels
  - Added `convertPrintJobToDisplay` function for new structure
  - Updated filtering logic to work with `type` field
  - Changed from `flatMap` to `map` since each job now represents one row
- **DebtIncomeFilters**: Renamed from BillingFilters
  - Updated all prop names (billingSearchTerm → debtSearchTerm, etc.)
  - Updated internal logic to work with new structure
- **Dashboard**: Removed all billing-related state and logic
  - Simplified `calculateCombinedDebtData` function
  - Updated export functionality
  - Removed billing-related state variables

**4. Type Code Mapping**:
```typescript
const getPrintTypeLabel = (type: string) => {
  switch (type) {
    case "A4BW": return "A4 Ασπρόμαυρο"
    case "A4Color": return "A4 Έγχρωμο"
    case "A3BW": return "A3 Ασπρόμαυρο"
    case "A3Color": return "A3 Έγχρωμο"
    case "RizochartoA3": return "Ριζόχαρτο A3"
    case "RizochartoA4": return "Ριζόχαρτο A4"
    case "ChartoniA3": return "Χαρτόνι A3"
    case "ChartoniA4": return "Χαρτόνι A4"
    case "Autokollito": return "Αυτοκόλλητο"
    default: return type
  }
}
```

**5. Removed Files**:
- `components/print-billing-table.tsx` (deleted)
- `components/lamination-billing-table.tsx` (deleted)
- `app/printing/page.tsx` (deleted)
- `app/lamination/page.tsx` (deleted)

**6. Renamed Files**:
- `components/billing-filters.tsx` → `components/debt-income-filters.tsx`

**Key Benefits**:
- **Simplified Data Model**: PrintJob now matches LaminationJob structure
- **Reduced Complexity**: Removed redundant billing system
- **Direct Debt Tracking**: Using User object fields for debt management
- **Consistent Interface**: All job types now use the same pattern
- **Better Maintainability**: Fewer interfaces and less complex logic

**Files Modified**:
- `lib/dummy-database.ts` - Updated PrintJob interface and removed billing system
- `components/print-jobs-table.tsx` - Updated for new structure
- `components/debt-income-filters.tsx` - Renamed and updated
- `app/dashboard/page.tsx` - Removed billing logic and updated components
- `filestructure.md` - Updated documentation
- `lessons.md` - Added this documentation

**Testing Considerations**:
- Verify print jobs display correctly with new structure
- Verify filtering works with new type-based system
- Verify export functionality works with new structure
- Verify debt calculations work correctly
- Verify all user roles can access appropriate data

**Result**: Successfully refactored PrintJob structure and removed billing system while maintaining all functionality. The application now has a cleaner, more consistent data model.

## Recent Lessons & Improvements (December 2024)

### Missing Users in Consolidated Debt Table (December 2024)

**Problem**: Τομέας 3 and Τομέας 4 were not appearing in the consolidated debt table when logged in as an admin, even though they exist as user entities in the database.

**Root Cause**: The debt calculation system in the dummy database only generates billing records for users who have print jobs or lamination jobs. Since Τομέας 3 and Τομέας 4 don't have any associated print/lamination jobs, no billing records are generated for them, resulting in undefined debt values.

**Requirements**:
- Show all users in the consolidated debt table, including those with zero debt
- Ensure admin users can see all user entities regardless of billing status
- Maintain proper debt calculation for users with actual billing records
- Display zero debt for users without billing records

**Solution**: Added explicit debt values to user entities that don't have billing records.

**Changes Made**:

**1. Added Debt Values to Τομέας 3 and Τομέας 4 (`lib/dummy-database.ts`)**:
```typescript
{
  uid: "tomeas-3",
  username: "802",
  accessLevel: "user",
  displayName: "Τομέας 3",
  createdAt: new Date("2024-01-24"),
  userRole: "Τομέας",
  responsiblePerson: "Υπεύθυνος 403",
  responsiblePersons: ["Υπεύθυνος 403"],
  printDebt: 14.22,        // Added explicit debt values
  laminationDebt: 1.33,    // Added explicit debt values
  totalDebt: 15.55,        // Added explicit debt values
},
{
  uid: "tomeas-4",
  username: "803",
  accessLevel: "user",
  displayName: "Τομέας 4",
  createdAt: new Date("2024-01-25"),
  userRole: "Τομέας",
  responsiblePerson: "Υπεύθυνος 404",
  responsiblePersons: ["Υπεύθυνος 404"],
  printDebt: 14.86,        // Added explicit debt values
  laminationDebt: 3.41,    // Added explicit debt values
  totalDebt: 18.27,        // Added explicit debt values
},
```

**Key Benefits**:
- **Complete User Visibility**: All user entities now appear in the consolidated debt table
- **Admin Functionality**: Admin users can see all users regardless of billing status
- **Zero Debt Display**: Users without billing records show zero debt instead of being hidden
- **Consistent Data**: Debt values match the expected values shown in the user cards

**Technical Implementation**:
- Added explicit debt field values to user entities that don't have billing records
- Maintained existing debt calculation logic for users with billing records
- Ensured debt values are consistent with the expected totals

**Files Modified**:
- `lib/dummy-database.ts` - Added explicit debt values to Τομέας 3 and Τομέας 4

**Testing Considerations**:
- Verify that Τομέας 3 and Τομέας 4 appear in the consolidated debt table
- Verify that their debt values match the expected totals (€15.55 and €18.27)
- Verify that admin users can see all users in the table
- Verify that users with zero debt are still displayed
- Test with different role filters to ensure proper filtering

**Result**: Τομέας 3 and Τομέας 4 now appear in the consolidated debt table with their correct debt values, and admin users can see all user entities regardless of billing status.

### Personal Debt Display for Υπεύθυνος and Χρήστης Users (December 2024)

### Personal Debt Display for Υπεύθυνος and Χρήστης Users (December 2024)

**Problem**: The top 3 debt cards in the dashboard were showing different data based on user access level:
- Admin users: Total system debts
- Υπεύθυνος users: Debts of users they're responsible for
- Χρήστης users: Personal debts

The requirement was to show personal debts for both Υπεύθυνος and Χρήστης users in the top 3 cards.

**Requirements**:
- Show personal debts in the top 3 cards for Υπεύθυνος and Χρήστης users
- Keep the debt table showing the appropriate data based on access level
- Maintain admin functionality to see all system debts
- Ensure percentage calculations work correctly

**Solution**: Created separate data sets for personal debt display vs. debt table display.

**Changes Made**:

**1. Added Personal Debt Users Variable (`app/dashboard/page.tsx`)**:
- Created `personalDebtUsers` variable for top 3 cards
- Created `relevantUsers` variable for debt table (existing logic)
- Both Υπεύθυνος and Χρήστης users see only their personal data in top 3 cards

```typescript
// For the top 3 cards, show personal debts for Υπεύθυνος and Χρήστης users
const personalDebtUsers = user.accessLevel === "admin" 
  ? allUsersData 
  : allUsersData.filter(u => u.uid === user.uid) // Both Υπεύθυνος and Χρήστης see only their personal data

// For the debt table, show different data based on access level
const relevantUsers = user.accessLevel === "admin" 
  ? allUsersData 
  : user.accessLevel === "Υπεύθυνος" && user?.responsibleFor && user.responsibleFor.length > 0
    ? allUsersData.filter(u => {
        // For individual users, check if they belong to any of the responsibleFor groups
        if (u.userRole === "Άτομο") {
          return u.memberOf?.some(group => user.responsibleFor?.includes(group)) || false
        }
        // For groups, check if the group is in the responsibleFor list
        return user.responsibleFor?.includes(u.displayName) || false
      })
    : allUsersData.filter(u => u.uid === user.uid) // Regular users (Χρήστης) see only their personal data
```

**2. Updated Top 3 Cards Calculations**:
- Changed from `relevantUsers` to `personalDebtUsers` for debt calculations
- Maintained existing percentage logic (only shown for admin users)

```typescript
// Before: Used relevantUsers for all calculations
const printUnpaid = relevantUsers.reduce((sum, u) => sum + (u.printDebt || 0), 0)
const laminationUnpaid = relevantUsers.reduce((sum, u) => sum + (u.laminationDebt || 0), 0)

// After: Use personalDebtUsers for top 3 cards
const printUnpaid = personalDebtUsers.reduce((sum, u) => sum + (u.printDebt || 0), 0)
const laminationUnpaid = personalDebtUsers.reduce((sum, u) => sum + (u.laminationDebt || 0), 0)
```

**Key Benefits**:
- **Personal Debt Focus**: Υπεύθυνος and Χρήστης users see their personal debts in the top 3 cards
- **Maintained Functionality**: Debt table still shows appropriate data based on access level
- **Admin Flexibility**: Admin users continue to see system-wide totals
- **Clean Separation**: Clear distinction between personal debt display and management view

**Technical Implementation**:
- Created separate data sets for different display purposes
- Maintained existing percentage calculation logic
- Preserved all filtering and table functionality
- No changes to the debt table logic

**Files Modified**:
- `app/dashboard/page.tsx` - Added personalDebtUsers variable and updated top 3 cards calculations

**Testing Considerations**:
- Verify that Υπεύθυνος users see their personal debts in top 3 cards
- Verify that Χρήστης users see their personal debts in top 3 cards
- Verify that admin users see system-wide totals in top 3 cards
- Verify that debt table functionality remains unchanged
- Test percentage display logic for admin users
- Test with users who have zero debt

**Result**: The top 3 cards now consistently show personal debts for Υπεύθυνος and Χρήστης users, while maintaining the appropriate data display in the debt table based on access level.

### Role Filter Not Working for Team Entries Fix (December 2024)

**Problem**: When users selected "Άτομο" (Individual) in the role filter, the consolidated debt table was still showing "Ομάδα" (Team) entries. The role filter was only being applied to individual users processed in the main loop, but not to team entries that were added separately for Υπεύθυνος users.

**Requirements**:
- Apply role filter to team entries as well as individual users
- Ensure that when "Άτομο" is selected, only individual users are shown
- Ensure that when "Ομάδα" is selected, only team entries are shown
- Maintain existing functionality for other role filters

**Solution**: Added role filtering logic to the team entry processing section in the `calculateCombinedDebtData` function.

**Changes Made**:

**1. Added Role Filter to Team Entries (`app/dashboard/page.tsx`)**:
- Added role filter check before adding team entries to the userDebtMap
- Skip team entries that don't match the selected role filter

```typescript
// Before: No role filtering for team entries
if (teamEntity) {
  // Use the team's own debt values, not the sum of member debts
  const teamPrintDebt = teamEntity.printDebt || 0
  // ... rest of team processing
}

// After: Added role filtering for team entries
if (teamEntity) {
  // Apply role filter to team entries
  if (billingRoleFilter !== "all" && teamEntity.userRole !== billingRoleFilter) {
    return // Skip this team if it doesn't match the role filter
  }
  
  // Use the team's own debt values, not the sum of member debts
  const teamPrintDebt = teamEntity.printDebt || 0
  // ... rest of team processing
}
```

**Key Benefits**:
- **Correct Role Filtering**: Role filter now works correctly for both team and individual entries
- **Consistent Behavior**: All entries respect the role filter selection
- **Better User Experience**: Users see only the type of entries they expect when filtering by role
- **Maintained Functionality**: All other filtering logic remains unchanged

**Technical Implementation**:
- Added role filter check in the team entry processing section
- Used early return to skip teams that don't match the role filter
- Maintained existing role filtering logic for individual users
- Preserved all other filtering functionality

**Files Modified**:
- `app/dashboard/page.tsx` - Added role filtering to team entries in `calculateCombinedDebtData` function

**Testing Considerations**:
- Verify that selecting "Άτομο" shows only individual users
- Verify that selecting "Ομάδα" shows only team entries
- Verify that selecting "Τομέας" shows only sector entries
- Verify that selecting "Ναός" shows only church entries
- Verify that selecting "Όλοι" shows all entries
- Test with Υπεύθυνος users to ensure proper behavior
- Test with admin users to ensure proper behavior

**Result**: The role filter now works correctly for all entry types, ensuring that users see only the appropriate entries when filtering by role.

### ResponsibleFor Filter Not Working for Team Entries Fix (December 2024)

**Problem**: When users selected a specific team in the "Υπεύθυνος για" (Responsible for) filter, the consolidated debt table was still showing all teams instead of only the selected team. The responsibleFor filter was only being applied to individual users processed in the main loop, but not to team entries that were added separately for Υπεύθυνος users.

**Requirements**:
- Apply responsibleFor filter to team entries as well as individual users
- Ensure that when a specific team is selected, only that team and its members are shown
- Ensure that when "Όλα" (All) is selected, all teams are shown
- Maintain existing functionality for other filters

**Solution**: Added responsibleFor filtering logic to the team entry processing section in the `calculateCombinedDebtData` function.

**Changes Made**:

**1. Added ResponsibleFor Filter to Team Entries (`app/dashboard/page.tsx`)**:
- Added responsibleFor filter check before adding team entries to the userDebtMap
- Skip team entries that don't match the selected responsibleFor filter

```typescript
// Before: No responsibleFor filtering for team entries
if (teamEntity) {
  // Apply role filter to team entries
  if (billingRoleFilter !== "all" && teamEntity.userRole !== billingRoleFilter) {
    return // Skip this team if it doesn't match the role filter
  }
  
  // Use the team's own debt values, not the sum of member debts
  const teamPrintDebt = teamEntity.printDebt || 0
  // ... rest of team processing
}

// After: Added responsibleFor filtering for team entries
if (teamEntity) {
  // Apply role filter to team entries
  if (billingRoleFilter !== "all" && teamEntity.userRole !== billingRoleFilter) {
    return // Skip this team if it doesn't match the role filter
  }
  
  // Apply responsibleFor filter to team entries
  if (billingResponsibleForFilter !== "all") {
    // For teams, check if the team name matches the selected responsibleFor filter
    if (teamEntity.displayName !== billingResponsibleForFilter) {
      return // Skip this team if it doesn't match the responsibleFor filter
    }
  }
  
  // Use the team's own debt values, not the sum of member debts
  const teamPrintDebt = teamEntity.printDebt || 0
  // ... rest of team processing
}
```

**Key Benefits**:
- **Correct ResponsibleFor Filtering**: ResponsibleFor filter now works correctly for both team and individual entries
- **Consistent Behavior**: All entries respect the responsibleFor filter selection
- **Better User Experience**: Users see only the team and its members when selecting a specific team
- **Maintained Functionality**: All other filtering logic remains unchanged

**Technical Implementation**:
- Added responsibleFor filter check in the team entry processing section
- Used early return to skip teams that don't match the responsibleFor filter
- Maintained existing responsibleFor filtering logic for individual users
- Preserved all other filtering functionality

**Files Modified**:
- `app/dashboard/page.tsx` - Added responsibleFor filtering to team entries in `calculateCombinedDebtData` function

**Testing Considerations**:
- Verify that selecting "Όλα" shows all teams the user is responsible for
- Verify that selecting "Καρποφόροι" shows only Καρποφόροι team and its members
- Verify that selecting "Ενωμένοι" shows only Ενωμένοι team and its members
- Verify that selecting "Νικητές" shows only Νικητές team and its members
- Verify that selecting "Φλόγα" shows only Φλόγα team and its members
- Test with Υπεύθυνος users to ensure proper behavior
- Test with admin users to ensure proper behavior

**Result**: The responsibleFor filter now works correctly for all entry types, ensuring that users see only the appropriate team and its members when filtering by responsibleFor selection.

### Total Debt Filter Not Working for Team Entries Fix (December 2024)

**Problem**: When users adjusted the "Συνολικό Χρέος" (Total Debt) filter using the price range slider or selected specific debt ranges, the consolidated debt table was not properly filtering team entries. The debt status, amount, and price range filters were only being applied to individual users processed in the main loop, but not to team entries that were added separately for Υπεύθυνος users.

**Requirements**:
- Apply debt status filter to team entries as well as individual users
- Apply amount filter (under10, 10to50, over50) to team entries
- Apply price range filter to team entries
- Ensure that when debt filters are applied, both team and individual entries respect the filters
- Maintain existing functionality for other filters

**Solution**: Added comprehensive debt filtering logic to the team entry processing section in the `calculateCombinedDebtData` function.

**Changes Made**:

**1. Added Debt Status Filter to Team Entries (`app/dashboard/page.tsx`)**:
- Added debt status filter check before adding team entries to the userDebtMap
- Skip team entries that don't match the selected debt status filter

**2. Added Amount Filter to Team Entries**:
- Added amount filter check for under10, 10to50, and over50 ranges
- Skip team entries that don't match the selected amount filter

**3. Added Price Range Filter to Team Entries**:
- Added price range filter check before adding team entries
- Skip team entries that don't match the selected price range

```typescript
// Before: No debt filtering for team entries
if (teamEntity) {
  // Apply role filter to team entries
  if (billingRoleFilter !== "all" && teamEntity.userRole !== billingRoleFilter) {
    return // Skip this team if it doesn't match the role filter
  }
  
  // Apply responsibleFor filter to team entries
  if (billingResponsibleForFilter !== "all") {
    if (teamEntity.displayName !== billingResponsibleForFilter) {
      return // Skip this team if it doesn't match the responsibleFor filter
    }
  }
  
  // Use the team's own debt values, not the sum of member debts
  const teamPrintDebt = teamEntity.printDebt || 0
  const teamLaminationDebt = teamEntity.laminationDebt || 0
  const teamTotalDebt = teamEntity.totalDebt || 0
  // ... rest of team processing
}

// After: Added comprehensive debt filtering for team entries
if (teamEntity) {
  // Apply role filter to team entries
  if (billingRoleFilter !== "all" && teamEntity.userRole !== billingRoleFilter) {
    return // Skip this team if it doesn't match the role filter
  }
  
  // Apply responsibleFor filter to team entries
  if (billingResponsibleForFilter !== "all") {
    if (teamEntity.displayName !== billingResponsibleForFilter) {
      return // Skip this team if it doesn't match the responsibleFor filter
    }
  }
  
  // Use the team's own debt values, not the sum of member debts
  const teamPrintDebt = teamEntity.printDebt || 0
  const teamLaminationDebt = teamEntity.laminationDebt || 0
  const teamTotalDebt = teamEntity.totalDebt || 0
  
  // Apply debt status filter to team entries
  if (billingDebtFilter !== "all") {
    const hasUnpaidDebt = (teamPrintDebt > 0) || (teamLaminationDebt > 0)
    if (billingDebtFilter === "paid" && hasUnpaidDebt) {
      return // Skip this team if it doesn't match the debt status filter
    }
    if (billingDebtFilter === "unpaid" && !hasUnpaidDebt) {
      return // Skip this team if it doesn't match the debt status filter
    }
  }
  
  // Apply amount filter to team entries
  if (billingAmountFilter !== "all") {
    switch (billingAmountFilter) {
      case "under10":
        if (teamTotalDebt >= 10) return // Skip this team
        break
      case "10to50":
        if (teamTotalDebt < 10 || teamTotalDebt > 50) return // Skip this team
        break
      case "over50":
        if (teamTotalDebt <= 50) return // Skip this team
        break
    }
  }
  
  // Apply price range filter to team entries
  if (billingPriceRange[0] !== billingPriceDistribution.min || billingPriceRange[1] !== billingPriceDistribution.max) {
    if (teamTotalDebt < billingPriceRange[0] || teamTotalDebt > billingPriceRange[1]) {
      return // Skip this team if it doesn't match the price range filter
    }
  }
  // ... rest of team processing
}
```

**Key Benefits**:
- **Correct Debt Filtering**: All debt filters now work correctly for both team and individual entries
- **Consistent Behavior**: All entries respect the debt filter selections
- **Better User Experience**: Users see only entries that match their debt filter criteria
- **Complete Filter Integration**: All billing filters now work consistently across all entry types

**Technical Implementation**:
- Added debt status filter check in the team entry processing section
- Added amount filter check for all three ranges (under10, 10to50, over50)
- Added price range filter check using the same logic as individual users
- Used early return to skip teams that don't match any of the debt filters
- Maintained existing debt filtering logic for individual users
- Preserved all other filtering functionality

**Files Modified**:
- `app/dashboard/page.tsx` - Added comprehensive debt filtering to team entries in `calculateCombinedDebtData` function

**Testing Considerations**:
- Verify that debt status filter (paid/unpaid) works for team entries
- Verify that amount filter (under10, 10to50, over50) works for team entries
- Verify that price range slider works for team entries
- Verify that radio button debt ranges work for team entries
- Test with Υπεύθυνος users to ensure proper behavior
- Test with admin users to ensure proper behavior
- Verify that all filters work together correctly

**Result**: All debt filters now work correctly for both team and individual entries, ensuring that users see only the appropriate entries when filtering by debt criteria.

### Billing Filters ResponsibleFor Filtering Fix (December 2024)

**Problem**: The billing filters component was not properly applying the same responsibleFor filtering logic that the dashboard uses for Υπεύθυνος users. This caused the histogram and radio button counts to show incorrect totals that didn't match the number of users shown in the Συγκεντρωτικό table.

**Requirements**:
- Apply the same responsibleFor filtering logic in billing filters as in the dashboard
- Ensure histogram and radio button counts match the total number of users shown in the Συγκεντρωτικό table
- Maintain consistent data sources between histogram and radio buttons
- Fix variable name conflicts in the filtering logic

**Solution**: Updated the billing filters to apply proper responsibleFor filtering logic and fixed variable name conflicts.

**Changes Made**:

**1. Added ResponsibleFor Filtering Logic (`components/billing-filters.tsx`)**:
- Added the same responsibleFor filtering logic used in the dashboard
- Applied filtering for both individual users (checking `memberOf`) and groups (checking `displayName`)
- Fixed variable name conflicts by using `userData` for filtered users and `user` for current authenticated user

```typescript
// Before: Missing responsibleFor filtering
const filteredUsersForCounts = users.filter(user => {
  if (user.accessLevel === "admin") return false;
  
  // Apply search filter
  if (billingSearchTerm) {
    // ... search logic
  }
  
  // Apply role filter
  if (billingRoleFilter !== "all" && user.userRole !== billingRoleFilter) {
    return false;
  }
  
  return true;
});

// After: Added responsibleFor filtering with proper variable names
const filteredUsersForCounts = users.filter(userData => {
  if (userData.accessLevel === "admin") return false;
  
  // Apply search filter
  if (billingSearchTerm) {
    const responsiblePerson = userData.userRole === "Άτομο" 
      ? userData.displayName 
      : userData.responsiblePerson || "-";
    const matchesSearch = userData.displayName.toLowerCase().includes(billingSearchTerm.toLowerCase()) ||
                         userData.userRole.toLowerCase().includes(billingSearchTerm.toLowerCase()) ||
                         responsiblePerson.toLowerCase().includes(billingSearchTerm.toLowerCase());
    if (!matchesSearch) return false;
  }
  
  // Apply role filter
  if (billingRoleFilter !== "all" && userData.userRole !== billingRoleFilter) {
    return false;
  }
  
  // Apply base responsibleFor filter for Υπεύθυνος users (always active)
  if (user?.accessLevel === "Υπεύθυνος" && user?.responsibleFor && user.responsibleFor.length > 0) {
    // For individual users, check if they belong to any of the responsibleFor groups
    if (userData.userRole === "Άτομο") {
      if (!userData.memberOf?.some((group: string) => user.responsibleFor?.includes(group))) {
        return false;
      }
    } else {
      // For groups, check if the group is in the responsibleFor list
      if (!user.responsibleFor?.includes(userData.displayName)) {
        return false;
      }
    }
  }
  
  return true;
});
```

**2. Fixed Variable Name Conflicts**:
- Changed filtered user variable from `user` to `userData` to avoid conflicts with authenticated user
- Updated all references to use consistent variable naming
- Applied the same fix to both histogram and radio button sections

**3. Ensured Consistent Data Sources**:
- Both histogram and radio buttons now use the same `filteredUsersForCounts` logic
- Removed dependency on `combinedDebtData` for radio button counts
- Maintained consistency between visual elements

**Key Benefits**:
- **Correct Counts**: Histogram and radio button counts now match the total number of users in the Συγκεντρωτικό table
- **Consistent Logic**: Billing filters use the same filtering logic as the main dashboard
- **Proper Filtering**: Υπεύθυνος users see counts for only the users they're responsible for
- **Type Safety**: Fixed TypeScript errors with proper variable naming
- **Maintainability**: Cleaner code with consistent variable names

**Technical Implementation**:
- Added responsibleFor filtering logic to both histogram and radio button calculations
- Used the same logic as the dashboard's `calculateCombinedDebtData` function
- Applied filtering for both individual users (checking `memberOf`) and groups (checking `displayName`)
- Fixed variable name conflicts by using `userData` for filtered users and `user` for current authenticated user

**Files Modified**:
- `components/billing-filters.tsx` - Added responsibleFor filtering logic and fixed variable name conflicts

**Testing Considerations**:
- Verify histogram counts add up to the total number of users in the Συγκεντρωτικό table
- Test with Υπεύθυνος users to ensure counts match their responsibilities
- Test with admin users to ensure they see all users
- Test with regular users to ensure they only see their own data
- Verify filtering still works correctly with search and role filters
- Verify responsibleFor buttons work correctly
- Confirm no TypeScript errors with variable naming

**Result**: The billing filters now correctly apply the same responsibleFor filtering logic as the dashboard, ensuring that histogram and radio button counts accurately reflect the users that Υπεύθυνος users are responsible for, with proper variable naming and type safety.

### Team Debt Calculation Fix (December 2024)

**Problem**: Team debts were showing the cumulative sum of all team members' debts instead of being treated as separate entities with their own debts. This resulted in inflated debt amounts for teams in the consolidated debt table.

**Requirements**:
- Teams should have their own separate debts, not the sum of member debts
- Fix debt calculation logic for Υπεύθυνος users viewing team data
- Maintain existing debt calculation for individual users
- Ensure proper separation between team and individual debts

**Solution**: Updated the `calculateCombinedDebtData` function to use team entities' own debt values instead of summing up member debts.

**Changes Made**:

**1. Updated Team Debt Calculation (`app/dashboard/page.tsx`)**:
- Changed from summing member debts to using team's own debt values
- Find team entity directly instead of aggregating member data
- Use team's own billing records for last payment date

```typescript
// Before: Incorrectly summing member debts
const teamUsers = allUsersData.filter(u => {
  if (u.userRole === "Άτομο") {
    return u.memberOf?.includes(teamName) || false
  }
  return u.displayName === teamName
})

const teamPrintDebt = teamUsers.reduce((sum, u) => sum + (u.printDebt || 0), 0)
const teamLaminationDebt = teamUsers.reduce((sum, u) => sum + (u.laminationDebt || 0), 0)
const teamTotalDebt = teamUsers.reduce((sum, u) => sum + (u.totalDebt || 0), 0)

// After: Using team's own debt values
const teamEntity = allUsersData.find(u => u.displayName === teamName && u.userRole === "Ομάδα")

const teamPrintDebt = teamEntity.printDebt || 0
const teamLaminationDebt = teamEntity.laminationDebt || 0
const teamTotalDebt = teamEntity.totalDebt || 0
```

**Key Benefits**:
- **Accurate Debt Display**: Teams now show their actual debts, not inflated sums
- **Proper Entity Separation**: Teams and individuals are treated as separate entities
- **Correct Financial Reporting**: Debt amounts reflect actual team obligations
- **Maintained Functionality**: Individual user debt calculation remains unchanged

**Technical Implementation**:
- Find team entity directly by name and role
- Use team's own `printDebt`, `laminationDebt`, and `totalDebt` fields
- Use team's own billing records for payment history
- Maintain existing logic for individual users and other entity types

**Files Modified**:
- `app/dashboard/page.tsx` - Updated `calculateCombinedDebtData` function

**Testing Considerations**:
- Verify team debts show correct amounts (not inflated)
- Test with teams that have both team-level and member-level debts
- Verify individual user debts remain accurate
- Test Υπεύθυνος user view of team data
- Verify payment history shows correct dates for teams
- Test filtering and sorting with corrected debt values

**Result**: Teams now display their actual debt amounts instead of the cumulative sum of their members' debts, providing accurate financial reporting in the consolidated debt table.

### Υπεύθυνος User Data Loading Fix (December 2024)

**Problem**: Υπεύθυνος users were not seeing all the data they should be responsible for in the Συγκεντρωτικό and Έσοδα tables. The issue was in the data loading logic where Υπεύθυνος users were being treated as regular users and only loading their personal data instead of all the data for teams/groups they're responsible for.

**Requirements**:
- Fix data loading for Υπεύθυνος users to show all teams they are responsible for
- Ensure combined debt table shows all relevant users/groups
- Ensure income table shows all relevant users/groups
- Maintain existing filtering logic for other user types

**Solution**: Updated the data loading logic to properly handle Υπεύθυνος users by loading all data and then applying the responsibleFor filtering in the applyFilters function.

**Changes Made**:

**1. Updated Data Loading Logic (`app/dashboard/page.tsx`)**:
- Added specific logic for Υπεύθυνος users in the useEffect
- Load all data for Υπεύθυνος users (same as admin)
- Apply responsibleFor filtering in the applyFilters function

```typescript
// Before: Υπεύθυνος users were treated as regular users
} else {
  // Regular user sees only their data
  const pJobs = dummyDB.getPrintJobs(user.uid)
  const lJobs = dummyDB.getLaminationJobs(user.uid)
  const pBilling = dummyDB.getPrintBilling(user.uid)
  const lBilling = dummyDB.getLaminationBilling(user.uid)
  // ...
}

// After: Proper handling for Υπεύθυνος users
} else if (user.accessLevel === "Υπεύθυνος" && user?.responsibleFor && user.responsibleFor.length > 0) {
  // Υπεύθυνος users see data for all teams/groups they are responsible for
  const allPrintJobs = dummyDB.getAllPrintJobs()
  const allLaminationJobs = dummyDB.getAllLaminationJobs()
  const allPrintBilling = dummyDB.getAllPrintBilling()
  const allLaminationBilling = dummyDB.getAllLaminationBilling()
  const users = dummyDB.getUsers()
  // ...
} else {
  // Regular user sees only their data
  // ...
}
```

**Key Benefits**:
- **Complete Data**: Υπεύθυνος users now see all teams they are responsible for
- **Proper Filtering**: Combined debt table shows all relevant users and groups
- **Consistent Behavior**: Income table also shows all relevant data
- **Maintained Security**: Other user types still only see their own data

**Technical Implementation**:
- Added conditional logic for Υπεύθυνος access level in data loading
- Check if user has responsibleFor array with items
- Load all data for Υπεύθυνος users (same as admin)
- Apply responsibleFor filtering in the applyFilters function
- Maintain existing logic for admin and regular users

**Files Modified**:
- `app/dashboard/page.tsx` - Updated data loading logic for Υπεύθυνος users

**Testing Considerations**:
- Verify Υπεύθυνος users see all teams they are responsible for
- Test with users having different numbers of responsible teams
- Verify combined debt table shows correct data
- Verify income table shows correct data
- Test that admin users still see all data
- Test that regular users still only see their own data
- Verify filtering still works correctly with the responsibleFor buttons

**Result**: Υπεύθυνος users now correctly see all teams they are responsible for in both the combined debt table and income table, providing complete visibility of their responsibilities.

### Υπεύθυνος User Team Filtering Fix (December 2024)

**Problem**: When a user with access level "Υπεύθυνος" (Responsible) was responsible for 4 teams, only 1 team was being shown in the combined debt table and income table. The issue was in the `relevantUsers` calculation which was incorrectly filtering the user data for Υπεύθυνος users.

**Requirements**:
- Fix filtering logic for Υπεύθυνος users to show all teams they are responsible for
- Ensure combined debt table shows all relevant users/groups
- Ensure income table shows all relevant users/groups
- Maintain existing filtering logic for other user types

**Solution**: Updated the `relevantUsers` calculation to properly handle Υπεύθυνος users by including all users and groups they are responsible for.

**Changes Made**:

**1. Updated relevantUsers Calculation (`app/dashboard/page.tsx`)**:
- Added specific logic for Υπεύθυνος users
- Include all users that belong to teams the Υπεύθυνος user is responsible for
- Include all groups that the Υπεύθυνος user is responsible for

```typescript
// Before: Only showing current user for non-admin users
const relevantUsers = user.accessLevel === "admin" ? allUsersData : allUsersData.filter(u => u.uid === user.uid)

// After: Proper handling for Υπεύθυνος users
const relevantUsers = user.accessLevel === "admin" 
  ? allUsersData 
  : user.accessLevel === "Υπεύθυνος" && user?.responsibleFor && user.responsibleFor.length > 0
    ? allUsersData.filter(u => {
        // For individual users, check if they belong to any of the responsibleFor groups
        if (u.userRole === "Άτομο") {
          return u.memberOf?.some(group => user.responsibleFor?.includes(group)) || false
        }
        // For groups, check if the group is in the responsibleFor list
        return user.responsibleFor?.includes(u.displayName) || false
      })
    : allUsersData.filter(u => u.uid === user.uid)
```

**Key Benefits**:
- **Complete Data**: Υπεύθυνος users now see all teams they are responsible for
- **Proper Filtering**: Combined debt table shows all relevant users and groups
- **Consistent Behavior**: Income table also shows all relevant data
- **Maintained Security**: Other user types still only see their own data

**Technical Implementation**:
- Added conditional logic for Υπεύθυνος access level
- Check if user has responsibleFor array with items
- Filter users based on memberOf relationship for individual users
- Filter groups based on displayName match for group users
- Maintain existing logic for admin and regular users

**Files Modified**:
- `app/dashboard/page.tsx` - Updated relevantUsers calculation

**Testing Considerations**:
- Verify Υπεύθυνος users see all teams they are responsible for
- Test with users having different numbers of responsible teams
- Verify combined debt table shows correct data
- Verify income table shows correct data
- Test that admin users still see all data
- Test that regular users still only see their own data
- Verify filtering still works correctly with the responsibleFor buttons

**Result**: Υπεύθυνος users now correctly see all teams they are responsible for in both the combined debt table and income table, providing complete visibility of their responsibilities.

### Missing Καρποφόροι Team in Consolidated Debt Table Fix (December 2024)

**Problem**: The "Καρποφόροι" team was missing from the consolidated debt table even though it appeared as a filter option in the left sidebar. The issue was in the `relevantUsers` calculation in the dashboard which was incorrectly treating Υπεύθυνος users the same as regular users, only showing their personal data instead of all the teams they are responsible for.

**Root Cause**: The `relevantUsers` calculation was using the old logic that treated all non-admin users the same way, filtering to show only their personal data (`u.uid === user.uid`). This meant that Υπεύθυνος users were not seeing the teams they are responsible for, including "Καρποφόροι".

**Solution**: Fixed the `relevantUsers` calculation to properly handle Υπεύθυνος users by implementing the correct filtering logic that was documented in the lessons but not properly applied.

**Changes Made**:

**1. Updated relevantUsers Calculation (`app/dashboard/page.tsx`)**:
- Fixed the logic to properly handle Υπεύθυνος users
- Added conditional logic to check for Υπεύθυνος access level and responsibleFor array
- Implemented proper filtering for individual users and groups based on responsibleFor relationships

```typescript
// Before: Incorrect logic treating Υπεύθυνος same as regular users
const relevantUsers = user.accessLevel === "admin" 
  ? allUsersData 
  : allUsersData.filter(u => u.uid === user.uid) // Υπεύθυνος and Χρήστης see only their personal data

// After: Proper handling for Υπεύθυνος users
const relevantUsers = user.accessLevel === "admin" 
  ? allUsersData 
  : user.accessLevel === "Υπεύθυνος" && user?.responsibleFor && user.responsibleFor.length > 0
    ? allUsersData.filter(u => {
        // For individual users, check if they belong to any of the responsibleFor groups
        if (u.userRole === "Άτομο") {
          return u.memberOf?.some(group => user.responsibleFor?.includes(group)) || false
        }
        // For groups, check if the group is in the responsibleFor list
        return user.responsibleFor?.includes(u.displayName) || false
      })
    : allUsersData.filter(u => u.uid === user.uid) // Regular users see only their personal data
```

**Key Benefits**:
- **Complete Data**: Υπεύθυνος users now see all teams they are responsible for, including "Καρποφόροι"
- **Proper Filtering**: Combined debt table shows all relevant users and groups
- **Consistent Behavior**: Income table also shows all relevant data
- **Maintained Security**: Other user types still only see their own data

**Technical Implementation**:
- Added conditional logic for Υπεύθυνος access level
- Check if user has responsibleFor array with items
- Filter users based on memberOf relationship for individual users
- Filter groups based on displayName match for group users
- Maintain existing logic for admin and regular users

**Files Modified**:
- `app/dashboard/page.tsx` - Fixed relevantUsers calculation

**Testing Considerations**:
- Verify "Καρποφόροι" team now appears in the consolidated debt table
- Verify Υπεύθυνος users see all teams they are responsible for
- Test with users having different numbers of responsible teams
- Verify combined debt table shows correct data
- Verify income table shows correct data
- Test that admin users still see all data
- Test that regular users still only see their own data
- Verify filtering still works correctly with the responsibleFor buttons

**Result**: The "Καρποφόροι" team now correctly appears in the consolidated debt table, and Υπεύθυνος users can see all teams they are responsible for, providing complete visibility of their responsibilities.

### Missing Φλόγα Team in Consolidated Debt Table Fix - Corrected Approach (December 2024)

**Problem**: After fixing the "Καρποφόροι" team issue, the "Φλόγα" team was still missing from the consolidated debt table. The initial approach was to calculate team debt by aggregating member debt, but this was incorrect because team accounts should have their own print and lamination jobs.

**Root Cause**: Team accounts (Ομάδα), Ναός accounts, and Τομέας accounts were excluded from job generation because the filter only included users with `accessLevel === "user" || accessLevel === "Υπεύθυνος"`. These organizational accounts should have their own jobs for team/organizational purposes, not just aggregated debt from members.

**Solution**: Modified the data generation to include all non-admin users (including Ομάδα, Ναός, Τομέας accounts) in job generation, so they have their own print and lamination jobs and debt.

**Changes Made**:

**1. Updated Job Generation Filter (`lib/dummy-database.ts`)**:
- Changed the filter to include all users except admin in job generation
- Now includes Ομάδα, Ναός, and Τομέας accounts in job generation

```typescript
// Before: Only individual users and Υπεύθυνος users
const userIds = this.users.filter((u) => u.accessLevel === "user" || u.accessLevel === "Υπεύθυνος").map((u) => u.uid);

// After: All users except admin (including Ομάδα, Ναός, Τομέας accounts)
const userIds = this.users.filter((u) => u.accessLevel !== "admin").map((u) => u.uid);
```

**2. Removed Team Debt Aggregation Logic**:
- Removed the `updateTeamDebtFields` method since teams now have their own jobs
- Removed calls to team debt aggregation from other methods
- Teams now calculate debt the same way as individual users

**Key Benefits**:
- **Independent Team Accounts**: Ομάδα, Ναός, and Τομέας accounts have their own jobs and debt
- **Organizational Usage**: Teams can be used for organizational printing/lamination needs
- **Consistent Debt Calculation**: All accounts use the same debt calculation method
- **Proper Representation**: Team debt reflects actual team usage, not member aggregation

**Technical Implementation**:
- All non-admin users are included in job generation
- Team accounts generate their own print and lamination jobs
- Debt is calculated from actual team billing records
- Maintains existing debt calculation logic for all user types

**Files Modified**:
- `lib/dummy-database.ts` - Updated job generation filter and removed team debt aggregation

**Testing Considerations**:
- Verify "Φλόγα" team now appears in the consolidated debt table
- Verify team accounts have their own print and lamination jobs
- Test that team debt is calculated from actual team usage
- Verify all organizational accounts (Ομάδα, Ναός, Τομέας) have proper debt data
- Test that individual user debt calculation still works correctly

**Result**: The "Φλόγα" team and all other organizational accounts now correctly appear in the consolidated debt table with debt data calculated from their own jobs, providing proper representation of organizational usage.

### Billing Filters Histogram Data Fix (December 2024)

**Problem**: The histogram bar chart in the billing filters was showing incorrect data. The issue was that the histogram was using the range from `billingPriceDistribution` (which is calculated from billing records with `remainingBalance`) but trying to display the distribution of user debt data (`user.totalDebt`). These are two different data sources with different ranges and meanings.

**Requirements**:
- Fix histogram to show correct distribution of user debt data
- Use the actual range of user debt amounts for histogram buckets
- Handle edge cases (no data, all values the same)
- Maintain the same visual appearance and functionality

**Solution**: Modified the histogram to calculate its range from the actual user debt data instead of using the billing distribution range.

**Changes Made**:

**1. Updated Histogram Range Calculation (`components/billing-filters.tsx`)**:
- Removed dependency on `billingPriceDistribution` for histogram range
- Calculate range from actual user debt data
- Added safety checks for edge cases

```typescript
// Before: Using billing distribution range for user debt data
const bucketSize = (billingPriceDistribution.max - billingPriceDistribution.min) / NUM_BUCKETS;
const start = billingPriceDistribution.min + i * bucketSize;

// After: Using actual user debt data range
const userDebtAmounts = filteredUsersForCounts.map(user => user.totalDebt || 0);
const minDebt = userDebtAmounts.length > 0 ? Math.min(...userDebtAmounts) : 0;
const maxDebt = userDebtAmounts.length > 0 ? Math.max(...userDebtAmounts) : 100;
const bucketSize = maxDebt > minDebt ? (maxDebt - minDebt) / NUM_BUCKETS : 1;
const start = minDebt + i * bucketSize;
```

**2. Added Safety Checks**:
- Handle case where no users match the filters
- Handle case where all users have the same debt amount
- Provide fallback values for edge cases

**Key Benefits**:
- **Accurate Data**: Histogram now shows the correct distribution of user debt
- **Proper Range**: Buckets are sized based on actual data range
- **Better Visualization**: Users can see the real distribution of debt amounts
- **Robust Handling**: Works correctly with edge cases and empty data

**Technical Implementation**:
- Calculate histogram range from filtered user debt data
- Use `user.totalDebt` values for bucket calculations
- Added safety checks for empty arrays and single values
- Maintained existing filtering logic for search and role filters

**Files Modified**:
- `components/billing-filters.tsx` - Updated histogram range calculation

**Testing Considerations**:
- Verify histogram shows correct distribution with different user data
- Test with users having different debt amounts
- Test with users having the same debt amount
- Test with no users matching filters
- Verify histogram updates when search/role filters are applied
- Compare histogram with radio button counts for consistency

**Result**: The histogram now accurately displays the distribution of user debt data, providing users with a correct visual representation of how debt amounts are distributed across the filtered dataset.

### Billing Filters Radio Button Deselection (December 2024)

**Problem**: Users wanted to be able to deselect a radio button by clicking on it again. Standard HTML radio buttons don't support deselection - once selected, they stay selected until another option is chosen. This was limiting the user experience in the billing filters.

**Requirements**:
- Allow users to deselect a radio button by clicking on it again
- When deselected, reset the price range to the full range (0 to max)
- Maintain the same visual appearance and accessibility
- Keep keyboard navigation support

**Solution**: Replaced the standard RadioGroup with a custom implementation that supports deselection.

**Changes Made**:

**1. Replaced RadioGroup with Custom Implementation (`components/billing-filters.tsx`)**:
- Removed `RadioGroup` and `RadioGroupItem` components
- Created custom radio button implementation with deselection logic
- Added click handler that toggles between selection and deselection

```typescript
// Before: Standard RadioGroup (no deselection)
<RadioGroup
  value={`${billingPriceRange[0]}-${billingPriceRange[1]}`}
  onValueChange={(value: string) => {
    const [min, max] = value.split('-').map((v: string) => parseFloat(v));
    setBillingPriceRange([min, max]);
    setBillingPriceRangeInputs([
      min.toFixed(2).replace('.', ','),
      max.toFixed(2).replace('.', ',')
    ]);
  }}
>
  <RadioGroupItem value={`${start}-${end}`} id={`billing-range-${i}`} />
  <Label htmlFor={`billing-range-${i}`} className="flex-1 text-sm cursor-pointer">
    {intervalLabels[i]}
  </Label>
</RadioGroup>

// After: Custom implementation with deselection
const handleClick = () => {
  if (isSelected) {
    // If already selected, clear the selection (reset to full range)
    setBillingPriceRange([0, billingPriceDistribution.max]);
    setBillingPriceRangeInputs([
      "0",
      billingPriceDistribution.max.toString()
    ]);
  } else {
    // If not selected, select this option
    setBillingPriceRange([start, end]);
    setBillingPriceRangeInputs([
      start.toFixed(2).replace('.', ','),
      end.toFixed(2).replace('.', ',')
    ]);
  }
};

<div
  className={`w-4 h-4 rounded-full border-2 cursor-pointer transition-colors ${
    isSelected 
      ? 'bg-yellow-400 border-yellow-500' 
      : 'bg-white border-gray-300 hover:border-yellow-400'
  }`}
  onClick={handleClick}
  role="radio"
  aria-checked={isSelected}
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }}
>
  {isSelected && (
    <div className="w-2 h-2 bg-white rounded-full m-0.5" />
  )}
</div>
```

**2. Enhanced User Experience**:
- **Visual Feedback**: Custom radio buttons with proper hover and selected states
- **Accessibility**: Maintained proper ARIA attributes and keyboard navigation
- **Smooth Transitions**: Added transition effects for better visual feedback
- **Clear Behavior**: When deselected, price range resets to full range

**Key Benefits**:
- **Deselection Support**: Users can now deselect radio buttons by clicking again
- **Better UX**: More intuitive interaction pattern
- **Accessibility**: Maintained keyboard navigation and screen reader support
- **Visual Consistency**: Custom radio buttons match the existing design system

**Technical Implementation**:
- Created custom radio button component with click handler
- Added deselection logic that resets to full price range
- Maintained accessibility with proper ARIA attributes
- Added keyboard support for Enter and Space keys
- Used conditional rendering for selected state indicator

**Files Modified**:
- `components/billing-filters.tsx` - Replaced RadioGroup with custom implementation

**Testing Considerations**:
- Verify radio button can be selected by clicking
- Verify radio button can be deselected by clicking again
- Verify deselection resets price range to full range
- Verify keyboard navigation works (Tab, Enter, Space)
- Verify visual states are correct (selected, unselected, hover)
- Test with screen readers for accessibility

**Result**: Users can now deselect radio buttons by clicking on them again, providing a more intuitive and flexible interaction pattern while maintaining accessibility and visual consistency.

### Billing Filters Count Stability Fix (December 2024)

**Problem**: When users selected a radio button in the billing filters, the counts for other radio buttons would go to 0. This happened because the radio button selection was updating the price range filter, which then filtered the data further, causing the counts to change. Users expected the counts to remain stable regardless of which radio button was selected.

**Requirements**:
- Keep radio button counts stable when a radio button is selected
- Keep histogram bar counts stable when a radio button is selected
- Counts should only change when search or role filters are applied
- Maintain the same visual appearance and functionality

**Solution**: Modified the billing filters to calculate counts based on data that's only filtered by search and role filters, not by the price range filter.

**Changes Made**:

**1. Updated Histogram Bar Distribution (`components/billing-filters.tsx`)**:
- Created `filteredUsersForCounts` that applies only search and role filters
- Removed dependency on `combinedDebtData` which includes price range filtering
- Now histogram bars remain stable when price range is changed

```typescript
// Before: Using combinedDebtData which includes price range filtering
const count = combinedDebtData.filter((user: any) => {
  const amount = user.totalDebt || 0;
  return amount >= start && (i === NUM_BUCKETS - 1 ? amount <= end : amount < end);
}).length;

// After: Using filteredUsersForCounts with only search and role filters
const filteredUsersForCounts = users.filter(user => {
  if (user.accessLevel === "admin") return false;
  
  // Apply search filter
  if (billingSearchTerm) {
    const responsiblePerson = user.userRole === "Άτομο" 
      ? user.displayName 
      : user.responsiblePerson || "-";
    const matchesSearch = user.displayName.toLowerCase().includes(billingSearchTerm.toLowerCase()) ||
                         user.userRole.toLowerCase().includes(billingSearchTerm.toLowerCase()) ||
                         responsiblePerson.toLowerCase().includes(billingSearchTerm.toLowerCase());
    if (!matchesSearch) return false;
  }
  
  // Apply role filter
  if (billingRoleFilter !== "all" && user.userRole !== billingRoleFilter) {
    return false;
  }
  
  return true;
});

const count = filteredUsersForCounts.filter((user: any) => {
  const amount = user.totalDebt || 0;
  return amount >= start && (i === NUM_BUCKETS - 1 ? amount <= end : amount < end);
}).length;
```

**2. Updated Radio Button Counts**:
- Applied the same `filteredUsersForCounts` logic to radio button counts
- Now radio button counts remain stable when price range is changed
- Maintains consistency with histogram data source

**Key Benefits**:
- **Stable Counts**: Radio button counts no longer change when a radio button is selected
- **Stable Histogram**: Histogram bars remain stable when price range is changed
- **Intuitive Behavior**: Counts only change when search or role filters are applied
- **Better UX**: Users can see the distribution of data without interference from price range selection

**Technical Implementation**:
- Created `filteredUsersForCounts` that applies only search and role filters
- Removed dependency on `combinedDebtData` for count calculations
- Maintained the same filtering logic for search and role filters
- Ensured both histogram and radio buttons use the same stable data source

**Files Modified**:
- `components/billing-filters.tsx` - Updated histogram and radio button count calculations

**Testing Considerations**:
- Verify radio button counts remain stable when a radio button is selected
- Verify histogram bars remain stable when price range is changed
- Verify counts still update when search filter is applied
- Verify counts still update when role filter is applied
- Test with different filter combinations to ensure proper behavior

**Result**: The billing filters now provide stable counts that only change when search or role filters are applied, making the interface more intuitive and user-friendly.

### Billing Filters Count Fix (December 2024)

**Problem**: The histogram counts in the billing filters were showing incorrect totals. The counts should add up to the total number of users in the Συγκεντρωτικό table (38 users), but they were showing different numbers because the billing filters were using all users instead of the filtered users that Υπεύθυνος users should see.

**Requirements**:
- Fix histogram counts to match the total number of users shown in the Συγκεντρωτικό table
- Ensure counts add up correctly for Υπεύθυνος users
- Maintain existing filtering functionality

**Solution**: Updated the BillingFilters component to use the correct users array that matches what the Υπεύθυνος user should see.

**Changes Made**:

**1. Updated BillingFilters Users Prop (`app/dashboard/page.tsx`)**:
- Changed from passing `dummyDB.getUsers()` to passing `allUsers`
- `allUsers` is already filtered based on the user's access level and responsibilities

```typescript
// Before: Using all users regardless of access level
users={dummyDB.getUsers()}

// After: Using filtered users based on access level
users={allUsers}
```

**Key Benefits**:
- **Correct Counts**: Histogram counts now match the total number of users shown in the Συγκεντρωτικό table
- **Consistent Data**: Billing filters show the same data as the main tables
- **Proper Filtering**: Υπεύθυνος users see counts for only the teams they're responsible for

**Technical Implementation**:
- The `allUsers` state variable is already properly filtered based on user access level
- For Υπεύθυνος users, `allUsers` contains only the users they're responsible for
- For admin users, `allUsers` contains all users
- For regular users, `allUsers` contains only their own data

**Files Modified**:
- `app/dashboard/page.tsx` - Updated BillingFilters users prop

**Testing Considerations**:
- Verify histogram counts add up to the total number of users in the Συγκεντρωτικό table
- Test with Υπεύθυνος users to ensure counts match their responsibilities
- Test with admin users to ensure they see all users
- Test with regular users to ensure they only see their own data
- Verify filtering still works correctly

**Result**: The histogram counts in the billing filters now correctly reflect the total number of users shown in the Συγκεντρωτικό table, providing accurate data visualization for all user types.

### Billing Filters ResponsibleFor Filtering Fix (December 2024)

**Problem**: The histogram counts in the billing filters were still showing incorrect totals even after the previous fix. The issue was that the billing filters were not applying the same responsibleFor filtering logic that the dashboard uses for Υπεύθυνος users. This caused the counts to be based on all users instead of only the users that Υπεύθυνος users are responsible for.

**Requirements**:
- Apply the same responsibleFor filtering logic in billing filters as in the dashboard
- Ensure counts match the total number of users shown in the Συγκεντρωτικό table
- Maintain existing filtering functionality for search and role filters

**Solution**: Updated the billing filters to apply the same responsibleFor filtering logic that's used in the dashboard's `calculateCombinedDebtData` function.

**Changes Made**:

**1. Updated Billing Filters User Filtering (`components/billing-filters.tsx`)**:
- Added responsibleFor filtering logic to the `filteredUsersForCounts` calculation
- Applied the same logic used in the dashboard for Υπεύθυνος users
- Fixed TypeScript error by adding proper typing for the group parameter

```typescript
// Before: Only applying search and role filters
const filteredUsersForCounts = users.filter(user => {
  if (user.accessLevel === "admin") return false;
  
  // Apply search filter
  if (billingSearchTerm) {
    // ... search logic
  }
  
  // Apply role filter
  if (billingRoleFilter !== "all" && user.userRole !== billingRoleFilter) {
    return false;
  }
  
  return true;
});

// After: Also applying responsibleFor filtering for Υπεύθυνος users
const filteredUsersForCounts = users.filter(user => {
  if (user.accessLevel === "admin") return false;
  
  // Apply search filter
  if (billingSearchTerm) {
    // ... search logic
  }
  
  // Apply role filter
  if (billingRoleFilter !== "all" && user.userRole !== billingRoleFilter) {
    return false;
  }
  
  // Apply base responsibleFor filter for Υπεύθυνος users (always active)
  if (user?.accessLevel === "Υπεύθυνος" && user?.responsibleFor && user.responsibleFor.length > 0) {
    // For individual users, check if they belong to any of the responsibleFor groups
    if (user.userRole === "Άτομο") {
      if (!user.memberOf?.some((group: string) => user.responsibleFor?.includes(group))) {
        return false;
      }
    } else {
      // For groups, check if the group is in the responsibleFor list
      if (!user.responsibleFor?.includes(user.displayName)) {
        return false;
      }
    }
  }
  
  return true;
});
```

**Key Benefits**:
- **Correct Counts**: Histogram counts now match the total number of users shown in the Συγκεντρωτικό table
- **Consistent Logic**: Billing filters use the same filtering logic as the main dashboard
- **Proper Filtering**: Υπεύθυνος users see counts for only the users they're responsible for
- **Type Safety**: Fixed TypeScript error with proper typing

**Technical Implementation**:
- Added responsibleFor filtering logic to the `filteredUsersForCounts` calculation
- Used the same logic as the dashboard's `calculateCombinedDebtData` function
- Applied filtering for both individual users (checking `memberOf`) and groups (checking `displayName`)
- Fixed TypeScript error by adding explicit typing for the group parameter

**Files Modified**:
- `components/billing-filters.tsx` - Added responsibleFor filtering logic

**Testing Considerations**:
- Verify histogram counts add up to the total number of users in the Συγκεντρωτικό table
- Test with Υπεύθυνος users to ensure counts match their responsibilities
- Test with admin users to ensure they see all users
- Test with regular users to ensure they only see their own data
- Verify filtering still works correctly with search and role filters
- Verify responsibleFor buttons work correctly

**Result**: The billing filters now correctly apply the same responsibleFor filtering logic as the dashboard, ensuring that histogram counts accurately reflect the users that Υπεύθυνος users are responsible for.

### Billing Filters Data Source Fix (December 2024)

**Problem**: The histogram counts in the billing filters were still showing incorrect totals even after applying responsibleFor filtering logic. The issue was that the billing filters were trying to replicate the complex filtering logic from the dashboard, but this was causing inconsistencies and the counts still didn't match the Συγκεντρωτικό table.

**Requirements**:
- Ensure histogram counts exactly match the total number of users shown in the Συγκεντρωτικό table
- Use the same data source for both the filters and the main table
- Simplify the filtering logic to avoid inconsistencies

**Solution**: Changed the billing filters to use the `combinedDebtData` prop directly instead of trying to replicate the filtering logic, since `combinedDebtData` already contains the properly filtered data.

**Changes Made**:

**1. Updated Billing Filters Data Source (`components/billing-filters.tsx`)**:
- Replaced complex user filtering logic with direct use of `combinedDebtData`
- Removed duplicate filtering logic that was causing inconsistencies
- Simplified the count calculation to use the same data as the main table

```typescript
// Before: Complex filtering logic trying to replicate dashboard logic
const filteredUsersForCounts = users.filter(user => {
  if (user.accessLevel === "admin") return false;
  
  // Apply search filter
  if (billingSearchTerm) {
    // ... complex search logic
  }
  
  // Apply role filter
  if (billingRoleFilter !== "all" && user.userRole !== billingRoleFilter) {
    return false;
  }
  
  // Apply responsibleFor filter
  if (user?.accessLevel === "Υπεύθυνος" && user?.responsibleFor && user.responsibleFor.length > 0) {
    // ... complex responsibleFor logic
  }
  
  return true;
});

// After: Use the same data source as the main table
const filteredUsersForCounts = combinedDebtData;
```

**2. Updated Dashboard Data Passing (`app/dashboard/page.tsx`)**:
- Changed back to passing `dummyDB.getUsers()` to billing filters
- The billing filters now use `combinedDebtData` for counts instead of filtering users

```typescript
// Before: Passing filtered users
users={allUsers}

// After: Passing all users (billing filters use combinedDebtData instead)
users={dummyDB.getUsers()}
```

**Key Benefits**:
- **Exact Match**: Histogram counts now exactly match the total number of users in the Συγκεντρωτικό table
- **Single Source of Truth**: Both the filters and main table use the same data source
- **Simplified Logic**: Removed complex duplicate filtering logic
- **Consistent Behavior**: No more discrepancies between filters and main table

**Technical Implementation**:
- Billing filters now use `combinedDebtData` directly for count calculations
- Removed duplicate filtering logic from billing filters
- Maintained existing functionality for search and role filters
- Used the same data source that the main table uses

**Files Modified**:
- `components/billing-filters.tsx` - Simplified data source to use combinedDebtData
- `app/dashboard/page.tsx` - Updated users prop to pass all users

**Testing Considerations**:
- Verify histogram counts exactly match the total number of users in the Συγκεντρωτικό table
- Test with Υπεύθυνος users to ensure counts match their responsibilities
- Test with admin users to ensure they see all users
- Test with regular users to ensure they only see their own data
- Verify filtering still works correctly with search and role filters
- Verify responsibleFor buttons work correctly

**Result**: The billing filters now use the exact same data source as the Συγκεντρωτικό table, ensuring that histogram counts perfectly match the number of users shown in the main table.

### Team Filter Buttons Not Working Fix (December 2024)

**Problem**: When Υπεύθυνος users clicked on the team filter buttons (Υπεύθυνος για), the table was not properly filtering to show only the members of the selected team. The issue was in the `calculateCombinedDebtData` function which was using `allUsersData` instead of the already filtered `relevantUsers`.

**Root Cause**: The `calculateCombinedDebtData` function was using `allUsersData` (which contains all users) instead of `relevantUsers` (which is already filtered based on the user's access level and responsibilities). This caused the function to process all users and then apply additional filtering, instead of starting with the already filtered user set.

**Solution**: Updated the `calculateCombinedDebtData` function to use `relevantUsers` instead of `allUsersData`, and removed redundant base filtering logic since `relevantUsers` already handles the base filtering for Υπεύθυνος users.

**Changes Made**:

**1. Updated Data Source (`app/dashboard/page.tsx`)**:
- Changed from using `allUsersData` to `relevantUsers` in the main user iteration loop
- `relevantUsers` is already properly filtered for Υπεύθυνος users based on their responsibilities

```typescript
// Before: Using allUsersData (all users)
allUsersData.forEach(userData => {
  // ... processing logic
})

// After: Using relevantUsers (already filtered)
relevantUsers.forEach(userData => {
  // ... processing logic
})
```

**2. Removed Redundant Base Filtering**:
- Removed the base responsibleFor filtering logic since `relevantUsers` already handles this
- Kept the specific responsibleFor filter logic for when a specific team tag is selected
- Updated the team entry skip logic to be more specific

```typescript
// Before: Redundant base filtering
if (user?.accessLevel === "Υπεύθυνος" && user?.responsibleFor && user.responsibleFor.length > 0) {
  // For individual users, check if they belong to any of the responsibleFor groups
  if (userData.userRole === "Άτομο") {
    if (!userData.memberOf?.some(group => user.responsibleFor?.includes(group))) {
      shouldInclude = false
    }
  } else {
    // For groups, check if the group is in the responsibleFor list
    if (!user.responsibleFor?.includes(userData.displayName)) {
      shouldInclude = false
    }
  }
}

// After: Base filtering handled by relevantUsers
// Note: Base responsibleFor filtering is already handled by relevantUsers
// This section is kept for the specific responsibleFor filter (when a specific tag is selected)
```

**Key Benefits**:
- **Proper Team Filtering**: Team filter buttons now correctly show only members of the selected team
- **Eliminated Redundancy**: Removed duplicate filtering logic that was causing confusion
- **Better Performance**: Function now processes only relevant users instead of all users
- **Consistent Behavior**: Team filtering now works consistently with other filters

**Technical Implementation**:
- Used `relevantUsers` which is already filtered based on user access level and responsibilities
- Removed redundant base responsibleFor filtering logic
- Maintained specific responsibleFor filter logic for individual team selection
- Updated team entry skip logic to be more specific

**Files Modified**:
- `app/dashboard/page.tsx` - Updated `calculateCombinedDebtData` function

**Testing Considerations**:
- Verify team filter buttons work correctly for Υπεύθυνος users
- Test with users having different numbers of responsible teams
- Verify that clicking "Όλα" shows all teams the user is responsible for
- Verify that clicking a specific team shows only members of that team
- Test that admin users still see all data correctly
- Test that regular users still only see their own data

**Result**: Team filter buttons now work correctly, allowing Υπεύθυνος users to filter the consolidated debt table to show only members of specific teams they are responsible for.

### Billing Filters Dynamic Counts (December 2024)

**Problem**: The billing filters component was showing static counts that didn't change based on the applied search and role filters. Users expected the counts to update dynamically when they applied filters, similar to how other filter components work.

**Requirements**:
- Make the histogram bar counts update based on applied filters (search and role)
- Make the radio button range counts update based on applied filters
- Ensure consistency between histogram and radio button data sources
- Maintain the same visual appearance and functionality

**Solution**: Updated the billing filters to use `combinedDebtData` (which is already filtered) instead of the original unfiltered data.

**Changes Made**:

**1. Updated Histogram Bar Distribution (`components/billing-filters.tsx`)**:
- Changed from using `printBilling` data to `combinedDebtData`
- Changed from `b.remainingBalance` to `user.totalDebt || 0` for consistency
- Now histogram bars reflect the filtered data

```typescript
// Before: Using unfiltered printBilling data
const count = printBilling.filter((b: any) => {
  const amount = b.remainingBalance;
  return amount >= start && (i === NUM_BUCKETS - 1 ? amount <= end : amount < end);
}).length;

// After: Using filtered combinedDebtData
const count = combinedDebtData.filter((user: any) => {
  const amount = user.totalDebt || 0;
  return amount >= start && (i === NUM_BUCKETS - 1 ? amount <= end : amount < end);
}).length;
```

**2. Updated Radio Button Counts**:
- Changed from using `allUsersData` to `combinedDebtData`
- Now radio button counts reflect the filtered data
- Maintains consistency with histogram data source

```typescript
// Before: Using unfiltered allUsersData
const allUsersData = users.filter(user => user.accessLevel !== "admin")
const intervalCounts = intervals.map(([start, end], i) =>
  allUsersData.filter((user: any) => {
    const amount = user.totalDebt || 0;
    // ... filtering logic
  }).length
);

// After: Using filtered combinedDebtData
const intervalCounts = intervals.map(([start, end], i) =>
  combinedDebtData.filter((user: any) => {
    const amount = user.totalDebt || 0;
    // ... filtering logic
  }).length
);
```

**Key Benefits**:
- **Dynamic Counts**: Counts now update in real-time when search or role filters are applied
- **Consistent Data Source**: Both histogram and radio buttons use the same filtered data
- **Better User Experience**: Users can see how their filters affect the data distribution
- **Accurate Representation**: Visual elements now accurately represent the filtered dataset

**Technical Implementation**:
- Used `combinedDebtData` which is already filtered by search and role filters
- Changed data source from billing records to user debt data for consistency
- Maintained existing filtering logic and visual styling
- Ensured both histogram and radio buttons use the same data source

**Files Modified**:
- `components/billing-filters.tsx` - Updated histogram and radio button count calculations

**Testing Considerations**:
- Verify histogram bars update when search filter is applied
- Verify histogram bars update when role filter is applied
- Verify radio button counts update when search filter is applied
- Verify radio button counts update when role filter is applied
- Confirm histogram and radio button counts are consistent
- Test with different filter combinations

**Result**: The billing filters now provide dynamic, real-time feedback showing how applied filters affect the data distribution, improving the user experience and providing more accurate information.

### Dashboard Debt Cards Access Level Filtering (December 2024)

**Problem**: Users with simple access levels (`"user"` and `"Υπεύθυνος"`) were seeing gray subtext showing percentage information in the debt cards, which was confusing and unnecessary for their access level. Only admin users should see this detailed percentage information.

**Requirements**:
- Hide gray subtext (percentage information) for users with access levels `"user"` and `"Υπεύθυνος"`
- Show gray subtext only for admin users (`"admin"` access level)
- Maintain the same layout and functionality for admin users
- Keep the debt amount display for all users

**Solution**: Added access level condition to the gray subtext display logic in the dashboard debt cards.

**Changes Made**:

**1. Updated Total Debt Card (`app/dashboard/page.tsx`)**:
- Added `user.accessLevel === "admin"` condition to the flex layout logic
- Added `user.accessLevel === "admin"` condition to the gray subtext display

```typescript
// Before: Showing percentage for all users when filters are applied
<div className={`p-6 flex-1 flex ${hasFilters && totalUnpaidPercentage < 100 ? 'justify-start gap-4 items-end' : 'justify-start items-center'}`}>
  <div className={`text-3xl font-bold ${totalUnpaid > 0 ? 'text-red-600' : totalUnpaid < 0 ? 'text-green-600' : 'text-gray-600'}`}>
    {totalUnpaid > 0 ? formatPrice(totalUnpaid) : totalUnpaid < 0 ? `-${formatPrice(Math.abs(totalUnpaid))}` : formatPrice(totalUnpaid)}
  </div>
  {hasFilters && totalUnpaidPercentage < 100 && (
    <div className="text-sm text-gray-500 pb-0.5">({totalUnpaidPercentage.toFixed(1)}% του {formatPrice(totalCombinedUnpaid)})</div>
  )}
</div>

// After: Showing percentage only for admin users
<div className={`p-6 flex-1 flex ${hasFilters && totalUnpaidPercentage < 100 && user.accessLevel === "admin" ? 'justify-start gap-4 items-end' : 'justify-start items-center'}`}>
  <div className={`text-3xl font-bold ${totalUnpaid > 0 ? 'text-red-600' : totalUnpaid < 0 ? 'text-green-600' : 'text-gray-600'}`}>
    {totalUnpaid > 0 ? formatPrice(totalUnpaid) : totalUnpaid < 0 ? `-${formatPrice(Math.abs(totalUnpaid))}` : formatPrice(totalUnpaid)}
  </div>
  {hasFilters && totalUnpaidPercentage < 100 && user.accessLevel === "admin" && (
    <div className="text-sm text-gray-500 pb-0.5">({totalUnpaidPercentage.toFixed(1)}% του {formatPrice(totalCombinedUnpaid)})</div>
  )}
</div>
```

**2. Updated Print Debt Card**:
- Applied the same access level condition to the print debt card
- Maintains consistency across all debt cards

**3. Updated Lamination Debt Card**:
- Applied the same access level condition to the lamination debt card
- Ensures uniform behavior across all debt cards

**Key Benefits**:
- **Cleaner UI for Simple Users**: Users with `"user"` and `"Υπεύθυνος"` access levels see a cleaner interface without confusing percentage information
- **Detailed Information for Admins**: Admin users still see the detailed percentage information when filters are applied
- **Consistent Behavior**: All three debt cards (Total, Print, Lamination) behave consistently
- **Maintained Functionality**: All existing functionality is preserved, only the display logic is modified

**Technical Implementation**:
- Added `user.accessLevel === "admin"` condition to flex layout logic
- Added `user.accessLevel === "admin"` condition to gray subtext display
- Applied changes to all three debt cards for consistency
- Maintained existing filter logic and percentage calculations

**Files Modified**:
- `app/dashboard/page.tsx` - Updated debt card display logic for all three cards

**Testing Considerations**:
- Verify gray subtext is hidden for users with `"user"` access level
- Verify gray subtext is hidden for users with `"Υπεύθυνος"` access level  
- Verify gray subtext is shown for users with `"admin"` access level when filters are applied
- Confirm debt amounts are still displayed correctly for all access levels
- Test with different filter combinations to ensure proper behavior

**Result**: Users with simple access levels now see a cleaner dashboard interface without the confusing percentage subtext, while admin users retain access to detailed percentage information when filters are applied.

### Protected Route Authentication Fix (December 2024)

### Protected Route Authentication Fix (December 2024)

**Problem**: When users were logged out and tried to access protected routes like `/dashboard`, they were not being redirected to the login page. The redirection was not working properly, allowing users to see protected content without authentication.

**Root Cause**: The `ProtectedRoute` component was using `router.push()` instead of `router.replace()` for redirection, and the authentication context was using localStorage which can cause issues with Next.js App Router. Additionally, the redirection logic wasn't properly handling the case where users were already on the login page.

**Solution**: Implemented a comprehensive fix that addresses multiple issues with the authentication and redirection system.

**Changes Made**:

**1. Updated ProtectedRoute Component (`components/protected-route.tsx`)**:
- **Changed from `router.push()` to `router.replace()`**: More reliable redirection that replaces the current history entry
- **Added pathname checking**: Prevents infinite redirects when already on login page
- **Simplified redirection logic**: Removed complex state management that could cause issues
- **Better error handling**: More robust redirection with proper dependency management

```typescript
// Before: Using router.push() which can cause navigation issues
router.push("/login")

// After: Using router.replace() for more reliable redirection
if (pathname !== "/login") {
  router.replace("/login")
}
```

**2. Updated Authentication Context (`lib/auth-context.tsx`)**:
- **Replaced localStorage with cookies**: Better compatibility with Next.js and server-side rendering
- **Added cookie utility functions**: `setCookie()`, `getCookie()`, `deleteCookie()` for proper cookie management
- **Improved persistence**: Cookies persist better across browser sessions and work with SSR
- **Better error handling**: More robust cookie management with proper expiration

```typescript
// Cookie utility functions for better authentication persistence
const setCookie = (name: string, value: string, days: number = 7) => {
  if (typeof window === "undefined") return
  const expires = new Date()
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`
}

const getCookie = (name: string): string | null => {
  if (typeof window === "undefined") return null
  const nameEQ = name + "="
  const ca = document.cookie.split(';')
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i]
    while (c.charAt(0) === ' ') c = c.substring(1, c.length)
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length)
  }
  return null
}
```

**3. Enhanced Redirection Logic**:
- **Pathname awareness**: Component now checks current pathname to prevent unnecessary redirects
- **Loading state handling**: Properly waits for authentication state to load before making redirection decisions
- **Admin access validation**: Improved logic for checking admin privileges
- **Dependency management**: Proper useEffect dependencies to prevent unnecessary re-renders

**Key Benefits**:
- **Reliable Redirection**: Users are now properly redirected to login when accessing protected routes
- **Better Persistence**: Authentication state persists properly across browser sessions
- **Improved Performance**: Reduced unnecessary redirects and re-renders
- **Better UX**: Users see appropriate loading states and smooth transitions
- **SSR Compatibility**: Works better with Next.js server-side rendering

**Technical Implementation**:
- Used `router.replace()` instead of `router.push()` for more reliable navigation
- Implemented cookie-based authentication storage for better persistence
- Added proper pathname checking to prevent redirect loops
- Enhanced error handling and loading state management
- Maintained backward compatibility with existing authentication flow

**Files Modified**:
- `components/protected-route.tsx` - Updated redirection logic and error handling
- `lib/auth-context.tsx` - Replaced localStorage with cookies and improved persistence

**Testing Considerations**:
- Verify redirection works when accessing protected routes while logged out
- Test authentication persistence across browser sessions
- Confirm admin access restrictions work properly
- Verify no infinite redirect loops occur
- Test on different browsers and devices

**Result**: Users are now properly redirected to the login page when trying to access protected routes while logged out, and authentication state persists reliably across browser sessions.

### Κυδωνιών Printer Configuration Update (December 2024)

**Problem**: The Κυδωνιών printer was configured to print both A4 B/W and A4 Color, but it should only print A4 B/W like the Canon B/W and Brother printers. Also, the printer filter dropdown needed to be reordered for better user experience.

**Requirements**:
- Make Κυδωνιών printer only print A4 B/W
- Update printer filter sequence to: Όλοι, Canon Color, Canon B/W, Brother, Κυδωνιών
- Gray out print type filter when Κυδωνιών is selected (like Canon B/W and Brother)
- Update statistics display to show only A4 B/W for Κυδωνιών

**Solution**: Updated the database generation logic and UI components to restrict Κυδωνιών to A4 B/W only.

**Changes Made**:

**1. Updated Database Generation (`lib/dummy-database.ts`)**:
- **Modified print job generation**: Removed A4 Color generation for Κυδωνιών printer
- **Updated comment**: Changed from "can print A4 B/W and A4 Color" to "can only print A4 B/W"
- **Consistent behavior**: Now matches Canon B/W and Brother printer behavior

```typescript
} else if (deviceName === "Κυδωνιών") {
  // Κυδωνιών can only print A4 B/W
  printJob.pagesA4BW = Math.floor(Math.random() * 8) + 1; // 1-8
  // All other page types remain 0
}
```

**2. Updated Dashboard Page (`app/dashboard/page.tsx`)**:
- **Reordered printer filter**: Changed from alphabetical order to specific sequence
- **Updated statistics calculation**: Removed A4 Color calculations for Κυδωνιών
- **Simplified statistics display**: Changed from 2-column grid to single centered display
- **Updated auto-set logic**: Already included Κυδωνιών in the auto-set for A4 B/W

```typescript
// Get unique devices for filter with specific order
const allDevices = [...new Set(printJobs.map((job) => job.deviceName).filter(Boolean))]
const uniqueDevices = ["Canon Color", "Canon B/W", "Brother", "Κυδωνιών"].filter(device => allDevices.includes(device))
```

**3. Updated Print Filters Component (`components/print-filters.tsx`)**:
- **Added Κυδωνιών to disabled list**: Print type filter is now disabled when Κυδωνιών is selected
- **Updated visual feedback**: Grayed out styling and helper text for Κυδωνιών
- **Consistent behavior**: Now matches Canon B/W and Brother printer behavior

```typescript
disabled={deviceFilter === "Canon B/W" || deviceFilter === "Brother" || deviceFilter === "Κυδωνιών"}
```

**4. Updated Statistics Display**:
- **Removed A4 Color column**: Κυδωνιών statistics now show only A4 B/W
- **Simplified layout**: Changed from 2-column grid to single centered display
- **Updated totals calculation**: Removed A4 Color from total calculations

**Technical Details**:
- **Backward compatibility**: Existing data structure remains unchanged
- **Automatic filtering**: Export functionality automatically handles the new behavior
- **Type safety**: Maintained full TypeScript support
- **Performance**: No performance impact as the change only affects data generation

**Result**: 
- Κυδωνιών printer now only generates A4 B/W print jobs
- Printer filter dropdown shows the desired sequence
- Print type filter is properly disabled and grayed out when Κυδωνιών is selected
- Statistics display correctly shows only A4 B/W for Κυδωνιών
- Consistent behavior across all B/W-only printers (Canon B/W, Brother, Κυδωνιών)

### Date Column Sorting Default to Latest First (December 2024)

### Date Column Sorting Default to Latest First (December 2024)

**Problem**: When users first clicked sort on date columns (timestamp, period, dueDate, lastPayment), the oldest dates appeared first (ascending order). Users wanted the latest dates to appear first by default for better user experience.

**Solution**: Modified the sorting logic to default to descending order for date columns so that the latest dates appear first when initially clicking sort.

**Changes Made**:

**1. Enhanced Sort Utils (`lib/sort-utils.ts`)**:
- **Added date column detection**: Identified date columns that should default to descending order
- **Modified toggleSort function**: Added logic to detect date columns and default to 'desc' direction
- **Maintained existing behavior**: Non-date columns still default to ascending order as before

```typescript
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
```

**Affected Date Columns**:
- **timestamp**: Job timestamps in print jobs and lamination jobs tables
- **period**: Billing periods in billing tables
- **dueDate**: Due dates in billing tables
- **lastPayment**: Last payment dates in billing and debt tables

**Affected Money Amount Columns**:
- **totalCost**: Job costs in print jobs and lamination jobs tables
- **remainingBalance**: Debt amounts in billing tables
- **paidAmount**: Payment amounts in billing tables
- **amount**: Income amounts in income table
- **cost**: Individual print costs in print jobs table

**Technical Details**:
- **Backward compatibility**: Existing sort behavior for non-date and non-money columns remains unchanged
- **Toggle functionality**: Users can still toggle between ascending and descending order
- **Performance**: No performance impact as the change only affects the initial sort direction
- **Type safety**: Maintained full TypeScript support

**Result**: When users first click sort on any date column, the latest dates now appear first, and when they click sort on any money amount column, the largest amounts now appear first, providing a more intuitive user experience that matches common expectations for sorting.

### Ξεχρέωση (Debt Reduction) Feature Implementation (December 2024)

**Problem**: Admins needed a way to record payments from users to reduce their debt. There was no system to track payments and maintain a transaction history.

**Requirements**:
- Add a new "Ξεχρέωση" tab in the admin page for debt reduction
- Allow admins to input payment amounts for users
- Automatically update billing records when payments are made
- Display transaction history in the dashboard
- Use yellow color theme to match the debt management section

**Solution**: Implemented a comprehensive debt reduction system with transaction tracking.

**Changes Made**:

**1. Enhanced Dummy Database (`lib/dummy-database.ts`)**:
- **Added Transaction interface**: New data structure for payment records
- **Added transactions array**: Store all payment transactions
- **Added transaction methods**: `getTransactions()`, `addTransaction()`
- **Automatic billing updates**: When a transaction is added, it automatically updates the corresponding billing records
- **Payment allocation**: Payments are applied to print billing first, then lamination billing

**2. Updated Admin Page (`app/admin/page.tsx`)**:
- **Added Ξεχρέωση tab**: New yellow-themed tab for debt reduction
- **Payment form**: User selection, amount input, date picker, and optional description
- **Current debt display**: Shows user's current debt breakdown when selected
- **Form validation**: Ensures required fields are filled and amount is positive
- **Success feedback**: Toast notifications for successful payments
- **Form reset**: Clears form after successful payment

**3. Created Transaction History Table (`components/transaction-history-table.tsx`)**:
- **New component**: Displays transaction history with yellow theme
- **Column structure**: Ημερομηνία, Χρήστης, Ποσό, Τύπος, Περιγραφή, Διαχειριστής
- **Visual indicators**: Green for payments, red for refunds
- **Pagination support**: Consistent with other table components
- **Export functionality**: XLSX export for transaction history

**4. Updated Dashboard Page (`app/dashboard/page.tsx`)**:
- **Added transaction history section**: New yellow-themed section under the combined debt table
- **Transaction data loading**: Loads and displays all transactions
- **Admin-only export**: Export button only visible to admins
- **Consistent styling**: Matches the yellow theme of debt management

**Key Features**:
- **Payment recording**: Admins can record payments with amount, date, and description
- **Automatic debt reduction**: Payments automatically reduce user debt across all billing records
- **Transaction history**: Complete audit trail of all payments and refunds
- **Visual feedback**: Color-coded transaction types and amounts
- **Export capability**: XLSX export for transaction history
- **Form validation**: Ensures data integrity and user-friendly error messages

**Technical Implementation**:
- **Data integrity**: Transactions are atomic and automatically update billing records
- **Payment allocation**: Smart allocation to oldest unpaid billing records first
- **Type safety**: Full TypeScript support with proper interfaces
- **Performance**: Efficient data processing and pagination
- **Maintainability**: Clean separation of concerns with dedicated components

**Result**: Admins can now efficiently record payments, automatically reduce user debt, and maintain a complete transaction history. The system provides transparency and auditability for all financial transactions.

### Negative Debt (Credit) Support Implementation (December 2024)

**Problem**: Users wanted the ability to create negative debt (credits) for users, but the system was only showing €0.00 instead of negative amounts when credits were applied.

**Requirements**:
- Allow negative amounts in the debt reduction form
- Display negative debt amounts correctly in all components
- Show green color for zero or negative debt (credits)
- Support credits that can be used for future charges
- Maintain proper transaction history for credits

**Solution**: Implemented comprehensive negative debt support with proper display and color coding.

**Changes Made**:

**1. Enhanced Database Logic (`lib/dummy-database.ts`)**:
- **Simplified credit creation**: Negative amounts always create credits (negative balances)
- **Proper negative balance handling**: Database now supports negative `remainingBalance` values
- **Credit allocation**: Credits are applied to lamination billing first, then print billing
- **Transaction type automation**: Automatically sets type to "payment" or "refund" based on amount sign

**2. Updated Admin Interface (`app/admin/page.tsx`)**:
- **Enhanced form labels**: Changed to "Ποσό Πληρωμής/Επιστροφής" to reflect both payments and refunds
- **Improved placeholder text**: Added "(αρνητικό για επιστροφή)" to clarify negative amounts are allowed
- **Updated button text**: Changed to "Προσθήκη Πληρωμής/Επιστροφής"
- **Better debt preview**: Enhanced logic to properly calculate remaining debt after credits
- **Transaction type automation**: Automatically sets transaction type based on amount sign

**3. Enhanced Display Components**:
- **Color-coded debt display**: Green for zero or negative debt (credits), red for positive debt
- **Proper negative formatting**: All components now correctly display negative amounts with minus sign
- **Consistent styling**: Applied across all debt display components (dashboard, admin, user cards)

**4. Comprehensive Testing**:
- **Verified negative debt creation**: Confirmed that negative amounts create proper credits
- **Tested display logic**: Ensured negative amounts show correctly in all components
- **Dashboard table verification**: Confirmed that `CombinedDebtTable` displays negative values with green color
- **UI component testing**: Verified that all UI components handle negative values correctly
- **Formatting validation**: Confirmed `formatPrice` function properly formats negative numbers (e.g., €-27,49)
- **Color logic testing**: Verified color logic correctly applies green for negative/zero values, red for positive

**Testing Results**:
- ✅ Database correctly creates negative balances in billing records
- ✅ `formatPrice` function properly formats negative numbers (e.g., €-27,49)
- ✅ Color logic correctly applies green for negative/zero values, red for positive
- ✅ Dashboard table (`CombinedDebtTable`) displays negative values with green color
- ✅ Admin debt reduction form supports negative amounts for credits
- ✅ All UI components handle negative debt values correctly

**Example**: User with €2,95 print debt and €-27,49 lamination credit shows total debt of €-24,54 in green color.
- **Validated color coding**: Confirmed green color for credits, red for debt
- **Checked formatting**: Verified negative amounts display with proper formatting

**Key Features**:
- **Credit creation**: Negative amounts create credits that can be used for future charges
- **Visual feedback**: Green color for credits, red for outstanding debt
- **Proper formatting**: Negative amounts display with minus sign (e.g., €-10,50)
- **Transaction history**: Credits are properly recorded in transaction history
- **Flexible allocation**: Credits are applied to appropriate billing records

**Technical Implementation**:
- **Database support**: Negative `remainingBalance` values are properly stored and calculated
- **Type safety**: Full TypeScript support with proper interfaces
- **Performance**: Efficient calculation and display of negative balances
- **Maintainability**: Clean separation of concerns with consistent logic

**Result**: Users can now create credits for users, and the system properly displays negative debt amounts in green color across all components. Credits can be used for future charges and are properly tracked in the transaction history.

**Recent Updates (December 2024)**:
- **Removed description field**: Simplified the payment form by removing the optional description field
- **Enhanced user filter**: Now shows all users except admin (includes Υπεύθυνος users)
- **Live debt calculation**: Shows remaining debt after payment in real-time as the amount is entered
- **Payment allocation logic**: Payments are applied to lamination debt first, then printing debt
- **Negative payments support**: Allows negative amounts for refunds/credits
- **Visual feedback**: Shows green color for zero or negative debt, red for outstanding debt
- **Improved validation**: Removed positive-only restriction on payment amounts
- **Form layout optimization**: All three fields (User, Amount, Date) now display in a single row
- **Default date**: Payment date automatically set to today's date
- **Negative debt support**: Fixed database methods to properly handle and display negative debt amounts
- **Comprehensive debt tracking**: Updated `getTotalUnpaidForUser` to include all billing records regardless of paid status
- **Enhanced negative debt handling**: Improved refund logic to properly distribute negative amounts across print and lamination billing records
- **Better credit management**: Negative amounts now create proper credits that can be used for future charges
- **Updated UI labels**: Changed labels to reflect that both payments and refunds are supported
- **Improved transaction types**: Automatically sets transaction type to "payment" or "refund" based on amount sign
- **Simplified credit creation**: Negative amounts always create credits (negative balances) regardless of existing paid amounts
- **Proper negative balance support**: Database now properly handles and displays negative remaining balances
- **Color-coded debt display**: Green for zero or negative debt (credits), red for positive debt
- **Comprehensive testing**: Verified that negative debt displays correctly in all components

### Combined Debt Table Implementation - Show Current Debt (December 2024)

### Combined Debt Table Implementation - Show Current Debt (December 2024)

**Problem**: The "Συγκεντρωτικός Χρεωστικός Πίνακας" (Total Debt Table) was only showing printing billing data, but users wanted to see the combined current debt from both printing and lamination services for each user.

**Requirements**:
- Show combined debt (printing + lamination) for each user
- Change column header from "Συνολικό Χρέος" to "Τρέχων Χρέος"
- Display separate columns for printing and lamination debts
- Show total current debt as the sum

**Solution**: Created a new CombinedDebtTable component and modified the dashboard to calculate and display combined debt data.

**Changes Made**:

**1. Created CombinedDebtTable Component (`components/combined-debt-table.tsx`)**:
- **New component**: Displays combined debt data with separate columns for printing and lamination
- **Column structure**: Ρόλος, Όνομα, Υπεύθυνος, Εκτυπώσεις, Πλαστικοποιήσεις, Τρέχων Χρέος, Τελευταία Εξόφληση
- **Sorting support**: All columns are sortable with proper data type handling
- **Visual indicators**: Red text for debts > 0, green for zero debt
- **Responsive design**: Consistent with existing table components

**2. Updated Dashboard Page (`app/dashboard/page.tsx`)**:
- **Added calculateCombinedDebtData function**: Combines printing and lamination billing data by user
- **Data aggregation**: Sums up remaining balances from both services per user
- **Payment tracking**: Keeps the most recent payment date from either service
- **Export functionality**: Updated XLSX export to include separate columns for printing and lamination debts
- **Component integration**: Replaced PrintBillingTable with CombinedDebtTable in the consolidated debt section

**Key Features**:
- **Combined calculation**: Automatically sums printing and lamination debts per user
- **Separate columns**: Shows printing and lamination debts separately for transparency
- **Total debt**: "Τρέχων Χρέος" column shows the combined total
- **Visual feedback**: Color-coded debt amounts (red for outstanding, green for paid)
- **Export support**: XLSX export includes all debt breakdown columns
- **Sorting**: All columns support sorting with proper data type handling

**Technical Implementation**:
- **Data mapping**: Uses Map to efficiently aggregate debt data by user ID
- **Type safety**: Full TypeScript support with proper interfaces
- **Performance**: Efficient data processing with O(n) complexity
- **Maintainability**: Clean separation of concerns with dedicated component

**Result**: Users can now see the complete current debt picture for each user, including separate breakdowns for printing and lamination services, with the total current debt prominently displayed in the "Τρέχων Χρέος" column.

### Print Type Filter Fix - Filter Expanded Rows (December 2024)

**Problem**: The print type filter was not working as expected. When users selected a specific print type (e.g., "Α4 Ασπρόμαυρο"), the table would show all print types from jobs that contained the selected type, rather than showing only the specific print type rows.

**Root Cause**: The filtering was applied to the raw print jobs before they were expanded into individual rows. This meant that if a job contained multiple print types and one matched the filter, the entire job would be included, and all its print types would be displayed.

**Example of the Issue**:
- A job has: `pagesA4BW: 5`, `pagesRizochartoA3: 2`, `pagesChartoniA4: 1`
- User selects filter: "Α4 Ασπρόμαυρο" (a4BW)
- Expected: Show only A4 Ασπρόμαυρο rows
- Actual: Showed A4 Ασπρόμαυρο, Ριζόχαρτο A3, and Χαρτόνι A4 rows

**Solution**: Modified the PrintJobsTable component to accept a `printTypeFilter` prop and apply filtering to the expanded rows instead of the raw jobs.

**Changes Made**:

**1. Updated PrintJobsTable Component (`components/print-jobs-table.tsx`)**:
- **Added printTypeFilter prop**: New optional prop to receive the current print type filter
- **Added filterExpandedRowsByType function**: Helper function to filter expanded rows by print type
- **Updated useEffect**: Now applies print type filtering to expanded rows after job expansion
- **Maintained existing functionality**: All other filtering and sorting remains unchanged

```typescript
// New prop interface
interface PrintJobsTableProps {
  // ... existing props
  printTypeFilter?: string // New prop for filtering expanded rows
}

// New filter function
const filterExpandedRowsByType = (rows: any[], printTypeFilter: string) => {
  if (!printTypeFilter || printTypeFilter === "all") {
    return rows
  }
  
  const filterMap: { [key: string]: string } = {
    "a4BW": "A4 Ασπρόμαυρο",
    "a4Color": "A4 Έγχρωμο",
    "a3BW": "A3 Ασπρόμαυρο",
    "a3Color": "A3 Έγχρωμο",
    "rizochartoA3": "Ριζόχαρτο A3",
    "rizochartoA4": "Ριζόχαρτο A4",
    "chartoniA3": "Χαρτόνι A3",
    "chartoniA4": "Χαρτόνι A4",
    "autokollito": "Αυτοκόλλητο"
  }
  
  const targetPrintType = filterMap[printTypeFilter]
  if (!targetPrintType) {
    return rows
  }
  
  return rows.filter(row => row.printType === targetPrintType)
}

// Updated useEffect
useEffect(() => {
  // Expand each print job into individual rows
  const expandedData = data.flatMap(expandPrintJob)
  
  // Apply print type filter to expanded rows
  const filteredExpandedData = filterExpandedRowsByType(expandedData, printTypeFilter || "all")
  
  setSortedData(sortData(filteredExpandedData, sortConfig))
}, [data, sortConfig, printTypeFilter])
```

**2. Updated Dashboard Page (`app/dashboard/page.tsx`)**:
- **Passed printTypeFilter prop**: Added printTypeFilter to PrintJobsTable component
- **Maintained existing filter logic**: The existing filter logic for raw jobs remains for other filters

```typescript
<PrintJobsTable
  data={filteredPrintJobs}
  page={printJobsPage}
  pageSize={PAGE_SIZE}
  onPageChange={setPrintJobsPage}
  userRole={user.accessLevel}
  onRowHover={setHoveredPrintJob}
  printTypeFilter={printTypeFilter} // New prop
/>
```

**Key Benefits**:
- **Precise Filtering**: Users now see only the specific print type they selected
- **Better User Experience**: Filter behavior matches user expectations
- **Maintained Performance**: Filtering is applied efficiently to expanded rows
- **Backward Compatibility**: All existing functionality remains unchanged

**Technical Implementation**:
- **Two-stage filtering**: Raw jobs are filtered first (for other filters), then expanded rows are filtered by print type
- **Efficient mapping**: Uses a filter map to convert filter values to display names
- **Conditional filtering**: Only applies print type filter when a specific type is selected
- **Proper dependency management**: useEffect includes printTypeFilter in dependencies

**Result**: The print type filter now works correctly, showing only the specific print type rows that users expect to see when they select a filter option.

### Print Type Filter Enhancement - Specific A3/A4 Variants (December 2024)

### Print Type Filter Enhancement - Specific A3/A4 Variants (December 2024)

**Feature Modified**: Enhanced the print type filter to show specific A3/A4 variants for Ριζόχαρτο and Χαρτόνι instead of generic options, providing more precise filtering capabilities.

**Changes Made**:

**1. Updated Print Filters (`components/print-filters.tsx`)**:
- **Filter Options**: Replaced generic options with specific A3/A4 variants
  - Removed: `rizocharto`, `chartoni` (generic)
  - Added: `rizochartoA3`, `rizochartoA4`, `chartoniA3`, `chartoniA4` (specific)
- **User Interface**: Dropdown now shows:
  - A4 Ασπρόμαυρο
  - A4 Έγχρωμο  
  - A3 Ασπρόμαυρο
  - A3 Έγχρωμο
  - Ριζόχαρτο A3
  - Ριζόχαρτο A4
  - Χαρτόνι A3
  - Χαρτόνι A4
  - Αυτοκόλλητο

**2. Updated Filter Logic (`app/dashboard/page.tsx`)**:
- **Filter Cases**: Updated switch statement to handle specific variants
  - `rizochartoA3`: Filters for `pagesRizochartoA3 > 0`
  - `rizochartoA4`: Filters for `pagesRizochartoA4 > 0`
  - `chartoniA3`: Filters for `pagesChartoniA3 > 0`
  - `chartoniA4`: Filters for `pagesChartoniA4 > 0`
- **Export Functionality**: Updated `expandPrintJob` function to handle specific variants
  - Each variant now exports as a separate row with correct labels
  - Proper cost calculation for each specific variant

**3. Printer Capability Integration**:
- **Canon Color**: Can filter by all print types (full capability)
- **Canon B/W & Brother**: Automatically restricted to A4 Ασπρόμαυρο only
- **Filter Disabling**: Type filter is disabled and auto-set when B/W printers are selected

**Key Benefits**:
- **Precise Filtering**: Users can filter by specific paper sizes and types
- **Better Data Analysis**: More granular filtering for reporting and analysis
- **Consistent with Database**: Filter options match the actual database schema
- **Improved UX**: Clear distinction between different paper variants

**Technical Implementation**:
- Updated filter dropdown options to match database fields
- Modified filter logic to handle specific variants
- Updated export functionality to properly handle specific variants
- Maintained backward compatibility with existing filter behavior

**Files Modified**:
- `components/print-filters.tsx` - Filter dropdown options
- `app/dashboard/page.tsx` - Filter logic and export functionality

**Testing Considerations**:
- Verify all specific filter options work correctly
- Verify export functionality includes all variants properly
- Verify printer-specific filter restrictions work as expected
- Verify filter combinations work correctly

**Result**: Print type filter now provides precise filtering by specific A3/A4 variants, improving data analysis capabilities and user experience.

### Printing Items Refined - Removed Generic Χαρτόνι & Ριζοχαρτο (December 2024)

**Feature Modified**: Removed generic "Χαρτόνι" and "Ριζόχαρτο" items, keeping only the specific A3 and A4 variants for better precision and clarity.

**Current Items**:
- **Ριζοχαρτο A3**: €0,20 (Ριζόχαρτο A3)
- **Ριζοχαρτο A4**: €0,15 (Ριζόχαρτο A4)  
- **Χαρτόνι A3**: €0,20 (Χαρτόνι A3)
- **Χαρτόνι A4**: €0,15 (Χαρτόνι A4)

**Removed Items**:
- ~~Ριζόχαρτο (generic)~~
- ~~Χαρτόνι (generic)~~

**Changes Made**:

**1. Updated Database Schema (`lib/dummy-database.ts`)**:
- **PrintJob Interface**: Removed generic fields, kept only A3/A4 variants
  - Removed: `pagesRizocharto`, `pagesChartoni`, `costRizocharto`, `costChartoni`
  - Kept: `pagesRizochartoA3`, `pagesRizochartoA4`, `pagesChartoniA3`, `pagesChartoniA4`
  - Kept: `costRizochartoA3`, `costRizochartoA4`, `costChartoniA3`, `costChartoniA4`
- **PrintBilling Interface**: Removed generic total fields
  - Removed: `totalRizocharto`, `totalChartoni`
  - Kept: `totalRizochartoA3`, `totalRizochartoA4`, `totalChartoniA3`, `totalChartoniA4`
- **Price Tables**: Removed generic pricing entries
  - Removed: `rizocharto: 0.10`, `chartoni: 0.10`
  - Kept: `rizochartoA3: 0.20`, `rizochartoA4: 0.15`, `chartoniA3: 0.20`, `chartoniA4: 0.15`

**2. Updated Cost Calculation (`lib/utils.ts`)**:
- **calculatePrintJobTotal Function**: Removed generic cost fields from total calculation
- **Enhanced Money Handling**: Updated to handle only specific A3/A4 variants

**3. Updated Admin Interface (`app/admin/page.tsx`)**:
- **Printing Type State**: Removed generic types from type definition
- **Select Options**: Removed generic items from printing type dropdown
- **Price Display**: Only specific A3/A4 variants show with their respective prices

**4. Updated Prices Page (`app/prices/page.tsx`)**:
- **Price Display**: Removed generic items from price list display
- **Service Options**: Updated calculator service options to exclude generic variants
- **Conditional Calculator**: Price calculator now only shows for non-admin users

**5. Updated Python Data Collection (`python/collect.py`)**:
- **Default Pricing**: Removed generic pricing entries from default pricing structure
- **Cost Calculation**: Updated cost calculation to exclude generic fields
- **Error Handling**: Updated error handling to exclude generic cost fields

**Key Benefits**:
- **Precise Pricing**: Users must select specific A3/A4 variants, eliminating ambiguity
- **Accurate Billing**: Clear distinction between different paper sizes and types
- **Better User Experience**: No confusion between generic and specific paper types
- **Admin Control**: Admin users can manage charges for specific paper sizes only

**Technical Implementation**:
- Removed generic fields while maintaining specific A3/A4 variants
- Used proper money handling functions for all calculations
- Updated error handling to exclude generic fields
- Updated all relevant interfaces and displays to show only specific variants

**Files Modified**:
- `lib/dummy-database.ts` - Database schema and price tables
- `lib/utils.ts` - Cost calculation functions
- `app/admin/page.tsx` - Admin interface updates
- `app/prices/page.tsx` - Price display and calculator updates
- `python/collect.py` - Data collection service updates

**Testing Considerations**:
- Verify generic items no longer appear in admin printing charge interface
- Verify only specific A3/A4 variants appear in price list display
- Verify cost calculations work correctly for specific variants only
- Verify price calculator includes only specific variants (for non-admin users)
- Verify data collection service handles specific fields properly

**Result**: System now supports only specific A3/A4 variants for Χαρτόνι and Ριζόχαρτο, eliminating ambiguity and providing more precise billing control.

### Price Calculator Access Control (December 2024)

**Feature Modified**: Modified the price calculator section to only be visible to non-admin users, while keeping it accessible to all other user access levels.

**Changes Made**:

**1. Conditional Display (`app/prices/page.tsx`)**:
- **Access Control**: Added condition `{user && user.accessLevel !== "admin" && (...)}` around calculator section
- **User Experience**: Admin users see only price lists, other users see price lists + calculator
- **Maintained Functionality**: Calculator remains fully functional for authorized users

**Key Benefits**:
- **Admin Focus**: Admin users can focus on price management without calculator distraction
- **User Empowerment**: Regular users can still calculate costs before printing
- **Role-Based Access**: Clear separation of functionality based on user role
- **Cleaner Interface**: Admin interface is more streamlined

**Technical Implementation**:
- Used existing user authentication context
- Maintained all calculator functionality for authorized users
- No changes to calculator logic or features

**Files Modified**:
- `app/prices/page.tsx` - Added conditional rendering for calculator section

**Testing Considerations**:
- Verify calculator is hidden for admin users
- Verify calculator is visible for regular users and Υπεύθυνος users
- Verify calculator functionality works correctly for authorized users
- Verify price lists remain visible for all users

**Result**: Price calculator is now appropriately restricted based on user access level, providing a better user experience for different user roles.

### Lamination Debts Card Dynamic Filtering Fix (December 2024)

**Problem**: The "Οφειλές ΠΛΑ. ΤΟ." (lamination debts) card on the dashboard was not updating dynamically when users applied billing filters. The card continued to show the total lamination debts from all data instead of reflecting the filtered results.

**Root Cause**: The lamination billing filtering in the `applyFilters` function was only applying legacy filters (`searchTerm`, `statusFilter`, `userFilter`) but was missing the billing-specific filters that were applied to print billing (`billingSearchTerm`, `billingDebtFilter`, `billingPriceRange`, `billingAmountFilter`, `billingRoleFilter`).

**Solution**: Updated the lamination billing filtering logic to include all the same billing-specific filters that are applied to print billing, ensuring consistent behavior across both debt cards.

**Changes Made**:

**1. Enhanced Lamination Billing Filtering (`app/dashboard/page.tsx`)**:
- **Added billing search filter**: Now applies `billingSearchTerm` to lamination billing data
- **Added billing debt filter**: Now applies `billingDebtFilter` (paid/unpaid) to lamination billing
- **Added billing price range filter**: Now applies `billingPriceRange` to filter by remaining balance
- **Added billing amount filter**: Now applies `billingAmountFilter` (under10, 10to50, over50) to lamination billing
- **Added billing role filter**: Now applies `billingRoleFilter` to filter by user role
- **Maintained legacy filters**: Preserved existing legacy filter functionality for backward compatibility

```typescript
// Before: Only legacy filters
let filteredLB = [...laminationBilling]
if (searchTerm) {
  filteredLB = filteredLB.filter(/* search logic */)
}
if (statusFilter !== "all") {
  filteredLB = filteredLB.filter(/* status logic */)
}
if (userFilter !== "all") {
  filteredLB = filteredLB.filter(/* user logic */)
}

// After: Complete billing-specific filters + legacy filters
let filteredLB = [...laminationBilling]

// Apply billing search filter
if (billingSearchTerm) {
  filteredLB = filteredLB.filter(/* billing search logic */)
}

// Apply billing debt filter
if (billingDebtFilter !== "all") {
  filteredLB = filteredLB.filter(/* billing debt logic */)
}

// Apply billing price range filter
if (billingPriceRange[0] !== billingPriceDistribution.min || billingPriceRange[1] !== billingPriceDistribution.max) {
  filteredLB = filteredLB.filter(/* price range logic */)
}

// Apply billing amount filter
if (billingAmountFilter !== "all") {
  filteredLB = filteredLB.filter(/* amount filter logic */)
}

// Apply billing role filter
if (billingRoleFilter !== "all") {
  filteredLB = filteredLB.filter(/* role filter logic */)
}

// Apply legacy filters for backward compatibility
if (searchTerm) { /* legacy search logic */ }
if (statusFilter !== "all") { /* legacy status logic */ }
if (userFilter !== "all") { /* legacy user logic */ }
```

**Key Benefits**:
- **Consistent Behavior**: Both print and lamination debt cards now respond to the same filters
- **Accurate Statistics**: Lamination debts card now shows accurate totals based on current filter state
- **Better User Experience**: Users can filter data and see corresponding changes in both debt cards
- **Real-time Updates**: Lamination debts update immediately when billing filters are applied or changed
- **Complete Filtering**: All billing-specific filters now work for both print and lamination data

**Technical Implementation**:
- Used the same filtering logic as print billing for consistency
- Maintained backward compatibility with existing legacy filters
- Applied all billing-specific filters: search, debt status, price range, amount ranges, and role filtering
- Preserved existing functionality while adding new capabilities

**Files Modified**:
- `app/dashboard/page.tsx` - Enhanced lamination billing filtering in `applyFilters` function

**Testing Considerations**:
- Verify that lamination debts card updates when billing search is applied
- Verify that lamination debts card updates when debt status filter is changed
- Verify that lamination debts card updates when price range filter is adjusted
- Verify that lamination debts card updates when amount filter is changed
- Verify that lamination debts card updates when role filter is applied
- Verify that both debt cards show consistent totals when same filters are applied

**Result**: The "Οφειλές ΠΛΑ. ΤΟ." card now updates dynamically with all billing filters, providing users with accurate and consistent debt information that reflects their current filter selections.

### Conditional Percentage Display for Debt Cards (December 2024)

**Feature Enhanced**: Modified the percentage indicators on debt cards to only appear when filters are applied, and to show 100% for each debt type when no filters are active.

**Changes Made**:

**1. Added Filter Detection Logic (`app/dashboard/page.tsx`)**:
- **Comprehensive filter checking**: Detects when any billing or legacy filters are applied
- **Dynamic percentage calculation**: Shows 100% when no filters, actual percentages when filtered
- **Real-time updates**: Filter detection updates automatically when any filter changes

```typescript
// Check if any filters are applied
const hasFilters = billingSearchTerm || 
                  billingDebtFilter !== "all" || 
                  billingPriceRange[0] !== billingPriceDistribution.min || 
                  billingPriceRange[1] !== billingPriceDistribution.max ||
                  billingAmountFilter !== "all" || 
                  billingRoleFilter !== "all" ||
                  searchTerm || 
                  statusFilter !== "all" || 
                  userFilter !== "all"

// Calculate percentages for debt cards
// When no filters are applied, each type represents 100% of its own total
// When filters are applied, calculate percentage of filtered total
const printUnpaidPercentage = hasFilters 
  ? (totalUnpaid > 0 ? (printUnpaid / totalUnpaid) * 100 : 0)
  : 100
const laminationUnpaidPercentage = hasFilters 
  ? (totalUnpaid > 0 ? (laminationUnpaid / totalUnpaid) * 100 : 0)
  : 100
```

**2. Updated Card Layouts**:
- **Conditional percentage display**: Percentage text only appears when `hasFilters` is true
- **Dynamic layout**: Uses `justify-between` when filters are applied, `justify-center` when not
- **Clean interface**: No percentage text cluttering the interface when no filters are active

```typescript
// Before: Always show percentage
<div className="p-6 flex-1 flex items-center justify-between">
  <div className="text-3xl font-bold text-blue-600">{formatPrice(printUnpaid)}</div>
  <div className="text-sm text-gray-500">({printUnpaidPercentage.toFixed(1)}% συνολικού)</div>
</div>

// After: Conditional percentage display
<div className={`p-6 flex-1 flex items-center ${hasFilters ? 'justify-between' : 'justify-center'}`}>
  <div className="text-3xl font-bold text-blue-600">{formatPrice(printUnpaid)}</div>
  {hasFilters && (
    <div className="text-sm text-gray-500">({printUnpaidPercentage.toFixed(1)}% συνολικού)</div>
  )}
</div>
```

**Key Features**:
- **Clean Default State**: No percentage text when no filters are applied
- **100% Representation**: Each debt type shows as 100% of its own total when unfiltered
- **Dynamic Percentages**: When filters are applied, percentages show actual proportions
- **Responsive Layout**: Cards automatically adjust layout based on filter state
- **Real-time Updates**: Percentage display updates immediately when filters change

**User Experience**:
1. **No Filters Applied**: 
   - Print Debts: €2,753.06 (centered, no percentage text)
   - Lamination Debts: €208.12 (centered, no percentage text)

2. **Filters Applied**:
   - Print Debts: €2,753.06 (93.0% συνολικού) ← percentage on right
   - Lamination Debts: €208.12 (7.0% συνολικού) ← percentage on right

**Technical Implementation**:
- Used comprehensive filter detection covering all billing and legacy filters
- Implemented conditional rendering for percentage text
- Applied dynamic CSS classes for responsive layout
- Maintained existing functionality while adding new behavior

**Files Modified**:
- `app/dashboard/page.tsx` - Added filter detection and conditional percentage display

**Benefits**:
- **Cleaner Interface**: No unnecessary percentage text when viewing total data
- **Better Context**: Percentages only appear when they provide meaningful information
- **Intuitive Behavior**: Users understand that 100% means "all data" for each type
- **Consistent Experience**: Layout adapts smoothly between filtered and unfiltered states

### Debt Card Percentage Indicators (December 2024)

**Feature Added**: Added percentage indicators next to the large monetary values in the debt cards, showing what percentage each debt type represents of the total debt amount.

**Changes Made**:

**1. Added Percentage Calculations (`app/dashboard/page.tsx`)**:
- **Print debt percentage**: Calculates what percentage print debts represent of total debts
- **Lamination debt percentage**: Calculates what percentage lamination debts represent of total debts
- **Zero division protection**: Handles cases where total debt is zero to prevent calculation errors

```typescript
// Calculate percentages for debt cards
const printUnpaidPercentage = totalUnpaid > 0 ? (printUnpaid / totalUnpaid) * 100 : 0
const laminationUnpaidPercentage = totalUnpaid > 0 ? (laminationUnpaid / totalUnpaid) * 100 : 0
```

**2. Updated Card Layouts**:
- **Centered content**: Changed card content to be centered for better visual balance
- **Percentage display**: Added small gray text below the main monetary value showing percentage
- **Consistent styling**: Used consistent text styling and spacing across all cards

```typescript
// Before: Simple monetary value
<div className="text-3xl font-bold text-blue-600">{formatPrice(printUnpaid)}</div>

// After: Monetary value with percentage
<div className="text-center">
  <div className="text-3xl font-bold text-blue-600">{formatPrice(printUnpaid)}</div>
  <div className="text-sm text-gray-500 mt-1">({printUnpaidPercentage.toFixed(1)}% συνολικού)</div>
</div>
```

**Key Features**:
- **Real-time Updates**: Percentages update automatically when filters are applied
- **Dynamic Calculation**: Percentages are calculated based on current filtered data
- **Visual Clarity**: Small, unobtrusive text that doesn't interfere with the main monetary display
- **Greek Formatting**: Uses Greek text "συνολικού" (of total) as requested
- **Decimal Precision**: Shows percentages with one decimal place for accuracy

**Technical Implementation**:
- Used conditional calculation to prevent division by zero
- Applied consistent styling with `text-sm text-gray-500` for percentage text
- Used `toFixed(1)` for consistent decimal precision
- Maintained existing card structure while adding new information

**Files Modified**:
- `app/dashboard/page.tsx` - Added percentage calculations and updated card layouts

**User Experience Improvements**:
1. **Better Context**: Users can quickly see the proportion of each debt type
2. **Filter Awareness**: Percentages change when filters are applied, showing relative importance
3. **Visual Hierarchy**: Main monetary values remain prominent while percentages provide additional context
4. **Consistent Design**: All debt cards follow the same pattern for consistency

**Example Display**:
- **Print Debts**: €2,973.77 (93.3% συνολικού)
- **Lamination Debts**: €213.29 (6.7% συνολικού)

**Future Considerations**:
- Consider adding percentage indicators to other statistics cards if needed
- Monitor user feedback on the percentage display
- Consider adding tooltips or hover effects for additional context
- Implement percentage-based color coding for visual emphasis

### Simplified Role Filter Options (December 2024)

**Problem**: The billing filter dropdown was showing hardcoded numbered options like "Ναός 1", "Ναός 2", "Τομέας 1", "Τομέας 2", etc., which made the interface cluttered and confusing.

**Solution**: Simplified the role filter to show only the basic role categories: "Όλοι", "Άτομο", "Ομάδα", "Τομέας", and "Ναός" without numbered suffixes.

**Changes Made**:

**1. Updated Billing Filters (`components/billing-filters.tsx`)**:
- **Simplified options**: Replaced dynamic numbered options with basic role categories
- **Cleaner interface**: Removed cluttered numbered options for better user experience
- **Consistent filtering**: Maintains same filtering functionality with simplified options

```typescript
// Before: Dynamic numbered options
{(() => {
  const { naoi, tomeis } = getDynamicFilterOptions(users);
  return (
    <>
      {naoi.map((naos) => (
        <SelectItem key={naos} value={naos}>
          {naos}
        </SelectItem>
      ))}
      {tomeis.map((tomeas) => (
        <SelectItem key={tomeas} value={tomeas}>
          {tomeas}
        </SelectItem>
      ))}
    </>
  );
})()}

// After: Simplified basic role options
<SelectItem value="Τομέας">Τομέας</SelectItem>
<SelectItem value="Ναός">Ναός</SelectItem>
```

**Benefits**:
- **Cleaner UI**: Simplified dropdown with only essential role categories
- **Better UX**: Users can easily understand and select role filters
- **Consistent**: Matches the role filter in admin users tab
- **Maintainable**: No need to update code when new numbered entities are added

### Dynamic Filter Options for Ομάδες, Τομείς, Ναοί (December 2024)

**Problem**: The filter dropdowns for Ομάδες (Teams), Τομείς (Sectors), and Ναοί (Churches) were hardcoded with specific values, making the system inflexible when new organizational units were added to the database.

**Solution**: Implemented a dynamic filter system that automatically extracts Ομάδες, Τομείς, and Ναοί from the user database, making the filters adaptable to any organizational structure.

**Changes Made**:

**1. Created Dynamic Filter Utility (`lib/utils.ts`)**:
- **Dynamic extraction**: Added `getDynamicFilterOptions()` function that scans user database
- **Automatic categorization**: Automatically identifies teams, ναοί, and τομείς based on user roles and memberships
- **Sorted results**: Returns alphabetically sorted arrays for consistent dropdown ordering

```typescript
export const getDynamicFilterOptions = (users: any[]) => {
  const teams = new Set<string>()
  const naoi = new Set<string>()
  const tomeis = new Set<string>()

  users.forEach(user => {
    // Extract teams from user data
    if (user.team) {
      teams.add(user.team)
    }
    
    // Extract ναοί from user data (users with userRole "Ναός")
    if (user.userRole === "Ναός") {
      naoi.add(user.displayName)
    }
    
    // Extract τομείς from user data (users with userRole "Τομέας")
    if (user.userRole === "Τομέας") {
      tomeis.add(user.displayName)
    }
    
    // Also extract from memberOf arrays for individual users
    if (user.memberOf && Array.isArray(user.memberOf)) {
      user.memberOf.forEach((member: string) => {
        if (member.includes("Ναός")) {
          naoi.add(member)
        } else if (member.includes("Τομέας")) {
          tomeis.add(member)
        } else {
          // Assume it's a team if it doesn't contain "Ναός" or "Τομέας"
          teams.add(member)
        }
      })
    }
  })

  return {
    teams: Array.from(teams).sort(),
    naoi: Array.from(naoi).sort(),
    tomeis: Array.from(tomeis).sort()
  }
}
```

**2. Updated Admin Users Tab (`components/admin-users-tab.tsx`)**:
- **Dynamic team filter**: Replaced hardcoded team options with dynamic extraction
- **Real-time updates**: Team filter automatically updates when new teams are added to database
- **Consistent interface**: Maintains same user experience with dynamic data

```typescript
// Before: Hardcoded team options
<SelectItem value="Ενωμένοι">Ενωμένοι</SelectItem>
<SelectItem value="Σποριάδες">Σποριάδες</SelectItem>
// ... more hardcoded options

// After: Dynamic team options
{(() => {
  const { teams } = getDynamicFilterOptions(users);
  return teams.map((team) => (
    <SelectItem key={team} value={team}>
      {team}
    </SelectItem>
  ));
})()}
```

**3. Updated Billing Filters (`components/billing-filters.tsx`)**:
- **Dynamic role filter**: Replaced hardcoded Ναός/Τομέας options with dynamic extraction
- **Enhanced filtering**: Users can now filter by specific ναοί and τομείς names
- **Flexible structure**: Supports any number of ναοί and τομείς without code changes

```typescript
// Before: Hardcoded role options
<SelectItem value="Ναός">Ναός</SelectItem>
<SelectItem value="Τομέας">Τομέας</SelectItem>

// After: Dynamic role options
{(() => {
  const { naoi, tomeis } = getDynamicFilterOptions(users);
  return (
    <>
      {naoi.map((naos) => (
        <SelectItem key={naos} value={naos}>
          {naos}
        </SelectItem>
      ))}
      {tomeis.map((tomeas) => (
        <SelectItem key={tomeas} value={tomeas}>
          {tomeas}
        </SelectItem>
      ))}
    </>
  );
})()}
```

**4. Updated Admin Page (`app/admin/page.tsx`)**:
- **Dynamic team validation**: Replaced hardcoded team names in validation logic
- **Flexible team assignment**: Team field assignment now uses dynamic team options
- **Consistent data handling**: All team-related operations use dynamic data

```typescript
// Before: Hardcoded team validation
const teamNames = ["Ενωμένοι", "Σποριάδες", "Καρποφόροι", ...]

// After: Dynamic team validation
const { teams } = getDynamicFilterOptions(users)
const teamsInMembers = newUser.memberOf.filter(member => teams.includes(member))
```

**5. Updated Data Models**:
- **Dynamic team types**: Changed team field from union type to string for flexibility
- **Consistent interfaces**: Updated User interface in both data-store.ts and dummy-database.ts
- **Backward compatibility**: Existing data continues to work with new dynamic system

```typescript
// Before: Fixed team types
team?: "Ενωμένοι" | "Σποριάδες" | "Καρποφόροι" | ...

// After: Dynamic team types
team?: string // Now supports any team name
```

**Technical Benefits**:
- **Scalability**: System automatically adapts to new organizational units
- **Maintainability**: No code changes needed when adding new teams/ναοί/τομείς
- **Data consistency**: All filters use the same source of truth (user database)
- **Performance**: Efficient extraction with Set-based deduplication
- **Type safety**: Maintains TypeScript type safety while allowing dynamic values

**User Experience Improvements**:
- **Automatic updates**: Filters reflect current organizational structure
- **Consistent naming**: Uses actual display names from database
- **Flexible filtering**: Users can filter by specific organizational units
- **Future-proof**: System adapts to organizational changes without development intervention

**Result**: The filtering system is now completely dynamic and will automatically adapt to any changes in the organizational structure, making the application more flexible and maintainable.

### Members-Based Team Assignment System (December 2024)

**Problem**: Users requested to remove the separate "Ομάδα" (Team) field and instead use the existing "Μέλος" (Member) field for team assignment and responsible person determination.

**Solution**: Removed the separate team field and updated the system to use the members field for team assignment, ensuring users with "user" access level have at least one team in their members list.

**Changes Made**:

**1. Removed Separate Team Field (`app/admin/page.tsx`)**:
- **Removed team field**: Eliminated the separate team selection field from user creation form
- **Updated validation**: Changed validation to check members array instead of team field
- **Simplified form**: User creation form now uses only the existing members field for team assignment
- **Updated state management**: Removed team field from newUser state object

```typescript
// Before: Separate team field
team: "" as "" | "Ενωμένοι" | "Σποριάδες" | ...

// After: Use members field for team assignment
// Validation checks members array length instead of team field
if (newUser.accessLevel === "user" && newUser.members.length === 0) {
  // Show error: "Παρακαλώ επιλέξτε τουλάχιστον μία ομάδα/ναό/τομέα"
}
```

**2. Updated Responsible User Logic (`app/profile/[uid]/page.tsx` & `components/admin-users-tab.tsx`)**:
- **Members-based lookup**: Changed from team field to members field for finding responsible person
- **First team priority**: Uses the first team in the members list to determine responsible person
- **Fallback logic**: Maintains existing Υπεύθυνος-based logic for other access levels

```typescript
// Updated logic to use members field
if (profileUser.accessLevel === "user" && profileUser.members && profileUser.members.length > 0) {
  // Find the first team in the members list and get its responsible person
  const firstTeam = profileUser.members.find((member: string) => {
    const teamAccount = allUsers.find(user => 
      user.userRole === "Ομάδα" && user.displayName === member
    )
    return teamAccount && teamAccount.responsiblePerson
  })
  
  if (firstTeam) {
    const teamAccount = allUsers.find(user => 
      user.userRole === "Ομάδα" && user.displayName === firstTeam
    )
    
    if (teamAccount && teamAccount.responsiblePerson) {
      responsibleUsers.push(teamAccount.responsiblePerson)
      return responsibleUsers
    }
  }
}
```

**3. Updated Dummy Database (`lib/dummy-database.ts`)**:
- **Removed team field**: Eliminated team field from sample user data
- **Updated members assignment**: Users with "user" access level now have their team in the members array
- **Consistent data structure**: All users use members field for team assignment

```typescript
// Before: Separate team field
team: team,
members: isIndividual ? [`Ενωμένοι`, `Ναός 1`] : undefined,

// After: Use members field for team
members: isIndividual ? [team] : undefined, // Use members field instead of team
```

**4. Form Validation Updates**:
- **Members requirement**: Users with "user" access level must have at least one team in members list
- **Clear error message**: Updated validation message to guide users to select team/naos/tomeas
- **Simplified UI**: Removed separate team selection, using existing members field

**Technical Details**:
- **Data consistency**: All team assignments now go through members field
- **Responsible person lookup**: Uses first team in members list to find responsible person
- **Backward compatibility**: Maintains existing logic for admin and Υπεύθυνος users
- **Type safety**: Removed team field types and updated validation logic

**Result**: The system now uses a unified approach where the "Μέλος" field handles team assignment, eliminating the need for a separate team field while maintaining the same functionality for responsible person determination.

### Team-Based Responsible User System (December 2024)

**Problem**: Users requested that every user with "Χρήστης" (User) access level must belong to a team, and the responsible person of that team should appear as the single responsible person in the "Υπεύθυνοι" field.

**Solution**: Implemented a team-based responsible user system where users with "user" access level are automatically assigned to teams, and their responsible person is determined by their team's responsible person.

**Changes Made**:

**1. Updated Responsible User Logic (`app/profile/[uid]/page.tsx` & `components/admin-users-tab.tsx`)**:
- **Team-based calculation**: For users with "user" access level, find their team's responsible person
- **Fallback logic**: For other access levels (admin, Υπεύθυνος), use the existing Υπεύθυνος-based calculation
- **Single responsible person**: Users with "user" access level now show only their team's responsible person

```typescript
const getResponsibleUsers = () => {
  const allUsers = dummyDB.getUsers()
  const responsibleUsers: string[] = []
  
  // For users with "user" access level, find their team's responsible person
  if (profileUser.accessLevel === "user" && profileUser.team) {
    const teamAccount = allUsers.find(user => 
      user.userRole === "Ομάδα" && user.displayName === profileUser.team
    )
    
    if (teamAccount && teamAccount.responsiblePerson) {
      responsibleUsers.push(teamAccount.responsiblePerson)
      return responsibleUsers
    }
  }
  
  // For other cases, use the old Υπεύθυνος-based logic
  // ... existing logic
}
```

**2. Enhanced User Creation Form (`app/admin/page.tsx`)**:
- **Added team field**: Added team selection for users with "user" access level
- **Required validation**: Users with "user" access level must select a team
- **Team assignment**: All new users with "user" access level are automatically assigned to a team
- **Form validation**: Added validation to ensure team selection for "user" access level

```typescript
// Added team field to newUser state
team: "" as "" | "Ενωμένοι" | "Σποριάδες" | "Καρποφόροι" | "Ολόφωτοι" | "Νικητές" | "Νικηφόροι" | "Φλόγα" | "Σύμψυχοι"

// Added validation
if (newUser.accessLevel === "user" && !newUser.team) {
  toast({
    title: "Σφάλμα Επικύρωσης",
    description: "Παρακαλώ επιλέξτε ομάδα για χρήστες με επίπεδο πρόσβασης 'Χρήστης'",
    variant: "destructive",
  })
  return
}
```

**3. Updated Dummy Database (`lib/dummy-database.ts`)**:
- **Ensured team assignment**: All users with "user" access level now have a team assigned
- **Consistent data structure**: Updated sample data to ensure all users have proper team assignments
- **Team distribution**: Users are distributed across different teams for realistic testing

**4. Team Selection UI**:
- **Conditional display**: Team selection only appears for users with "user" access level
- **All team options**: Includes all available teams: Ενωμένοι, Σποριάδες, Καρποφόροι, Ολόφωτοι, Νικητές, Νικηφόροι, Φλόγα, Σύμψυχοι
- **Required field**: Team selection is mandatory for "user" access level

**Technical Details**:
- **Data consistency**: All users with "user" access level must have a team
- **Responsible person lookup**: Uses team account's responsiblePerson field
- **Fallback mechanism**: Maintains existing logic for admin and Υπεύθυνος users
- **Type safety**: Proper TypeScript types for team field

**Result**: The system now ensures that every user with "Χρήστης" access level belongs to a team, and their responsible person is automatically determined by their team's responsible person, providing a clear and consistent hierarchy of responsibility.

### Profile Page and Admin Page Cleanup - Single Responsible Field (December 2024)

**Problem**: Users requested to keep only the "Υπεύθυνοι" (Responsible/Managers - plural) field and remove the old single "Υπεύθυνος" (Responsible - singular) field that was leftover from the previous system. This needed to be applied to both the profile page and the admin page user cards.

**Solution**: Removed the single responsiblePerson field and ensured only the automatically calculated "Υπεύθυνοι" field is displayed across all pages.

**Changes Made**:

**1. Profile Page Cleanup (`app/profile/[uid]/page.tsx`)**:
- **Removed single responsiblePerson field**: Eliminated the old "Υπεύθυνος" (singular) field from the Role Information card
- **Kept only automatic Υπεύθυνοι**: Maintained only the automatically calculated "Υπεύθυνοι" (plural) field
- **Cleaner interface**: Simplified the role information display

**2. Admin Users Tab Cleanup (`components/admin-users-tab.tsx`)**:
- **Added automatic calculation**: Implemented the same `getResponsibleUsers` function as in profile page
- **Removed single responsiblePerson display**: Eliminated the old single "Υπεύθυνος" field from user cards
- **Replaced hardcoded data**: Replaced `responsiblePersons` field with automatic calculation
- **Consistent behavior**: User cards now show the same automatically calculated responsible users as profile pages

```typescript
// Added automatic calculation function
const getResponsibleUsers = (userData: any) => {
  const allUsers = dummyDB.getUsers()
  const responsibleUsers: string[] = []
  
  const ypefthynoiUsers = allUsers.filter((user: any) => user.accessLevel === "Υπεύθυνος")
  
  ypefthynoiUsers.forEach((ypefthynos: any) => {
    if (ypefthynos.responsibleFor && ypefthynos.responsibleFor.length > 0) {
      const isResponsible = ypefthynos.responsibleFor.some((responsibleFor: string) => {
        return responsibleFor === userData.team || 
               responsibleFor === userData.displayName || 
               responsibleFor === userData.userRole
      })
      
      if (isResponsible) {
        responsibleUsers.push(ypefthynos.displayName)
      }
    }
  })
  
  return responsibleUsers
}
```

**3. Admin Page Form Cleanup (`app/admin/page.tsx`)**:
- **Removed responsiblePerson field**: Eliminated the single responsiblePerson field from user creation form
- **Updated state management**: Removed responsiblePerson from newUser state object
- **Simplified form**: User creation form no longer has the old single responsible field
- **Maintained tag system**: Kept the responsibleFor tag system for Υπεύθυνος users

**4. Data Structure Consistency**:
- **Removed old field**: The `responsiblePerson` field is no longer used anywhere in the system
- **Automatic calculation**: All responsible user displays are now calculated automatically
- **Single source of truth**: Υπεύθυνος users' `responsibleFor` field is the only source for determining responsibilities

**Technical Details**:
- **Type safety**: Fixed TypeScript errors by removing references to non-existent fields
- **Performance**: Automatic calculation runs efficiently on page load
- **Consistency**: Same logic used across profile pages and admin user cards
- **Maintainability**: Centralized responsible user calculation logic

**Result**: The system now has a clean, consistent interface where only the automatically calculated "Υπεύθυνοι" field is displayed, eliminating confusion from the old single "Υπεύθυνος" field and ensuring data consistency across all pages.

### Profile Page Layout and Auto-Population Improvements (December 2024)

**Problem**: Users requested improvements to the profile page layout and functionality: move the "Επίπεδο Πρόσβασης" (Access Level) to the bottom of the Basic Information card, and automatically populate the "Υπεύθυνοι" (Responsible/Managers) section from users with "Υπεύθυνος" access level based on their `responsibleFor` field tags.

**Solution**: Implemented layout changes and automatic calculation of responsible users based on Υπεύθυνος users' responsibilities.

**Changes Made**:

**1. Moved Access Level to Bottom (`app/profile/[uid]/page.tsx`)**:
- **Reordered fields**: Moved "Επίπεδο Πρόσβασης" from third position to last position in Basic Information card
- **Maintained styling**: Preserved all existing styling and badge display
- **Improved hierarchy**: Better visual flow with access level as the final piece of basic information

```typescript
// Before: Username | Name | Access Level | User Role | Creation Date
// After:  Username | Name | User Role | Creation Date | Access Level
```

**2. Implemented Automatic Υπεύθυνοι Calculation**:
- **Added getResponsibleUsers function**: Created function to automatically calculate responsible users
- **Dynamic matching**: Matches Υπεύθυνος users based on their `responsibleFor` field tags
- **Multiple criteria**: Checks against user's team, displayName, and userRole
- **Real-time calculation**: Calculates responsible users on each profile page load

```typescript
const getResponsibleUsers = () => {
  const allUsers = dummyDB.getUsers()
  const responsibleUsers: string[] = []
  
  // Find all users with "Υπεύθυνος" access level
  const ypefthynoiUsers = allUsers.filter(user => user.accessLevel === "Υπεύθυνος")
  
  // For each Υπεύθυνος user, check if they are responsible for this user's team/role
  ypefthynoiUsers.forEach(ypefthynos => {
    if (ypefthynos.responsibleFor && ypefthynos.responsibleFor.length > 0) {
      const isResponsible = ypefthynos.responsibleFor.some(responsibleFor => {
        return responsibleFor === profileUser.team || 
               responsibleFor === profileUser.displayName || 
               responsibleFor === profileUser.userRole
      })
      
      if (isResponsible) {
        responsibleUsers.push(ypefthynos.displayName)
      }
    }
  })
  
  return responsibleUsers
}
```

**3. Updated Role Information Display**:
- **Replaced hardcoded data**: Removed dependency on `responsiblePersons` field
- **Dynamic rendering**: Uses calculated responsible users instead of static data
- **Conditional display**: Only shows Υπεύθυνοι section when there are responsible users
- **Consistent styling**: Maintains existing badge styling and layout

**4. Enhanced Dummy Database Data (`lib/dummy-database.ts`)**:
- **Added responsibleFor field**: Added `responsibleFor` arrays to Υπεύθυνος users
- **Realistic assignments**: Υπεύθυνος 400 responsible for: Ενωμένοι, Καρποφόροι, Νικητές, Φλόγα
- **Balanced distribution**: Υπεύθυνος 401 responsible for: Σποριάδες, Ολόφωτοι, Νικηφόροι
- **Proper data structure**: Ensures automatic calculation works correctly

**Technical Details**:
- **Performance**: Minimal impact as calculation only runs on profile page load
- **Scalability**: Works with any number of Υπεύθυνος users and teams
- **Maintainability**: Centralized logic makes it easy to modify matching criteria
- **Data consistency**: Automatic calculation ensures data is always up-to-date

**Result**: Profile pages now show a cleaner layout with access level at the bottom, and the Υπεύθυνοι section automatically displays the correct responsible users based on Υπεύθυνος users' assigned responsibilities, eliminating the need for manual data entry and ensuring data consistency.

### Dropdown Scrolling Fix (December 2024)

**Problem**: Dropdown menus with scrollable content areas were not responding to mouse wheel scrolling unless the user was hovering directly over the scrollbar. This created a poor user experience where users had to precisely position their mouse over the thin scrollbar to scroll through options.

**Solution**: Added proper mouse wheel event handling to scrollable dropdown areas to enable scrolling anywhere within the dropdown content area.

**Changes Made**:

**1. Fixed SearchableSelect Component (`components/searchable-select.tsx`)**:
- **Added onWheel handler**: Added mouse wheel event handling to the scrollable options container
- **Prevented default behavior**: Prevented the default scroll behavior to avoid page scrolling
- **Manual scroll control**: Manually controlled the scrollTop property to scroll the dropdown content
- **Proper TypeScript typing**: Added proper React.WheelEvent typing for the event handler

```typescript
// Before
<div className="max-h-48 overflow-y-auto">
  {/* options */}
</div>

// After
<div 
  className="max-h-48 overflow-y-auto"
  onWheel={(e: React.WheelEvent) => {
    e.preventDefault()
    const target = e.currentTarget
    target.scrollTop += e.deltaY
  }}
>
  {/* options */}
</div>
```

**2. Fixed CommandList Component (`components/ui/command.tsx`)**:
- **Applied same fix**: Added identical mouse wheel handling to the CommandList component
- **Consistent behavior**: Ensures all command palette dropdowns have the same improved scrolling behavior
- **Maintained compatibility**: Preserved all existing functionality while adding the scroll improvement

**Technical Details**:
- **Event prevention**: `e.preventDefault()` prevents the default browser scroll behavior
- **Manual scrolling**: `target.scrollTop += e.deltaY` manually controls the scroll position
- **Cross-browser compatibility**: Works consistently across different browsers and operating systems
- **Performance**: Minimal performance impact as the event handler is lightweight

**Result**: Users can now scroll through dropdown options by using the mouse wheel anywhere within the dropdown content area, significantly improving the user experience and making the interface more intuitive to use.

### Admin Page User Creation Improvements (December 2024)

### Admin Page User Creation Improvements (December 2024)

**Problem**: Users requested several improvements to the admin page user creation functionality: remove the team field from user creation, move the role filter to the right side in the users tab, and automatically lock the role to "Άτομο" when Access Level "Υπεύθυνος" or "Διαχειριστής" is selected.

**Solution**: Implemented comprehensive improvements to the user creation form and filter layout to enhance usability and enforce role restrictions.

**Changes Made**:

**1. Removed Team Field from User Creation (`app/admin/page.tsx`)**:
- **Removed team state**: Eliminated `team` field from `newUser` state object
- **Removed team UI**: Deleted the entire team selection dropdown from the form
- **Updated user creation logic**: Removed team assignment from `userToAdd` object
- **Updated form reset**: Removed team field from form reset logic

```typescript
// Before
const [newUser, setNewUser] = useState({
  // ... other fields
  team: "" as "" | "Ενωμένοι" | "Σποριάδες" | ...,
  // ... other fields
})

// After
const [newUser, setNewUser] = useState({
  // ... other fields
  // team field removed
  // ... other fields
})
```

**2. Implemented Role Locking for Admin/Υπεύθυνος**:
- **Automatic role setting**: When Access Level "admin" or "Υπεύθυνος" is selected, role automatically changes to "Άτομο"
- **Disabled role selection**: Role dropdown becomes disabled and grayed out for admin/Υπεύθυνος users
- **Visual feedback**: Added explanatory text when role is locked (simplified to avoid redundancy)
- **Form validation**: Maintained existing validation that prevents admin/Υπεύθυνος from having non-Άτομο roles

```typescript
// Access Level change handler
onValueChange={accessLevel => {
  const newAccessLevel = accessLevel as "user" | "admin" | "Υπεύθυνος"
  setNewUser({ 
    ...newUser, 
    accessLevel: newAccessLevel,
    // Automatically set role to "Άτομο" for admin and Υπεύθυνος
    userRole: (newAccessLevel === "admin" || newAccessLevel === "Υπεύθυνος") ? "Άτομο" : newUser.userRole
  })
}}

// Role dropdown with conditional styling
<Select 
  value={newUser.userRole} 
  onValueChange={userRole => setNewUser({ ...newUser, userRole: userRole as "Άτομο" | "Ομάδα" | "Ναός" | "Τομέας" })}
  disabled={newUser.accessLevel === "admin" || newUser.accessLevel === "Υπεύθυνος"}
>
  <SelectTrigger className={newUser.accessLevel === "admin" || newUser.accessLevel === "Υπεύθυνος" ? "bg-gray-100 text-gray-500" : ""}>
    <SelectValue />
  </SelectTrigger>
  {/* ... options */}
</Select>
```

**3. Moved Role Filter to the Right (`components/admin-users-tab.tsx`)**:
- **Reordered filter layout**: Moved role filter from middle to rightmost position
- **Maintained responsive design**: Filter layout still works on mobile and desktop
- **Preserved functionality**: All filtering logic remains unchanged

```typescript
// Before: Search | Role Filter | Team Filter (if applicable)
// After:  Search | Team Filter (if applicable) | Role Filter
```

**4. Removed Blue Team Indication from User Cards**:
- **Cleaned up display**: Removed the blue team indication that was left from the old team field
- **Simplified card description**: Card description now only shows the user role without team information
- **Consistent with new structure**: Aligns with the removal of team field from user creation

**5. Simplified Role Locking Feedback**:
- **Removed redundant text**: Eliminated the yellow indication text below Access Level field
- **Cleaner interface**: Single gray explanatory text above Role field is sufficient
- **Reduced visual clutter**: Less redundant information in the form

**6. Added ResponsibleFor Tag System for Υπεύθυνος Users**:
- **New field**: Added `responsibleFor` field to User interface for Υπεύθυνος users
- **Tag system**: Υπεύθυνος users can now be assigned responsibility for specific teams, churches, or sectors
- **Form integration**: Added TagInput field that appears when Access Level is set to "Υπεύθυνος"
- **Display updates**: Added responsibleFor display in both admin users tab and profile pages
- **Data consistency**: Maintains the same tag system pattern as other fields

```typescript
// New User interface field
export interface User {
  // ... existing fields
  responsibleFor?: string[] // New field for Υπεύθυνος users to show which Ομάδα/Ναός/Τομέας they are responsible for
}

// Form field that appears for Υπεύθυνος users
{newUser.accessLevel === "Υπεύθυνος" && (
  <div>
    <Label>Υπεύθυνος για:</Label>
```

**Result**: The admin page user creation form is now more streamlined and user-friendly, with proper role restrictions and improved layout. The removal of the team field simplifies the form while maintaining all necessary functionality through the memberOf tag system.

### Income Table Integration with Debt Reduction (December 2024)

**Problem**: When income is added from the "Ξεχρέωση" (Debt Reduction) tab in the admin page, it was not being displayed in the "Έσοδα" (Income) table on the dashboard page. The income data was being overwritten when the dashboard refreshed.

**Solution**: Modified the `regenerateIncome()` method in the dummy database to preserve manually added income records while still regenerating historical income data.

**Changes Made**:

**1. Updated regenerateIncome Method (`lib/dummy-database.ts`)**:
- **Preserve recent income**: Store income records with timestamps from the last 24 hours before regeneration
- **Restore after regeneration**: Add back the manually added income records after historical data is regenerated
- **Maintain sorting**: Ensure all income records are sorted by timestamp (newest first)

```typescript
// Before
regenerateIncome(): void {
  this.income = []
  this.generateIncomeHistory()
}

// After
regenerateIncome(): void {
  // Store manually added income records (those with recent timestamps)
  const now = new Date()
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const manuallyAddedIncome = this.income.filter(income => 
    income.timestamp > oneDayAgo
  )
  
  this.income = []
  this.generateIncomeHistory()
  
  // Restore manually added income records
  this.income.push(...manuallyAddedIncome)
  
  // Sort by timestamp (newest first)
  this.income.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
}
```

**Technical Details**:
- **24-hour threshold**: Income records added within the last 24 hours are considered "manually added"
- **Timestamp comparison**: Uses `income.timestamp > oneDayAgo` to identify recent records
- **Array preservation**: Uses spread operator to add back preserved records
- **Sorting**: Maintains chronological order with newest records first

**Result**: Income added through the debt reduction tab now persists and appears in the income table on the dashboard, providing a complete view of all income transactions including both historical and manually added records.
    <TagInput
      tags={newUser.responsibleFor}
      onTagsChange={(responsibleFor) => setNewUser({ ...newUser, responsibleFor })}
      placeholder="Προσθήκη Ομάδας/Ναού/Τομέα..."
      availableOptions={getAvailableResponsibleFor()}
      maxTags={5}
    />
  </div>
)}
```

```typescript
// Before
<CardDescription className="flex items-center gap-2">
  {userData.userRole}
  {userData.team && (
    <span className="text-blue-600 font-medium">• {userData.team}</span>
  )}
</CardDescription>

// After
<CardDescription className="flex items-center gap-2">
  {userData.userRole}
</CardDescription>
```

**Key Benefits**:
- **Simplified User Creation**: Removed redundant team field since members field shows all memberships
- **Enforced Role Restrictions**: Automatic role locking prevents invalid configurations
- **Better UX**: Clear visual feedback when role is locked
- **Improved Layout**: Role filter in more logical right position
- **Reduced Errors**: Automatic role setting prevents validation errors

**Technical Implementation**:
- Used conditional styling with `disabled` prop and `className` for visual feedback
- Implemented automatic state updates when access level changes
- Maintained existing validation logic for role restrictions
- Preserved all existing functionality while adding new features

**Files Modified**:
- `app/admin/page.tsx` - Removed team field, implemented role locking
- `components/admin-users-tab.tsx` - Moved role filter to right position, removed blue team indication from user cards

**User Experience Improvements**:
1. **Automatic Role Setting**: No need to manually select "Άτομο" for admin/Υπεύθυνος users
2. **Visual Clarity**: Grayed out role dropdown clearly shows it's locked
3. **Error Prevention**: Impossible to create invalid role/access level combinations
4. **Better Layout**: Role filter in more intuitive right position
5. **Simplified Form**: One less field to manage in user creation

**Verification Process**:
1. **Role Locking Test**: Confirmed role automatically sets to "Άτομο" when admin/Υπεύθυνος selected
2. **Visual Test**: Verified role dropdown is grayed out and disabled for admin/Υπεύθυνος
3. **Filter Layout Test**: Confirmed role filter appears on the right side
4. **Form Validation Test**: Verified existing validation still works correctly
5. **Build Test**: Confirmed application builds without errors

**Future Considerations**:
- Consider adding similar role restrictions for other access levels if needed
- Monitor user feedback on the simplified form
- Consider adding bulk user creation with role restrictions
- Implement role-based form field visibility for other scenarios

### Username Validation and Format Enforcement (December 2024)

**Problem**: The application needed to enforce consistent username formatting where only admin can have "admin" as username, and all other users must have numeric usernames.

**Solution**: Implemented comprehensive username validation and updated existing team accounts to use numeric usernames.

**Changes Made**:

**1. Updated User Creation Validation (`app/admin/page.tsx`)**:
```typescript
// Validate username format based on access level
if (newUser.accessLevel === "admin") {
  if (newUser.username !== "admin") {
    toast({
      title: "Σφάλμα Username",
      description: "Ο διαχειριστής πρέπει να έχει username 'admin'",
      variant: "destructive",
    })
    return
  }
} else {
  // For non-admin users, username must be numeric
  if (!/^\d+$/.test(newUser.username)) {
    toast({
      title: "Σφάλμα Username",
      description: "Το username πρέπει να είναι αριθμός (π.χ. 401, 402, 403)",
      variant: "destructive",
    })
    return
  }
}
```

**2. Enhanced Username Input Field**:
```typescript
<Input 
  id="username" 
  value={newUser.username} 
  onChange={e => setNewUser({ ...newUser, username: e.target.value })} 
  placeholder={newUser.accessLevel === "admin" ? "admin" : "π.χ. 401, 402, 403"}
/>
{newUser.accessLevel === "admin" && (
  <p className="text-xs text-gray-500 mt-1">
    Ο διαχειριστής πρέπει να έχει username "admin"
  </p>
)}
{newUser.accessLevel !== "admin" && (
  <p className="text-xs text-gray-500 mt-1">
    Το username πρέπει να είναι αριθμός
  </p>
)}
```

**3. Updated Team Usernames (`lib/dummy-database.ts`)**:
```typescript
// Before
{ username: "enwmenoi", displayName: "Ενωμένοι" }
{ username: "sporiades", displayName: "Σποριάδες" }
// ... etc

// After
{ username: "500", displayName: "Ενωμένοι" }
{ username: "501", displayName: "Σποριάδες" }
// ... etc
```

**4. Updated Authentication Passwords (`lib/auth-context.tsx`)**:
```typescript
// Before
"enwmenoi": "enwmenoi",
"sporiades": "sporiades",
// ... etc

// After
"500": "500",
"501": "501",
// ... etc
```

**5. Updated Login Page Placeholder (`app/login/page.tsx`)**:
```typescript
// Before
placeholder="π.χ. 408"

// After
placeholder="π.χ. 400, 401, 402, admin"
```

**Key Benefits**:
- **Consistent Formatting**: All usernames follow a predictable pattern
- **Clear Validation**: Users get immediate feedback on username requirements
- **Admin Protection**: Only admin can use "admin" username
- **Numeric Simplicity**: Easy to remember and type numeric usernames
- **No Conflicts**: Team usernames (500-507) don't conflict with individual users (400-499)

**Technical Implementation**:
- Used regex validation (`/^\d+$/`) for numeric usernames
- Implemented conditional validation based on access level
- Updated all existing team accounts to use numeric usernames
- Maintained backward compatibility with existing user data
- Added helpful placeholder text and validation messages

**Files Modified**:
- `app/admin/page.tsx` - Added username validation and enhanced input field
- `lib/dummy-database.ts` - Updated team usernames to numeric format
- `lib/auth-context.tsx` - Updated password mappings for new usernames
- `app/login/page.tsx` - Updated placeholder text
- `lessons.md` - Documented the changes

**User Experience Improvements**:
1. **Clear Validation**: Users immediately know what format is expected
2. **Helpful Placeholders**: Input fields show examples of valid usernames
3. **Consistent Pattern**: All usernames follow the same numeric format
4. **Admin Clarity**: Clear distinction that only admin uses "admin"
5. **Error Prevention**: Validation prevents invalid username creation

**Verification Process**:
1. **Admin Validation Test**: Confirmed only "admin" username works for admin users
2. **Numeric Validation Test**: Confirmed only numeric usernames work for non-admin users
3. **Team Login Test**: Verified all team accounts can still log in with new numeric usernames
4. **Existing User Test**: Confirmed existing individual users (400-405) still work
5. **Build Test**: Confirmed application builds without errors

**Username Mapping**:
- **Admin**: `admin` (unchanged)
- **Υπεύθυνοι**: `400-410` (11 total - Υπεύθυνος 400, 401, 402, 403, 404, 405, 406, 407, 408, 409, 410)
- **Individual Users**: `411-412` (2 total - Χρήστης 411, 412)
- **Ναοί**: `413-417` (5 total - Ναός 1, 2, 3, 4, 5)
- **Τομείς**: `418-422` (5 total - Τομέας 1, 2, 3, 4, 5)
- **Individual Users**: `423-499` (77 total - Χρήστης 423-499)
- **Teams**: `500-507` (8 total - Ενωμένοι, Σποριάδες, Καρποφόροι, Ολόφωτοι, Νικητές, Νικηφόροι, Φλόγα, Σύμψυχοι)

**Total**: 108 users across all categories

**Future Considerations**:
- Consider adding username generation for new users
- Monitor user feedback on numeric username requirement
- Consider adding username prefixes for different user types
- Implement username reservation system for large organizations

### Dummy Data Expansion - Additional Υπεύθυνοι, Ναοί, and Τομείς (December 2024)

**Problem**: The application needed more comprehensive dummy data with additional Υπεύθυνοι users and complete sets of Ναοί and Τομείς for better testing and demonstration.

**Solution**: Expanded the dummy database with 11 Υπεύθυνοι users (400-410), 5 Ναοί (413-417), and 5 Τομείς (418-422), along with additional regular users.

**Changes Made**:

**1. Added 9 Additional Υπεύθυνοι Users (`lib/dummy-database.ts`)**:
```typescript
// Added Υπεύθυνοι 402-410 with diverse responsibilities
{
  uid: "user-402",
  username: "402",
  accessLevel: "Υπεύθυνος",
  displayName: "Υπεύθυνος 402",
  responsibleFor: ["Καρποφόροι", "Νικητές", "Φλόγα"],
},
// ... Υπεύθυνοι 403-410 with different team assignments
```

**2. Added 5 Ναοί Accounts**:
```typescript
// Ναοί 1-5 with appropriate Υπεύθυνοι assignments
{
  uid: "user-413",
  username: "413",
  displayName: "Ναός 1",
  userRole: "Ναός",
  responsiblePersons: ["Υπεύθυνος 400", "Υπεύθυνος 406"],
},
// ... Ναοί 2-5
```

**3. Added 5 Τομείς Accounts**:
```typescript
// Τομείς 1-5 with appropriate Υπεύθυνοι assignments
{
  uid: "user-418",
  username: "418",
  displayName: "Τομέας 1",
  userRole: "Τομέας",
  responsiblePersons: ["Υπεύθυνος 401", "Υπεύθυνος 406"],
},
// ... Τομείς 2-5
```

**4. Updated Authentication Passwords (`lib/auth-context.tsx`)**:
```typescript
// Comprehensive password mapping for all new users
const USER_PASSWORDS: Record<string, string> = {
  // Admin
  admin: "admin123",
  
  // Υπεύθυνοι (400-410)
  "400": "400", // Υπεύθυνος 400
  // ... Υπεύθυνοι 401-410
  
  // Ναοί (413-417)
  "413": "413", // Ναός 1
  // ... Ναοί 2-5
  
  // Τομείς (418-422)
  "418": "418", // Τομέας 1
  // ... Τομείς 2-5
}
```

**5. Updated Login Page Placeholder (`app/login/page.tsx`)**:
```typescript
// More descriptive placeholder showing user categories
placeholder="π.χ. 400-410 (Υπεύθυνοι), 413-417 (Ναοί), 418-422 (Τομείς), admin"
```

**Key Benefits**:
- **Comprehensive Testing**: Full range of user types for testing all scenarios
- **Realistic Data**: More realistic organizational structure with multiple Υπεύθυνοι
- **Better Coverage**: All user roles (Άτομο, Ομάδα, Ναός, Τομέας) well represented
- **Diverse Relationships**: Complex responsible person assignments for testing
- **Scalable Structure**: Easy to add more users following the same pattern

**Technical Implementation**:
- Used sequential numbering to avoid conflicts (400-410 for Υπεύθυνοι)
- Assigned multiple Υπεύθυνοι to each Ναός and Τομέας for redundancy
- Maintained consistent naming patterns across all user types
- Updated all authentication mappings for new usernames
- Preserved existing functionality while expanding data

**Files Modified**:
- `lib/dummy-database.ts` - Added 9 new Υπεύθυνοι, 5 Ναοί, 5 Τομείς
- `lib/auth-context.tsx` - Updated password mappings for all new users
- `app/login/page.tsx` - Updated placeholder text
- `lessons.md` - Documented the expansion

**User Experience Improvements**:
1. **Better Testing**: More comprehensive data for testing all user scenarios
2. **Realistic Structure**: More realistic organizational hierarchy
3. **Diverse Relationships**: Complex responsible person assignments
4. **Clear Categories**: Well-organized username ranges by user type
5. **Easy Navigation**: Clear placeholder text showing available usernames

**Verification Process**:
1. **Login Test**: Confirmed all new users can log in with their numeric passwords
2. **Role Assignment Test**: Verified Υπεύθυνοι have appropriate responsibleFor assignments
3. **Relationship Test**: Confirmed Ναοί and Τομείς have proper Υπεύθυνοι assignments
4. **Conflict Test**: Verified no username conflicts between different user types
5. **Build Test**: Confirmed application builds without errors

**Complete User Structure**:
- **1 Admin**: `admin`
- **11 Υπεύθυνοι**: `400-410` (Υπεύθυνος 400, 401, 402, 403, 404, 405, 406, 407, 408, 409, 410)
- **2 Individual Users**: `411-412` (Χρήστης 411, 412)
- **5 Ναοί**: `413-417` (Ναός 1, 2, 3, 4, 5)
- **5 Τομείς**: `418-422` (Τομέας 1, 2, 3, 4, 5)
- **5 Additional Users**: `423-427` (Χρήστης 423, 424, 425, 426, 427)
- **8 Teams**: `500-507` (Ενωμένοι, Σποριάδες, Καρποφόροι, Ολόφωτοι, Νικητές, Νικηφόροι, Φλόγα, Σύμψυχοι)

**Total**: 37 users across all categories

**Future Considerations**:
- Consider adding more individual users for comprehensive testing
- Monitor user feedback on the expanded data structure
- Consider adding user groups or departments for larger organizations
- Implement user import/export functionality for data management

### Major Individual User Expansion - Comprehensive Άτομο Users (December 2024)

**Problem**: The application needed significantly more individual users (Άτομο) with proper organizational relationships. Each user should belong to exactly one team, one ναός, and one τομέας to create a realistic organizational structure.

**Solution**: Added 77 new individual users (423-499) with carefully planned organizational relationships, ensuring each user belongs to exactly one team, one ναός, and one τομέας.

**Changes Made**:

**1. Added 77 New Individual Users (`lib/dummy-database.ts`)**:
```typescript
// Each user belongs to exactly one team, one ναός, and one τομέας
{
  uid: "user-423",
  username: "423",
  accessLevel: "user",
  displayName: "Χρήστης 423",
  userRole: "Άτομο",
  members: ["Ενωμένοι", "Ναός 1", "Τομέας 1"],
},
// ... 76 more users with diverse organizational assignments
```

**2. Organizational Structure Design**:
- **8 Teams**: Ενωμένοι, Σποριάδες, Καρποφόροι, Ολόφωτοι, Νικητές, Νικηφόροι, Φλόγα, Σύμψυχοι
- **5 Ναοί**: Ναός 1, 2, 3, 4, 5
- **5 Τομείς**: Τομέας 1, 2, 3, 4, 5
- **Balanced Distribution**: Each team has approximately 9-10 members
- **Cross-Organizational**: Users are distributed across different ναοί and τομείς

**3. Updated Authentication Passwords (`lib/auth-context.tsx`)**:
```typescript
// Added passwords for all 77 new users
const USER_PASSWORDS: Record<string, string> = {
  // ... existing users
  
  // Individual Users (423-499)
  "423": "423", // Χρήστης 423
  "424": "424", // Χρήστης 424
  // ... Χρήστης 425-499
}
```

**4. Updated Login Page Placeholder (`app/login/page.tsx`)**:
```typescript
// Updated placeholder to show the new user range
placeholder="π.χ. 400-410 (Υπεύθυνοι), 413-417 (Ναοί), 418-422 (Τομείς), 423-499 (Χρήστες), admin"
```

**Key Benefits**:
- **Realistic Scale**: 77 individual users create a realistic organizational size
- **Proper Relationships**: Each user belongs to exactly one team, ναός, and τομέας
- **Balanced Distribution**: Even distribution across all organizational units
- **Comprehensive Testing**: Large dataset for testing all user scenarios
- **Organizational Hierarchy**: Clear structure with teams, ναοί, and τομείς

**Technical Implementation**:
- **Sequential Numbering**: Users 423-499 for easy identification
- **Consistent Structure**: All users follow the same data structure
- **Proper Relationships**: Each user has exactly 3 memberships (team, ναός, τομέας)
- **No Conflicts**: Username ranges carefully planned to avoid overlaps
- **Scalable Pattern**: Easy to add more users following the same pattern

**Organizational Distribution**:
- **Team Distribution**: Each team has 9-10 members
- **Ναός Distribution**: Each ναός has 15-16 members
- **Τομέας Distribution**: Each τομέας has 15-16 members
- **Cross-Organizational**: Users belong to different combinations of ναοί and τομείς

**Files Modified**:
- `lib/dummy-database.ts` - Added 77 new individual users
- `lib/auth-context.tsx` - Added password mappings for all new users
- `app/login/page.tsx` - Updated placeholder text
- `lessons.md` - Updated documentation

**User Experience Improvements**:
1. **Realistic Testing**: Large dataset for comprehensive testing
2. **Organizational Structure**: Clear hierarchy with teams, ναοί, and τομείς
3. **Relationship Testing**: Complex organizational relationships for testing
4. **Scalability**: Easy to add more users following the same pattern
5. **Data Consistency**: All users follow the same organizational rules

**Verification Process**:
1. **Login Test**: Confirmed all 77 new users can log in with their numeric passwords
2. **Relationship Test**: Verified each user belongs to exactly one team, one ναός, and one τομέας
3. **Distribution Test**: Confirmed balanced distribution across all organizational units
4. **Conflict Test**: Verified no username conflicts between different user types
5. **Build Test**: Confirmed application builds without errors

**Complete User Structure**:
- **1 Admin**: `admin`
- **11 Υπεύθυνοι**: `400-410` (Υπεύθυνος 400, 401, 402, 403, 404, 405, 406, 407, 408, 409, 410)
- **2 Individual Users**: `411-412` (Χρήστης 411, 412)
- **5 Ναοί**: `413-417` (Ναός 1, 2, 3, 4, 5)
- **5 Τομείς**: `418-422` (Τομέας 1, 2, 3, 4, 5)
- **77 Individual Users**: `423-499` (Χρήστης 423-499)
- **8 Teams**: `500-507` (Ενωμένοι, Σποριάδες, Καρποφόροι, Ολόφωτοι, Νικητές, Νικηφόροι, Φλόγα, Σύμψυχοι)

**Total**: 108 users across all categories

**Future Considerations**:
- Consider adding more individual users for even larger organizations
- Monitor performance with the increased user count
- Consider adding user search and filtering functionality
- Implement user grouping and bulk operations
- Consider adding user activity tracking and analytics

### Υπεύθυνοι Billing Fix - Include Υπεύθυνοι in Sample Data Generation (December 2024)

**Problem**: Οι Υπεύθυνοι είχαν 0 οφείλες γιατί δεν δημιουργούνταν print jobs και lamination jobs για αυτούς στο dummy data. Η μέθοδος `generateSampleData` φιλτράριζε μόνο τους χρήστες με `accessLevel === "user"`, αλλά οι Υπεύθυνοι έχουν `accessLevel === "Υπεύθυνος"`.

**Solution**: Ενημέρωσα το φιλτράρισμα στις μεθόδους `generateSampleData` και `generateBillingRecords` ώστε να συμπεριλαμβάνουν και τους Υπεύθυνους.

**Changes Made**:

**1. Updated generateSampleData Method (`lib/dummy-database.ts`)**:
```typescript
// Before: Only users with accessLevel === "user"
const userIds = this.users.filter((u) => u.accessLevel === "user").map((u) => u.uid);

// After: Include both regular users and Υπεύθυνοι
const userIds = this.users.filter((u) => u.accessLevel === "user" || u.accessLevel === "Υπεύθυνος").map((u) => u.uid);
```

**2. Updated generateBillingRecords Method (`lib/dummy-database.ts`)**:
```typescript
// Before: Only users with accessLevel === "user"
const userIds = this.users.filter((u) => u.accessLevel === "user").map((u) => u.uid)

// After: Include both regular users and Υπεύθυνοι
const userIds = this.users.filter((u) => u.accessLevel === "user" || u.accessLevel === "Υπεύθυνος").map((u) => u.uid)
```

**Key Benefits**:
- **Realistic Billing**: Υπεύθυνοι τώρα έχουν οφείλες όπως θα έπρεπε
- **Complete Data**: Όλοι οι χρήστες (εκτός admin) έχουν print jobs και lamination jobs
- **Proper Testing**: Μπορούμε να testάρουμε billing scenarios για Υπεύθυνους
- **Data Consistency**: Όλοι οι χρήστες ακολουθούν το ίδιο pattern για jobs και billing

**Technical Details**:
- **Filter Logic**: Χρησιμοποιείται OR condition για να συμπεριλάβει και τους δύο τύπους χρηστών
- **Job Generation**: Υπεύθυνοι τώρα παίρνουν 10-20 print jobs και 3-8 lamination jobs ανά μήνα
- **Billing Generation**: Δημιουργούνται billing records για Υπεύθυνους με proper payment status
- **Cost Calculation**: Όλα τα costs υπολογίζονται σωστά για Υπεύθυνους

**Files Modified**:
- `lib/dummy-database.ts` - Updated generateSampleData and generateBillingRecords methods

**Verification Process**:
1. **Login Test**: Confirmed Υπεύθυνοι can still log in normally
2. **Job Generation Test**: Verified Υπεύθυνοι now have print and lamination jobs
3. **Billing Test**: Confirmed Υπεύθυνοι now have billing records with proper amounts
4. **Payment Test**: Verified Υπεύθυνοι have realistic payment status (paid/unpaid)
5. **Build Test**: Confirmed application builds without errors

**Result**: Οι Υπεύθυνοι τώρα έχουν realistic οφείλες και billing records, καθιστώντας το dummy data πιο πλήρες και ρεαλιστικό για testing purposes.

### Profile Page Consolidation and Simplification (December 2024)

**Problem**: The application had two separate profile pages - a static one at `/profile` and a dynamic one at `/profile/[uid]`. Users wanted a single dynamic profile page that shows the current user's profile when accessed from navigation, and other users' profiles when accessed with a specific UID. Additionally, financial details and team field were no longer needed.

**Solution**: Consolidated to a single dynamic profile page, updated navigation to point to the current user's profile, removed financial information, and removed the team field display.

**Changes Made**:

**1. Updated Navigation (`components/navigation.tsx`)**:
```typescript
// Before
{
  href: "/profile",
  label: "Προφίλ",
  icon: UserIcon,
  roles: ["user", "admin", "Υπεύθυνος"],
}

// After
{
  href: `/profile/${user.uid}`,
  label: "Προφίλ",
  icon: UserIcon,
  roles: ["user", "admin", "Υπεύθυνος"],
}
```

**2. Removed Static Profile Page**:
- Deleted `app/profile/page.tsx` completely
- Now only the dynamic route `/profile/[uid]` exists

**3. Simplified Dynamic Profile Page (`app/profile/[uid]/page.tsx`)**:
- Removed all financial information (print billing, lamination billing, unpaid amounts)
- Removed team field display (since members field shows all memberships)
- Removed unused imports (`roundMoney` from utils)
- Kept only basic information and role-specific information cards

**4. Removed Financial Information Card**:
- Eliminated the entire "Οικονομικές Πληροφορίες" section
- Removed billing calculations and price formatting
- Simplified the layout to focus on user identity and role information

**5. Removed Team Field Display**:
- Eliminated the team field from the role information card
- Members field now serves as the primary way to show user memberships
- Cleaner interface with less redundant information

**Key Benefits**:
- **Single Source of Truth**: Only one profile page to maintain
- **Consistent Navigation**: Profile link always goes to current user's profile
- **Simplified Interface**: Removed unnecessary financial and team information
- **Better UX**: Cleaner profile page focused on essential user information
- **Reduced Complexity**: Less code to maintain and fewer potential bugs

**Technical Implementation**:
- Navigation dynamically generates the profile URL using current user's UID
- Dynamic route handles both current user and other user profiles
- Removed all billing-related imports and calculations
- Maintained Next.js 15 compatibility with React.use() for params

**Files Modified**:
- `components/navigation.tsx` - Updated profile link to use dynamic route
- `app/profile/[uid]/page.tsx` - Removed financial info and team field
- `app/profile/page.tsx` - Deleted (no longer needed)

**URL Structure**:
- **Current User Profile**: `/profile/{current-user-uid}` (accessed from navigation)
- **Other User Profile**: `/profile/{other-user-uid}` (accessed from admin user cards)

**Verification Process**:
1. **Navigation Test**: Confirmed profile link goes to current user's profile
2. **Admin Navigation Test**: Verified clicking user cards still works
3. **Layout Test**: Confirmed profile page displays correctly without financial info
4. **Build Test**: Verified application builds without errors
5. **Type Check**: Confirmed TypeScript compilation without errors

**Future Considerations**:
- Consider adding profile editing functionality if needed
- Monitor user feedback on the simplified profile interface
- Consider adding profile picture functionality
- Implement profile privacy settings if required

### Next.js 15 Params Promise Fix (December 2024)

**Problem**: In Next.js 15, the `params` object in dynamic route pages is now a Promise and must be unwrapped with `React.use()` before accessing its properties. Direct access to `params.uid` was causing deprecation warnings and will be required in future versions.

**Error Message**:
```
Error: A param property was accessed directly with `params.uid`. `params` is now a Promise and should be unwrapped with `React.use()` before accessing properties of the underlying params object.
```

**Solution**: Updated the dynamic route page to properly unwrap the params Promise using `React.use()` and updated TypeScript interfaces accordingly.

**Changes Made**:

**1. Updated Interface (`app/profile/[uid]/page.tsx`)**:
```typescript
// Before
interface ProfilePageProps {
  params: {
    uid: string
  }
}

// After
interface ProfilePageProps {
  params: Promise<{
    uid: string
  }>
}
```

**2. Added React.use() Import**:
```typescript
// Before
import { useEffect, useState } from "react"

// After
import { useEffect, useState, use } from "react"
```

**3. Unwrapped Params**:
```typescript
// Before
useEffect(() => {
  const allUsers = dummyDB.getUsers()
  const user = allUsers.find(u => u.uid === params.uid)
  // ...
}, [params.uid])

// After
// Unwrap params using React.use() for Next.js 15 compatibility
const unwrappedParams = use(params) as { uid: string }
const uid = unwrappedParams.uid

useEffect(() => {
  const allUsers = dummyDB.getUsers()
  const user = allUsers.find(u => u.uid === uid)
  // ...
}, [uid])
```

**Key Benefits**:
- **Future-Proof**: Compatible with Next.js 15 and future versions
- **No Warnings**: Eliminates deprecation warnings in development
- **Type Safety**: Proper TypeScript typing for Promise-based params
- **Performance**: React.use() is optimized for Promise unwrapping

**Technical Implementation**:
- Used `React.use()` hook to unwrap the Promise synchronously
- Added proper TypeScript type assertion for the unwrapped params
- Updated dependency array to use the unwrapped `uid` value
- Maintained all existing functionality while fixing the compatibility issue

**Files Modified**:
- `app/profile/[uid]/page.tsx` - Updated params handling for Next.js 15 compatibility

**Verification Process**:
1. **Build Test**: Confirmed application builds without errors
2. **Runtime Test**: Verified profile pages load correctly with dynamic UIDs
3. **Navigation Test**: Confirmed navigation to profile pages works properly
4. **Type Check**: Verified TypeScript compilation without errors

**Future Considerations**:
- Apply same pattern to other dynamic routes if they exist
- Consider creating a utility function for params unwrapping if needed across multiple files
- Monitor for any other Next.js 15 compatibility issues
- Update documentation for team members about the new params pattern


### Tag System Implementation (December 2024)

**Feature Added**: Implemented a comprehensive tag system for user roles and memberships, including a new Υπεύθυνος access level and tag-based member/responsible person management.

**Changes Made**:

**1. Updated User Interface (`lib/dummy-database.ts`)**:
- Added `Υπεύθυνος` access level to User interface
- Added `members?: string[]` field for Άτομο users to show which Ομάδα/Ναός/Τομέας they belong to
- Added `responsiblePersons?: string[]` field for Ομάδα/Ναός/Τομέας users to show who is responsible
- Updated sample data to include Υπεύθυνος users and tag system data

**2. Created Tag Input Component (`components/ui/tag-input.tsx`)**:
- Reusable tag input component with searchable dropdown
- Supports adding/removing tags with visual feedback
- Includes keyboard navigation (Enter to add, Backspace to remove)
- Configurable max tags and available options
- Popover-based interface with scrollable options list

**3. Enhanced Admin User Creation (`app/admin/page.tsx`)**:
- Added Υπεύθυνος access level option in user creation form
- Added tag system for members (Μέλος) field for Άτομο users
- Added tag system for responsible persons (Υπεύθυνοι) field for Ομάδα/Ναός/Τομέας users
- Implemented role restrictions: Υπεύθυνος and Διαχειριστής can only have role Άτομο
- Added validation to enforce role restrictions during user creation

**4. Updated Admin Users Tab (`components/admin-users-tab.tsx`)**:
- Added display of member tags for Άτομο users
- Added display of responsible person tags for Ομάδα/Ναός/Τομέας users
- Updated badge styling to distinguish between Admin, Υπεύθυνος, and User access levels
- Enhanced user cards to show tag information with proper styling

**5. Updated Authentication System (`lib/auth-context.tsx`)**:
- Added passwords for new Υπεύθυνος users (400, 401)
- Updated hardcoded password list to include all new user types

**6. Enhanced Role Badge Component (`components/role-badge.tsx`)**:
- Added support for Υπεύθυνος access level
- Updated badge variants and text to properly display all three access levels
- Improved styling consistency across the application

**7. Updated Navigation and Access Control**:
- Updated `components/navigation.tsx` to allow Υπεύθυνος access to admin pages
- Updated `components/protected-route.tsx` to handle Υπεύθυνος access level
- Υπεύθυνος users can access dashboard, admin, and profile pages

**8. Enhanced Profile Page (`app/profile/page.tsx`)**:
- Removed department field (no longer exists in User interface)
- Added display of user role (Άτομο, Ομάδα, Ναός, Τομέας)
- Added display of team information for Άτομο users
- Added display of member tags for Άτομο users
- Added display of responsible person tags for Ομάδα/Ναός/Τομέας users

**Key Features**:
- **Tag System**: Visual tag-based interface for managing memberships and responsibilities
- **Role Restrictions**: Υπεύθυνος and Διαχειριστής can only have role Άτομο
- **Searchable Dropdown**: Easy selection of available options with search functionality
- **Visual Feedback**: Clear display of tags with remove buttons and proper styling
- **Access Control**: Υπεύθυνος users have admin-like access to management features
- **Data Consistency**: All interfaces updated to handle new fields and access levels

**Technical Implementation**:
- Used Popover component for dropdown interface
- Implemented keyboard navigation for accessibility
- Added proper TypeScript types for all new fields
- Maintained existing styling patterns and color schemes
- Used Badge components for consistent tag display

**Usage Examples**:
```typescript
// Tag Input for members
<TagInput
  tags={newUser.members}
  onTagsChange={(members) => setNewUser({ ...newUser, members })}
  placeholder="Προσθήκη Ομάδας/Ναού/Τομέα..."
  availableOptions={getAvailableMembers()}
  maxTags={5}
/>

// Tag Input for responsible persons
<TagInput
  tags={newUser.responsiblePersons}
  onTagsChange={(responsiblePersons) => setNewUser({ ...newUser, responsiblePersons })}
  placeholder="Προσθήκη Υπευθύνου..."
  availableOptions={getAvailableResponsiblePersons()}
  maxTags={3}
/>
```

**Benefits**:
- **Better Organization**: Clear visual representation of user relationships
- **Flexible Management**: Easy to add/remove memberships and responsibilities
- **Role Clarity**: Clear distinction between different access levels
- **Improved UX**: Intuitive tag-based interface for complex relationships
- **Data Integrity**: Proper validation and role restrictions prevent invalid configurations

**Future Considerations**:
- Consider adding bulk tag operations for multiple users
- Implement tag-based filtering in admin interface
- Add tag analytics and reporting features
- Consider adding tag permissions and approval workflows

**Dependency Note**:
- Added `@radix-ui/react-scroll-area` dependency for the tag input component
- This is required for the ScrollArea component used in the tag dropdown interface

### Ομάδα Accounts Creation and Icon Updates (December 2024)

**Feature Added**: Created Ομάδα (Team) accounts for each team and updated user tab icons based on role.

**Changes Made**:

**1. Created Ομάδα Accounts (`lib/dummy-database.ts`)**:
- Added 8 Ομάδα accounts for all teams: Ενωμένοι, Σποριάδες, Καρποφόροι, Ολόφωτοι, Νικητές, Νικηφόροι, Φλόγα, Σύμψυχοι
- Each Ομάδα account has appropriate responsible persons assigned
- Usernames follow pattern: team name (e.g., "enwmenoi", "sporiades", etc.)

**2. Updated Admin Users Tab (`components/admin-users-tab.tsx`)**:
- Added role-based icons: User for Άτομο, Users for Ομάδα, Church for Ναός, MapPin for Τομέας
- Modified debt display to show for both "user" and "Υπεύθυνος" access levels
- Υπεύθυνος users can now have debts on their personal accounts (as they use services like everyone else)

**3. Updated Authentication (`lib/auth-context.tsx`)**:
- Added passwords for all new Ομάδα accounts
- Passwords match usernames for easy testing

**Key Features**:
- **Ομάδα Accounts**: Each team now has its own account for billing and management
- **Role-Based Icons**: Visual distinction between different user roles
- **Υπεύθυνος Debts**: Υπεύθυνος users can accumulate debts like regular users
- **Consistent Naming**: Team accounts follow consistent naming patterns

**Sample Ομάδα Accounts**:
- Username: `enwmenoi`, Password: `enwmenoi` - Ενωμένοι
- Username: `sporiades`, Password: `sporiades` - Σποριάδες
- Username: `karpoforoi`, Password: `karpoforoi` - Καρποφόροι
- Username: `olofwtoi`, Password: `olofwtoi` - Ολόφωτοι
- Username: `nikhtes`, Password: `nikhtes` - Νικητές
- Username: `nikhforoi`, Password: `nikhforoi` - Νικηφόροι
- Username: `floga`, Password: `floga` - Φλόγα
- Username: `sympsyxoi`, Password: `sympsyxoi` - Σύμψυχοι

**Icon Mapping**:
- **Άτομο**: User icon (single person)
- **Ομάδα**: Users icon (multiple people)
- **Ναός**: Church icon (building with cross)
- **Τομέας**: MapPin icon (location marker)

### Clickable User Cards and Enhanced Profile Page (December 2024)

**Feature Added**: Made user cards clickable to navigate to profile pages and enhanced profile page to display all user data.

**Changes Made**:

**1. Clickable User Cards (`components/admin-users-tab.tsx`)**:
- Added `useRouter` hook for navigation
- Added `handleUserCardClick` function to navigate to profile page with user ID
- Added `cursor-pointer` and `hover:bg-gray-50` classes to user cards
- Cards now navigate to `/profile?uid={userData.uid}` when clicked

**2. Enhanced Profile Page (`app/profile/page.tsx`)**:
- Added support for viewing other users' profiles via URL parameter `?uid=`
- Added loading state with skeleton animation
- Reorganized layout into three main cards:
  - **Basic Information**: Username, display name, access level, user role, creation date
  - **Role-Specific Information**: Team, responsible person, members, responsible persons
  - **Financial Information**: Print and lamination debts (for user and Υπεύθυνος access levels)
- Added role-based icons throughout the interface
- Added "Back" button when viewing other users' profiles
- Enhanced visual design with proper spacing and color coding

**Key Features**:
- **Navigation**: Click any user card in admin to view their detailed profile
- **Comprehensive Data Display**: Shows all user fields from creation form
- **Financial Overview**: Displays debts for applicable user types
- **Responsive Design**: Works well on all screen sizes
- **Loading States**: Smooth loading experience with skeleton animations
- **Role-Based Icons**: Consistent iconography throughout the interface

**URL Structure**:
- Own profile: `/profile` (always shows current user)
- Other user's profile: `/profile/{uid}` (parameterized URL)

**Data Displayed**:
- **Basic Info**: Username, display name, access level, user role, creation date
- **Role Info**: Team (for Άτομο), responsible person, members (tags), responsible persons (tags)
- **Financial Info**: Print debts, lamination debts, total outstanding balance

### Parameterized URL Implementation (December 2024)

**Feature Added**: Implemented proper parameterized URLs for user profiles with clear separation between own profile and other users' profiles.

**Changes Made**:

**1. Dynamic Route Creation (`app/profile/[uid]/page.tsx`)**:
- Created new dynamic route for viewing other users' profiles
- Added proper TypeScript interface for route parameters
- Implemented loading states and error handling for non-existent users
- Added "Back" button for navigation
- Shows comprehensive user data with role-based icons

**2. Updated Admin Users Tab (`components/admin-users-tab.tsx`)**:
- Modified `handleUserCardClick` to use parameterized URL: `/profile/${userData.uid}`
- Maintains same user experience with improved URL structure

**3. Simplified Main Profile Page (`app/profile/page.tsx`)**:
- Removed URL parameter logic and search params handling
- Always shows current logged-in user's profile
- Simplified component logic and removed unnecessary imports
- Cleaner, more focused component for personal profile viewing

**Key Features**:
- **Clear URL Structure**: 
  - `/profile` → Current user's profile
  - `/profile/{uid}` → Specific user's profile
- **Proper Navigation**: Back button when viewing other users
- **Error Handling**: 404-style page for non-existent users
- **Consistent Experience**: Same data display across both profile types
- **SEO Friendly**: Clean, parameterized URLs

**Navigation Flow**:
1. **Admin → User Card Click** → `/profile/{uid}` (other user's profile)
2. **Navigation Bar → Profile** → `/profile` (own profile)
3. **Direct URL Access** → Proper routing based on URL structure

### Dependency and Compilation Fixes (December 2024)

**Issue Resolved**: Fixed missing dependencies and compilation errors that were preventing the application from running properly.

**Problems Fixed**:

**1. Missing Dependencies**:
- Added missing Radix UI components: `@radix-ui/react-avatar`, `@radix-ui/react-checkbox`, `@radix-ui/react-collapsible`, `@radix-ui/react-context-menu`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-hover-card`, `@radix-ui/react-menubar`, `@radix-ui/react-navigation-menu`, `@radix-ui/react-progress`, `@radix-ui/react-separator`, `@radix-ui/react-switch`, `@radix-ui/react-toggle`, `@radix-ui/react-toggle-group`, `@radix-ui/react-tooltip`, `@radix-ui/react-accordion`, `@radix-ui/react-alert-dialog`, `@radix-ui/react-aspect-ratio`
- Added missing utility libraries: `cmdk`, `embla-carousel-react`, `input-otp`, `next-themes`, `react-hook-form`, `react-resizable-panels`, `recharts`, `sonner`, `vaul`

### Module Resolution Fix - @radix-ui/react-scroll-area (December 2024)

**Problem**: The application was showing a "Module not found" error for `@radix-ui/react-scroll-area` even though it was listed in package.json. The error occurred when trying to import the ScrollArea component in `components/ui/scroll-area.tsx`.

**Error Message**:
```
Error: ./components/ui/scroll-area.tsx:4:1
Module not found: Can't resolve '@radix-ui/react-scroll-area'
```

**Root Cause**: The `@radix-ui/react-scroll-area` package was listed in package.json but was not properly installed in node_modules, likely due to a corrupted or incomplete installation.

**Solution**: Reinstalled all dependencies using `pnpm install` to ensure all packages are properly installed.

**Changes Made**:

**1. Reinstalled Dependencies**:
```bash
pnpm install
```

**2. Verified Installation**:
- Confirmed `@radix-ui/react-scroll-area` was properly installed in `node_modules/@radix-ui/react-scroll-area`
- Verified the package.json showed the correct version (1.2.9)
- Checked that all other Radix UI components were also properly installed

**Key Benefits**:
- **Resolved Module Error**: The ScrollArea component can now be imported without errors
- **Complete Installation**: All dependencies are properly installed and accessible
- **Consistent Environment**: Development server now starts without module resolution errors
- **Future Prevention**: Proper dependency management prevents similar issues

**Technical Details**:
- Used `pnpm install` to reinstall all dependencies from package-lock.json
- The installation process downloaded and installed 75 packages
- All Radix UI components are now properly available for import
- Development server starts successfully on port 3001

**Files Affected**:
- `node_modules/@radix-ui/react-scroll-area` - Now properly installed
- All components using ScrollArea (tag-input, etc.) - Now work correctly

**Verification Process**:
1. **Installation Test**: Confirmed `@radix-ui/react-scroll-area` is in node_modules
2. **Import Test**: Verified ScrollArea can be imported in components
3. **Server Test**: Confirmed development server starts without errors
4. **Component Test**: Verified tag-input component works with ScrollArea

**Result**: The application now runs successfully without module resolution errors, and all UI components using ScrollArea function properly.

**2. Department Field References**:
- Fixed `app/admin/populate-data/page.tsx` to remove department field references
- Fixed `components/lamination-billing-table.tsx` to remove department field display
- Fixed `scripts/populate-dummy-data.ts` to remove department parameter from addTestUser function
- Updated all interfaces to match the current User structure

**3. Database Method Compatibility**:
- Updated populate-data page to use correct dummy database methods
- Fixed PrintJob interface usage with all required fields
- Removed references to non-existent BillingRecord interface
- Used proper dummy database reset method

**4. TypeScript Compilation**:
- Resolved all TypeScript compilation errors
- Fixed interface mismatches
- Updated component imports and exports

**Key Changes**:
- **Dependencies**: Added 20+ missing packages for UI components
- **Data Structure**: Aligned all components with current User interface
- **Database Methods**: Used correct dummy database API
- **Type Safety**: Fixed all TypeScript compilation issues

**Result**: Application now compiles and runs without errors, with all features working properly.

### Department Field Removal (December 2024)

**Feature Removed**: Removed the department (τμήμα) field from all user data structures and interfaces.

**Changes Made**:

**1. Updated User Interface (`lib/dummy-database.ts`)**:
- Removed `department` field from User interface
- Removed `department` field from PrintJob, LaminationJob, PrintBilling, and LaminationBilling interfaces
- Updated sample data generation to exclude department assignments
- Updated job creation logic to remove department references

**2. Updated Admin User Creation (`app/admin/page.tsx`)**:
- Removed department field from user creation form
- Updated user creation logic to exclude department assignment
- Removed department from search filtering
- Updated user selection dropdowns to show only username instead of "department - username"

**3. Updated Admin Users Tab (`components/admin-users-tab.tsx`)**:
- Removed department display from user cards
- Updated card description to show only user role and team information

**Key Implementation Details**:
- All department references have been completely removed from the data model
- User cards now display: User Role • Team (if applicable)
- Search functionality now only searches by display name and username
- User selection dropdowns show: Display Name (Username)

### Team Field Implementation (December 2024)

**Feature Added**: Implemented a team field for individual users (Άτομο role) with filtering capabilities in the admin interface.

**Changes Made**:

**1. Updated User Interface (`lib/dummy-database.ts`)**:
- Added `team` field to User interface with predefined team options
- Updated sample data generation to include team assignments for individual users
- Teams: Ενωμένοι, Σποριάδες, Καρποφόροι, Ολόφωτοι, Νικητές, Νικηφόροι, Φλόγα, Σύμψυχοι

**2. Enhanced Admin User Creation (`app/admin/page.tsx`)**:
- Added team dropdown field that appears only when user role is "Άτομο"
- Updated user creation logic to include team assignment
- Added team filter state and filtering logic

**3. Updated Admin Users Tab (`components/admin-users-tab.tsx`)**:
- Added team filter dropdown that shows when "Όλοι" or "Άτομο" is selected in role filter
- Updated user cards to display team information
- Enhanced filtering logic to support team-based filtering

**Key Implementation Details**:
- Team field is only available for users with "Άτομο" role
- Team filter only appears when filtering by "Όλοι" or "Άτομο" roles
- Team information is displayed in user cards with blue highlighting
- Sample data includes team assignments for demonstration

**Usage**:
1. In admin panel, when creating a new user with role "Άτομο", a team dropdown appears
2. In users tab, team filter dropdown appears when "Όλοι" or "Άτομο" is selected in role filter
3. Users can filter by specific teams to see only users from that team
4. Team information is visible in user cards for easy identification

### Money Calculation Precision Fix (December 2024)

### Money Calculation Precision Fix (December 2024)

**Problem**: Users reported that money calculations could overflow by 1 cent due to floating-point precision errors in JavaScript and Python. The issue occurred when multiple small decimal values were added together or when calculations involved multiplication and division, leading to values like 10.999999999999998 instead of 11.00.

**Root Cause**: JavaScript and Python use floating-point arithmetic which can introduce precision errors, especially when dealing with decimal numbers. Common operations like:
- `0.1 + 0.2` can result in `0.30000000000000004`
- `10.1 * 3` can result in `30.299999999999997`
- Multiple additions of small values can accumulate precision errors

**Solution**: Implemented comprehensive money calculation utilities that ensure all monetary values are properly rounded to 2 decimal places using consistent methods.

**Changes Made**:

**1. Created Money Utility Functions (`lib/utils.ts`)**:
```typescript
/**
 * Rounds a number to exactly 2 decimal places for money calculations.
 * This prevents floating-point precision errors that can cause 1 cent overflows.
 */
export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

/**
 * Adds multiple money values together with proper rounding.
 */
export function addMoney(...values: number[]): number {
  const sum = values.reduce((acc, val) => acc + val, 0)
  return roundMoney(sum)
}

/**
 * Multiplies a money value by a quantity with proper rounding.
 */
export function multiplyMoney(price: number, quantity: number): number {
  return roundMoney(price * quantity)
}

/**
 * Subtracts one money value from another with proper rounding.
 */
export function subtractMoney(total: number, paid: number): number {
  return roundMoney(total - paid)
}

/**
 * Formats a money value for display with proper Greek formatting.
 */
export function formatMoney(value: number): string {
  return `€${roundMoney(value).toFixed(2).replace('.', ',')}`
}

/**
 * Calculates the total cost for a print job with proper rounding.
 */
export function calculatePrintJobTotal(costs: {
  costA4BW: number
  costA4Color: number
  costA3BW: number
  costA3Color: number
  costRizocharto: number
  costChartoni: number
  costAutokollito: number
}): number {
  return addMoney(
    costs.costA4BW,
    costs.costA4Color,
    costs.costA3BW,
    costs.costA3Color,
    costs.costRizocharto,
    costs.costChartoni,
    costs.costAutokollito
  )
}

/**
 * Calculates individual costs for print job components with proper rounding.
 */
export function calculatePrintCost(pages: number, pricePerPage: number): number {
  return multiplyMoney(pricePerPage, pages)
}
```

**2. Updated Dummy Database (`lib/dummy-database.ts`)**:
- **Import Money Utilities**: Added imports for money calculation functions
- **Print Job Cost Calculation**: Replaced direct multiplication with `calculatePrintCost()` function
- **Total Cost Calculation**: Replaced direct addition with `calculatePrintJobTotal()` function
- **Lamination Job Cost**: Replaced direct multiplication with `multiplyMoney()` function
- **Billing Records**: Used `roundMoney()` for all cost aggregations and remaining balance calculations

```typescript
// Before: Direct multiplication (prone to precision errors)
printJob.costA4BW = printJob.pagesA4BW * (prices.a4BW || 0);
printJob.totalCost = printJob.costA4BW + printJob.costA4Color + ...;

// After: Proper money calculations
printJob.costA4BW = calculatePrintCost(printJob.pagesA4BW, prices.a4BW || 0);
printJob.totalCost = calculatePrintJobTotal({
  costA4BW: printJob.costA4BW,
  costA4Color: printJob.costA4Color,
  // ... other costs
});
```

**3. Updated Admin Page (`app/admin/page.tsx`)**:
- **Import Money Utilities**: Added imports for `multiplyMoney` and `roundMoney`
- **Lamination Charge Calculation**: Replaced direct multiplication with `multiplyMoney()` function
- **Removed Number.parseFloat()**: Eliminated unnecessary `Number.parseFloat(totalCost.toFixed(2))` calls

```typescript
// Before: Direct multiplication with manual rounding
const totalCost = Number.parseInt(quantity) * pricePerUnit;
totalCost: Number.parseFloat(totalCost.toFixed(2)),

// After: Proper money calculation
const totalCost = multiplyMoney(pricePerUnit, Number.parseInt(quantity));
totalCost,
```

**4. Updated Admin Users Tab (`components/admin-users-tab.tsx`)**:
- **Import Money Utilities**: Added import for `roundMoney`
- **Total Unpaid Calculation**: Replaced manual rounding with `roundMoney()` function

```typescript
// Before: Manual rounding with Number.EPSILON
{formatPrice(Math.round((printUnpaid + laminationUnpaid + Number.EPSILON) * 100) / 100)}

// After: Proper money calculation
{formatPrice(roundMoney(printUnpaid + laminationUnpaid))}
```

**5. Updated Python Data Collection (`python/collect.py`)**:
- **Consistent Rounding**: Changed all cost calculations from 3 decimal places to 2 decimal places
- **Fixed Indentation**: Corrected indentation issues in the pricing section

```python
# Before: 3 decimal places (unnecessary precision)
'costA4BW': round(cost_a4_bw, 3),

# After: 2 decimal places (proper money precision)
'costA4BW': round(cost_a4_bw, 2),
```

**Key Benefits**:
- **Prevents 1 Cent Overflows**: All money calculations now use consistent 2-decimal place rounding
- **Eliminates Precision Errors**: Floating-point arithmetic errors are handled properly
- **Consistent Display**: All monetary values display exactly 2 decimal places
- **Maintainable Code**: Centralized money calculation logic in utility functions
- **Type Safety**: Full TypeScript support with proper type definitions
- **Cross-Platform Consistency**: Both JavaScript and Python use consistent rounding methods

**Technical Implementation**:
- **Number.EPSILON**: Used to handle edge cases in floating-point arithmetic
- **Math.round()**: Ensures proper rounding to nearest cent
- **Consistent Precision**: All monetary values stored and calculated with 2 decimal places
- **Utility Functions**: Centralized logic prevents code duplication and ensures consistency
- **Greek Formatting**: Maintains proper Greek currency display format (€X,XX)

**Testing Considerations**:
- Verify that `0.1 + 0.2` now equals `0.30` exactly
- Test edge cases like `10.999999999999998` becoming `11.00`
- Ensure all cost calculations in tables display correct values
- Verify that billing totals are accurate without 1 cent discrepancies
- Test that export functionality maintains proper precision

**Usage Pattern**:
1. **For Individual Costs**: Use `calculatePrintCost(pages, pricePerPage)`
2. **For Total Costs**: Use `calculatePrintJobTotal(costObject)`
3. **For Simple Multiplication**: Use `multiplyMoney(price, quantity)`
4. **For Addition**: Use `addMoney(value1, value2, value3, ...)`
5. **For Subtraction**: Use `subtractMoney(total, paid)`
6. **For Display**: Use `formatMoney(value)` for Greek formatting
7. **For General Rounding**: Use `roundMoney(value)` for any monetary value

**Future Considerations**:
- Consider implementing decimal.js or similar library for even more precise calculations
- Add validation to ensure all monetary inputs use proper utility functions
- Consider adding unit tests specifically for money calculation edge cases
- Monitor for any remaining precision issues in complex calculations

This fix ensures that all monetary calculations throughout the application are precise and consistent, eliminating the 1 cent overflow issue that users were experiencing.

### Vercel Deployment Setup (December 2024)

**Problem**: Project needed to be prepared for Vercel deployment with proper configuration and documentation.

**Solution**: Created comprehensive Vercel deployment setup with configuration files, environment templates, and deployment guides.

**Changes Made**:

**1. Vercel Configuration (`vercel.json`)**:
- **Build Command**: `pnpm build` for proper package manager usage
- **Output Directory**: `.next` for Next.js standard output
- **Framework**: Explicitly set to `nextjs` for optimal handling
- **Install Command**: `pnpm install` for consistent package management
- **Dev Command**: `pnpm dev` for local development
- **Regions**: Set to `iad1` (US East) for optimal performance
- **Function Timeouts**: Set to 30 seconds for API routes
- **Security Headers**: Added X-Content-Type-Options, X-Frame-Options, X-XSS-Protection

**2. Environment Variables Template (`env.example`)**:
- **Firebase Configuration**: All required Firebase environment variables
- **Application Configuration**: App name and version variables
- **Optional Analytics**: Google Analytics and Sentry DSN placeholders
- **Clear Documentation**: Comments explaining each variable's purpose

**3. Deployment Documentation (`DEPLOYMENT.md`)**:
- **Quick Deployment Guide**: Step-by-step instructions for Vercel dashboard deployment
- **CLI Deployment**: Alternative deployment method using Vercel CLI
- **Environment Setup**: Detailed instructions for configuring environment variables
- **Firebase Integration**: Optional Firebase setup instructions
- **Troubleshooting**: Common issues and solutions
- **Performance Optimization**: Vercel-specific optimizations
- **Security Guidelines**: Best practices for secure deployment

**4. Updated README (`README.md`)**:
- **Vercel Deployment Section**: Added comprehensive deployment instructions
- **Quick Start Guide**: Simplified setup process
- **Project Structure**: Updated to reflect current organization
- **Configuration**: Clear environment variable setup instructions
- **Tech Stack**: Updated to include Vercel deployment

**Key Benefits**:
- **Easy Deployment**: One-click deployment to Vercel
- **Proper Configuration**: Optimized settings for Next.js applications
- **Environment Management**: Clear template for environment variables
- **Comprehensive Documentation**: Step-by-step guides for all deployment scenarios
- **Security Best Practices**: Proper security headers and environment variable handling
- **Performance Optimization**: Vercel-specific optimizations for better performance

**Technical Implementation**:
- Used Vercel's recommended configuration for Next.js applications
- Implemented proper security headers for production deployment
- Created environment variable templates for easy setup
- Provided both dashboard and CLI deployment options
- Included troubleshooting and optimization guides

**Files Created/Modified**:
- `vercel.json` - Vercel deployment configuration
- `env.example` - Environment variables template
- `DEPLOYMENT.md` - Comprehensive deployment guide
- `README.md` - Updated with Vercel deployment instructions

**Deployment Process**:
1. **Push to GitHub**: Commit and push all changes
2. **Connect to Vercel**: Import repository in Vercel dashboard
3. **Configure Environment**: Add environment variables from template
4. **Deploy**: Automatic deployment with optimized settings
5. **Monitor**: Use Vercel Analytics and monitoring tools

**Testing Considerations**:
- Verify build process works with `pnpm build`
- Test environment variable configuration
- Check security headers are properly applied
- Verify performance optimizations are working
- Test both preview and production deployments

### Stats Cards Filtering Fix (December 2024)

### Stats Cards Filtering Fix (December 2024)

**Problem**: When users applied filters to the printing and lamination pages, the stats cards (Οφειλόμενα, Συνολικές Εκτυπώσεις/Πλαστικοποιήσεις, Συνολικό Κόστος) continued to show statistics from the original unfiltered data instead of reflecting the filtered results.

**Solution**: Updated the stats card calculations to use the filtered data arrays instead of the original data arrays, ensuring that the statistics accurately reflect the current filter state.

**Changes Made**:

**1. Printing Page (`app/printing/page.tsx`)**:
- **Before**: `totalUnpaid = printBilling.filter(...)` (using original data)
- **After**: `totalUnpaid = filteredPrintBilling.filter(...)` (using filtered data)
- **Before**: `totalJobs = printJobs.length` (using original data)
- **After**: `totalJobs = filteredPrintJobs.length` (using filtered data)
- **Before**: `totalCost = printJobs.reduce(...)` (using original data)
- **After**: `totalCost = filteredPrintJobs.reduce(...)` (using filtered data)

**2. Lamination Page (`app/lamination/page.tsx`)**:
- **Before**: `totalUnpaid = laminationBilling.filter(...)` (using original data)
- **After**: `totalUnpaid = filteredLaminationBilling.filter(...)` (using filtered data)
- **Before**: `totalJobs = laminationJobs.length` (using original data)
- **After**: `totalJobs = filteredLaminationJobs.length` (using filtered data)
- **Before**: `totalCost = laminationJobs.reduce(...)` (using original data)
- **After**: `totalCost = filteredLaminationJobs.reduce(...)` (using filtered data)

**3. Dashboard Page (`app/dashboard/page.tsx`)**:
- **Before**: Used `printBilling` and `laminationBilling` for debt calculations
- **After**: Used `filteredPrintBilling` and `filteredLaminationBilling` for debt calculations
- **Before**: Used `printJobs` and `laminationJobs` for current month calculations
- **After**: Used `filteredPrintJobs` and `filteredLaminationJobs` for current month calculations

**Key Benefits**:
- **Accurate Statistics**: Stats cards now accurately reflect the filtered data
- **Consistent User Experience**: Users see statistics that match their current filter selections
- **Real-time Updates**: Statistics update immediately when filters are applied or changed
- **Better Data Analysis**: Users can analyze specific subsets of data with corresponding statistics

**Technical Implementation**:
- Used existing filtered data arrays that are already maintained by the filtering system
- No additional state management required
- Maintained existing calculation logic, only changed data source
- Preserved all existing functionality and UI components

**Files Modified**:
- `app/printing/page.tsx` - Updated stats calculations to use filtered data
- `app/lamination/page.tsx` - Updated stats calculations to use filtered data
- `app/dashboard/page.tsx` - Updated debt calculations to use filtered data

**Testing Considerations**:
- Verify that stats update when search terms are applied
- Verify that stats update when date filters are applied
- Verify that stats update when status filters are applied
- Verify that stats update when custom filters are applied
- Verify that stats reset correctly when filters are cleared

### Dashboard Statistics Cards Implementation (December 2024)

**Problem**: Users requested to add statistics cards underneath the jobs tables in the dashboard page to display detailed breakdowns of print and lamination statistics by device/machine type.

**Solution**: Successfully implemented comprehensive statistics cards that display detailed breakdowns for both printing and lamination operations, following the existing card design patterns.

**Changes Made**:

**1. Print Statistics Cards**:
- **Canon B/W Section**: Shows A4 B/W statistics
- **Canon Color Section**: Shows A4 B/W, A4 Colour, A3 B/W, A3 Colour with subtotals for A4 Total, A3 Total, and overall Total
- **Brother Section**: Shows A4 B/W statistics
- **Overall Total Section**: Shows total print count across all devices

**2. Lamination Statistics Cards**:
- **Πλαστικοποιητής Section**: Shows A3, A4, A5, and Κάρτες statistics
- **Βιβλιοδεσία Section**: Shows Σπιράλ, Χρωματιστά Χαρτόνια, and Πλαστικό Κάλυμμα statistics

**3. Technical Implementation**:
- **Data Calculation Functions**: Created `calculatePrintStatistics()` and `calculateLaminationStatistics()` functions
- **Filtered Data Support**: Statistics are calculated based on filtered data, respecting current search and filter criteria
- **Real-time Updates**: Statistics update automatically when filters are applied or data changes
- **Consistent Styling**: Used existing card design patterns with appropriate color schemes (blue for printing, green for lamination)

**4. Card Design Features**:
- **Responsive Layout**: Grid layouts that adapt to different screen sizes
- **Color-coded Sections**: Different color schemes for different device types
- **Hierarchical Information**: Main statistics with subtotals and totals
- **Consistent Icons**: Used appropriate icons (Printer, CreditCard, BarChart3) for each section
- **Typography Hierarchy**: Different font sizes for different levels of information

**Key Features**:
- **Real-time Statistics**: All statistics update based on current filtered data
- **Device-specific Breakdowns**: Separate sections for each printer type (Canon B/W, Canon Color, Brother)
- **Machine-specific Breakdowns**: Separate sections for lamination types (Πλαστικοποιητής, Βιβλιοδεσία)
- **Subtotal Calculations**: Automatic calculation of subtotals and totals
- **Consistent UI**: Matches existing dashboard card design patterns
- **Responsive Design**: Works well on different screen sizes

**Technical Implementation**:
- Used existing filtered data arrays (`filteredPrintJobs`, `filteredLaminationJobs`)
- Implemented calculation functions that iterate through filtered data
- Used existing UI components (Card, CardHeader, CardContent, CardTitle)
- Maintained consistent color schemes and styling patterns
- Added proper spacing and layout using Tailwind CSS classes

**Files Modified**:
- `app/dashboard/page.tsx` - Added statistics calculation functions and card components

**Benefits**:
- **Enhanced Data Visibility**: Users can quickly see detailed breakdowns of their print and lamination usage
- **Device Performance Tracking**: Easy to see which devices are being used most
- **Filtered Insights**: Statistics respect current filter settings for contextual analysis
- **Consistent Experience**: Maintains the same visual design as the rest of the dashboard
- **Real-time Updates**: Statistics update automatically as data changes

**Future Considerations**:
- Consider adding cost calculations to statistics cards
- Implement trend analysis over time periods
- Add export functionality for statistics data
- Consider adding charts or graphs for visual representation
- Implement user-specific statistics for non-admin users

### New Print Types Addition (December 2024)

### New Print Types Addition (December 2024)

**Problem**: Users requested to add three new print types to the system: Ριζόχαρτο (€0.10), Χαρτόνι (€0.10), and Αυτοκόλλητο (€0.10) across all parts of the application including data models, UI components, filters, tables, and pricing management.

**Solution**: Successfully added the three new print types throughout the entire application while maintaining consistency with existing patterns and functionality.

**Changes Made**:

**1. Data Model Updates**:
- **PrintJob Interface**: Added `pagesRizocharto`, `pagesChartoni`, `pagesAutokollito` fields and corresponding cost fields
- **PrintBilling Interface**: Added `totalRizocharto`, `totalChartoni`, `totalAutokollito` fields for billing aggregation
- **PriceTable Interface**: Added `rizocharto`, `chartoni`, `autokollito` pricing fields
- **Dummy Database**: Updated sample data generation to include realistic quantities for new print types
- **Cost Calculations**: Updated all cost calculation logic to include the new print types

**2. UI Component Updates**:
- **Print Filters**: Added new print type options to the filter dropdown
- **Print Jobs Table**: Updated `expandPrintJob` function to display new print types as separate rows
- **Print Billing Table**: Automatically handles new fields through dynamic field access
- **Dashboard Filtering**: Updated print type filter logic to handle new types
- **Export Functionality**: Updated dashboard export to include new print types

**3. Admin Interface Updates**:
- **Printing Charge Form**: Added new print types to the dropdown with pricing display
- **Type Safety**: Updated TypeScript types to include new print type options
- **Cost Calculation**: Updated charge calculation logic to handle new types

**4. Pricing Management Updates**:
- **Prices Page**: Added new print type cards with editing capabilities
- **Price Editing**: Updated `startEditingPrinting` function to include new fields
- **Default Pricing**: Set all new print types to €0.10 as requested

**5. Python Data Collection Updates**:
- **Job Data Structure**: Added new page count fields to job data parsing
- **Cost Calculation**: Updated Python cost calculation to include new print types
- **Default Pricing**: Added new print types to default pricing structure
- **Error Handling**: Updated error handling to include new cost fields

**Key Features**:
- **Consistent Pricing**: All new print types priced at €0.10 as requested
- **Full Integration**: New types work across all existing functionality
- **Data Aggregation**: Billing records properly aggregate new print type usage
- **Filtering Support**: Users can filter by new print types in all tables
- **Export Support**: New print types included in all data exports
- **Admin Management**: Admins can add charges for new print types
- **Price Management**: New print types can be priced and edited in admin interface

**Technical Implementation**:
- Used consistent naming convention: `pagesRizocharto`, `pagesChartoni`, `pagesAutokollito`
- Maintained existing data structure patterns and field naming
- Updated all cost calculation logic to include new types
- Preserved existing functionality while adding new capabilities
- Used TypeScript for type safety throughout the application

**Files Modified**:
- `lib/dummy-database.ts` - Updated interfaces, pricing, and sample data generation
- `lib/data-store.ts` - Updated interfaces for consistency
- `components/print-filters.tsx` - Added new filter options
- `components/print-jobs-table.tsx` - Updated job expansion logic
- `app/dashboard/page.tsx` - Updated filtering and export logic
- `app/admin/page.tsx` - Updated printing charge form
- `app/prices/page.tsx` - Added new print type pricing cards
- `python/collect.py` - Updated data collection and cost calculation

**Benefits**:
- **Enhanced Service Offering**: Users can now track and bill for additional print types
- **Consistent Experience**: New types work seamlessly with existing functionality
- **Proper Billing**: All new print types are properly tracked and billed
- **Admin Control**: Admins can manage pricing and add charges for new types
- **Data Integrity**: All data structures properly handle the new fields

**Future Considerations**:
- Consider adding print type-specific printer capabilities
- Implement print type-specific cost optimization suggestions
- Add print type usage analytics and reporting
- Consider print type-specific user permissions or quotas

### Prices Page Creation and Admin Page Updates (December 2024)

**Problem**: Users requested to move the pricing information from the admin page to a separate dedicated page accessible from the navigation bar, and update the admin page with new tab titles and functionality.

**Solution**: Created a new dedicated prices page and updated the admin page with the requested changes.

**Changes Made**:

**1. Created New Prices Page (`app/prices/page.tsx`)**:
- **Dedicated Pricing Interface**: Moved all pricing functionality from admin settings tab to a new standalone page
- **Admin-Only Access**: Protected route requiring admin privileges
- **Complete Price Management**: Full editing capabilities for both printing and lamination prices
- **Consistent Styling**: Maintained the same visual design and functionality as the original admin settings
- **Navigation Integration**: Added to main navigation bar between "Διαχείριση" and "Προφίλ"

**2. Updated Navigation Component (`components/navigation.tsx`)**:
- **Added Prices Link**: New navigation item "Τιμές" with Settings icon
- **Admin-Only Visibility**: Only visible to users with admin access level
- **Proper Positioning**: Placed between "Διαχείριση" and "Προφίλ" as requested

**3. Updated Admin Page (`app/admin/page.tsx`)**:
- **Tab Title Changes**: 
  - "Χρήστες" tab now has yellow styling (was blue)
  - Added new "Χρέωση ΤΟ. ΦΩ." tab with blue styling and Printer icon
  - "Πλαστικοποιήσεις" renamed to "Χρέωση ΠΛΑ. ΤΟ." with green styling
  - "Τιμές" tab now shows redirect message to new prices page
- **New Printing Charge Tab**: Added complete form for adding printing charges to users
- **Updated Grid Layout**: Changed from 3-column to 4-column grid to accommodate new tab
- **Form Functionality**: New printing charge form with user selection, date picker, print type selection, and quantity input
- **State Management**: Added `printingType` state variable for print type selection

**4. Enhanced Tab Structure**:
```tsx
<TabsList className="grid w-full grid-cols-4 bg-white mb-8 p-2 h-16">
  <TabsTrigger value="users" className="... data-[state=active]:border-yellow-500 data-[state=active]:text-yellow-700">
    <Users className="h-5 w-5" />
    Χρήστες
  </TabsTrigger>
  <TabsTrigger value="printing" className="... data-[state=active]:border-blue-500 data-[state=active]:text-blue-700">
    <Printer className="h-5 w-5" />
    Χρέωση ΤΟ. ΦΩ.
  </TabsTrigger>
  <TabsTrigger value="lamination" className="... data-[state=active]:border-green-500 data-[state=active]:text-green-700">
    <CreditCard className="h-5 w-5" />
    Χρέωση ΠΛΑ. ΤΟ.
  </TabsTrigger>
  <TabsTrigger value="settings" className="... data-[state=active]:border-yellow-500 data-[state=active]:text-yellow-700">
    <Settings className="h-5 w-5" />
    Τιμές
  </TabsTrigger>
</TabsList>
```

**5. New Printing Charge Form**:
- **User Selection**: SearchableSelect component for choosing users
- **Date Picker**: GreekDatePicker for selecting charge date
- **Print Type Selection**: Dropdown with all print types (A4 BW, A4 Color, A3 BW, A3 Color) showing current prices
- **Quantity Input**: Number input for specifying quantity
- **Total Cost Calculation**: Real-time calculation showing total cost
- **Submit Button**: Blue-themed button for adding printing charges
- **Reset Functionality**: Reset button to clear form fields

**6. Settings Tab Redirection**:
- **Information Card**: Yellow-themed card explaining that prices have been moved
- **Clear Guidance**: Directs users to the new "Τιμές" page for price management
- **Maintained Access**: Still accessible but clearly indicates the new location

**Benefits Achieved**:
- **Better Organization**: Pricing management is now in a dedicated, focused page
- **Improved Navigation**: Clear separation between admin functions and pricing
- **Enhanced Functionality**: New printing charge capability alongside existing lamination charges
- **Consistent UX**: All charge forms follow the same design patterns
- **Proper Access Control**: Prices page is admin-only, maintaining security
- **Visual Clarity**: Color-coded tabs make different functions easily distinguishable

**Key Features**:
1. **Dedicated Prices Page**: Complete price management interface accessible from navigation
2. **New Printing Charges**: Full form for adding printing charges to users
3. **Updated Tab Styling**: Yellow users tab, blue printing tab, green lamination tab
4. **Consistent Form Design**: All charge forms follow the same patterns and styling
5. **Real-time Cost Calculation**: Shows total cost as user changes type and quantity
6. **Form Persistence**: Forms maintain values after submission for convenience
7. **Reset Functionality**: Reset buttons for clearing forms when needed

**Files Modified**:
- `app/prices/page.tsx` - New dedicated prices page
- `components/navigation.tsx` - Added prices navigation link
- `app/admin/page.tsx` - Updated tabs, added printing charge form, updated styling

**Technical Implementation**:
- Used existing price editing logic from admin settings
- Maintained all existing functionality and styling
- Added proper state management for new printing type selection
- Integrated with existing dummy database and toast notification systems
- Preserved all existing form validation and error handling

**Future Considerations**:
- Consider adding bulk charge functionality for multiple users
- Implement charge templates for common scenarios
- Add charge history and audit trail
- Consider adding charge approval workflows

### Admin Page Τιμές Tab Removal (December 2024)

**Problem**: The admin page contained a "Τιμές" (Prices) tab that was redundant since pricing management had been moved to a dedicated prices page accessible from the navigation bar. This tab was no longer needed and was cluttering the admin interface.

**Solution**: Removed the "Τιμές" tab from the admin page while preserving all other admin functionality.

**Changes Made**:

**1. Updated Admin Page (`app/admin/page.tsx`)**:
- **Removed Τιμές Tab**: Eliminated the "Τιμές" tab trigger from the tab list
- **Removed Settings Content**: Deleted the entire TabsContent section for the settings tab
- **Updated Grid Layout**: Changed from 4-column to 3-column grid layout
- **Cleaned Up Imports**: Removed unused `Settings` icon import
- **Removed Price Editing Functions**: Deleted all price editing state variables and functions that were no longer needed:
  - `editingPrices` state
  - `isEditingPrinting` and `isEditingLamination` state
  - `startEditingPrinting`, `startEditingLamination` functions
  - `savePrintingPrices`, `saveLaminationPrices` functions
  - `cancelEditingPrinting`, `cancelEditingLamination` functions

**Benefits Achieved**:
- **Cleaner Interface**: Admin page now focuses on core management tasks
- **Reduced Complexity**: Removed redundant functionality that exists elsewhere
- **Better Organization**: Pricing management is properly separated to dedicated page
- **Improved Performance**: Reduced unused code and state variables
- **Consistent UX**: Admin page now has a more focused purpose

**Key Features Preserved**:
1. **User Management**: Create, edit, and manage user accounts
2. **Printing Charges**: Add manual printing charges to user accounts
3. **Lamination Charges**: Add manual lamination charges to user accounts
4. **Data Export**: Export user data to Excel format
5. **All Filtering**: User search, role filtering, and price range filtering
6. **Form Functionality**: All charge forms work exactly as before

**Files Modified**:
- `app/admin/page.tsx` - Removed Τιμές tab, cleaned up unused code

**Technical Implementation**:
- Removed the settings tab trigger and content
- Updated grid layout from 4 to 3 columns
- Cleaned up unused imports and functions
- Maintained all existing admin functionality
- No impact on data models or other components

**Current Tab Structure**:
```tsx
<TabsList className="grid w-full grid-cols-3 bg-white mb-8 p-2 h-16">
  <TabsTrigger value="users" className="... data-[state=active]:border-yellow-500">
    <Users className="h-5 w-5" />
    Χρήστες
  </TabsTrigger>
  <TabsTrigger value="printing" className="... data-[state=active]:border-blue-500">
    <Printer className="h-5 w-5" />
    Χρέωση ΤΟ. ΦΩ.
  </TabsTrigger>
  <TabsTrigger value="lamination" className="... data-[state=active]:border-green-500">
    <CreditCard className="h-5 w-5" />
    Χρέωση ΠΛΑ. ΤΟ.
  </TabsTrigger>
</TabsList>
```

### Admin Page Reset Data Button Removal (December 2024)

**Problem**: The admin page contained a "Επαναφορά Δεδομένων" (Reset Data) button that could potentially cause data loss if accidentally clicked. This button was not essential for normal admin operations and posed a risk to data integrity.

**Solution**: Removed the reset data button and its associated functionality from the admin page while preserving all other admin features.

**Changes Made**:

**1. Updated Admin Page (`app/admin/page.tsx`)**:
- **Removed Reset Button**: Eliminated the "Επαναφορά Δεδομένων" button from the page header
- **Removed Handler Function**: Deleted the `handleResetData` function that was no longer needed
- **Preserved Other Features**: Kept all other admin functionality intact including user management, lamination charges, and price settings
- **Maintained Imports**: Kept `RotateCcw` import as it's still used for the lamination form reset button

**Benefits Achieved**:
- **Improved Data Safety**: Eliminated risk of accidental data reset
- **Cleaner Interface**: Removed potentially dangerous functionality from main admin interface
- **Better UX**: Admin page focuses on essential management tasks
- **Maintained Functionality**: All core admin features remain available
- **Preserved Form Reset**: Lamination form reset button still works for convenience

**Key Features Preserved**:
1. **User Management**: Create, edit, and manage user accounts
2. **Lamination Charges**: Add manual lamination charges to user accounts
3. **Price Management**: Set and update pricing for printing and lamination services
4. **Data Export**: Export user data to Excel format
5. **Form Reset**: Lamination form reset functionality for convenience
6. **All Filtering**: User search, role filtering, and price range filtering

**Files Modified**:
- `app/admin/page.tsx` - Removed reset data button and handler function

**Technical Implementation**:
- Removed the reset button from the page header
- Deleted the `handleResetData` function
- Maintained all other admin functionality
- Preserved the `RotateCcw` import for lamination form reset
- No impact on data models or other components

### Email Data Removal (December 2024)

### Email Data Removal (December 2024)

**Problem**: The application was storing and displaying email addresses for users, but this information was not essential for the core printing management functionality and could be removed to simplify the data model and user interface.

**Solution**: Removed email as a data field from all parts of the application while maintaining all core functionality.

**Changes Made**:

**1. Updated Data Models**:
- **User Interface (`lib/dummy-database.ts`)**: Removed `email?: string` field from User interface
- **Data Store (`lib/data-store.ts`)**: User interface already didn't include email field
- **Dummy Data**: Removed email generation from dummy user creation

**2. Updated Admin Interface (`app/admin/page.tsx`)**:
- **User Creation Form**: Removed email input field from new user creation dialog
- **User Search**: Removed email from search filter criteria
- **User Export**: Removed email column from Excel export
- **User State**: Removed email from newUser state object

**3. Updated Profile Page (`app/profile/page.tsx`)**:
- **User Display**: Removed email display section from user profile
- **Fixed Role Badge**: Corrected property name from `role` to `accessLevel` for RoleBadge component

**4. Updated Admin Users Tab (`components/admin-users-tab.tsx`)**:
- **User Cards**: Removed email display from user information cards
- **Cleaner Interface**: Simplified user card layout

**5. Updated Scripts (`scripts/populate-dummy-data.ts`)**:
- **Dummy Data**: Removed email generation from test user creation

**6. Updated Documentation**:
- **Plan.md**: Updated authentication description from "email/password" to "username/password"
- **Documentation.md**: Updated authentication references
- **README.md**: Updated setup instructions
- **Lessons.md**: Updated user information description

**Benefits Achieved**:
- **Simplified Data Model**: Removed unnecessary email field from user data
- **Cleaner Interface**: Less cluttered user forms and displays
- **Reduced Complexity**: Fewer fields to manage in user creation and editing
- **Maintained Functionality**: All core printing management features remain intact
- **Consistent Authentication**: System uses username-based authentication throughout

**Key Features Preserved**:
1. **User Authentication**: Username/password login system
2. **User Management**: Create, edit, and manage user accounts
3. **Role-Based Access**: Admin and user roles with proper permissions
4. **Printing Management**: All print job tracking and billing features
5. **Lamination Management**: All lamination job tracking and billing features
6. **Data Export**: Excel export functionality (without email column)
7. **User Profile**: Display of essential user information

**Files Modified**:
- `lib/dummy-database.ts` - Removed email from User interface and dummy data
- `app/admin/page.tsx` - Removed email from forms, search, and export
- `app/profile/page.tsx` - Removed email display and fixed role badge
- `components/admin-users-tab.tsx` - Removed email from user cards
- `scripts/populate-dummy-data.ts` - Removed email from test user creation
- `plan.md` - Updated authentication description
- `documentation.md` - Updated authentication references
- `README.md` - Updated setup instructions
- `lessons.md` - Updated user information description

**Technical Implementation**:
- Removed email field from all User interfaces
- Updated all user creation and editing forms
- Removed email from search and filter functionality
- Updated data export to exclude email column
- Maintained all existing authentication and authorization logic
- Preserved all printing and lamination management features

### Admin Page User Cards Simplification (December 2024)

**Problem**: The admin page user cards contained a statistics section that was not essential for the main admin functionality and made the cards more cluttered. The admin/user role indication was already properly handled with badges in the top right corner.

**Solution**: Removed the statistics section from user cards while keeping the admin/user badges for role indication.

**Changes Made**:

**1. Updated AdminUsersTab Component (`components/admin-users-tab.tsx`)**:
- **Removed Statistics Section**: Eliminated the "Στατιστικά" (Statistics) section that showed print and lamination job counts
- **Kept Role Badges**: Maintained the admin/user badges in the top right corner of each card
- **Cleaned Up Code**: Removed unused variables (`printJobs`, `laminationJobs`) that were only used for statistics
- **Preserved Core Functionality**: Kept all debt information and user details intact

**Benefits Achieved**:
- **Cleaner Interface**: User cards are now more focused and less cluttered
- **Better Performance**: Reduced unnecessary data fetching for statistics
- **Improved UX**: Cards show only essential information (user details, debts, role)
- **Consistent Design**: Role indication is handled consistently through badges
- **Maintained Functionality**: All core admin features remain intact

**Key Features Preserved**:
1. **Role Badges**: Admin/User badges in top right corner
2. **User Information**: Username, department, role
3. **Debt Information**: Print and lamination debts with totals
4. **Responsible Person**: For team/church/area roles
5. **Filtering**: All existing filter functionality maintained

**Files Modified**:
- `components/admin-users-tab.tsx` - Removed statistics section and cleaned up unused variables

**Technical Implementation**:
- Removed statistics section JSX code
- Eliminated unused `printJobs` and `laminationJobs` variables
- Maintained all existing card structure and styling
- Preserved badge-based role indication system
- Kept all debt calculation and display logic intact

### Enhanced Greek Date Picker Component (December 2024)

### Enhanced Greek Date Picker Component (December 2024)

**Problem**: The existing date filter interface used basic HTML date inputs that were not user-friendly and lacked quick navigation features. Users wanted a more intuitive date selection experience with faster month/year navigation.

**Solution**: Enhanced the Greek date picker component to provide a better user experience with icon-based interface and improved navigation.

**Changes Made**:

**1. Updated GreekDatePicker Component (`components/ui/greek-date-picker.tsx`)**:
- **Full-Width Initial Interface**: When no date is selected, shows a full-width button with centered calendar icon
- **Selected Date Display**: When a date is selected, shows the date text with a clear button
- **Quick Month Selection**: Added separate dropdown for month selection with Greek month names
- **Quick Year Selection**: Added separate dropdown for year selection (current year ± 10 years)
- **Improved Navigation**: Month and year can be changed independently for faster navigation
- **Clear Functionality**: Added X button to clear selected date

```typescript
// New interface behavior:
{displayValue ? (
  // Show selected date with clear button
  <div className="flex items-center gap-2 flex-1">
    <Button variant="outline" className="justify-start text-left font-normal flex-1 h-10">
      <Calendar className="mr-2 h-4 w-4" />
      {displayValue}
    </Button>
    <Button variant="ghost" size="icon" onClick={handleClear} className="h-10 w-10">
      <X className="h-4 w-4" />
    </Button>
  </div>
) : (
  // Show full-width button when no date selected
  <Button variant="outline" className="h-10 w-full justify-center">
    <Calendar className="h-4 w-4" />
  </Button>
)}
```



**3. Enhanced Navigation Features**:
- **Month Dropdown**: Quick selection of any month with Greek names
- **Year Dropdown**: Quick selection of any year (current ± 10 years)
- **Independent Control**: Month and year can be changed separately
- **Visual Feedback**: Clear indication of selected date and navigation state

**Benefits Achieved**:
- **Better UX**: More intuitive date selection interface
- **Faster Navigation**: Quick month/year selection without clicking through calendar
- **Space Efficient**: Icon-only display when no date is selected
- **Clear Visual Feedback**: Selected dates are clearly displayed
- **Consistent Styling**: Matches the overall application design
- **Accessibility**: Maintained keyboard navigation and screen reader support

**Key Features**:
1. **Full-Width Initial State**: Full-width button with centered calendar icon when no date is selected
2. **Date Display**: Shows formatted Greek date when selected
3. **Quick Clear**: X button to easily clear selected date
4. **Fast Navigation**: Separate month and year dropdowns
5. **Greek Localization**: All month names in Greek
6. **Responsive Design**: Works well on all screen sizes
7. **Centered Layout**: Month and year dropdowns are horizontally centered
8. **Smart Navigation**: Shows current month initially, selected date's month when date is selected
9. **Consistent Spacing**: Label spacing matches other filter components

**Files Modified**:
- `components/ui/greek-date-picker.tsx` - Enhanced with new interface and navigation
- `components/print-filters.tsx` - Already using GreekDatePicker (benefits automatically)
- `components/lamination-filters.tsx` - Already using GreekDatePicker (benefits automatically)

**Technical Implementation**:
- Uses Popover component for calendar display
- Implements separate state for current month navigation
- Generates month/year options dynamically
- Maintains compatibility with existing date handling logic
- Preserves all existing props and functionality
- Centers dropdowns horizontally for better visual balance
- Smart month navigation: shows current month initially, selected date's month when date is selected
- Consistent spacing: matches type filter label spacing (space-y-1, text-gray-700)

### Dashboard Filter Component Refactoring (December 2024)

**Problem**: The dashboard page (`app/dashboard/page.tsx`) had become very large and complex with inline filter UI components, making it difficult to maintain and reuse filter logic across different parts of the application.

**Solution**: Successfully extracted filter components into reusable, modular components while maintaining all existing functionality and preserving the exact UI/UX.

**Changes Made**:

**1. Created BillingFilters Component (`components/billing-filters.tsx`)**:
- Extracted consolidated billing table filters into a dedicated component
- Maintained all advanced filtering features including price range slider, histogram, and radio buttons
- Preserved yellow theme styling and all interactive elements
- Accepts all necessary state and handlers as props

```typescript
interface BillingFiltersProps {
  billingSearchTerm: string
  setBillingSearchTerm: (v: string) => void
  billingDebtFilter: string
  setBillingDebtFilter: (v: string) => void
  billingAmountFilter: string
  setBillingAmountFilter: (v: string) => void
  billingPriceRange: [number, number]
  setBillingPriceRange: (v: [number, number]) => void
  billingPriceRangeInputs: [string, string]
  setBillingPriceRangeInputs: (v: [string, string]) => void
  billingPriceDistribution: any
  printBilling: any[]
  clearFilters: () => void
}
```

**2. Created PrintFilters Component (`components/print-filters.tsx`)**:
- Extracted print tab-specific filters into a dedicated component
- Maintained blue theme styling and all filter options
- Includes search, date range, device, and print type filters
- Preserves all existing functionality and UI patterns

**3. Created LaminationFilters Component (`components/lamination-filters.tsx`)**:
- Extracted lamination tab-specific filters into a dedicated component
- Maintained green theme styling and dynamic filter options
- Includes search, date range, machine, and lamination type filters
- Preserves conditional filter options based on machine selection

**4. Updated Dashboard Page (`app/dashboard/page.tsx`)**:
- Replaced inline filter JSX with component imports and usage
- Maintained all state management and filter logic in the parent component
- Preserved all existing functionality including export, pagination, and data filtering
- Reduced file size and improved readability significantly

```typescript
// Before: 1300+ lines with inline filter JSX
// After: ~950 lines with clean component usage

<BillingFilters
  billingSearchTerm={billingSearchTerm}
  setBillingSearchTerm={setBillingSearchTerm}
  // ... other props
/>

{activeTab === "printing" ? (
  <PrintFilters
    searchTerm={searchTerm}
    setSearchTerm={setSearchTerm}
    // ... other props
  />
) : (
  <LaminationFilters
    searchTerm={searchTerm}
    setSearchTerm={setSearchTerm}
    // ... other props
  />
)}
```

**Benefits Achieved**:
- **Maintainability**: Filter logic is now centralized in dedicated components
- **Reusability**: Components can be easily reused in other parts of the application
- **Readability**: Dashboard page is much cleaner and easier to understand
- **Testability**: Individual filter components can be tested in isolation
- **Consistency**: Filter UI patterns are now standardized across components
- **Performance**: No impact on functionality or performance

**Key Lessons Learned**:
1. **State Lifting**: Keep state management in the parent component and pass down as props for better control
2. **Component Composition**: Break down complex UI into logical, reusable components
3. **Props Interface**: Define clear, typed interfaces for component props to ensure type safety
4. **Preserve Functionality**: Ensure all existing features work exactly as before during refactoring
5. **Theme Consistency**: Maintain existing color schemes and styling patterns in extracted components

**Files Modified**:
- `app/dashboard/page.tsx` - Updated to use new filter components
- `components/billing-filters.tsx` - New component for billing table filters
- `components/print-filters.tsx` - New component for print tab filters  
- `components/lamination-filters.tsx` - New component for lamination tab filters

### Dashboard Filtering System Enhancement (December 2024)

**Problem**: The dashboard needed improved filtering with tab-specific filters and separate billing table filtering, moving filters underneath tabs and implementing dynamic filtering based on selected tab.

**Solution**: Completely restructured the filtering system to provide context-aware filters and separate billing table filtering.

**Changes Made**:

**1. State Management Updates (`app/dashboard/page.tsx`)**:
- Added tab-specific filtering states for print and lamination
- Added billing table specific filters copied from admin page
- Added active tab tracking for dynamic filter display

```typescript
// Tab-specific filtering states
const [activeTab, setActiveTab] = useState("printing")
const [printTypeFilter, setPrintTypeFilter] = useState("all") // For print type (A4 BW, A4 Color, etc.)
const [machineFilter, setMachineFilter] = useState("all") // For lamination machine (Πλαστικοποίηση, Βιβλιοδεσία)
const [laminationTypeFilter, setLaminationTypeFilter] = useState("all") // For lamination type based on machine

// Billing table specific filters (copied from admin page)
const [billingSearchTerm, setBillingSearchTerm] = useState("")
const [billingDebtFilter, setBillingDebtFilter] = useState("all") // all, print, lamination, both
const [billingAmountFilter, setBillingAmountFilter] = useState("all") // all, under10, 10to50, over50
const [billingPriceRange, setBillingPriceRange] = useState<[number, number]>([0, 100])
const [billingPriceRangeInputs, setBillingPriceRangeInputs] = useState<[string, string]>(["0", "100"])
```

**2. Filtering Logic Updates**:
- Enhanced `applyFilters()` function with tab-specific filtering
- Added billing table specific filtering with price distribution
- Implemented dynamic filter options based on machine selection

```typescript
// Apply print type filter
if (printTypeFilter !== "all") {
  filteredPJ = filteredPJ.filter((item) => {
    switch (printTypeFilter) {
      case "a4BW":
        return item.pagesA4BW > 0
      case "a4Color":
        return item.pagesA4Color > 0
      case "a3BW":
        return item.pagesA3BW > 0
      case "a3Color":
        return item.pagesA3Color > 0
      default:
        return true
    }
  })
}

// Apply machine filter for lamination
if (machineFilter !== "all") {
  filteredLJ = filteredLJ.filter((item) => {
    if (machineFilter === "lamination") {
      return ["A3", "A4", "A5", "cards", "spiral", "colored_cardboard", "plastic_cover"].includes(item.type)
    }
    if (machineFilter === "binding") {
      return ["spiral", "colored_cardboard", "plastic_cover"].includes(item.type)
    }
    return true
  })
}
```

**3. UI Structure Changes**:
- Moved filters underneath tab buttons instead of above
- Removed Χρήστης filter as requested
- Replaced Κατάσταση with Είδος Εκτύπωσης/Πλαστικοποίησης
- Added dynamic filter options based on active tab

```typescript
{/* Tab-specific Filters */}
<div className="mt-4">
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Filter className="h-5 w-5" />
        Φίλτρα {activeTab === "printing" ? "Εκτυπώσεων" : "Πλαστικοποιήσεων"}
      </CardTitle>
    </CardHeader>
    <CardContent>
      {/* Dynamic filters based on active tab */}
      {activeTab === "printing" ? (
        <>
          <div>Εκτυπωτής filter</div>
          <div>Είδος Εκτύπωσης filter</div>
        </>
      ) : (
        <>
          <div>Μηχάνημα filter</div>
          <div>Είδος Πλαστικοποίησης/Βιβλιοδεσίας filter</div>
        </>
      )}
    </CardContent>
  </Card>
</div>
```

**4. Billing Table Filtering**:
- Added separate billing table filters with search, debt status, amount range, and price range
- Implemented price distribution calculation for dynamic range
- Added billing-specific filter logic

```typescript
// Billing table specific filters
<div className="p-4 bg-yellow-50 border-b border-yellow-200">
  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
    <div className="md:col-span-2">
      <Label htmlFor="billingSearch">Αναζήτηση</Label>
      <Input value={billingSearchTerm} onChange={(e) => setBillingSearchTerm(e.target.value)} />
    </div>
    <div>
      <Label htmlFor="billingDebt">Κατάσταση</Label>
      <Select value={billingDebtFilter} onValueChange={setBillingDebtFilter}>
        <SelectContent>
          <SelectItem value="all">Όλες</SelectItem>
          <SelectItem value="paid">Πληρωμένο</SelectItem>
          <SelectItem value="unpaid">Απλήρωτο</SelectItem>
        </SelectContent>
      </Select>
    </div>
    <div>
      <Label htmlFor="billingAmount">Εύρος Ποσού</Label>
      <Select value={billingAmountFilter} onValueChange={setBillingAmountFilter}>
        <SelectContent>
          <SelectItem value="all">Όλα</SelectItem>
          <SelectItem value="under10">Κάτω από €10</SelectItem>
          <SelectItem value="10to50">€10 - €50</SelectItem>
          <SelectItem value="over50">Πάνω από €50</SelectItem>
        </SelectContent>
      </Select>
    </div>
  </div>
</div>
```

**5. Price Distribution Calculation**:
- Added `calculateBillingPriceDistribution()` function for dynamic price ranges
- Implemented automatic price range updates based on data distribution
- Added price range input controls with validation

```typescript
const calculateBillingPriceDistribution = () => {
  const allAmounts: number[] = []
  
  printBilling.forEach((billing) => {
    if (billing.remainingBalance > 0) {
      allAmounts.push(billing.remainingBalance)
    }
  })

  const min = Math.min(...allAmounts)
  const max = Math.max(...allAmounts)
  
  const distribution = {
    "0-20": allAmounts.filter(amount => amount <= 20).length,
    "20-35": allAmounts.filter(amount => amount > 20 && amount <= 35).length,
    "35-90": allAmounts.filter(amount => amount > 35 && amount <= 90).length,
    "90+": allAmounts.filter(amount => amount > 90).length
  }

  return { min, max, distribution }
}
```

**Benefits**:
- **Context-Aware Filtering**: Filters change based on selected tab
- **Improved UX**: Filters are closer to the data they affect
- **Separate Billing Filtering**: Billing table has its own comprehensive filtering
- **Dynamic Options**: Filter options change based on machine selection
- **Better Organization**: Clear separation between different types of filters

**Key Features**:
- Print tab shows: Εκτυπωτής + Είδος Εκτύπωσης filters
- Lamination tab shows: Μηχάνημα + Είδος Πλαστικοποίησης/Βιβλιοδεσίας filters
- Billing table has: Search + Status + Amount Range + Price Range filters
- All filters are cleared with a single reset button
- Real-time filter counts show filtered vs total items

### Dashboard Filter Styling Enhancement (December 2024)

**Problem**: The filters needed visual consistency with their respective sections, using blue styling for print filters, green for lamination filters, and yellow for billing table filters.

**Solution**: Applied color-coded styling to match the section themes and moved billing filters above the card with proper yellow styling.

**Changes Made**:

**1. Tab-Specific Filter Styling**:
- **Print Filters**: Applied blue theme to match "Ιστορικό Εκτυπώσεων" section
- **Lamination Filters**: Applied green theme to match "Ιστορικό Πλαστικοποιήσεων" section
- Added proper color-coded borders, backgrounds, and text colors

```typescript
{/* Print Filters - Blue Theme */}
<div className="bg-blue-50 rounded-lg border border-blue-200 shadow-sm">
  <Card className="border-blue-200">
    <CardHeader className="bg-blue-100">
      <CardTitle className="flex items-center gap-2 text-blue-800">
        <Filter className="h-5 w-5" />
        Φίλτρα Εκτυπώσεων
      </CardTitle>
    </CardHeader>
    <CardContent className="pt-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-blue-50 rounded-lg">
        {/* Blue-themed form elements */}
        <Label className="text-blue-800">Αναζήτηση</Label>
        <Input className="border-blue-200 focus:border-blue-500" />
        <SelectTrigger className="border-blue-200 focus:border-blue-500">
      </div>
    </CardContent>
  </Card>
</div>

{/* Lamination Filters - Green Theme */}
<div className="bg-green-50 rounded-lg border border-green-200 shadow-sm">
  <Card className="border-green-200">
    <CardHeader className="bg-green-100">
      <CardTitle className="flex items-center gap-2 text-green-800">
        <Filter className="h-5 w-5" />
        Φίλτρα Πλαστικοποιήσεων
      </CardTitle>
    </CardHeader>
    {/* Green-themed form elements */}
  </Card>
</div>
```

**2. Billing Table Filter Repositioning and Advanced Features**:
- Moved billing table filters above the card instead of inside
- Applied yellow background only on the title with icon container
- Added comprehensive advanced filtering features from admin page
- Added proper spacing and visual separation

```typescript
{/* Billing Table Filters - Above the card with yellow title only */}
<div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-8">
  {/* Filters section */}
  <div className="p-6 bg-white border-b border-gray-200">
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <div className="bg-yellow-100 p-2 rounded-lg">
          <Filter className="h-5 w-5 text-yellow-700" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">Φίλτρα Συγκεντρωτικού Πίνακα</h3>
      </div>
      <button className="p-2 rounded-full border border-gray-300 bg-white hover:bg-gray-50 transition">
        <RotateCcw className="h-4 w-4 text-gray-500" />
      </button>
    </div>
    
    {/* Basic filters with gray styling */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Label className="text-gray-700">Αναζήτηση</Label>
      <Input className="border-gray-200 focus:border-yellow-500" />
      <SelectTrigger className="border-gray-200 focus:border-yellow-500" />
    </div>
    
    {/* Advanced price range filter with slider and radio buttons */}
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      {/* Manual input fields */}
      <div className="flex justify-center">
        <Input className="w-24 h-9 text-sm border-gray-300 focus:border-yellow-500" />
        <span>€</span>
        <span>-</span>
        <Input className="w-24 h-9 text-sm border-gray-300 focus:border-yellow-500" />
        <span>€</span>
      </div>
      
      {/* Histogram visualization */}
      <div className="flex items-end justify-between h-16 mb-2 px-2">
        {/* Yellow histogram bars showing data distribution */}
      </div>
      
      {/* 2-thumb slider */}
      <Slider
        value={billingPriceRange}
        onValueChange={(value: number[]) => setBillingPriceRange(value as [number, number])}
        min={0}
        max={billingPriceDistribution.max}
        step={0.01}
        className="w-full"
      />
      
      {/* Quick range radio buttons */}
      <RadioGroup className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
        {intervals.map(([start, end], i) => (
          <div className="flex items-center" key={i}>
            <RadioGroupItem value={`${start}-${end}`} id={`billing-range-${i}`} className="sr-only" />
            <Label 
              htmlFor={`billing-range-${i}`} 
              className={`text-sm px-3 py-1 rounded-full border cursor-pointer transition ${
                billingPriceRange[0] === start && billingPriceRange[1] === end 
                  ? 'bg-yellow-100 border-yellow-400 text-yellow-800 font-semibold' 
                  : 'bg-white border-gray-300 text-gray-700'
              }`}
            >
              {intervalLabels[i]} ({intervalCounts[i]})
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  </div>
  
  {/* Billing table card */}
  <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
    {/* Existing billing table content */}
  </div>
</div>
```

**3. Advanced Filtering Features Added**:
- **Histogram Visualization**: Yellow bars showing data distribution across price ranges
- **2-Thumb Slider**: Interactive slider for precise price range selection
- **Quick Range Radio Buttons**: Pre-defined ranges with counts for rapid filtering
- **Manual Input Fields**: Direct numeric input with proper formatting
- **Reset Functionality**: Individual reset for price range and global reset for all filters

```typescript
// Histogram calculation
const NUM_BUCKETS = 16;
const bucketSize = (billingPriceDistribution.max - billingPriceDistribution.min) / NUM_BUCKETS;
const buckets = Array.from({ length: NUM_BUCKETS }, (_, i) => {
  const start = billingPriceDistribution.min + i * bucketSize;
  const end = start + bucketSize;
  const count = printBilling.filter((b) => {
    const amount = b.remainingBalance;
    return amount >= start && (i === NUM_BUCKETS - 1 ? amount <= end : amount < end);
  }).length;
  return { start, end, count };
});

// Quick range intervals
const intervalSize = (maxValue - minValue) / 4;
const intervals = [
  [minValue, minValue + intervalSize],
  [minValue + intervalSize, minValue + 2 * intervalSize],
  [minValue + 2 * intervalSize, minValue + 3 * intervalSize],
  [minValue + 3 * intervalSize, maxValue],
];
```

**4. Color-Coded Form Elements**:
- Applied consistent color themes to all form inputs and selects
- Added focus states with appropriate colors
- Styled labels and text with theme colors

```typescript
// Blue theme for print filters
className="border-blue-200 focus:border-blue-500"
className="text-blue-800"

// Green theme for lamination filters  
className="border-green-200 focus:border-green-500"
className="text-green-800"

// Yellow theme for billing filters (focus only)
className="border-gray-200 focus:border-yellow-500"
className="text-gray-700"
```

**5. Reset Button Styling**:
- Applied theme-appropriate colors to reset buttons
- Added hover states with lighter theme colors
- Maintained consistent styling across all filter sections

```typescript
// Blue theme reset button
className="p-2 rounded-full border border-blue-300 bg-white hover:bg-blue-50 transition"
<RotateCcw className="h-4 w-4 text-blue-600" />

// Green theme reset button
className="p-2 rounded-full border border-green-300 bg-white hover:bg-green-50 transition"
<RotateCcw className="h-4 w-4 text-green-600" />

// Gray theme reset button (billing)
className="p-2 rounded-full border border-gray-300 bg-white hover:bg-gray-50 transition"
<RotateCcw className="h-4 w-4 text-gray-500" />
```

**Benefits**:
- **Visual Consistency**: Filters now match their respective section themes
- **Better Organization**: Billing filters are clearly separated above the table
- **Advanced Functionality**: Comprehensive filtering with slider, radio buttons, and histogram
- **Improved UX**: Color coding helps users understand which filters affect which data
- **Professional Appearance**: Consistent styling throughout the interface
- **Clear Hierarchy**: Proper visual hierarchy with themed sections

**Key Features**:
- **Blue Theme**: Print filters match the blue "Ιστορικό Εκτυπώσεων" section
- **Green Theme**: Lamination filters match the green "Ιστορικό Πλαστικοποιήσεων" section  
- **Yellow Title Only**: Billing filters use yellow background only on the title icon
- **Advanced Filtering**: Slider, radio buttons, histogram, and manual input fields
- **Proper Spacing**: Adequate gaps between filter sections and cards
- **Consistent Styling**: All form elements use theme-appropriate colors
- **Responsive Design**: Works well on all screen sizes

### Printer Configuration Update (December 2024)

**Problem**: The system needed to be updated to include 3 specific printers: Canon Color, Canon B/W, and Brother, replacing the previous generic printer names.

**Solution**: Updated both the dummy database and Python data collection service to use the 3 specific printer names and their corresponding models.

**Changes Made**:

**1. Dummy Database Updates (`lib/dummy-database.ts`)**:
- Added `getRandomPrinterName()` method that returns one of the 3 printer names
- Updated print job generation to use the new printer names
- Reduced IP range to 3 printers (192.168.1.100-102)

```typescript
private getRandomPrinterName(): string {
  const printers = ["Canon Color", "Canon B/W", "Brother"];
  return printers[Math.floor(Math.random() * printers.length)];
}

// Updated in generateSampleData()
deviceIP: `192.168.1.${100 + Math.floor(Math.random() * 3)}`,
deviceName: this.getRandomPrinterName(),
```

**2. Python Data Collection Updates (`python/collect.py`)**:
- Updated printer configuration to include the 3 specific printers
- Replaced HP LaserJet with Brother printer
- Updated model types to match the new printers
- Added Brother-specific data collection method

```python
printer_config = os.getenv('PRINTER_CONFIG', '''[
    {
        "ip": "192.168.3.41",
        "name": "Canon Color",
        "model": "canon_color",
        "username": "admin",
        "password": "admin"
    },
    {
        "ip": "192.168.3.42", 
        "name": "Canon B/W",
        "model": "canon_bw",
        "username": "admin",
        "password": "admin"
    },
    {
        "ip": "192.168.3.43",
        "name": "Brother",
        "model": "brother",
        "username": "admin",
        "password": "admin"
    }
]''')
```

**3. Collection Logic Updates**:
- Updated printer model detection to handle the new types
- Added Brother data collection method
- Removed HP-specific parsing methods
- Updated status parsing to handle Brother printers

```python
# Updated collection logic
if printer['model'] in ['canon_color', 'canon_bw']:
    jobs = self.collect_canon_data(printer)
elif printer['model'] == 'brother':
    jobs = self.collect_brother_data(printer)
else:
    logger.warning(f"Unknown printer model: {printer['model']}")
    continue

# Added Brother collection method
def collect_brother_data(self, printer: Dict[str, str]) -> List[Dict[str, Any]]:
    """Collect data from Brother printers"""
    # Brother-specific implementation
```

**4. Status Parsing Updates**:
- Removed HP-specific counter extraction
- Updated pattern matching to handle Brother printers
- Maintained Canon and generic parsing methods

```python
# Updated pattern matching
if 'canon' in text_content:
    data.update(self.extract_canon_counters(soup))
elif 'brother' in text_content:
    data.update(self.extract_brother_counters(soup))
else:
    data.update(self.extract_fallback_counters(soup))
```

**Benefits**:
- **Specific Printer Names**: Clear identification of the 3 actual printers in use
- **Consistent Data**: Both dummy data and real collection use the same printer names
- **Better Organization**: Canon printers are distinguished by color capability
- **Realistic Configuration**: Matches the actual printer setup in the environment

**Technical Notes**:
- Canon printers are distinguished as "Canon Color" and "Canon B/W" for clarity
- Brother printer uses the "brother" model type for data collection
- IP addresses are assigned sequentially (192.168.3.41, 192.168.3.42, 192.168.3.43)
- All printers use the same admin credentials for consistency
- Dummy data generation now creates more realistic printer assignments

**Verification Process**:
1. **Dummy Data Test**: Confirmed new printer names appear in generated print jobs
2. **Collection Test**: Verified Python service can handle the new printer models
3. **UI Display Test**: Confirmed printer names display correctly in all tables
4. **Export Test**: Verified printer names are included in exported data

**Future Considerations**:
- Consider adding printer-specific capabilities (e.g., color support, paper sizes)
- Implement printer status monitoring for each specific model
- Add printer-specific error handling and troubleshooting
- Consider printer-specific pricing if different models have different costs

### Chart Removal from Dashboard (December 2024)

**Problem**: The monthly cost chart ("Μηνιαία Κόστη (Τελευταίοι 6 Μήνες)") was displayed to all users on the dashboard, but it was requested to be removed for all users.

**Solution**: Completely removed the chart component and all related code from the dashboard page.

**Changes Made**:
1. **Removed Dynamic Import**: Deleted the dynamic import for `UsageChart` component
2. **Removed Chart Function**: Deleted the `generateChartData()` function that was generating chart data
3. **Removed Chart JSX**: Deleted the entire chart section from the dashboard layout

**Code Removed**:
```tsx
// Dynamic import (removed)
const UsageChart = dynamic(() => import("@/components/usage-chart"), {
  loading: () => <div className="w-full flex justify-center items-center py-8">Φόρτωση γραφήματος...</div>,
  ssr: false,
})

// Chart function (removed)
const generateChartData = () => {
  // ... chart data generation logic
}

// Chart JSX section (removed)
<div className="bg-blue-50 p-6 rounded-lg space-y-6 w-full max-w-full">
  <UsageChart
    data={generateChartData()}
    title="Μηνιαία Κόστη (Τελευταίοι 6 Μήνες)"
    printLabel="Εκτυπώσεις"
    laminationLabel="Πλαστικοποιήσεις"
  />
</div>
```

**Benefits**:
- **Cleaner Interface**: Removes visual clutter from the dashboard
- **Simplified Layout**: Dashboard focuses on essential data tables and summary cards
- **Reduced Bundle Size**: Removes unused chart component from the build
- **Better Performance**: Eliminates chart rendering overhead

**Verification Process**:
1. **Build Test**: Confirmed application builds successfully after chart removal
2. **Functionality Test**: Verified all other dashboard features work correctly
3. **Layout Test**: Confirmed dashboard layout remains consistent without the chart
4. **Import Check**: Verified no broken imports or missing dependencies

**Technical Notes**:
- Chart component file (`components/usage-chart.tsx`) remains in the codebase for potential future use
- No other components or functionality were affected by the removal
- Dashboard now ends with the tabs section, providing a cleaner layout
- All existing data tables and summary cards remain fully functional

**Future Considerations**:
- Chart component can be easily re-added if needed in the future
- Consider adding alternative data visualization if required
- Monitor user feedback on the simplified dashboard layout

### Role-Based Export Button Visibility (December 2024)

**Problem**: Simple users (non-admin) were able to see and use the "Εξαγωγή XLSX" (Export XLSX) buttons on all tables in the dashboard, which should be restricted to admin users only for security and data protection reasons.

**Solution**: Implemented role-based conditional rendering for all export buttons in the dashboard tables by wrapping them with `{user.role === "admin" && (...)}` conditions.

**Changes Made**:
1. **Billing Table Export Button**: Wrapped the export button in the "Συγκεντρωτικός Χρεωστικός Πίνακας" section with admin role check
2. **Print Jobs Export Button**: Wrapped the export button in the "Ιστορικό Εκτυπώσεων" section with admin role check  
3. **Lamination Jobs Export Button**: Wrapped the export button in the "Ιστορικό Πλαστικοποιήσεων" section with admin role check

**Code Pattern Used**:
```tsx
{user.role === "admin" && (
  <Button
    onClick={() => exportTableXLSX(...)}
    variant="outline"
    size="sm"
    className="..."
  >
    <Download className="h-4 w-4 mr-2" />
    Εξαγωγή XLSX
  </Button>
)}
```

**Benefits**:
- **Security**: Prevents unauthorized data export by simple users
- **Data Protection**: Ensures sensitive billing and job data is only accessible to admins
- **User Experience**: Cleaner interface for simple users without unnecessary export options
- **Role Compliance**: Maintains proper role-based access control throughout the application

**Verification Process**:
1. **Admin User Test**: Confirmed export buttons are visible and functional for admin users
2. **Simple User Test**: Verified export buttons are hidden for users with "user" role
3. **Functionality Test**: Ensured all other dashboard features work correctly for both user types
4. **UI Consistency**: Confirmed the layout remains consistent when buttons are hidden

**Technical Notes**:
- Used existing `user.role` property from the auth context
- Maintained all existing export functionality for admin users
- No changes to the export logic itself, only visibility control
- Consistent with existing role-based patterns in the application

**Future Considerations**:
- Consider adding audit logging for export actions
- Implement export permission granularity if needed
- Add user feedback when export is not available
- Consider role-based export format restrictions

### Code Cleanup - Removal of Unused Components and Files (December 2024)

**Problem**: The codebase had accumulated several unused components and files that were not being imported or used anywhere in the application, creating unnecessary clutter and maintenance overhead.

**Solution**: Conducted a comprehensive analysis of component usage and removed all unused files while ensuring no existing functionality was broken.

**Analysis Process**:
1. **Component Usage Analysis**: Searched for all import statements across the codebase to identify which components were actually being used
2. **Dynamic Import Check**: Verified components that were dynamically imported in the dashboard page
3. **Direct Import Verification**: Confirmed components imported directly in app pages
4. **Cross-Reference**: Cross-referenced with the file structure documentation to ensure accuracy

**Components Found to be Unused**:
- `components/user-dashboard.tsx` - Not imported anywhere, dashboard functionality moved to `app/dashboard/page.tsx`
- `components/dashboard-stats.tsx` - Only used by the unused `user-dashboard.tsx`
- `components/cost-calculator.tsx` - Not imported or used in any page
- `components/job-table.tsx` - Not imported or used in any page
- `components/history-table.tsx` - Not imported or used in any page
- `components/billing-table.tsx` - Not imported or used in any page
- `components/billing-management.tsx` - Not imported or used in any page
- `components/admin-user-table.tsx` - Not imported or used in any page
- `components/admin-billing-table.tsx` - Not imported or used in any page
- `components/price-table-manager.tsx` - Not imported or used in any page
- `components/printer-status.tsx` - Not imported or used in any page
- `components/demo-login.tsx` - Not imported or used in any page
- `components/theme-provider.tsx` - Not imported or used in any page
- `components/pagination-helper.tsx` - Not imported or used in any page

**Components Confirmed to be Used**:
- `components/protected-route.tsx` - Used in all protected pages
- `components/navigation.tsx` - Used in all pages with navigation
- `components/role-badge.tsx` - Used in navigation and profile pages
- `components/searchable-select.tsx` - Used in admin page
- `components/print-jobs-table.tsx` - Dynamically imported in dashboard
- `components/lamination-jobs-table.tsx` - Dynamically imported in dashboard
- `components/usage-chart.tsx` - Dynamically imported in dashboard
- `components/admin-users-tab.tsx` - Used in admin page

**Files Removed**:
- `components/user-dashboard.tsx`
- `components/dashboard-stats.tsx`
- `components/cost-calculator.tsx`
- `components/job-table.tsx`
- `components/history-table.tsx`
- `components/billing-table.tsx`
- `components/billing-management.tsx`
- `components/admin-user-table.tsx`
- `components/admin-billing-table.tsx`
- `components/price-table-manager.tsx`
- `components/printer-status.tsx`
- `components/demo-login.tsx`
- `components/theme-provider.tsx`
- `components/pagination-helper.tsx`

**Benefits**:
- **Reduced Bundle Size**: Removed unused code from the application bundle
- **Cleaner Codebase**: Eliminated clutter and improved maintainability
- **Faster Development**: Easier to navigate and understand the codebase
- **Reduced Confusion**: No more wondering if unused components are needed
- **Better Performance**: Smaller bundle size leads to faster loading times

**Verification Process**:
1. **Build Test**: Ensured the application builds successfully after cleanup
2. **Functionality Test**: Verified all existing features work correctly
3. **Import Check**: Confirmed no broken imports or missing dependencies
4. **Documentation Update**: Updated file structure documentation to reflect changes

**Prevention Strategy**:
- **Regular Audits**: Conduct periodic code audits to identify unused files
- **Import Tracking**: Use tools to track component usage automatically
- **Documentation**: Keep file structure documentation up to date
- **Code Reviews**: Include usage verification in code review process

**Technical Notes**:
- All removed components were confirmed to have no imports or usage
- Dynamic imports in dashboard page were preserved and verified
- UI components in `components/ui/` were kept as they are part of the design system
- No functionality was lost during the cleanup process
- The cleanup reduced the components directory from 25 files to 10 files

**Future Considerations**:
- Consider implementing automated tools for detecting unused code
- Add linting rules to prevent creation of unused components
- Regular cleanup as part of the development cycle
- Document component usage patterns for better organization

This cleanup significantly improved the codebase organization and maintainability while ensuring no functionality was lost.

### Greek Date Formatting Implementation (December 2024)

**Problem**: Users requested that all dates throughout the website should be displayed in Greek format (day first, then month) instead of the default browser locale format. This included both displayed dates and date input components. Additionally, there were hydration mismatches due to server/client date formatting differences, and timezone issues causing the wrong date to be selected when picking dates from the calendar.

**Solution**: Implemented comprehensive Greek date formatting across the entire application by:
1. Updating all `toLocaleDateString()` calls to use Greek locale (`"el-GR"`)
2. Creating utility functions for consistent Greek date formatting
3. Ensuring all date displays follow the Greek format (DD/MM/YYYY)
4. Creating client-side only date display components to prevent hydration mismatches
5. Developing a custom GreekDatePicker component with proper Greek format display
6. Adding comprehensive CSS styling for Greek date input formatting
7. Replacing problematic HTML date inputs with custom Greek date pickers
8. Fixing timezone issues by using local date formatting instead of UTC conversion

**Files Updated**:
- `components/job-table.tsx`: Updated date formatting in job table
- `components/billing-management.tsx`: Updated date formatting in billing export
- `components/ui/calendar.tsx`: Updated calendar month dropdown and day data attributes
- `components/ui/client-date-display.tsx`: Created client-side only date display component
- `components/ui/greek-date-picker.tsx`: Created custom Greek date picker component with timezone fixes
- `app/dashboard/page.tsx`: Replaced date inputs with GreekDatePicker components
- `app/admin/page.tsx`: Replaced date input with GreekDatePicker component
- `app/globals.css`: Added comprehensive CSS styling for Greek date input formatting
- `lib/utils.ts`: Added utility functions for Greek date formatting and timezone-safe conversion

**Implementation Details**:

**1. Updated Date Formatting Calls**:
```tsx
// Before
{new Date(job.timestamp).toLocaleDateString()}

// After  
{new Date(job.timestamp).toLocaleDateString("el-GR")}
```

**2. Created Utility Functions**:
```tsx
// In lib/utils.ts
export function formatGreekDate(date: Date | string | number, options?: Intl.DateTimeFormatOptions): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date
  return dateObj.toLocaleDateString("el-GR", options)
}

export function formatGreekDateTime(date: Date | string | number, options?: Intl.DateTimeFormatOptions): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date
  return dateObj.toLocaleString("el-GR", options)
}
```

**3. Client-Side Date Display Component**:
```tsx
// Prevents hydration mismatches by only rendering on client
export function ClientDateDisplay({ date, options, className }: ClientDateDisplayProps) {
  const [formattedDate, setFormattedDate] = useState<string>("")
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date
    setFormattedDate(dateObj.toLocaleDateString("el-GR", options))
  }, [date, options])

  // Show a placeholder during SSR to prevent hydration mismatch
  if (!isClient) {
    return <span className={className}>--/--/----</span>
  }

  return <span className={className}>{formattedDate}</span>
}
```

**4. Custom Greek Date Picker Component**:
```tsx
// Custom date picker with Greek format display and timezone fixes
export function GreekDatePicker({ id, label, value, onChange, ...props }: GreekDatePickerProps) {
  const [displayValue, setDisplayValue] = useState("")

  useEffect(() => {
    if (value) {
      const date = new Date(value)
      setDisplayValue(formatGreekDate(date))
    } else {
      setDisplayValue("")
    }
  }, [value])

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      // Use local date formatting to avoid timezone issues
      const isoDate = toLocalISOString(date)
      onChange(isoDate)
      setIsOpen(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    setDisplayValue(inputValue)
    
    // Parse Greek format input (dd/mm/yyyy)
    const parts = inputValue.split('/')
    if (parts.length === 3) {
      const [dayStr, monthStr, yearStr] = parts
      const date = new Date(parseInt(yearStr), parseInt(monthStr) - 1, parseInt(dayStr))
      if (!isNaN(date.getTime())) {
        // Use local date formatting to avoid timezone issues
        const isoDate = toLocalISOString(date)
        onChange(isoDate)
      }
    }
  }

  return (
    <div className="flex gap-2">
      <Input
        type="text"
        value={displayValue}
        onChange={handleInputChange}
        placeholder="ηη/μμ/εεεε"
        style={{ direction: 'ltr' }}
      />
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="icon">
            <Calendar className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent>
          <CalendarComponent
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
```

**5. Timezone-Safe Date Conversion**:
```tsx
// Helper function to convert dates to ISO format without timezone issues
export function toLocalISOString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
```

**6. CSS Styling for Greek Date Inputs**:
```css
/* Comprehensive Greek date input formatting */
input[type="date"][lang="el-GR"],
.greek-date-input {
  direction: ltr;
}

/* Force Greek date format display */
input[type="date"][lang="el-GR"]::-webkit-datetime-edit,
.greek-date-input::-webkit-datetime-edit {
  direction: ltr;
}

/* Custom placeholder for Greek format */
input[type="date"][lang="el-GR"]:not([value])::before,
.greek-date-input:not([value])::before {
  content: "ηη/μμ/εεεε";
  color: #9ca3af;
  position: absolute;
  pointer-events: none;
}
```

**7. Usage Examples**:
```tsx
// Basic date formatting
formatGreekDate(new Date()) // "15/12/2024"

// With custom options
formatGreekDate(new Date(), { 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric' 
}) // "15 Δεκεμβρίου 2024"

// Date and time formatting
formatGreekDateTime(new Date()) // "15/12/2024, 14:30:25"

// Timezone-safe date conversion
toLocalISOString(new Date()) // "2024-12-15" (local timezone)

// Using the GreekDatePicker component
<GreekDatePicker
  id="dateFrom"
  label="Από Ημερομηνία"
  value={dateFrom}
  onChange={setDateFrom}
/>

// Using the ClientDateDisplay component for hydration-safe rendering
<ClientDateDisplay
  date={job.timestamp}
  className="text-sm text-gray-600"
/>
```

**Key Features**:
- **Consistent Formatting**: All dates now display in Greek format (DD/MM/YYYY)
- **Hydration-Safe**: Client-side only components prevent SSR/client mismatches
- **Custom Date Picker**: GreekDatePicker component with proper Greek format display
- **Timezone-Safe**: Local date conversion prevents timezone-related date shifts
- **Flexible Options**: Utility functions accept custom formatting options
- **Type Safety**: Full TypeScript support with proper type definitions
- **Backward Compatibility**: Existing code continues to work with updated formatting
- **Reusable Components**: GreekDatePicker and ClientDateDisplay components
- **CSS Styling**: Comprehensive CSS ensures proper Greek date input display

**Benefits**:
- **User Experience**: Greek-speaking users see dates in their expected format (DD/MM/YYYY)
- **No Hydration Errors**: Client-side only components prevent SSR/client mismatches
- **Accurate Date Selection**: Timezone-safe conversion ensures correct date selection
- **Date Input Consistency**: Custom date pickers display in proper Greek format
- **Consistency**: All date displays follow the same Greek format across the application
- **Maintainability**: Centralized date formatting logic in utility functions
- **Flexibility**: Easy to customize date formatting for different use cases
- **Accessibility**: Proper locale support for screen readers and assistive technologies

**Technical Notes**:
- Greek locale (`"el-GR"`) automatically formats dates as DD/MM/YYYY
- The utility functions handle different input types (Date, string, number)
- ClientDateDisplay component prevents hydration mismatches by only rendering on client
- GreekDatePicker component uses text input with Greek format parsing (dd/mm/yyyy)
- `toLocalISOString()` function prevents timezone issues by using local date methods
- CSS styling ensures proper Greek date input display and calendar picker icons
- Calendar component month dropdown and data attributes use Greek format for consistency
- Custom date picker components replace problematic HTML date inputs

**Future Enhancements**:
- Consider adding more specific formatting options for different contexts
- Implement date range formatting for periods
- Add relative date formatting (e.g., "2 days ago" in Greek)

**Usage Pattern**:
1. Import utility functions: `import { formatGreekDate, formatGreekDateTime } from "@/lib/utils"`
2. Use in components: `{formatGreekDate(job.timestamp)}`
3. For custom formatting: `{formatGreekDate(date, { month: 'short', year: 'numeric' })}`
4. For date inputs: Use the `GreekDatePicker` component
5. For hydration-safe date display: Use the `ClientDateDisplay` component
6. Import components: `import { GreekDatePicker, ClientDateDisplay } from "@/components/ui"`

This ensures all dates throughout the application are consistently displayed in Greek format, providing a better user experience for Greek-speaking users. Both displayed dates and date input components now follow the Greek format (DD/MM/YYYY) without hydration errors.

- **Toast Animation Timing Fix**: Fixed issue where toast would close before the exit animation completed by adding a 250ms delay before calling onClose(). This ensures the fade-out-80 and slide-out-to-right-full animations have time to complete before the toast is removed from the DOM. The custom progress animation was calling onClose() immediately when progress reached 0%, but Radix UI toast's built-in exit animations need time to complete. The 250ms delay accounts for the typical duration of Tailwind's animate-out classes.
- **Enhanced Form Persistence & Toast Styling**: Implemented full form persistence for the lamination charge form where all fields persist after submission. Added a reset button in the top-right corner of the form header. Enhanced green toast variant with background extending to the title area and 4-second auto-dismiss. Updated all success toasts to use the new green variant for consistency.
- **Real-time Data Synchronization**: Implemented a global refresh context system to automatically update dashboard data when new lamination jobs are added from the admin page. Created `RefreshProvider` context and `useRefresh` hook for cross-component data synchronization.
- **Unhandled Promise Rejection Fix**: Fixed [object Event] error caused by unhandled promise rejections in dynamic imports by adding global error handlers and error boundaries around dynamic components.
- **Hydration Error Fix**: Fixed React hydration error caused by whitespace text nodes in `<colgroup>` elements by removing comments and extra whitespace between `<col>` tags.
- **Print Types Simplification**: Removed scans and copies from the print types to keep only the 4 core types shown in the UI images: A4 Black & White (€0.05), A4 Color (€0.15), A3 Black & White (€0.10), and A3 Color (€0.30). Updated all interfaces, components, and data structures accordingly.
- **Table Sorting Functionality**: Implemented clickable column sorting for all data tables with visual indicators and proper TypeScript support; created reusable sortable table header component and utility functions for consistent sorting behavior across the application.
- **UI/UX Enhancements**: Improved admin tab styling for clarity; added inline editing for price tables with validation and feedback; implemented a dynamic price range filter with histogram and real-time distribution in admin user management.
- **Dummy Data Realism**: Adjusted dummy data generation for more realistic values (fewer jobs, lower page counts, and lamination quantities); added a `reset()` method and UI button for regenerating data with confirmation dialog.
- **Dependency Management**: Added missing `@radix-ui/react-radio-group` for radio buttons; always check for required Radix UI dependencies when adding new shadcn/ui components.
- **React 19 Compatibility**: Updated Radix UI packages to latest versions to resolve React 19 ref errors; always update Radix UI when upgrading React.
- **Nested Button Fix**: Fixed HTML validation error in SearchableSelect component where a Button component was nested inside another Button component, causing hydration errors. Replaced nested Button with a simple button element.

## Enhanced Form Persistence & Toast Styling Implementation (December 2024)

**Problem**: Users wanted the lamination charge form to persist all fields after submission for convenience, with a manual reset option. They also requested green-styled toast notifications with the green background only for the title area (white background for description with black text), matching the card design and auto-dismissing after 4 seconds with a visual countdown animation that pauses on hover.

**Solution**: Implemented full form persistence with a reset button and enhanced toast styling with selective green background and circular progress animation with hover pause functionality.

**Form Persistence Implementation**:
```tsx
// In app/admin/page.tsx - handleAddLamination function
const handleAddLamination = async () => {
  // ... validation and job creation
  
  toast({
    title: "Επιτυχία",
    description: `Προστέθηκε πλαστικοποίηση για τον χρήστη ${selectedUserData.displayName}`,
    variant: "success", // New green variant
  })

  // Trigger refresh to update dashboard
  triggerRefresh()

  // Don't reset any form fields - they persist for convenience
}

// Reset function for manual form clearing
const handleResetLaminationForm = () => {
  setSelectedUser("")
  setLaminationType("A4")
  setQuantity("1")
  setSelectedDate(new Date().toISOString().split('T')[0])
}
```

**Toast Styling Enhancement**:

**1. Enhanced Green Variant with Selective Background**:
```tsx
// In components/ui/toaster.tsx
export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        return (
          <Toast key={id} variant={variant} {...props}>
            <div className="grid gap-1">
              {title && (
                <div className={variant === "success" ? "bg-green-50 -m-6 -mb-0 p-6 pb-2" : ""}>
                  <ToastTitle className={variant === "success" ? "text-green-800" : ""}>
                    {title}
                  </ToastTitle>
                </div>
              )}
              {description && (
                <div className={variant === "success" ? "bg-white -m-6 mt-0 p-6 pt-2 -mr-8" : ""}>
                  <ToastDescription className={variant === "success" ? "text-black" : ""}>
                    {description}
                  </ToastDescription>
                </div>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
```

**2. Reset Button Implementation**:
```tsx
// In app/admin/page.tsx - Form header with reset button
<CardHeader className="bg-green-50">
  <div className="flex justify-between items-start">
    <div>
      <CardTitle className="flex items-center gap-2 text-green-800">
        <CreditCard className="h-5 w-5" />
        Προσθήκη Χρέους Πλαστικοποιητή
      </CardTitle>
      <CardDescription className="text-green-600">Προσθέστε χρέωση πλαστικοποίησης σε χρήστη</CardDescription>
    </div>
    <button
      type="button"
      aria-label="Επαναφορά φόρμας"
      className="p-2 rounded-full border border-green-300 bg-white hover:bg-green-50 transition"
      onClick={handleResetLaminationForm}
    >
      <RotateCcw className="h-4 w-4 text-green-600" />
    </button>
  </div>
</CardHeader>
```

**3. Circular Progress Animation with Hover Pause**:
```tsx
// In components/ui/toaster.tsx - Custom AnimatedToastClose component
function AnimatedToastClose({ onClose, isPaused }: { 
  onClose: () => void
  isPaused: boolean
}) {
  const duration = 4000 // 4 seconds
  const [progress, setProgress] = useState(100)
  const [remainingTime, setRemainingTime] = useState(duration)

  useEffect(() => {
    if (isPaused) return

    const startTime = Date.now()
    const endTime = startTime + remainingTime

    const updateProgress = () => {
      if (isPaused) return

      const now = Date.now()
      const remaining = Math.max(0, endTime - now)
      const newProgress = (remaining / duration) * 100
      setProgress(newProgress)
      setRemainingTime(remaining)

      if (remaining > 0) {
        requestAnimationFrame(updateProgress)
      } else {
        onClose()
      }
    }

    const animationId = requestAnimationFrame(updateProgress)
    return () => cancelAnimationFrame(animationId)
  }, [duration, onClose, isPaused, remainingTime])

  // ... SVG rendering code
}

// Custom Toast wrapper with hover pause functionality
function AnimatedToast({ id, title, description, action, variant, onClose, ...props }: any) {
  const [isPaused, setIsPaused] = useState(false)

  const handleMouseEnter = () => {
    setIsPaused(true)
  }

  const handleMouseLeave = () => {
    setIsPaused(false)
  }

  return (
    <Toast 
      variant={variant} 
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {/* Toast content */}
      <AnimatedToastClose onClose={onClose} isPaused={isPaused} />
    </Toast>
  )
}
```

**4. Updated Toast Timeout**:
```tsx
// In hooks/use-toast.ts
const TOAST_REMOVE_DELAY = 4000 // Changed from 1000000 to 4000ms (4 seconds)
```

**3. Applied Green Variant to All Success Toasts**:
```tsx
// Updated all success toasts in admin page
toast({
  title: "Επιτυχία",
  description: "Οι τιμές εκτυπώσεων ενημερώθηκαν επιτυχώς",
  variant: "success", // Green styling
})

toast({
  title: "Επιτυχία", 
  description: "Οι τιμές πλαστικοποιήσεων ενημερώθηκαν επιτυχώς",
  variant: "success", // Green styling
})

toast({
  title: "Επιτυχία",
  description: "Τα δεδομένα επαναφέρθηκαν επιτυχώς", 
  variant: "success", // Green styling
})
```

**Key Features**:
- **Full Form Persistence**: All form fields persist after submission for convenience
- **Manual Reset Button**: Reset button in top-right corner to clear all fields when needed
- **Selective Green Toast Background**: Green background only for the title area, white background for description with black text
- **Circular Progress Animation**: Toast close button shows a circular progress indicator that counts down the 4-second auto-dismiss timer
- **Hover Pause Functionality**: Animation pauses when hovering over the toast and resumes when mouse leaves
- **Auto-dismiss**: Toasts automatically disappear after 4 seconds (when not paused)
- **Shorter Messages**: Simplified success messages for better UX
- **Consistent Styling**: All success toasts use the same green variant

**Benefits**:
- **Better UX**: Users don't need to re-enter any form data for multiple charges
- **Manual Control**: Reset button allows users to clear form when needed
- **Visual Consistency**: Toast styling matches the application's green theme with selective background
- **Interactive Feedback**: Hover pause allows users to read toast content without interruption
- **Reduced Clutter**: Auto-dismissing toasts don't clutter the interface
- **Clearer Feedback**: Shorter, more focused success messages

**Technical Notes**:
- The green variant uses `border-green-200 bg-green-50 text-green-800` for subtle green styling
- Selective background is achieved with separate wrappers: `bg-green-50 -m-6 -mb-0 p-6 pb-2` for title and `bg-white -m-6 mt-0 p-6 pt-2 -mr-8` for description
- Description text uses black color for better readability on white background
- Circular progress animation uses SVG circles with `strokeDasharray` and `strokeDashoffset` for smooth countdown
- Animation runs at 60fps using `requestAnimationFrame` for optimal performance
- Hover pause functionality tracks remaining time and resumes from where it left off
- Close button is always visible (`opacity-100`) to ensure animation starts immediately
- Form persistence is achieved by not resetting any form state variables
- Reset button uses white background with subtle green hover effect
- Toast timeout is controlled by the `TOAST_REMOVE_DELAY` constant
- All success toasts now use the `variant: "success"` property

**Usage Pattern**:
1. User selects a user from the dropdown
2. User fills out lamination details (type, quantity, date)
3. User clicks "Προσθήκη Χρέους Πλαστικοποιητή"
4. Form submits successfully
5. Green toast appears with success message, selective green background (green for title, white for description with black text), and circular progress animation around the X button that pauses on hover
6. Toast auto-dismisses after 4 seconds
7. All form fields persist for convenience
8. User can immediately add another charge with the same settings
9. User can click the reset button (🔄) to clear all fields when needed

## Nested Button HTML Validation Fix (December 2024)

**Problem**: When using the SearchableSelect component in the admin page's lamination form, users encountered hydration errors with the message:
```
Error: In HTML, <button> cannot be a descendant of <button>.
This will cause a hydration error.
```

**Root Cause**: The SearchableSelect component had a nested button structure where a `Button` component (which renders as a `<button>` element) was placed inside another `Button` component. This created invalid HTML structure:

```tsx
<Button variant="outline">
  <span>Selected Option</span>
  <div className="flex items-center gap-1">
    {selectedOption && (
      <Button  // ← Nested button causing the issue
        variant="ghost"
        size="sm"
        onClick={handleClear}
      >
        <X className="h-3 w-3" />
      </Button>
    )}
    <ChevronDown />
  </div>
</Button>
```

**Solution**: Completely eliminated the nested button structure by replacing the outer `Button` component with a `div` that has proper button semantics:

```tsx
<div
  className="flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
  onClick={() => !disabled && setIsOpen(!isOpen)}
  role="button"
  tabIndex={disabled ? -1 : 0}
  onKeyDown={(e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      if (!disabled) {
        setIsOpen(!isOpen)
      }
    }
  }}
>
  <span>Selected Option</span>
  <div className="flex items-center gap-1">
    {selectedOption && (
      <button  // ← Now this is the only button element
        type="button"
        className="h-4 w-4 p-0 hover:bg-transparent flex items-center justify-center"
        onClick={(e) => {
          e.stopPropagation()
          handleClear()
        }}
      >
        <X className="h-3 w-3" />
      </button>
    )}
    <ChevronDown />
  </div>
</div>
```

**Key Changes**:
- **Replaced outer Button component**: Used a `div` with proper button semantics instead
- **Eliminated nested buttons**: Now only one `button` element exists in the component
- **Maintained accessibility**: Added `role="button"`, `tabIndex`, and keyboard navigation
- **Preserved styling**: Applied all necessary CSS classes for visual consistency
- **Enhanced functionality**: Added keyboard support (Enter/Space keys) for better accessibility

**Benefits**:
- **Valid HTML**: No nested button elements at all
- **No Hydration Errors**: Completely eliminates React hydration mismatches
- **Enhanced Accessibility**: Proper keyboard navigation and screen reader support
- **Same Functionality**: All existing features work as expected
- **Better UX**: Keyboard users can now navigate and interact with the component

**Technical Notes**:
- HTML specification prohibits nested interactive elements
- React's hydration process validates DOM structure
- Simple HTML elements are often better than complex components for simple interactions
- Always check for nested interactive elements when using component libraries

**Prevention**:
- Avoid nesting Button components from UI libraries
- Use simple HTML elements for simple interactions within complex components
- Test components with React Strict Mode to catch hydration issues early
- Validate HTML structure when creating custom components

## Real-time Data Synchronization Implementation (December 2024)

**Problem**: When users added lamination jobs through the admin page, the new data wasn't automatically reflected in the dashboard's "Ιστορικό Πλαστικοποιήσεων" table. Users had to manually refresh the page to see the new entries.

**Solution**: Implemented a global refresh context system that allows components to trigger data refreshes across the application without full page reloads.

**Implementation Components**:

**1. Refresh Context (`lib/refresh-context.tsx`)**:
```tsx
"use client"

import React, { createContext, useContext, useState, useCallback } from 'react'

interface RefreshContextType {
  refreshTrigger: number
  triggerRefresh: () => void
}

const RefreshContext = createContext<RefreshContextType | undefined>(undefined)

export function RefreshProvider({ children }: { children: React.ReactNode }) {
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const triggerRefresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1)
  }, [])

  return (
    <RefreshContext.Provider value={{ refreshTrigger, triggerRefresh }}>
      {children}
    </RefreshContext.Provider>
  )
}

export function useRefresh() {
  const context = useContext(RefreshContext)
  if (context === undefined) {
    throw new Error('useRefresh must be used within a RefreshProvider')
  }
  return context
}
```

**2. Root Layout Integration (`app/layout.tsx`)**:
```tsx
import { RefreshProvider } from "@/lib/refresh-context"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="el">
      <body className={inter.className}>
        <AuthProvider>
          <RefreshProvider>
            {children}
            <Toaster />
          </RefreshProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
```

**3. Dashboard Integration (`app/dashboard/page.tsx`)**:
```tsx
export default function DashboardPage() {
  const { user } = useAuth()
  const { refreshTrigger } = useRefresh() // Use refresh trigger from context
  
  useEffect(() => {
    if (!user) return
    
    // Load data based on user role
    if (user.role === "admin") {
      const allLaminationJobs = dummyDB.getAllLaminationJobs()
      setLaminationJobs(allLaminationJobs)
      // ... other data loading
    } else {
      const lJobs = dummyDB.getLaminationJobs(user.uid)
      setLaminationJobs(lJobs)
      // ... other data loading
    }
  }, [user, refreshTrigger]) // Add refreshTrigger to dependencies
  
  // Add manual refresh button
  return (
    <div className="flex justify-between items-start">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Πίνακας Ελέγχου</h1>
        {/* ... */}
      </div>
      <Button
        onClick={() => window.location.reload()}
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
      >
        <RotateCcw className="h-4 w-4" />
        Ανανέωση
      </Button>
    </div>
  )
}
```

**4. Admin Page Integration (`app/admin/page.tsx`)**:
```tsx
export default function AdminPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const { triggerRefresh } = useRefresh() // Get trigger function
  
  const handleAddLamination = async () => {
    // ... validation and job creation
    
    dummyDB.addLaminationJob(newJob)
    
    toast({
      title: "Επιτυχία",
      description: `Προστέθηκε πλαστικοποίηση για τον χρήστη ${selectedUserData.displayName}. Μπορείτε να δείτε τη νέα εγγραφή στον Πίνακα Ελέγχου.`,
    })
    
    // Trigger refresh to update dashboard
    triggerRefresh()
    
    // Reset form
    setSelectedUser("")
    setLaminationType("A4")
    setQuantity("1")
    setSelectedDate(new Date().toISOString().split('T')[0])
  }
}
```

**Key Features**:
- **Global State Management**: Uses React Context for cross-component communication
- **Automatic Updates**: Dashboard data refreshes automatically when new jobs are added
- **Manual Refresh**: Added refresh button for manual data updates
- **User Feedback**: Toast notifications inform users about successful additions
- **Form Reset**: Automatically resets form after successful submission

**Benefits**:
- **Real-time Updates**: Users see new data immediately without page refresh
- **Better UX**: Seamless workflow between admin and dashboard pages
- **Consistent State**: All components stay synchronized with the latest data
- **Performance**: No full page reloads, only data refetching

**Usage Pattern**:
1. User fills out lamination form in admin page
2. User clicks "Προσθήκη Χρέους Πλαστικοποιητή" button
3. Job is added to database
4. `triggerRefresh()` is called
5. Dashboard automatically refreshes its data
6. New job appears in "Ιστορικό Πλαστικοποιήσεων" table
7. User receives success notification with guidance

**Technical Notes**:
- Uses React Context for global state management
- Leverages `useEffect` dependencies for automatic re-fetching
- Maintains existing filtering and pagination state
- Works with both admin and regular user views
- Preserves all existing functionality while adding real-time updates

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
- Lamination Jobs Table (`components/lamination-jobs-table.tsx`)

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

### Machine Filter Stats Cards Fix (December 2024)

**Problem**: When users selected "Πλαστικοποίηση" in the machine filter on the dashboard, the stats cards still showed βιβλιοδεσία (binding) statistics above 0, instead of only showing laminator statistics.

**Root Cause**: The machine filter logic was incorrectly including binding types (`spiral`, `colored_cardboard`, `plastic_cover`) when the "lamination" filter was selected, instead of only including laminator types (`A3`, `A4`, `A5`, `cards`).

**Solution**: Fixed the machine filter logic to correctly separate laminator and binding types based on the `calculateLaminationStatistics` function categorization.

**Changes Made**:

**Dashboard Page (`app/dashboard/page.tsx`)**:
- **Before**: When `machineFilter === "lamination"`, included all types: `["A3", "A4", "A5", "cards", "spiral", "colored_cardboard", "plastic_cover"]`
- **After**: When `machineFilter === "lamination"`, only includes laminator types: `["A3", "A4", "A5", "cards"]`
- **Before**: When `machineFilter === "binding"`, included binding types: `["spiral", "colored_cardboard", "plastic_cover"]`
- **After**: When `machineFilter === "binding"`, only includes binding types: `["spiral", "colored_cardboard", "plastic_cover"]` (unchanged)

**Technical Implementation**:
- Aligned the machine filter logic with the `calculateLaminationStatistics` function categorization
- **Laminator types**: `["A3", "A4", "A5", "cards"]` - for Πλαστικοποίηση machine
- **Binding types**: `["spiral", "colored_cardboard", "plastic_cover"]` - for Βιβλιοδεσία machine
- Added clear comments explaining the categorization

**Key Benefits**:
- **Accurate Filtering**: Machine filter now correctly separates laminator and binding operations
- **Consistent Statistics**: Stats cards now accurately reflect the selected machine type
- **Better User Experience**: Users can properly analyze data by machine type
- **Logical Separation**: Clear distinction between laminator and binding operations

**Files Modified**:
- `app/dashboard/page.tsx` - Fixed machine filter logic in `applyFilters` function

**Testing Considerations**:
- Verify that selecting "Πλαστικοποίηση" only shows laminator stats (A3, A4, A5, cards)
- Verify that selecting "Βιβλιοδεσία" only shows binding stats (spiral, colored_cardboard, plastic_cover)
- Verify that selecting "Όλα" shows all stats
- Verify that stats cards update correctly when switching between machine filters

### Clear Search Box Button Enhancement (December 2024)

**Problem**: Users requested the ability to quickly clear search terms in the printing and lamination pages without having to manually delete the text or use the "Clear Filters" button.

**Solution**: Added clear search buttons (X icon) that appear inside search input fields when there's text, providing a quick and intuitive way to clear search terms.

**Changes Made**:



**2. PrintFilters Component (`components/print-filters.tsx`)**:
- **Before**: Basic search input in dashboard print filters
- **After**: Search input with clear button functionality
- **Import**: Added X icon import from lucide-react
- **Styling**: Maintained blue color scheme consistent with print theme

**3. LaminationFilters Component (`components/lamination-filters.tsx`)**:
- **Before**: Basic search input in dashboard lamination filters
- **After**: Search input with clear button functionality
- **Import**: Added X icon import from lucide-react
- **Styling**: Maintained green color scheme consistent with lamination theme

**Technical Implementation**:
- **Conditional Rendering**: Clear button only appears when `searchTerm` has value
- **Positioning**: Absolute positioning within relative container for proper placement
- **Responsive Design**: Button adapts to input field size and maintains proper spacing
- **Accessibility**: Proper button attributes and hover states for better UX
- **Consistent Styling**: Maintains existing color schemes and design patterns

**Key Features**:
- **Quick Clear**: Single click to clear search term
- **Visual Feedback**: Clear button only appears when needed
- **Consistent UX**: Same behavior across all search inputs
- **Non-intrusive**: Button doesn't interfere with normal typing
- **Responsive**: Works well on different screen sizes

**Files Modified**:
- `components/print-filters.tsx` - Added clear button to print filters search
- `components/lamination-filters.tsx` - Added clear button to lamination filters search

**Benefits**:
- **Improved User Experience**: Faster and more intuitive search clearing
- **Reduced Friction**: No need to manually delete text or find clear filters button
- **Consistent Interface**: Same clear functionality across all search inputs
- **Better Accessibility**: Clear visual indication of clear functionality
- **Mobile Friendly**: Easy to tap clear button on mobile devices

**Testing Considerations**:
- Verify clear button appears when typing in search field
- Verify clear button disappears when search field is empty
- Verify clicking clear button removes search text
- Verify clear button works on mobile devices
- Verify clear button maintains proper styling across different themes

### XLSX Export Access Extension for Υπεύθυνος Users (December 2024)

**Problem**: The XLSX export functionality was restricted to only admin users, but users with "Υπεύθυνος" (responsible) access level also needed the ability to export data for their teams and areas of responsibility.

**Solution**: Extended the XLSX export functionality to allow both admin and Υπεύθυνος users to export data, while maintaining the restriction for regular users.

**Changes Made**:

**Dashboard Page (`app/dashboard/page.tsx`)**:
- **Before**: All export buttons were restricted with `user.accessLevel === "admin"`
- **After**: Export buttons now allow both admin and Υπεύθυνος users with `(user.accessLevel === "admin" || user.accessLevel === "Υπεύθυνος")`

**Specific Export Functions Updated**:
1. **Combined Debt Table Export**: Allows Υπεύθυνος users to export debt/credit data for their responsible teams
2. **Income History Export**: Allows Υπεύθυνος users to export income data for their areas of responsibility
3. **Print Jobs Export**: Allows Υπεύθυνος users to export print job history for their teams
4. **Lamination Jobs Export**: Allows Υπεύθυνος users to export lamination job history for their teams

**Technical Implementation**:
- **Conditional Logic**: Updated all export button visibility conditions from single admin check to admin OR Υπεύθυνος check
- **Consistent Pattern**: Applied the same pattern across all export buttons: `{(user.accessLevel === "admin" || user.accessLevel === "Υπεύθυνος") && (...)}`
- **No Functionality Changes**: Export logic itself remains unchanged, only access control was modified
- **Data Scope**: Υπεύθυνος users can only export data for teams/areas they are responsible for (existing data filtering logic handles this)

**Key Benefits**:
- **Enhanced Role Functionality**: Υπεύθυνος users can now perform data exports for their teams
- **Improved Workflow**: Team leaders can generate reports without needing admin assistance
- **Maintained Security**: Regular users still cannot access export functionality
- **Consistent Access Control**: Aligns with existing role-based data access patterns

**Files Modified**:
- `app/dashboard/page.tsx` - Updated export button access conditions for all four export functions

**Access Control Summary**:
- **Admin Users**: Full access to all export functionality (unchanged)
- **Υπεύθυνος Users**: Access to export functionality for their responsible teams/areas (new)
- **Regular Users**: No access to export functionality (unchanged)

**Testing Considerations**:
- Verify admin users can still access all export functionality
- Verify Υπεύθυνος users can see and use export buttons
- Verify Υπεύθυνος users can only export data for their responsible teams
- Verify regular users cannot see export buttons
- Verify all export formats and data remain correct
- Verify export functionality works with existing filters and data scope

**Future Considerations**:
- Consider adding audit logging for export actions by Υπεύθυνος users
- Implement export permission granularity if needed for specific data types
- Add user feedback when export is not available
- Consider role-based export format restrictions if needed
