# Receipt Configuration - Quick Start Guide

## Access Requirements

Receipt configuration is available to:
- ✅ **Super Admin** - Can manage all branches
- ✅ **Branch Admin** - Can manage their own branch only

No additional permissions needed!

## First Time Setup

### 1. Clean Up Old Permissions (One-time)
```bash
cd d4mediaCampus-api
npm run remove-receipt-permission
```

### 2. Restart API
```bash
npm run dev
```

### 3. Users Logout/Login
All users should logout and login again to refresh their session.

## Using Receipt Configuration

### For Branch Admins
1. Login to your account
2. Navigate to Receipt Configuration page
3. Fill in your branch details:
   - School name
   - Address
   - Contact information
   - Logo (optional)
   - Principal name
   - Tax/Registration numbers
4. Click "Create Configuration"

### For Super Admins
- Can view and manage receipt configurations for all branches
- Can create configurations for any branch
- Full access to all receipt settings

## Troubleshooting

### "Access Denied" Error
- ✅ Check your role is `super_admin` or `branch_admin`
- ✅ Logout and login again
- ✅ Contact system administrator if role is incorrect

### Cannot See Receipt Config Page
- ✅ Verify you're logged in
- ✅ Check your role in user profile
- ✅ Clear browser cache and try again

### Branch Admin Cannot Edit Config
- ✅ Verify the config belongs to your branch
- ✅ Check that you're assigned to the correct branch
- ✅ Logout and login to refresh session

## API Endpoints

All endpoints require authentication and appropriate role:

```
GET    /api/receipt-configs              (Super Admin only)
GET    /api/receipt-configs/branch/:id   (Branch access check)
POST   /api/receipt-configs              (Admin + Branch Admin)
PUT    /api/receipt-configs/:id          (Admin + Branch Admin)
DELETE /api/receipt-configs/:id          (Admin + Branch Admin)
```

## Need Help?

See detailed documentation:
- `RECEIPT_CONFIG_ROLE_BASED_ACCESS.md` - Full implementation details
- `RECEIPT_CONFIG_MIGRATION_SUMMARY.md` - Migration guide
