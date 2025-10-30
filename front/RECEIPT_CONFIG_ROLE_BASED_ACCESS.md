# Receipt Configuration - Role-Based Access

## Overview
Receipt configuration management has been updated to use **role-based access control** instead of permission-based access. This simplifies the system and ensures consistent access control.

## Access Control

### Who Can Manage Receipt Configurations?
Only the following roles can create, read, update, and delete receipt configurations:
- **Super Admin** (`super_admin`)
- **Branch Admin** (`branch_admin`)

### What Changed?
- **Before**: Users needed the `receipt-config` permission in their permissions array
- **After**: Access is determined solely by user role (no permission check required)

## Implementation Details

### Backend (API)
The receipt configuration routes use role-based authorization:
```typescript
router.post('/', authorize('super_admin', 'branch_admin'), async (req, res) => {
  // Create receipt config
});

router.put('/:id', authorize('super_admin', 'branch_admin'), async (req, res) => {
  // Update receipt config
});

router.delete('/:id', authorize('super_admin', 'branch_admin'), async (req, res) => {
  // Delete receipt config
});
```

### Frontend
The frontend no longer checks for `receipt-config` permission. Access is granted based on user role.

## Migration

### Remove Existing Permissions
To clean up existing `receipt-config` permissions from the database, run:

```bash
# From the root directory
node removeReceiptPermission.js

# Or from the API directory
cd d4mediaCampus-api
npm run remove-receipt-permission
```

This script will:
1. Connect to your MongoDB database
2. Remove the `receipt-config` permission from all users
3. Display the number of users updated

### Update Seeded Users
The seeder and user update utilities have been updated to exclude the `receipt-config` permission. New users created through these utilities will not have this permission.

## Benefits

1. **Simpler Access Control**: No need to manage individual permissions for receipt configuration
2. **Consistent Behavior**: All admins and branch admins automatically have access
3. **Easier Maintenance**: Fewer permission checks to maintain
4. **Better UX**: Users don't see confusing permission-related messages

## Branch Isolation

Branch admins can only manage receipt configurations for their assigned branch. The API enforces this by checking:
```typescript
if (user.role !== 'super_admin' && user.branchId !== branchId) {
  return res.status(403).json({ message: 'Access denied to this branch' });
}
```

Super admins can manage receipt configurations for all branches.
