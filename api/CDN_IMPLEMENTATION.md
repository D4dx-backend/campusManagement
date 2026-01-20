# DigitalOcean Spaces CDN Implementation Guide

## Overview
This implementation replaces local file storage with DigitalOcean Spaces (S3-compatible) CDN for handling file uploads, specifically for receipt configuration logos and other assets.

## Features
- ✅ Upload files to DigitalOcean Spaces
- ✅ Automatic CDN URL generation
- ✅ File deletion support
- ✅ File listing and management
- ✅ File existence checking
- ✅ Support for multiple image formats (JPEG, PNG, GIF, WEBP, SVG)
- ✅ Increased file size limit to 5MB
- ✅ Secure file access with public CDN URLs
- ✅ Organized folder structure by branch

## Environment Variables

Add the following variables to your `.env` file:

```env
# DigitalOcean Spaces Configuration
DO_SPACES_KEY=your_spaces_access_key
DO_SPACES_SECRET=your_spaces_secret_key
DO_SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com
DO_SPACES_CDN_ENDPOINT=https://your-space.nyc3.cdn.digitaloceanspaces.com
DO_SPACES_BUCKET=your-bucket-name
DO_SPACES_FOLDER=campus-management/logos
```

### How to Get These Values

1. **DO_SPACES_KEY & DO_SPACES_SECRET**:
   - Go to DigitalOcean Dashboard → API → Spaces Keys
   - Click "Generate New Key"
   - Copy the Access Key and Secret Key

2. **DO_SPACES_ENDPOINT**:
   - Format: `https://[region].digitaloceanspaces.com`
   - Common regions: nyc3, sfo3, sgp1, fra1
   - Example: `https://nyc3.digitaloceanspaces.com`

3. **DO_SPACES_CDN_ENDPOINT**:
   - Go to your Space → Settings → Enable CDN
   - Copy the CDN Endpoint URL
   - Format: `https://[space-name].[region].cdn.digitaloceanspaces.com`
   - Example: `https://my-space.nyc3.cdn.digitaloceanspaces.com`

4. **DO_SPACES_BUCKET**:
   - Your Space name (e.g., `my-campus-space`)

5. **DO_SPACES_FOLDER**:
   - Subfolder path within your Space
   - Example: `campus-management/logos` or `uploads/images`
   - Can be any path you want to organize files

## Architecture

### Backend Structure

```
api/
├── src/
│   ├── services/
│   │   └── doSpacesService.ts    # Main CDN service
│   └── routes/
│       └── upload.ts              # Upload endpoints
```

### Key Components

#### 1. DOSpacesService (`src/services/doSpacesService.ts`)
Main service class that handles all CDN operations:

**Methods:**
- `uploadFile(buffer, originalName, mimeType, branchId?)` - Upload file to CDN
- `deleteFile(key)` - Delete file by key
- `deleteFileByUrl(url)` - Delete file by CDN/direct URL
- `listFiles(prefix?)` - List files in folder
- `fileExists(key)` - Check if file exists
- `getCdnUrl(key)` - Get CDN URL for a file
- `getDirectUrl(key)` - Get direct (non-CDN) URL

#### 2. Upload Routes (`src/routes/upload.ts`)
REST API endpoints for file operations:

**Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload/logo` | Upload logo to CDN |
| DELETE | `/api/upload/logo/:key` | Delete logo by key |
| POST | `/api/upload/logo/delete-by-url` | Delete logo by URL |
| GET | `/api/upload/files` | List uploaded files |
| POST | `/api/upload/check-file` | Check if file exists |
| POST | `/api/upload/test` | Test upload configuration |

### Frontend Structure

```
front/
├── src/
│   ├── services/
│   │   └── receiptService.ts     # Updated with CDN methods
│   └── pages/
│       └── ReceiptConfig.tsx      # Updated to use CDN URLs
```

## API Usage Examples

### 1. Upload a File

```typescript
// Frontend
const formData = new FormData();
formData.append('logo', file);
formData.append('branchId', 'branch123');

const response = await fetch('/api/upload/logo', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
  },
  body: formData
});

