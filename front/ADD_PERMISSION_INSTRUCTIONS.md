# Receipt Configuration Access - DEPRECATED

## ⚠️ Notice
**This document is deprecated.** Receipt configuration now uses role-based access control instead of permission-based access.

## Current Implementation
Receipt configuration is now accessible to:
- **Super Admin** (`super_admin`)
- **Branch Admin** (`branch_admin`)

No additional permissions are required. See `RECEIPT_CONFIG_ROLE_BASED_ACCESS.md` for details.

To remove old permissions from your database, run: `node removeReceiptPermission.js`

---

## Old Instructions (For Reference Only)

The following instructions are kept for reference but are no longer needed:

### Option 1: SQL Database (MySQL/PostgreSQL)
Run the SQL script:
```bash
mysql -u your_username -p your_database < add-receipt-permission.sql
```

### Option 2: MongoDB
Run the Node.js script:
```bash
# Install dependencies
npm install mongoose

# Set your database connection
export MONGODB_URI="mongodb://localhost:27017/your-database"

# Run the script
node add-receipt-permission.js
```

### Option 3: Manual Database Update
Add this permission object to the user's permissions array:

```json
{
  "module": "receipt-config",
  "actions": ["create", "read", "update", "delete"]
}
```

### Option 4: Admin Panel/API
If you have an admin interface, add the permission through your user management system.

### Option 5: Direct Database Query

**For MongoDB:**
```javascript
db.users.updateMany(
  { role: "branch_admin" },
  { 
    $push: { 
      permissions: {
        module: "receipt-config",
        actions: ["create", "read", "update", "delete"]
      }
    }
  }
)
```

**For MySQL/PostgreSQL:**
```sql
UPDATE users 
SET permissions = JSON_ARRAY_APPEND(
  permissions, 
  '$', 
  JSON_OBJECT(
    'module', 'receipt-config',
    'actions', JSON_ARRAY('create', 'read', 'update', 'delete')
  )
) 
WHERE role = 'branch_admin';
```

## After Adding Permission

1. **Restart your API server** (if needed)
2. **Have the branch admin logout and login again** to refresh their token
3. **Verify the permission appears** in the debug info on the receipt config page
4. **Test creating a receipt configuration** - it should now work!

## Expected Result

After adding the permission, the branch admin's permissions should include:
```
receipt-config:create,read,update,delete
```

And the blue setup card will disappear, allowing full access to the receipt configuration feature.