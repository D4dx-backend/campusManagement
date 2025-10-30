# Debug "Access Denied" Error

## Quick Debug Steps

### Step 1: Check Your User Role

Run the debug script to see all users and their roles:

```bash
export MONGODB_URI="your-mongodb-connection-string"
node debugUserRole.js
```

Look for:
- Your user's role value (should be exactly `branch_admin` or `super_admin`)
- Any extra spaces or different casing
- The permissions array

### Step 2: Test API Authorization

After restarting your API server, test the debug endpoint:

```bash
# Get your auth token from browser localStorage or login response
# Then test:

curl -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  http://localhost:5000/api/debug/me
```

This will show:
- Your current role
- Whether you can access receipt config
- All your permissions

### Step 3: Test Receipt Config Authorization

```bash
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  http://localhost:5000/api/debug/test-receipt-auth
```

If this returns success, the authorization works!
If it returns 403, there's an issue with your role.

### Step 4: Check Common Issues

#### Issue 1: Role has extra spaces
```javascript
// Bad (has space)
role: "branch_admin "

// Good
role: "branch_admin"
```

**Fix:**
```javascript
db.users.updateMany(
  {},
  [{ $set: { role: { $trim: { input: "$role" } } } }]
)
```

#### Issue 2: Wrong role value
```javascript
// Bad
role: "branchAdmin"  // camelCase
role: "branch-admin" // hyphen instead of underscore

// Good
role: "branch_admin" // underscore
```

**Fix:**
```javascript
db.users.updateOne(
  { email: "your-email@example.com" },
  { $set: { role: "branch_admin" } }
)
```

#### Issue 3: User status is inactive
```javascript
status: "inactive"
```

**Fix:**
```javascript
db.users.updateOne(
  { email: "your-email@example.com" },
  { $set: { status: "active" } }
)
```

#### Issue 4: Token is stale
After any database changes, you need to:
1. Logout from the frontend
2. Login again to get a new token
3. Try accessing receipt config again

### Step 5: Manual Database Fix

If your user has the wrong role, fix it directly:

```javascript
// Connect to MongoDB
use your_database_name

// Check current user
db.users.findOne({ email: "your-email@example.com" })

// Update role to branch_admin
db.users.updateOne(
  { email: "your-email@example.com" },
  { 
    $set: { 
      role: "branch_admin",
      status: "active"
    }
  }
)

// Verify the change
db.users.findOne({ email: "your-email@example.com" }, { role: 1, status: 1 })
```

### Step 6: Check API Logs

When you try to access receipt config, check your API console for logs:
- Look for "Access denied" messages
- Check what role the API sees
- Verify the authorization middleware is being called

### Step 7: Frontend Token Check

In your browser console:
```javascript
// Check stored token
localStorage.getItem('auth_token')

// Check stored user
JSON.parse(localStorage.getItem('user') || '{}')
```

The stored user should have:
```json
{
  "role": "branch_admin",
  "status": "active",
  ...
}
```

## Quick Fix Commands

### Reset a user to branch admin:
```bash
# Using MongoDB shell
mongosh "your-connection-string"
use your_database_name
db.users.updateOne(
  { email: "user@example.com" },
  { $set: { role: "branch_admin", status: "active" } }
)
```

### Remove receipt-config permissions (they're not needed anymore):
```bash
node removeReceiptPermission.js
```

### Restart API and clear browser:
```bash
# Terminal 1: Restart API
cd d4mediaCampus-api
npm run dev

# Browser: Clear storage and login again
# Open DevTools > Application > Storage > Clear site data
```

## Still Having Issues?

1. Share the output of `node debugUserRole.js`
2. Share the output of the `/api/debug/me` endpoint
3. Share any error messages from the API console
4. Check if the API is actually running and accessible

## Expected Working State

When everything is correct:
- User role: `"branch_admin"` or `"super_admin"`
- User status: `"active"`
- Token is fresh (logout/login after any DB changes)
- API returns 200 for `/api/debug/test-receipt-auth`
- Receipt config page loads without "Access Denied" error