const result = await response.json();
// {
//   success: true,
//   message: 'Logo uploaded successfully to CDN',
//   data: {
//     logoPath: 'https://cdn.example.com/campus-management/logos/branch123_1234567890_logo.png',
//     cdnUrl: 'https://cdn.example.com/campus-management/logos/branch123_1234567890_logo.png',
//     directUrl: 'https://bucket.endpoint.com/campus-management/logos/branch123_1234567890_logo.png',
//     key: 'campus-management/logos/branch123_1234567890_logo.png',
//     filename: 'logo.png',
//     size: 102400
//   }
// }
```

### 2. Delete a File by Key

```typescript
const key = 'campus-management/logos/branch123_1234567890_logo.png';
const response = await fetch(`/api/upload/logo/${encodeURIComponent(key)}`, {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${token}`,
  }
});
```

### 3. Delete a File by URL

```typescript
const response = await fetch('/api/upload/logo/delete-by-url', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    url: 'https://cdn.example.com/campus-management/logos/branch123_1234567890_logo.png'
  })
});
```

### 4. List Files

```typescript
// List all files
const response = await fetch('/api/upload/files', {
  headers: { 'Authorization': `Bearer ${token}` }
});

// List files for specific branch
const response = await fetch('/api/upload/files?branchId=branch123', {
  headers: { 'Authorization': `Bearer ${token}` }
});

// Response:
// {
//   success: true,
//   data: {
//     files: [
//       {
//         key: 'campus-management/logos/branch123_1234567890_logo.png',
//         size: 102400,
//         lastModified: '2024-01-16T12:00:00Z',
//         url: 'https://bucket.endpoint.com/...',
//         cdnUrl: 'https://cdn.example.com/...'
//       }
//     ],
//     count: 1
//   }
// }
```

### 5. Check if File Exists

```typescript
const response = await fetch('/api/upload/check-file', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    key: 'campus-management/logos/branch123_1234567890_logo.png'
  })
});

// Response:
// {
//   success: true,
//   message: 'File exists',
//   data: { exists: true }
// }
```

## File Naming Convention

Files are automatically named using the following pattern:
```
{branchId}_{timestamp}_{sanitized_original_name}.{extension}
```

Example:
```
branch_abc123_1705412345678_school_logo.png
```

This ensures:
- Unique filenames (timestamp)
- Easy organization by branch
- Original filename preservation (sanitized)

## Security Features

1. **Authentication Required**: All endpoints require valid JWT token
2. **File Type Validation**: Only allowed image formats accepted
3. **File Size Limits**: Maximum 5MB per file
4. **Branch-Level Access Control**: Branch admins can only access their branch files
5. **Public Read Access**: Files are publicly readable via CDN (for display on receipts)

## Error Handling

The implementation includes comprehensive error handling:

```typescript
try {
  const result = await receiptService.uploadLogo(file, branchId);
  // Success
} catch (error) {
  // Error is properly formatted with message
  console.error(error.message);
}
```

Common error scenarios:
- Invalid file type
- File too large
- Network errors
- Permission denied
- Missing environment variables

## Migration from Local Storage

If you have existing local files in `uploads/logos/`:

1. **Files remain accessible**: Old receipts with local paths will still work
2. **New uploads**: All new uploads automatically go to CDN
3. **Manual migration** (optional):
   - Upload existing files to CDN
   - Update database records with new CDN URLs

## Performance Benefits

1. **CDN Caching**: Faster global access to images
2. **Reduced Server Load**: Static files served from CDN
3. **Scalability**: No local storage limits
4. **Reliability**: DigitalOcean's infrastructure
5. **Bandwidth Savings**: CDN handles traffic

## Monitoring and Debugging

### Test Upload Configuration

```bash
curl -X POST http://localhost:5001/api/upload/test \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "logo=@test-image.png"
```

This will return configuration status and test the upload setup without actually uploading to CDN.

### Check Environment Variables

The service validates all required environment variables on initialization. If any are missing, you'll see an error like:

```
Missing required environment variables: DO_SPACES_KEY, DO_SPACES_SECRET
```

### Logs

All operations are logged:
- Upload attempts and results
- Deletion operations
- Error details with stack traces

## Troubleshooting

### Issue: "Missing required environment variables"
**Solution**: Ensure all DO_SPACES_* variables are set in your `.env` file

### Issue: Files upload but URLs don't work
**Solution**: 
- Verify DO_SPACES_CDN_ENDPOINT is correct
- Ensure Space has CDN enabled
- Check file permissions (should be public-read)

### Issue: "Access Denied" errors
**Solution**:
- Verify DO_SPACES_KEY and DO_SPACES_SECRET are correct
- Check Space permissions in DigitalOcean dashboard

### Issue: Large files fail to upload
**Solution**:
- Check file size (max 5MB)
- Increase limit in `upload.ts` if needed
- Verify network stability for large uploads

## Future Enhancements

Potential improvements:
- [ ] Image optimization/resizing before upload
- [ ] Support for more file types (PDFs, documents)
- [ ] Automatic thumbnail generation
- [ ] Batch upload support
- [ ] Image cropping/editing interface
- [ ] Upload progress tracking
- [ ] File versioning

## Support

For issues or questions:
1. Check logs in backend console
2. Verify environment variables
3. Test with `/api/upload/test` endpoint
4. Check DigitalOcean Spaces dashboard for bucket status

## Dependencies

### Backend
```json
{
  "@aws-sdk/client-s3": "^3.x.x",
  "@aws-sdk/lib-storage": "^3.x.x",
  "multer": "^1.4.5-lts.1"
}
```

### Frontend
No additional dependencies required - uses standard Fetch API.


