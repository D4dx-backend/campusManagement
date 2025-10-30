// Script to update remaining pages with enhanced functionality
const fs = require('fs');
const path = require('path');

const pagesToUpdate = [
  'Divisions',
  'Departments', 
  'Designations',
  'ExpenseCategories',
  'IncomeCategories',
  'UserAccess'
];

const getImportUpdates = () => `
import { DataTable } from '@/components/ui/data-table';
import { formatters } from '@/utils/exportUtils';
import { pageConfigurations } from '@/utils/pageTemplates';`;

const getStateUpdates = () => `
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [filterValues, setFilterValues] = useState({});`;

const getApiUpdates = (hookName) => `
  const { data: response, isLoading, error } = ${hookName}({
    page: currentPage,
    limit: itemsPerPage,
    search: searchTerm,
    ...filterValues,
  });`;

const getConfigUpdates = (configKey) => `
  // Get data from API responses
  const data = response?.data || [];
  const pagination = response?.pagination;

  // Get configuration from templates
  const config = pageConfigurations.${configKey};

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
  };`;

const getDataTableWrapper = (searchPlaceholder, filename, iconName, emptyMessage) => `
        <DataTable
          searchPlaceholder="${searchPlaceholder}"
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          filters={config.filters}
          filterValues={filterValues}
          onFilterChange={handleFilterChange}
          onFilterReset={handleFilterReset}
          exportConfig={{
            filename: '${filename}',
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
            icon: <${iconName} className="w-12 h-12 text-muted-foreground mx-auto mb-4" />,
            message: "${emptyMessage}"
          }}
        >`;

console.log('Page update templates ready. Apply manually to each page:');
console.log('1. Add imports');
console.log('2. Add state variables');
console.log('3. Update API hook');
console.log('4. Add configuration');
console.log('5. Replace Card with DataTable');