// Utility functions for mapping frontend filters to API parameters

export interface ApiFilterParams {
  page: number;
  limit: number;
  search: string;
  [key: string]: any;
}

export interface FilterMapping {
  [frontendKey: string]: string | ((value: any) => { [key: string]: any });
}

export const createApiFilters = (
  currentPage: number,
  itemsPerPage: number,
  searchTerm: string,
  filterValues: any,
  filterMapping: FilterMapping
): ApiFilterParams => {
  const apiFilters: ApiFilterParams = {
    page: currentPage,
    limit: itemsPerPage,
    search: searchTerm,
  };

  // Apply filter mappings
  Object.entries(filterValues).forEach(([key, value]) => {
    if (value && filterMapping[key]) {
      const mapping = filterMapping[key];
      
      if (typeof mapping === 'string') {
        // Simple key mapping
        apiFilters[mapping] = value;
      } else if (typeof mapping === 'function') {
        // Complex mapping function
        const mappedValues = mapping(value);
        Object.assign(apiFilters, mappedValues);
      }
    }
  });

  return apiFilters;
};

// Common filter mappings for different pages
export const filterMappings = {
  students: {
    class: 'classId',
    gender: 'gender',
    transport: 'transport',
    dateOfBirth_from: 'dateOfBirthFrom',
    dateOfBirth_to: 'dateOfBirthTo',
  },
  
  staff: {
    designation: 'designation',
    department: 'department',
    dateOfJoining_from: 'dateOfJoiningFrom',
    dateOfJoining_to: 'dateOfJoiningTo',
    salary: 'minSalary',
  },
  
  expenses: {
    category: 'category',
    paymentMethod: 'paymentMethod',
    date_from: 'dateFrom',
    date_to: 'dateTo',
    amount: 'minAmount',
  },
  
  fees: {
    feeType: 'feeType',
    paymentMethod: 'paymentMethod',
    paymentDate_from: 'paymentDateFrom',
    paymentDate_to: 'paymentDateTo',
    amount: 'minAmount',
  },
  
  payroll: {
    department: 'department',
    designation: 'designation',
    payrollMonth: (value: string) => {
      const date = new Date(value);
      return {
        month: date.getMonth() + 1,
        year: date.getFullYear(),
      };
    },
    salary: 'minNetSalary',
  },
  
  textbooks: {
    class: 'classId',
    subject: 'subject',
    publisher: 'publisher',
    price: 'minPrice',
  },
  
  textbookIndents: {
    status: 'status',
    paymentStatus: 'paymentStatus',
    class: 'classId',
    issueDate_from: 'issueDateFrom',
    issueDate_to: 'issueDateTo',
    expectedReturnDate_from: 'expectedReturnDateFrom',
    expectedReturnDate_to: 'expectedReturnDateTo',
    paymentMethod: 'paymentMethod',
    amount: 'minAmount',
  },
  
  divisions: {
    class: 'classId',
    classTeacher: 'classTeacherId',
    capacity: 'minCapacity',
  },
  
  departments: {
    status: 'status',
    createdAt_from: 'createdAtFrom',
    createdAt_to: 'createdAtTo',
  },
  
  designations: {
    department: 'department',
    status: 'status',
  },
  
  expenseCategories: {
    status: 'status',
  },
  
  incomeCategories: {
    status: 'status',
  },
  
  userAccess: {
    role: 'role',
    status: 'status',
    lastLogin_from: 'lastLoginFrom',
    lastLogin_to: 'lastLoginTo',
  },
};

// Helper function to create export data fetcher
export const createExportDataFetcher = (
  apiHook: any,
  searchTerm: string,
  filterValues: any,
  filterMapping: FilterMapping,
  fallbackData: any[]
) => {
  return async () => {
    try {
      const exportFilters = createApiFilters(1, 10000, searchTerm, filterValues, filterMapping);
      // Remove pagination for export
      delete exportFilters.page;
      
      // Call the API hook or service
      // This would need to be implemented based on your API structure
      // For now, return fallback data
      return fallbackData;
    } catch (error) {
      console.error('Export data fetch failed:', error);
      return fallbackData;
    }
  };
};