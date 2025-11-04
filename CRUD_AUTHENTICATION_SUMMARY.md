# Complete CRUD Functions & Authentication Summary

## 🔐 Authentication Middleware

All routes use `authenticate` middleware which validates JWT tokens from the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## 📋 Module Permissions

Each module uses `checkPermission(module, action)` where:
- **module**: The module name (e.g., 'students', 'staff', 'classes')
- **action**: 'create', 'read', 'update', 'delete'

**Super Admin & Branch Admin** have all permissions automatically.

---

## 🗂️ COMPLETE CRUD FUNCTIONS

### 1. **Authentication** (`/api/auth`)
| Method | Endpoint | Auth | Role Required |
|--------|----------|------|---------------|
| POST | `/login` | ❌ Public | None |
| POST | `/register` | ✅ Required | super_admin |
| GET | `/profile` | ✅ Required | Any authenticated user |
| PUT | `/change-pin` | ✅ Required | Any authenticated user |
| POST | `/logout` | ✅ Required | Any authenticated user |

---

### 2. **Users** (`/api/users`)
| Method | Endpoint | Auth | Permission |
|--------|----------|------|------------|
| GET | `/` | ✅ | users:read |
| GET | `/:id` | ✅ | users:read |
| POST | `/` | ✅ | users:create (Super Admin only) |
| PUT | `/:id` | ✅ | users:update (Super Admin only) |
| DELETE | `/:id` | ✅ | users:delete (Super Admin only) |

**Special Note**: Super Admin only can manage users.

---

### 3. **Branches** (`/api/branches`)
| Method | Endpoint | Auth | Permission |
|--------|----------|------|------------|
| GET | `/` | ✅ | branches:read (Super Admin only) |
| GET | `/:id` | ✅ | branches:read (Super Admin only) |
| POST | `/` | ✅ | branches:create (Super Admin only) |
| PUT | `/:id` | ✅ | branches:update (Super Admin only) |
| DELETE | `/:id` | ✅ | branches:delete (Super Admin only) |

**Special Note**: Branch-level users cannot access this route, automatically filtered by middleware.

---

### 4. **Students** (`/api/students`)
| Method | Endpoint | Auth | Permission |
|--------|----------|------|------------|
| GET | `/` | ✅ | students:read |
| GET | `/:id` | ✅ | students:read |
| POST | `/` | ✅ | students:create |
| PUT | `/:id` | ✅ | students:update |
| DELETE | `/:id` | ✅ | students:delete |
| GET | `/stats/overview` | ✅ | students:read |

**Branch Filter**: Non-super admins only see their branch's students.

---

### 5. **Staff** (`/api/staff`)
| Method | Endpoint | Auth | Permission |
|--------|----------|------|------------|
| GET | `/` | ✅ | staff:read |
| GET | `/:id` | ✅ | staff:read |
| POST | `/` | ✅ | staff:create |
| PUT | `/:id` | ✅ | staff:update |
| DELETE | `/:id` | ✅ | staff:delete |
| GET | `/stats/overview` | ✅ | staff:read |

**Branch Filter**: Non-super admins only see their branch's staff.

---

### 6. **Classes** (`/api/classes`)
| Method | Endpoint | Auth | Permission |
|--------|----------|------|------------|
| GET | `/` | ✅ | classes:read |
| GET | `/:id` | ✅ | classes:read |
| POST | `/` | ✅ | classes:create |
| PUT | `/:id` | ✅ | classes:update |
| DELETE | `/:id` | ✅ | classes:delete |
| GET | `/stats/overview` | ✅ | classes:read |

**Branch Filter**: Non-super admins only see their branch's classes.

**Super Admin Note**: Must provide `branchId` when creating classes.

---

### 7. **Divisions** (`/api/divisions`)
| Method | Endpoint | Auth | Permission |
|--------|----------|------|------------|
| GET | `/` | ✅ | divisions:read |
| GET | `/:id` | ✅ | divisions:read |
| POST | `/` | ✅ | divisions:create |
| PUT | `/:id` | ✅ | divisions:update |
| DELETE | `/:id` | ✅ | divisions:delete |
| GET | `/stats/overview` | ✅ | divisions:read |

**Branch Filter**: Non-super admins only see their branch's divisions.

