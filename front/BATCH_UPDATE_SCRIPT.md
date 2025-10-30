# Batch Update Script for Remaining Pages

## ExpenseCategories - Continue Update

Add after API hooks:
```typescript
const categories = categoriesResponse?.data || [];
const pagination = categoriesResponse?.pagination;

// Get configuration from templates
const config = pageConfigurations.expenseCategories;

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

Replace main Card with:
```typescript
<DataTable
  searchPlaceholder="Search by category name..."
  searchValue={searchTerm}
  onSearchChange={setSearchTerm}
  filters={config.filters}
  filterValues={filterValues}
  onFilterChange={handleFilterChange}
  onFilterReset={handleFilterReset}
  exportConfig={{
    filename: 'expense_categories',
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
  data={categories}
  isLoading={isLoading}
  error={error}
  emptyState={{
    icon: <Tag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />,
    message: "No expense categories found"
  }}
>
  {/* Keep existing card content */}
</DataTable>
```

## IncomeCategories - Full Update Pattern

1. Add imports:
```typescript
import { DataTable } from '@/components/ui/data-table';
import { formatters } from '@/utils/exportUtils';
import { pageConfigurations } from '@/utils/pageTemplates';
```

2. Add state:
```typescript
const [itemsPerPage, setItemsPerPage] = useState(10);
const [filterValues, setFilterValues] = useState({});
```

3. Update API hook:
```typescript
const { data: categoriesResponse, isLoading, error } = useIncomeCategories({
  page: currentPage,
  limit: itemsPerPage,
  search: searchTerm,
  ...filterValues,
});
```

4. Add configuration:
```typescript
const categories = categoriesResponse?.data || [];
const pagination = categoriesResponse?.pagination;
const config = pageConfigurations.incomeCategories;
// Add filter handlers...
```

5. Replace Card with DataTable (filename: 'income_categories', icon: Tag)

## UserAccess - Full Update Pattern

Same pattern as above but:
- filename: 'user_access'
- icon: Users
- searchPlaceholder: "Search by username or email..."
- pageKey: userAccess

All pages will have:
- Export functionality (Excel/CSV)
- Advanced filters
- Enhanced pagination
- Consistent UI