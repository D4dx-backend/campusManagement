# Project Structure

## Repository Layout

```
d4mediaCampus/
├── api/                    # Backend Node.js API
├── front/                  # Frontend React application
└── *.md                    # Project documentation
```

## Backend Structure (`api/`)

```
api/
├── src/
│   ├── config/            # Configuration files
│   │   └── database.ts    # MongoDB connection setup
│   ├── middleware/        # Express middleware
│   │   ├── auth.ts        # JWT authentication & authorization
│   │   ├── errorHandler.ts
│   │   ├── notFound.ts
│   │   └── validation.ts
│   ├── models/           # MongoDB/Mongoose models
│   │   ├── User.ts       # User accounts and roles
│   │   ├── Branch.ts     # School branches
│   │   ├── Student.ts    # Student records
│   │   ├── Staff.ts      # Staff/employee records
│   │   ├── Class.ts      # Academic classes
│   │   ├── Division.ts   # Class divisions/sections
│   │   ├── Department.ts # Academic departments
│   │   ├── FeePayment.ts # Fee collection records
│   │   ├── PayrollEntry.ts # Salary payments
│   │   ├── Expense.ts    # Institutional expenses
│   │   ├── TextBook.ts   # Textbook inventory
│   │   └── ActivityLog.ts # Audit trail
│   ├── routes/           # API route handlers
│   │   ├── auth.ts       # Authentication endpoints
│   │   ├── users.ts      # User management
│   │   ├── students.ts   # Student CRUD operations
│   │   ├── staff.ts      # Staff management
│   │   ├── fees.ts       # Fee collection
│   │   ├── payroll.ts    # Payroll processing
│   │   ├── expenses.ts   # Expense tracking
│   │   ├── textbooks.ts  # Textbook management
│   │   ├── reports.ts    # Analytics and reports
│   │   └── [others].ts   # Additional modules
│   ├── types/            # TypeScript type definitions
│   ├── validations/      # Joi validation schemas
│   ├── utils/            # Utility functions and seeders
│   └── server.ts         # Main application entry point
├── dist/                 # Compiled JavaScript output
├── uploads/              # File upload storage
├── package.json
├── tsconfig.json
└── .env                  # Environment variables
```

## Frontend Structure (`front/`)

```
front/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── ui/          # shadcn/ui base components
│   │   ├── forms/       # Form components
│   │   ├── layout/      # Layout components (Sidebar, Header)
│   │   └── [feature]/   # Feature-specific components
│   ├── pages/           # Route components
│   │   ├── Dashboard.tsx
│   │   ├── Students.tsx
│   │   ├── Staff.tsx
│   │   ├── Fees.tsx
│   │   ├── Payroll.tsx
│   │   ├── Expenses.tsx
│   │   └── [others].tsx
│   ├── contexts/        # React contexts
│   │   └── AuthContext.tsx # Authentication state
│   ├── hooks/           # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useStudents.ts
│   │   └── [others].ts
│   ├── services/        # API service functions
│   │   ├── api.ts       # Axios configuration
│   │   ├── authService.ts
│   │   ├── studentService.ts
│   │   └── [others].ts
│   ├── lib/             # Utility libraries
│   │   └── utils.ts     # Helper functions
│   ├── types/           # TypeScript type definitions
│   └── App.tsx          # Main application component
├── public/              # Static assets
├── dist/                # Build output
├── package.json
├── vite.config.ts
├── tailwind.config.ts
└── .env                 # Environment variables
```

## Key Architectural Patterns

### Backend Patterns

- **MVC Architecture** - Models, routes (controllers), middleware
- **Repository Pattern** - Mongoose models abstract database operations
- **Middleware Chain** - Authentication → Authorization → Validation → Route Handler
- **Error Handling** - Centralized error handling with custom error classes
- **Branch Isolation** - Automatic filtering by branch for non-super-admin users

### Frontend Patterns

- **Component Composition** - Small, reusable components
- **Custom Hooks** - Business logic abstraction with React Query
- **Service Layer** - API calls abstracted into service functions
- **Context for Global State** - Authentication state management
- **Protected Routes** - Route-level authentication guards

## File Naming Conventions

### Backend
- **Models**: PascalCase (e.g., `User.ts`, `FeePayment.ts`)
- **Routes**: camelCase (e.g., `students.ts`, `expenseCategories.ts`)
- **Middleware**: camelCase (e.g., `auth.ts`, `errorHandler.ts`)

### Frontend
- **Components**: PascalCase (e.g., `Dashboard.tsx`, `StudentForm.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useStudents.ts`)
- **Services**: camelCase with Service suffix (e.g., `studentService.ts`)
- **Pages**: PascalCase (e.g., `Students.tsx`, `Payroll.tsx`)

## Import/Export Patterns

### Backend
```typescript
// Named exports for utilities
export { connectDB } from './config/database';

// Default exports for main modules
export default router; // in route files
```

### Frontend
```typescript
// Default exports for components
export default Dashboard;

// Named exports for hooks and services
export { useStudents, useCreateStudent };
```

## Environment-Specific Files

- **Development**: `.env` files for local configuration
- **Production**: Environment variables set in deployment platform
- **Testing**: Separate test databases and configurations
- **Documentation**: Extensive `.md` files for setup and integration guides

## Branch-Based Data Architecture

All data models include `branchId` field for multi-branch support:
- Super Admin can access all branches
- Branch-level users automatically filtered to their branch
- Consistent data isolation across all modules