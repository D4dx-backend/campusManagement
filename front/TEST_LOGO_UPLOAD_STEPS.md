# Test Logo Upload - Step by Step

## Issue Fixed
The API client was setting `Content-Type: application/json` by default, which conflicts with `multipart/form-data` needed for file uploads.

## Fix Applied
Changed from using `apiClient.post()` to raw `api.post()` to avoid the default JSON headers.

## Testing Steps

### 1. Restart API Server
```bash
cd d4mediaCampus-api
npm run dev
```

### 2. Open Receipt Configuration Page
- Navigate to the receipt config page
- Open browser DevTools (F12)
- Go to Console tab

### 3. Test File Selection
1. Click "Upload Logo" or "Change Logo" button
2. Select an image file (PNG/JPG under 2MB)
3. Check console for these logs:
   ```
   handleLogoSelect called
   Selected file: File {name: "...", size: ..., type: "image/..."}
   Logo file set: File {...}
   Logo preview created
   ```

### 4. Test FormData Creation
1. After selecting a file, you should see a "Test FormData" button
2. Click it and check console for:
   ```
   === TESTING FORMDATA ===
   FormData created:
   logo File {name: "...", ...}
   branchId 507f1f77bcf86cd799439011
   ```

### 5. Test Actual Upload
1. Fill in the receipt config form
2. Click "Save Configuration" or "Update Configuration"
3. Check console for upload logs:
   ```
   Starting logo upload...
   Logo file: File {...}
   Logo file type: image/png
   Logo file size: 12345
   Branch ID: 507f1f77bcf86cd799439011
   receiptService.uploadLogo called with: {...}
   FormData entries:
   logo File {...}
   branchId 507f1f77bcf86cd799439011
   Upload result: {success: true, data: {logoPath: "..."}}
   ```

### 6. Check API Server Logs
In your API server console, you should see:
```
Upload request received
Request body: { branchId: '507f1f77bcf86cd799439011' }
Request file: {
  fieldname: 'logo',
  originalname: 'test.png',
  encoding: '7bit',
  mimetype: 'image/png',
  destination: 'uploads/logos',
  filename: '507f1f77bcf86cd799439011_1703123456789.png',
  path: 'uploads/logos/507f1f77bcf86cd799439011_1703123456789.png',
  size: 12345
}
```

### 7. Verify File Upload
1. Check if `uploads/logos/` folder is created in your API directory
2. Check if the uploaded file exists there
3. Try accessing the file at: `http://localhost:5000/uploads/logos/filename.png`

## Expected Results

### ✅ Success Case
- File selection works (console shows file details)
- FormData creation works (console shows entries)
- Upload succeeds (returns logoPath)
- File is saved to `uploads/logos/` folder
- File is accessible via URL
- Receipt config saves with logo path

### ❌ Failure Cases & Solutions

**Case 1: File not selected**
- Console shows: "No logo file selected"
- Solution: Ensure file input is working, check file size/type

**Case 2: FormData empty**
- Console shows empty FormData entries
- Solution: Check if logoFile state is set correctly

**Case 3: Network error**
- Console shows network/CORS errors
- Solution: Check API server is running, check CORS settings

**Case 4: "No file uploaded" error**
- API logs show no file in request
- Solution: Check Content-Type headers, ensure using raw axios

**Case 5: File type/size error**
- API logs show multer error
- Solution: Ensure file is image type and under 2MB

## Debug Commands

### Check API Endpoint
```bash
# Test with curl (replace with actual token and file)
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "logo=@/path/to/image.png" \
  -F "branchId=507f1f77bcf86cd799439011" \
  http://localhost:5000/api/upload/logo
```

### Check File Permissions
```bash
# Ensure uploads directory is writable
ls -la uploads/
chmod 755 uploads/logos/
```

### Check File Access
```bash
# Test static file serving
curl http://localhost:5000/uploads/logos/filename.png
```

## Cleanup After Testing

Once upload is working, remove the debug elements:
1. Remove "Test FormData" button
2. Remove console.log statements
3. Remove debug panel from UI
4. Remove test endpoint from API

The upload should now work correctly! 🎉