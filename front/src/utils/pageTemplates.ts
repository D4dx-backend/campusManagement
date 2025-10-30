// Template configurations for different pages
export const pageConfigurations = {
  payroll: {
    filters: [
      {
        key: 'department',
        label: 'Department',
        type: 'select' as const,
        options: [] // Will be populated from API
      },
      {
        key: 'designation',
        label: 'Designation', 
        type: 'select' as const,
        options: [] // Will be populated from API
      },
      {
        key: 'payrollMonth',
        label: 'Payroll Month',
        type: 'date' as const
      },
      {
        key: 'salary',
        label: 'Salary Range',
        type: 'number' as const,
        placeholder: 'Minimum salary'
      }
    ],
    exportColumns: [
      { key: 'employeeId', label: 'Employee ID' },
      { key: 'employeeName', label: 'Employee Name' },
      { key: 'department', label: 'Department' },
      { key: 'designation', label: 'Designation' },
      { key: 'basicSalary', label: 'Basic Salary', formatter: 'currency' },
      { key: 'allowances', label: 'Allowances', formatter: 'currency' },
      { key: 'deductions', label: 'Deductions', formatter: 'currency' },
      { key: 'netSalary', label: 'Net Salary', formatter: 'currency' },
      { key: 'payrollMonth', label: 'Payroll Month', formatter: 'date' },
      { key: 'status', label: 'Status', formatter: 'capitalize' }
    ]
  },
  
  textbooks: {
    filters: [
      {
        key: 'class',
        label: 'Class',
        type: 'select' as const,
        options: [] // Will be populated from API
      },
      {
        key: 'subject',
        label: 'Subject',
        type: 'select' as const,
        options: [] // Will be populated from API
      },
      {
        key: 'publisher',
        label: 'Publisher',
        type: 'text' as const,
        placeholder: 'Enter publisher name'
      },
      {
        key: 'price',
        label: 'Price Range',
        type: 'number' as const,
        placeholder: 'Minimum price'
      }
    ],
    exportColumns: [
      { key: 'title', label: 'Book Title' },
      { key: 'author', label: 'Author' },
      { key: 'publisher', label: 'Publisher' },
      { key: 'class', label: 'Class' },
      { key: 'subject', label: 'Subject' },
      { key: 'isbn', label: 'ISBN' },
      { key: 'price', label: 'Price', formatter: 'currency' },
      { key: 'stock', label: 'Stock Quantity' },
      { key: 'status', label: 'Status', formatter: 'capitalize' }
    ]
  },

  classes: {
    filters: [
      {
        key: 'academicYear',
        label: 'Academic Year',
        type: 'select' as const,
        options: [
          { value: '2024-25', label: '2024-25' },
          { value: '2023-24', label: '2023-24' },
          { value: '2022-23', label: '2022-23' }
        ]
      },
      {
        key: 'status',
        label: 'Status',
        type: 'select' as const,
        options: [
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' }
        ]
      },
      {
        key: 'capacity',
        label: 'Capacity Range',
        type: 'number' as const,
        placeholder: 'Minimum capacity'
      }
    ],
    exportColumns: [
      { key: 'name', label: 'Class Name' },
      { key: 'academicYear', label: 'Academic Year' },
      { key: 'capacity', label: 'Total Capacity' },
      { key: 'enrolledStudents', label: 'Enrolled Students' },
      { key: 'availableCapacity', label: 'Available Capacity' },
      { key: 'classTeacher', label: 'Class Teacher' },
      { key: 'status', label: 'Status', formatter: 'capitalize' },
      { key: 'createdAt', label: 'Created Date', formatter: 'date' }
    ]
  },

  divisions: {
    filters: [
      {
        key: 'class',
        label: 'Class',
        type: 'select' as const,
        options: [] // Will be populated from API
      },
      {
        key: 'classTeacher',
        label: 'Class Teacher',
        type: 'select' as const,
        options: [] // Will be populated from API
      },
      {
        key: 'capacity',
        label: 'Capacity Range',
        type: 'number' as const,
        placeholder: 'Minimum capacity'
      }
    ],
    exportColumns: [
      { key: 'name', label: 'Division Name' },
      { key: 'className', label: 'Class' },
      { key: 'capacity', label: 'Capacity' },
      { key: 'enrolledStudents', label: 'Enrolled Students' },
      { key: 'availableCapacity', label: 'Available Capacity' },
      { key: 'classTeacherName', label: 'Class Teacher' },
      { key: 'status', label: 'Status', formatter: 'capitalize' }
    ]
  },

  departments: {
    filters: [
      {
        key: 'status',
        label: 'Status',
        type: 'select' as const,
        options: [
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' }
        ]
      },
      {
        key: 'createdAt',
        label: 'Created Date',
        type: 'dateRange' as const
      }
    ],
    exportColumns: [
      { key: 'name', label: 'Department Name' },
      { key: 'description', label: 'Description' },
      { key: 'headOfDepartment', label: 'Head of Department' },
      { key: 'staffCount', label: 'Staff Count' },
      { key: 'status', label: 'Status', formatter: 'capitalize' },
      { key: 'createdAt', label: 'Created Date', formatter: 'date' }
    ]
  },

  designations: {
    filters: [
      {
        key: 'department',
        label: 'Department',
        type: 'select' as const,
        options: [] // Will be populated from API
      },
      {
        key: 'status',
        label: 'Status',
        type: 'select' as const,
        options: [
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' }
        ]
      }
    ],
    exportColumns: [
      { key: 'name', label: 'Designation Name' },
      { key: 'department', label: 'Department' },
      { key: 'description', label: 'Description' },
      { key: 'staffCount', label: 'Staff Count' },
      { key: 'status', label: 'Status', formatter: 'capitalize' },
      { key: 'createdAt', label: 'Created Date', formatter: 'date' }
    ]
  },

  expenseCategories: {
    filters: [
      {
        key: 'status',
        label: 'Status',
        type: 'select' as const,
        options: [
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' }
        ]
      }
    ],
    exportColumns: [
      { key: 'name', label: 'Category Name' },
      { key: 'description', label: 'Description' },
      { key: 'totalExpenses', label: 'Total Expenses', formatter: 'currency' },
      { key: 'expenseCount', label: 'Expense Count' },
      { key: 'status', label: 'Status', formatter: 'capitalize' },
      { key: 'createdAt', label: 'Created Date', formatter: 'date' }
    ]
  },

  incomeCategories: {
    filters: [
      {
        key: 'status',
        label: 'Status',
        type: 'select' as const,
        options: [
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' }
        ]
      }
    ],
    exportColumns: [
      { key: 'name', label: 'Category Name' },
      { key: 'description', label: 'Description' },
      { key: 'totalIncome', label: 'Total Income', formatter: 'currency' },
      { key: 'incomeCount', label: 'Income Count' },
      { key: 'status', label: 'Status', formatter: 'capitalize' },
      { key: 'createdAt', label: 'Created Date', formatter: 'date' }
    ]
  },

  userAccess: {
    filters: [
      {
        key: 'role',
        label: 'Role',
        type: 'select' as const,
        options: [
          { value: 'admin', label: 'Admin' },
          { value: 'teacher', label: 'Teacher' },
          { value: 'staff', label: 'Staff' },
          { value: 'accountant', label: 'Accountant' }
        ]
      },
      {
        key: 'status',
        label: 'Status',
        type: 'select' as const,
        options: [
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' },
          { value: 'suspended', label: 'Suspended' }
        ]
      },
      {
        key: 'lastLogin',
        label: 'Last Login',
        type: 'dateRange' as const
      }
    ],
    exportColumns: [
      { key: 'username', label: 'Username' },
      { key: 'email', label: 'Email' },
      { key: 'name', label: 'Full Name' },
      { key: 'role', label: 'Role', formatter: 'capitalize' },
      { key: 'permissions', label: 'Permissions' },
      { key: 'status', label: 'Status', formatter: 'capitalize' },
      { key: 'lastLogin', label: 'Last Login', formatter: 'date' },
      { key: 'createdAt', label: 'Created Date', formatter: 'date' }
    ]
  }
};