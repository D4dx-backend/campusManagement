# Remaining Pages Update Guide

## Pages to Update:
- Divisions
- Departments  
- Designations
- ExpenseCategories
- IncomeCategories
- UserAccess

## Step-by-Step Update Process:

### 1. Add Imports (Add these after existing imports):
```typescript
import { DataTable } from '@/components/ui/data-table';
import { formatters } from '@/utils/exportUtils';
import { pageConfigurations } from '@/utils/pageTemplates';
```

### 2. Add State Variables (Add after existing state):
```typescript
const [itemsPerPage, setItemsPerPage] = useState(10);
const [filterValues, setFilterValues] = useState({});
```

### 3. Update API Hook (Replace existing API hook):
```typescript
// Replace limit: 10 with limit: itemsPerPage
// Add ...filterValues to the parameters
const { data: response, isLoading, error } = useYourHook({
  page: currentPage,
  limit: itemsPerPage,
  search: searchTerm,
  ...filterValues,
});
```

### 4. Add Configuration (Add after data definitions):
```typescript
// Get data from API responses
const data = response?.data || [];
const pagination = response?.pagination;

// Get configuration from templates
const config = pageConfigurations.yourPageKey;

// Filter handlers
const handleFilterChange = (values: any) => {
  setFilterValues(values);
  setCurrentPage(1);
};

const handleFilterReset = () => {
  setFilterValues({});
  setCurrentPage(1);
};

const handleItemsPerPageChange = (newItemsPerPage: number) => {
  setItemsPerPage(newItemsPerPage);
  setCurrentPage(1);
};
```

### 5. Replace Card with DataTable:
```typescript
<DataTable
  searchPlaceholder="Your search placeholder..."
  searchValue={searchTerm}
  onSearchChange={setSearchTerm}
  filters={config.filters}
  filterValues={filterValues}
  onFilterChange={handleFilterChange}
  onFilterReset={handleFilterReset}
  exportConfig={{
    filename: 'your_filename',
    columns: config.exportColumns.map(col => ({
      ...col,
      formatter: col.formatter ? formatters[col.formatter] : undefined
    }))
  }}
  pagination={{
    currentPage,
    totalPages: pagination?.pages || 1,
    totalItems: pagination?.total || 0,
    itemsPerPage,
    onPageChange: setCurrentPage,
    onItemsPerPageChange: handleItemsPerPageChange
  }}
  data={data}
  isLoading={isLoading}
  error={error}
  emptyState={{
    icon: <YourIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />,
    message: "Your empty message"
  }}
>
  {/* Keep your existing card content here */}
</DataTable>
```

## Page-Specific Configurations:

### Divisions:
- pageKey: `divisions`
- filename: `divisions`
- searchPlaceholder: `"Search by division name or class..."`
- icon: `Users`
- emptyMessage: `"No divisions found"`

### Departments:
- pageKey: `departments`
- filename: `departments`
- searchPlaceholder: `"Search by department name..."`
- icon: `Building`
- emptyMessage: `"No departments found"`

### Designations:
- pageKey: `designations`
- filename: `designations`
- searchPlaceholder: `"Search by designation name..."`
- icon: `UserCheck`
- emptyMessage: `"No designations found"`

### ExpenseCategories:
- pageKey: `expenseCategories`
- filename: `expense_categories`
- searchPlaceholder: `"Search by category name..."`
- icon: `Tag`
- emptyMessage: `"No expense categories found"`

### IncomeCategories:
- pageKey: `incomeCategories`
- filename: `income_categories`
- searchPlaceholder: `"Search by category name..."`
- icon: `Tag`
- emptyMessage: `"No income categories found"`

### UserAccess:
- pageKey: `userAccess`
- filename: `user_access`
- searchPlaceholder: `"Search by username or email..."`
- icon: `Users`
- emptyMessage: `"No users found"`

## Summary of Changes:
✅ **Completed Pages:**
- Students - Full implementation
- Staff - Full implementation  
- Expenses - Full implementation
- Fees - Full implementation
- Payroll - Full implementation
- TextBooks - Full implementation

🔄 **Remaining Pages:** (Apply template above)
- Divisions
- Departments
- Designations
- ExpenseCategories
- IncomeCategories
- UserAccess

## Key Features Added:
1. **Export Functionality** - Excel and CSV export with custom formatting
2. **Advanced Filters** - Dropdown, date range, text, and number filters
3. **Enhanced Pagination** - Items per page selection, jump to pages
4. **Responsive Design** - Mobile-friendly filter popover
5. **Consistent UI** - Unified data table component across all pages

All pages will now have consistent export, filtering, and pagination functionality!