---

### 8. **Departments** (`/api/departments`)
| Method | Endpoint | Auth | Permission |
|--------|----------|------|------------|
| GET | `/` | ✅ | departments:read |
| GET | `/:id` | ✅ | departments:read |
| POST | `/` | ✅ | departments:create |
| PUT | `/:id` | ✅ | departments:update |
| DELETE | `/:id` | ✅ | departments:delete |
| GET | `/stats/overview` | ✅ | departments:read |

**Branch Filter**: Non-super admins only see their branch's departments.

---

### 9. **Designations** (`/api/designations`)
| Method | Endpoint | Auth | Permission |
|--------|----------|------|------------|
| GET | `/` | ✅ | designations:read |
| GET | `/:id` | ✅ | designations:read |
| POST | `/` | ✅ | designations:create |
| PUT | `/:id` | ✅ | designations:update |
| DELETE | `/:id` | ✅ | designations:delete |
| GET | `/stats/overview` | ✅ | designations:read |

**Branch Filter**: Non-super admins only see their branch's designations.

---

### 10. **Fees** (`/api/fees`)
| Method | Endpoint | Auth | Permission |
|--------|----------|------|------------|
| GET | `/` | ✅ | fees:read |
| GET | `/:id` | ✅ | fees:read |
| POST | `/` | ✅ | fees:create |
| PUT | `/:id` | ✅ | fees:update |
| DELETE | `/:id` | ✅ | fees:delete |
| GET | `/stats/overview` | ✅ | fees:read |

**Branch Filter**: Non-super admins only see their branch's fees.

---

### 11. **Payroll** (`/api/payroll`)
| Method | Endpoint | Auth | Permission |
|--------|----------|------|------------|
| GET | `/` | ✅ | payroll:read |
| GET | `/:id` | ✅ | payroll:read |
| POST | `/` | ✅ | payroll:create |
| PUT | `/:id` | ✅ | payroll:update |
| DELETE | `/:id` | ✅ | payroll:delete |
| GET | `/stats/overview` | ✅ | payroll:read |

**Branch Filter**: Non-super admins only see their branch's payroll entries.

---

### 12. **Expenses** (`/api/expenses`)
| Method | Endpoint | Auth | Permission |
|--------|----------|------|------------|
| GET | `/` | ✅ | expenses:read |
| GET | `/:id` | ✅ | expenses:read |
| POST | `/` | ✅ | expenses:create |
| PUT | `/:id` | ✅ | expenses:update |
| DELETE | `/:id` | ✅ | expenses:delete |
| GET | `/stats/overview` | ✅ | expenses:read |

**Branch Filter**: Non-super admins only see their branch's expenses.

---

### 13. **Expense Categories** (`/api/expense-categories`)
| Method | Endpoint | Auth | Permission |
|--------|----------|------|------------|
| GET | `/` | ✅ | expense-categories:read |
| GET | `/:id` | ✅ | expense-categories:read |
| POST | `/` | ✅ | expense-categories:create |
| PUT | `/:id` | ✅ | expense-categories:update |
| DELETE | `/:id` | ✅ | expense-categories:delete |
| GET | `/stats/overview` | ✅ | expense-categories:read |

**Branch Filter**: Non-super admins only see their branch's expense categories.

---

### 14. **Income Categories** (`/api/income-categories`)
| Method | Endpoint | Auth | Permission |
|--------|----------|------|------------|
| GET | `/` | ✅ | income-categories:read |
| GET | `/:id` | ✅ | income-categories:read |
| POST | `/` | ✅ | income-categories:create |
| PUT | `/:id` | ✅ | income-categories:update |
| DELETE | `/:id` | ✅ | income-categories:delete |
| GET | `/stats/overview` | ✅ | income-categories:read |

**Branch Filter**: Non-super admins only see their branch's income categories.

---

### 15. **Textbooks** (`/api/textbooks`)
| Method | Endpoint | Auth | Permission |
|--------|----------|------|------------|
| GET | `/` | ✅ | textbooks:read |
| GET | `/:id` | ✅ | textbooks:read |
| POST | `/` | ✅ | textbooks:create |
| PUT | `/:id` | ✅ | textbooks:update |
| DELETE | `/:id` | ✅ | textbooks:delete |
| GET | `/stats/overview` | ✅ | textbooks:read |

