# d4mediaCampus API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
All endpoints (except login) require JWT token in Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error information"
}
```

## Authentication Endpoints

### POST /auth/login
Login user with mobile and PIN.

**Request Body:**
```json
{
  "mobile": "9999999999",
  "pin": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "jwt_token_here",
    "user": {
      "id": "user_id",
      "name": "User Name",
      "email": "user@example.com",
      "mobile": "9999999999",
      "role": "branch_admin",
      "branchId": "branch_id",
      "permissions": [...],
      "status": "active",
      "lastLogin": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### POST /auth/register
Register new user (Super Admin only).

**Request Body:**
```json
{
  "email": "user@example.com",
  "mobile": "9999999998",
  "pin": "123456",
  "name": "User Name",
  "role": "branch_admin",
  "branchId": "branch_id",
  "permissions": [
    {
      "module": "students",
      "actions": ["create", "read", "update", "delete"]
    }
  ]
}
```

### GET /auth/profile
Get current user profile.

### PUT /auth/change-pin
Change user PIN.

**Request Body:**
```json
{
  "currentPin": "123456",
  "newPin": "654321"
}
```

### POST /auth/logout
Logout user.

## Student Management

### GET /students
Get all students with pagination and filters.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10, max: 100)
- `search` (string): Search by name, admission no, or guardian name
- `class` (string): Filter by class
- `section` (string): Filter by section
- `status` (string): Filter by status (active/inactive)
- `transport` (string): Filter by transport (school/own/none)
- `sortBy` (string): Sort field (name/admissionNo/class/createdAt)
- `sortOrder` (string): Sort order (asc/desc)

### GET /students/:id
Get student by ID.

### POST /students
Create new student.

**Request Body:**
```json
{
  "admissionNo": "ADM001",
  "name": "Student Name",
  "class": "Class 1",
  "section": "A",
  "dateOfBirth": "2015-01-01",
  "guardianName": "Guardian Name",
  "guardianPhone": "9876543210",
  "guardianEmail": "guardian@example.com",
  "address": "Student Address",
  "transport": "school",
  "transportRoute": "Route 1"
}
```

### PUT /students/:id
Update student.

### DELETE /students/:id
Delete student.

### GET /students/stats/overview
Get student statistics.

## Staff Management

### GET /staff
Get all staff members with pagination and filters.

**Query Parameters:**
- `page`, `limit`, `search`, `sortBy`, `sortOrder` (same as students)
- `department` (string): Filter by department
- `designation` (string): Filter by designation
- `status` (string): Filter by status

### GET /staff/:id
Get staff member by ID.

### POST /staff
Create new staff member.

**Request Body:**
```json
{
  "employeeId": "EMP001",
  "name": "Staff Name",
  "designation": "Teacher",
  "department": "Mathematics",
  "dateOfJoining": "2024-01-01",
  "phone": "9876543210",
  "email": "staff@example.com",
  "address": "Staff Address",
  "salary": 50000
}
```

### PUT /staff/:id
Update staff member.

### DELETE /staff/:id
Delete staff member.

### GET /staff/stats/overview
Get staff statistics.

## Class Management

### GET /classes
Get all classes.

### GET /classes/:id
Get class by ID with divisions.

### POST /classes
Create new class.

**Request Body:**
```json
{
  "name": "Class 1",
  "description": "First standard",
  "academicYear": "2024-25"
}
```

### PUT /classes/:id
Update class.

### DELETE /classes/:id
Delete class.

### GET /classes/stats/overview
Get class statistics.

## Division Management

### GET /divisions
Get all divisions.

### GET /divisions/:id
Get division by ID.

### GET /divisions/class/:classId
Get divisions by class ID.

### POST /divisions
Create new division.

**Request Body:**
```json
{
  "classId": "class_id",
  "name": "A",
  "capacity": 30,
  "classTeacherId": "staff_id"
}
```

### PUT /divisions/:id
Update division.

### DELETE /divisions/:id
Delete division.

## Department Management

### GET /departments
Get all departments.

### GET /departments/:id
Get department by ID.

### POST /departments
Create new department.

**Request Body:**
```json
{
  "name": "Mathematics",
  "code": "MATH",
  "description": "Mathematics department",
  "headOfDepartment": "Dr. Math Teacher"
}
```

### PUT /departments/:id
Update department.

### DELETE /departments/:id
Delete department.

### GET /departments/stats/overview
Get department statistics.

## Fee Management

### GET /fees
Get all fee payments.

**Query Parameters:**
- `page`, `limit`, `search`, `sortBy`, `sortOrder` (standard pagination)
- `feeType` (string): Filter by fee type
- `paymentMethod` (string): Filter by payment method
- `status` (string): Filter by status
- `startDate`, `endDate` (date): Date range filter

### POST /fees
Record fee payment.

**Request Body:**
```json
{
  "studentId": "student_id",
  "feeType": "tuition",
  "amount": 5000,
  "paymentMethod": "cash",
  "remarks": "Monthly fee"
}
```

### GET /fees/stats/overview
Get fee statistics.

## Payroll Management

### GET /payroll
Get all payroll entries.

### GET /payroll/:id
Get payroll entry by ID.

### POST /payroll
Create payroll entry.

**Request Body:**
```json
{
  "staffId": "staff_id",
  "month": "January",
  "year": 2024,
  "allowances": 2000,
  "deductions": 500,
  "paymentMethod": "bank"
}
```

### PUT /payroll/:id
Update payroll entry.

### DELETE /payroll/:id
Delete payroll entry.

### GET /payroll/stats/overview
Get payroll statistics.

### GET /payroll/pending/:month/:year
Get staff without payroll for specific month/year.

## Expense Management

### GET /expenses
Get all expenses.

### GET /expenses/:id
Get expense by ID.

### POST /expenses
Create expense.

**Request Body:**
```json
{
  "date": "2024-01-01",
  "category": "utilities",
  "description": "Electricity bill",
  "amount": 5000,
  "paymentMethod": "bank",
  "approvedBy": "Principal",
  "remarks": "Monthly electricity bill"
}
```

### PUT /expenses/:id
Update expense.

### DELETE /expenses/:id
Delete expense.

### GET /expenses/stats/overview
Get expense statistics.

## Textbook Management

### GET /textbooks
Get all textbooks.

**Query Parameters:**
- Standard pagination parameters
- `class` (string): Filter by class
- `subject` (string): Filter by subject
- `academicYear` (string): Filter by academic year
- `availability` (string): Filter by availability (available/out_of_stock/low_stock)

### GET /textbooks/:id
Get textbook by ID.

### POST /textbooks
Create textbook.

**Request Body:**
```json
{
  "bookCode": "MATH001",
  "title": "Mathematics Grade 1",
  "subject": "Mathematics",
  "class": "Class 1",
  "publisher": "ABC Publications",
  "price": 250,
  "quantity": 100,
  "academicYear": "2024-25"
}
```

### PUT /textbooks/:id
Update textbook.

### DELETE /textbooks/:id
Delete textbook.

### PUT /textbooks/:id/stock
Update book stock.

**Request Body:**
```json
{
  "adjustment": 10,
  "reason": "New stock received"
}
```

### GET /textbooks/stats/overview
Get textbook statistics.

## Activity Logs

### GET /activity-logs
Get all activity logs.

**Query Parameters:**
- Standard pagination parameters
- `userId` (string): Filter by user ID
- `userRole` (string): Filter by user role
- `module` (string): Filter by module
- `action` (string): Filter by action
- `startDate`, `endDate` (date): Date range filter

### GET /activity-logs/:id
Get activity log by ID.

### GET /activity-logs/user/:userId
Get activity logs for specific user.

### GET /activity-logs/stats/overview
Get activity log statistics.

### DELETE /activity-logs/cleanup
Cleanup old activity logs (Super Admin only).

**Query Parameters:**
- `days` (number): Delete logs older than specified days (default: 90)

## Reports

### GET /reports/dashboard
Get dashboard overview report.

### GET /reports/financial
Get financial report.

**Query Parameters:**
- `startDate` (date): Start date (required)
- `endDate` (date): End date (required)
- `includeBreakdown` (boolean): Include detailed breakdown (default: true)

### GET /reports/students
Get student report.

### GET /reports/staff
Get staff report.

### GET /reports/fees
Get fee collection report.

**Query Parameters:**
- `startDate` (date): Start date (required)
- `endDate` (date): End date (required)

## Branch Management (Super Admin Only)

### GET /branches
Get all branches.

### GET /branches/:id
Get branch by ID.

### POST /branches
Create new branch.

### PUT /branches/:id
Update branch.

### DELETE /branches/:id
Delete branch.

## User Management (Super Admin Only)

### GET /users
Get all users.

### GET /users/:id
Get user by ID.

### PUT /users/:id
Update user.

### DELETE /users/:id
Delete user.

## Error Codes

- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate data)
- `500` - Internal Server Error

## Rate Limiting

- 100 requests per 15 minutes per IP address
- Applies to all `/api/*` endpoints

## Data Validation

All endpoints validate input data using Joi schemas. Common validation rules:

- **Mobile numbers**: Must be 10 digits
- **Email addresses**: Must be valid email format
- **PINs**: Must be 4-6 characters
- **Names**: 2-100 characters, trimmed
- **Amounts**: Must be non-negative numbers
- **Dates**: Must be valid date format

## Permissions System

Users have role-based permissions for different modules:

### Modules:
- `students`, `staff`, `classes`, `divisions`, `departments`
- `fees`, `payroll`, `expenses`, `textbooks`
- `reports`, `activity_logs`, `users`, `branches`

### Actions:
- `create`, `read`, `update`, `delete`

### Roles:
- **super_admin**: All permissions
- **branch_admin**: Full access to branch data
- **accountant**: Financial operations
- **teacher**: Academic operations
- **staff**: Limited access based on permissions