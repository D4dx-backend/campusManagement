# MongoDB ObjectId Comparison Best Practices

## The Problem

When comparing MongoDB ObjectIds in TypeScript/JavaScript, you can't use simple equality operators:

```typescript
// ❌ WRONG - This will always be false
if (user.branchId === branchId) { ... }
if (user.branchId !== branchId) { ... }
```

## Why It Fails

- `user.branchId` is a MongoDB ObjectId object
- `branchId` from request params/body is a string
- JavaScript compares object references, not values
- Even two ObjectIds with the same value are different objects

## Solutions (From Worst to Best)

### ❌ Bad: Direct Comparison
```typescript
if (user.branchId === branchId) {
  // This will NEVER be true
}
```
**Problem**: Compares object reference, not value

### ⚠️ Okay: String Conversion
```typescript
if (user.branchId?.toString() === branchId) {
  // This works but not ideal
}
```
**Problem**: Loses type safety, requires manual null checking

### ✅ Best: MongoDB's .equals() Method
```typescript
import { Types } from 'mongoose';

if (user.branchId && new Types.ObjectId(user.branchId).equals(branchId)) {
  // This is the proper way
}
```
**Benefits**:
- Type-safe
- Works with ObjectId or string
- Null-safe with explicit check
- MongoDB recommended approach

## Common Patterns

### Checking if ObjectIds Match
```typescript
import { Types } from 'mongoose';

// Pattern 1: User has access to their own branch
if (user.role !== 'super_admin' && user.branchId && !new Types.ObjectId(user.branchId).equals(branchId)) {
  return res.status(403).json({ message: 'Access denied' });
}

// Pattern 2: Checking if two ObjectIds are the same
if (document.ownerId && new Types.ObjectId(document.ownerId).equals(user._id)) {
  // User owns this document
}

// Pattern 3: Finding in array
const hasAccess = user.allowedBranches?.some(
  allowedBranch => new Types.ObjectId(allowedBranch).equals(requestedBranchId)
);
```

### Null Safety
```typescript
// Always check if ObjectId exists before comparing
if (user.branchId && new Types.ObjectId(user.branchId).equals(branchId)) {
  // Safe comparison
}

// Or use optional chaining with fallback
const isSameBranch = user.branchId 
  ? new Types.ObjectId(user.branchId).equals(branchId)
  : false;
```

### Comparing Two ObjectIds
```typescript
// When both are ObjectIds
if (objectId1 && objectId2 && new Types.ObjectId(objectId1).equals(objectId2)) {
  // They match
}

// When comparing with document _id
if (user._id && new Types.ObjectId(user._id).equals(document.createdBy)) {
  // User created this document
}
```

## Real-World Example

### Before (Buggy)
```typescript
router.post('/', async (req, res) => {
  const { branchId } = req.body;
  const user = req.user;

  // ❌ This always fails
  if (user.branchId !== branchId) {
    return res.status(403).json({ message: 'Access denied' });
  }
  
  // Create resource...
});
```

### After (Fixed)
```typescript
import { Types } from 'mongoose';

router.post('/', async (req, res) => {
  const { branchId } = req.body;
  const user = req.user;

  // ✅ Proper ObjectId comparison
  if (user.role !== 'super_admin' && user.branchId && !new Types.ObjectId(user.branchId).equals(branchId)) {
    return res.status(403).json({ message: 'Access denied' });
  }
  
  // Create resource...
});
```

## TypeScript Types

```typescript
import { Types } from 'mongoose';

// ObjectId can be:
type ObjectIdType = Types.ObjectId | string;

// Helper function for comparison
function compareObjectIds(id1: ObjectIdType, id2: ObjectIdType): boolean {
  if (!id1 || !id2) return false;
  return new Types.ObjectId(id1).equals(id2);
}

// Usage
if (compareObjectIds(user.branchId, requestedBranchId)) {
  // They match
}
```

## Common Mistakes to Avoid

### Mistake 1: Using == or ===
```typescript
// ❌ WRONG
if (user._id === document.userId) { }

// ✅ CORRECT
if (user._id && new Types.ObjectId(user._id).equals(document.userId)) { }
```

### Mistake 2: Forgetting Null Checks
```typescript
// ❌ WRONG - Can throw error if user.branchId is null
if (new Types.ObjectId(user.branchId).equals(branchId)) { }

// ✅ CORRECT
if (user.branchId && new Types.ObjectId(user.branchId).equals(branchId)) { }
```

### Mistake 3: Comparing toString() on Both Sides
```typescript
// ⚠️ WORKS but not ideal
if (user.branchId?.toString() === branchId.toString()) { }

// ✅ BETTER
if (user.branchId && new Types.ObjectId(user.branchId).equals(branchId)) { }
```

## Performance Note

The `.equals()` method is optimized by MongoDB and is very fast. Don't worry about performance - use it!

## Summary

**Always use MongoDB's `.equals()` method for ObjectId comparisons:**

```typescript
import { Types } from 'mongoose';

// The pattern to remember:
if (objectId && new Types.ObjectId(objectId).equals(otherObjectId)) {
  // They match
}
```

This is:
- ✅ Type-safe
- ✅ Null-safe (with explicit check)
- ✅ Works with ObjectId or string
- ✅ MongoDB recommended
- ✅ Best practice
