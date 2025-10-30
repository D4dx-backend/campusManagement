# Receipt Configuration - Edit Mode Implementation

## Overview

The receipt configuration page now implements a proper edit/view mode pattern:
- **First time**: Form is editable, shows "Save Configuration" button
- **After creation**: Form is read-only, shows "Edit Configuration" button
- **In edit mode**: Form is editable, shows "Update Configuration" and "Cancel" buttons

## User Flow

### 1. First Time Setup (No Config Exists)
```
┌─────────────────────────────────────┐
│  Receipt Configuration              │
│  Create your receipt template       │
├─────────────────────────────────────┤
│  [Info Card: First Time Setup]     │
├─────────────────────────────────────┤
│  School Name: [________]  ← Editable│
│  Address: [________]                │
│  ...                                │
│                                     │
│  [Save Configuration]               │
└─────────────────────────────────────┘
```

### 2. View Mode (Config Exists)
```
┌─────────────────────────────────────┐
│  Receipt Configuration              │
│  Update your receipt template       │
├─────────────────────────────────────┤
│  School Name: ABC School  ← Disabled│
│  Address: 123 Main St               │
│  ...                                │
│                                     │
│  [Edit Configuration]               │
└─────────────────────────────────────┘
```

### 3. Edit Mode (User Clicked Edit)
```
┌─────────────────────────────────────┐
│  Receipt Configuration              │
│  Update your receipt template       │
├─────────────────────────────────────┤
│  School Name: [ABC School] ← Editable│
│  Address: [123 Main St]             │
│  ...                                │
│                                     │
│  [Cancel] [Update Configuration]   │
└─────────────────────────────────────┘
```

## Implementation Details

### State Management
```typescript
const [isEditing, setIsEditing] = useState(false);

// Set editing state based on config existence
useEffect(() => {
  if (config) {
    setIsEditing(false); // View mode when config exists
  } else {
    setIsEditing(true);  // Edit mode when no config (first time)
  }
}, [config]);
```

### Form Fields
All form fields are disabled when not in edit mode:
```typescript
<Input
  value={formData.schoolName}
  onChange={...}
  disabled={!isEditing}  // ← Disabled in view mode
/>
```

### Buttons Logic
```typescript
{config && !isEditing ? (
  // View mode - show Edit button
  <Button onClick={handleEdit}>
    Edit Configuration
  </Button>
) : (
  // Edit mode - show Update/Save and Cancel
  <>
    {config && (
      <Button variant="outline" onClick={handleCancelEdit}>
        Cancel
      </Button>
    )}
    <Button type="submit">
      {config ? 'Update Configuration' : 'Save Configuration'}
    </Button>
  </>
)}
```

### Handlers

#### Edit Handler
```typescript
const handleEdit = () => {
  setIsEditing(true);
};
```

#### Cancel Handler
```typescript
const handleCancelEdit = () => {
  setIsEditing(false);
  // Reset form to original config values
  if (config) {
    setFormData({
      schoolName: config.schoolName,
      address: config.address,
      // ... reset all fields
    });
    setLogoPreview(config.logo || '');
    setLogoFile(null);
  }
};
```

#### Submit Handler
```typescript
const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (config) {
    await updateMutation.mutateAsync({ id: config._id, data: submitData });
    setIsEditing(false); // Exit edit mode after update
  } else {
    await createMutation.mutateAsync(submitData);
    setIsEditing(false); // Exit edit mode after creation
  }
};
```

## Backend Enforcement

The backend ensures only ONE config per branch:

```typescript
// Check if ANY config already exists for this branch
const existingConfig = await ReceiptConfig.findOne({ branchId });
if (existingConfig) {
  return res.status(400).json({
    message: 'Receipt configuration already exists for this branch. Please update the existing configuration instead.'
  });
}
```

## Features

### ✅ Implemented
- Read-only view mode after creation
- Edit button to enable editing
- Cancel button to discard changes
- Form fields disabled in view mode
- Logo upload only visible in edit mode
- Switch disabled in view mode
- Automatic mode switching after save/update
- Reset form on cancel

### 🎯 User Benefits
1. **Clear state**: Users know if they're viewing or editing
2. **Prevent accidents**: Can't accidentally modify config
3. **Easy updates**: One click to edit, one click to cancel
4. **No confusion**: Clear button labels (Edit vs Update)
5. **Data safety**: Cancel restores original values

## Testing Checklist

- [ ] First time: Form is editable, shows "Save Configuration"
- [ ] After save: Form becomes read-only, shows "Edit Configuration"
- [ ] Click Edit: Form becomes editable, shows "Update" and "Cancel"
- [ ] Click Cancel: Form returns to read-only, changes discarded
- [ ] Click Update: Changes saved, form returns to read-only
- [ ] Logo upload: Only visible in edit mode
- [ ] All fields: Disabled in view mode, enabled in edit mode
- [ ] Switch: Disabled in view mode, enabled in edit mode

## Error Handling

If someone tries to create a second config (shouldn't happen with UI, but API prevents it):

```typescript
if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
  toast({
    title: 'Configuration Already Exists',
    description: 'A receipt configuration already exists for your branch. The page will refresh to load it.',
  });
  setTimeout(() => window.location.reload(), 2000);
}
```

## Summary

The receipt configuration now follows a standard edit/view pattern:
1. **Create once** - First time setup
2. **View by default** - Read-only display
3. **Edit when needed** - Click Edit button
4. **Update or Cancel** - Save changes or discard

This prevents accidental modifications and provides a clear, professional user experience.
