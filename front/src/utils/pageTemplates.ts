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
  },

  academicYears: {
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
      { key: 'name', label: 'Academic Year' },
      { key: 'startDate', label: 'Start Date', formatter: 'date' },
      { key: 'endDate', label: 'End Date', formatter: 'date' },
      { key: 'isCurrent', label: 'Current', formatter: 'boolean' },
      { key: 'status', label: 'Status', formatter: 'capitalize' }
    ]
  },

  subjects: {
    filters: [
      {
        key: 'classId',
        label: 'Class',
        type: 'select' as const,
        options: []
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
      { key: 'code', label: 'Subject Code' },
      { key: 'name', label: 'Subject Name' },
      { key: 'maxMark', label: 'Max Mark' },
      { key: 'passMark', label: 'Pass Mark' },
      { key: 'isOptional', label: 'Optional', formatter: 'boolean' },
      { key: 'status', label: 'Status', formatter: 'capitalize' }
    ]
  },

  exams: {
    filters: [
      {
        key: 'academicYear',
        label: 'Academic Year',
        type: 'select' as const,
        options: []
      },
      {
        key: 'examType',
        label: 'Exam Type',
        type: 'select' as const,
        options: [
          { value: 'term', label: 'Term Exam' },
          { value: 'quarterly', label: 'Quarterly Exam' },
          { value: 'half_yearly', label: 'Half Yearly Exam' },
          { value: 'annual', label: 'Annual Exam' },
          { value: 'class_test', label: 'Class Test' },
          { value: 'other', label: 'Other' }
        ]
      },
      {
        key: 'status',
        label: 'Status',
        type: 'select' as const,
        options: [
          { value: 'upcoming', label: 'Upcoming' },
          { value: 'ongoing', label: 'Ongoing' },
          { value: 'completed', label: 'Completed' },
          { value: 'cancelled', label: 'Cancelled' }
        ]
      }
    ],
    exportColumns: [
      { key: 'name', label: 'Exam Name' },
      { key: 'examType', label: 'Exam Type' },
      { key: 'academicYear', label: 'Academic Year' },
      { key: 'startDate', label: 'Start Date', formatter: 'date' },
      { key: 'endDate', label: 'End Date', formatter: 'date' },
      { key: 'status', label: 'Status', formatter: 'capitalize' }
    ]
  },

  leaveRequests: {
    filters: [
      {
        key: 'status',
        label: 'Status',
        type: 'select' as const,
        options: [
          { value: 'pending', label: 'Pending' },
          { value: 'approved', label: 'Approved' },
          { value: 'rejected', label: 'Rejected' }
        ]
      },
      {
        key: 'classId',
        label: 'Class',
        type: 'select' as const,
        options: []
      }
    ],
    exportColumns: [
      { key: 'studentName', label: 'Student Name' },
      { key: 'className', label: 'Class' },
      { key: 'section', label: 'Section' },
      { key: 'fromDate', label: 'From Date', formatter: 'date' },
      { key: 'toDate', label: 'To Date', formatter: 'date' },
      { key: 'reason', label: 'Reason' },
      { key: 'status', label: 'Status', formatter: 'capitalize' },
      { key: 'reviewNote', label: 'Review Note' }
    ]
  },

  feeTypeConfigs: {
    exportColumns: [
      { key: 'name', label: 'Fee Type Name' },
      { key: 'isCommon', label: 'Common for All Classes', formatter: 'boolean' },
      { key: 'isActive', label: 'Active', formatter: 'boolean' }
    ]
  },

  feeStructures: {
    exportColumns: [
      { key: 'title', label: 'Title' },
      { key: 'feeTypeName', label: 'Fee Type' },
      { key: 'isCommon', label: 'Common', formatter: 'boolean' },
      { key: 'className', label: 'Class' },
      { key: 'amount', label: 'Amount (BHD)', formatter: 'currency' },
      { key: 'staffDiscountPercent', label: 'Staff Discount (%)' },
      { key: 'academicYear', label: 'Academic Year' },
      { key: 'isActive', label: 'Active', formatter: 'boolean' }
    ]
  },

  branches: {
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
      { key: 'name', label: 'Branch Name' },
      { key: 'code', label: 'Code' },
      { key: 'address', label: 'Address' },
      { key: 'phone', label: 'Phone' },
      { key: 'email', label: 'Email' },
      { key: 'principalName', label: 'Principal' },
      { key: 'status', label: 'Status', formatter: 'capitalize' },
      { key: 'establishedDate', label: 'Established', formatter: 'date' }
    ]
  },

  organizations: {
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
      { key: 'name', label: 'Organization Name' },
      { key: 'code', label: 'Code' },
      { key: 'phone', label: 'Phone' },
      { key: 'email', label: 'Email' },
      { key: 'website', label: 'Website' },
      { key: 'subscriptionPlan', label: 'Plan' },
      { key: 'currency', label: 'Currency' },
      { key: 'maxBranches', label: 'Max Branches' },
      { key: 'status', label: 'Status', formatter: 'capitalize' }
    ]
  },

  domains: {
    exportColumns: [
      { key: 'domain', label: 'Domain' },
      { key: 'domainType', label: 'Type' },
      { key: 'status', label: 'Status', formatter: 'capitalize' },
      { key: 'sslStatus', label: 'SSL Status' },
      { key: 'isPrimary', label: 'Primary', formatter: 'boolean' }
    ]
  },

  transportRoutes: {
    exportColumns: [
      { key: 'routeCode', label: 'Route Code' },
      { key: 'routeName', label: 'Route Name' },
      { key: 'description', label: 'Description' },
      { key: 'status', label: 'Status', formatter: 'capitalize' }
    ]
  },

  activityLogs: {
    exportColumns: [
      { key: 'userName', label: 'User' },
      { key: 'userRole', label: 'Role' },
      { key: 'action', label: 'Action' },
      { key: 'module', label: 'Module' },
      { key: 'details', label: 'Details' },
      { key: 'ipAddress', label: 'IP Address' },
      { key: 'timestamp', label: 'Timestamp', formatter: 'date' }
    ]
  },
};