**Branch Filter**: Non-super admins only see their branch's textbooks.

---

### 16. **Textbook Indents** (`/api/textbook-indents`)
| Method | Endpoint | Auth | Permission |
|--------|----------|------|------------|
| GET | `/` | ✅ | textbook-indents:read |
| GET | `/:id` | ✅ | textbook-indents:read |
| POST | `/` | ✅ | textbook-indents:create |
| PUT | `/:id` | ✅ | textbook-indents:update |
| DELETE | `/:id` | ✅ | textbook-indents:delete |
| POST | `/:id/return` | ✅ | textbook-indents:update |
| POST | `/:id/generate-receipt` | ✅ | textbook-indents:read |
| GET | `/stats/overview` | ✅ | textbook-indents:read |

**Branch Filter**: Non-super admins only see their branch's textbook indents.

---

### 17. **Reports** (`/api/reports`)
| Method | Endpoint | Auth | Permission |
|--------|----------|------|------------|
| GET | `/dashboard-stats` | ✅ | reports:read |
| GET | `/financial-summary` | ✅ | reports:read |
| GET | `/academic-summary` | ✅ | reports:read |

**Branch Filter**: Non-super admins only see their branch's reports.

---

### 18. **Activity Logs** (`/api/activity-logs`)
| Method | Endpoint | Auth | Permission |
|--------|----------|------|------------|
| GET | `/` | ✅ | activity_logs:read |
| GET | `/:id` | ✅ | activity_logs:read |

**Branch Filter**: Non-super admins only see their branch's activity logs.

---

### 19. **Receipt Config** (`/api/receipt-configs`)
| Method | Endpoint | Auth | Permission |
|--------|----------|------|------------|
| GET | `/` | ✅ | receipt-configs:read |
| GET | `/branch/:branchId` | ✅ | receipt-configs:read |
| POST | `/` | ✅ | receipt-configs:create (Super Admin/Branch Admin) |
| PUT | `/:id` | ✅ | receipt-configs:update (Super Admin/Branch Admin) |

**Special Note**: One receipt config per branch.

---

### 20. **Upload** (`/api/upload`)
| Method | Endpoint | Auth | Permission |
|--------|----------|------|------------|
| POST | `/logo` | ✅ | Any authenticated user |

**Purpose**: Upload branch logos.

---

### 21. **Debug** (`/api/debug`)
| Method | Endpoint | Auth | Permission |
|--------|----------|------|------------|
| GET | `/me` | ✅ | Any authenticated user |
| GET | `/permissions` | ✅ | Any authenticated user |

**Purpose**: Debug authentication and permissions (Development only).

---

## 🔒 Role-Based Access Summary

### Super Admin
- ✅ Full access to ALL modules
- ✅ Can manage branches
- ✅ Can create users for any branch
- ✅ Can access all branches' data
- ⚠️ Must specify `branchId` when creating classes/divisions/students/etc.

### Branch Admin
- ✅ Full access to their branch's modules
- ✅ Can manage all data in their branch
- ❌ Cannot access other branches
- ❌ Cannot manage branches
- ✅ Automatically uses their `branchId` from JWT

### Accountant
- ✅ Read-only: students, staff
- ✅ Full CRUD: fees, payroll, expenses
- ✅ Read-only: reports
- ❌ Cannot manage academic data (classes, divisions)

### Teacher
- ✅ Read/Update: students, classes, divisions
- ✅ Read-only: textbooks, reports
- ❌ Cannot access financial data

### Staff
- ✅ Access based on explicit permissions
- ⚠️ Must be granted specific permissions

---

## 🎯 Common Query Parameters

All GET endpoints support:
```
?page=1&limit=10&search=term&status=active&sortBy=name&sortOrder=asc
```

**Default Values**:
- `page`: 1
- `limit`: 10 (max: 100)
- `sortBy`: varies by module
- `sortOrder`: asc

---

## ✅ Response Format

All responses follow this structure:

**Success**:
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

**Error**:
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error info"
}
```

---

## 🚨 Error Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden (no permission) |
| 404 | Not Found |
| 500 | Server Error |

---

**Last Updated**: 2024
**API Version**: v1.0

