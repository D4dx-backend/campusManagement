# Debug: Logo Upload "No file uploaded" Error

## Issue
Logo upload fails with: `{success: false, message: "No file uploaded"}`

## Fixes Applied

### 1. Created Upload Endpoint
**File**: `d4mediaCampus-api/src/routes/upload.ts`
- Added `/api/upload/logo` POST endpoint
- Configured multer for file handling
- Added proper error handling
- Added debug logging

### 2. Added Static File Serving
**File**: `d4mediaCampus-api/src/server.ts`
- Added `app.use('/uploads', express.static('uploads'));`
- Registered upload routes
- Files will be accessible at `http://localhost:5000/uploads/logos/filename.jpg`

### 3. Fixed Content-Type Header
**File**: `src/services/receiptService.ts`
- Removed explicit `Content-Type: multipart/form-data` header
- Let browser set it automatically with boundary

### 4. Added Debug Logging
Added comprehensive logging to track the upload process:
- Frontend: File selection and FormData creation
- Service: API call details
- Backend: Request reception and file processing

## Testing Steps

### 1. Restart API Server
```bash
cd d4mediaCampus-api
npm run dev
```

### 2. Test Logo Upload
1. Go to Receipt Configuration page
2. Click "Upload Logo" or "Change Logo"
3. Select an image file (PNG, JPG, GIF under 2MB)
4. Check browser console for debug logs
5. Check API server console for debug logs

### 3. Expected Debug Output

**Frontend Console:**
```
Starting logo upload...
Logo file: File {name: "logo.png", size: 12345, type: "image/png"}
Branch ID: 507f1f77bcf86cd799439011
receiptService.uploadLogo called with: {file: File, branchId: "..."}
FormData entries:
logo File {name: "logo.png", ...}
branchId 507f1f77bcf86cd799439011
Upload result: {success: true, data: {logoPath: "/uploads/logos/..."}}
```

**Backend Console:**
```
Upload request received
Request body: { branchId: '507f1f77bcf86cd799439011' }
Request file: {
  fieldname: 'logo',
  originalname: 'logo.png',
  encoding: '7bit',
  mimetype: 'image/png',
  destination: 'uploads/logos',
  filename: '507f1f77bcf86cd799439011_1703123456789.png',
  path: 'uploads/logos/507f1f77bcf86cd799439011_1703123456789.png',
  size: 12345
}
```

## Common Issues & Solutions

### Issue 1: "No file uploaded"
**Cause**: File not reaching server
**Debug**: Check frontend console for FormData entries
**Fix**: Ensure file is selected and FormData is created correctly

### Issue 2: Multer Error
**Cause**: File type/size restrictions
**Debug**: Check backend console for multer errors
**Fix**: Ensure file is image type and under 2MB

### Issue 3: Directory Not Found
**Cause**: uploads/logos directory doesn't exist
**Debug**: Check if `uploads/logos` folder is created
**Fix**: Multer creates it automatically, but check permissions

### Issue 4: File Not Accessible
**Cause**: Static file serving not working
**Debug**: Try accessing `http://localhost:5000/uploads/logos/filename.jpg`
**Fix**: Ensure static middleware is registered

## File Structure Created

```
d4mediaCampus-api/
├── uploads/
│   └── logos/
│       └── branchId_timestamp.png
├── src/
│   └── routes/
│       └── upload.ts
└── ...
```

## API Endpoints

### Upload Logo
```
POST /api/upload/logo
Content-Type: multipart/form-data

Body:
- logo: File (image file)
- branchId: String (optional)

Response:
{
  "success": true,
  "message": "Logo uploaded successfully",
  "data": {
    "logoPath": "/uploads/logos/branchId_timestamp.png",
    "filename": "branchId_timestamp.png",
    "originalName": "logo.png",
    "size": 12345
  }
}
```

### Access Uploaded File
```
GET /uploads/logos/filename.png
```

## Security Features

1. **File Type Validation**: Only images (JPEG, JPG, PNG, GIF)
2. **File Size Limit**: 2MB maximum
3. **Authentication Required**: Must be logged in
4. **Unique Filenames**: Prevents conflicts with timestamp
5. **Directory Isolation**: Files stored in dedicated uploads folder

## Next Steps

1. **Test upload** with debug logging enabled
2. **Check console outputs** to identify where it fails
3. **Remove debug logs** once working
4. **Test file access** by visiting the uploaded file URL
5. **Verify receipt config** saves with logo path

The debug logs will show exactly where the upload process is failing!