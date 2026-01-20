# Quick Start Guide - CDN Implementation

## 🚀 What Changed?

Your campus management system now uses **DigitalOcean Spaces CDN** for storing and serving files (logos, images) instead of local storage. This means:

✅ **Faster loading** - Files served from global CDN  
✅ **Unlimited storage** - No local disk space limits  
✅ **Better reliability** - Professional cloud infrastructure  
✅ **Scalability** - Handle thousands of files easily  

## ⚡ Quick Setup (5 minutes)

### Step 1: Install Dependencies

Already done! ✓ The following packages were installed:
- `@aws-sdk/client-s3`
- `@aws-sdk/lib-storage`

### Step 2: Set Up DigitalOcean Spaces

1. **Create Space** (if you don't have one):
   - Go to https://cloud.digitalocean.com/spaces
   - Click "Create Space"
   - Choose region (e.g., NYC3)
   - Name it (e.g., `campus-management`)
   - **Enable CDN** ✓
   - Create!

2. **Get API Keys**:
   - Go to API → Spaces Keys
   - Click "Generate New Key"
   - Copy both keys (you'll need them!)

### Step 3: Configure Environment Variables

Add these to your `api/.env` file:

```env
DO_SPACES_KEY=your_access_key
DO_SPACES_SECRET=your_secret_key
DO_SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com
DO_SPACES_CDN_ENDPOINT=https://your-space-name.nyc3.cdn.digitaloceanspaces.com
DO_SPACES_BUCKET=your-space-name
DO_SPACES_FOLDER=campus-management/logos
```

📝 **See `api/ENV_TEMPLATE.md` for detailed instructions on getting these values**

### Step 4: Restart Server

```bash
cd api
npm run dev
```

### Step 5: Test It!

1. Go to Receipt Configuration page
2. Try uploading a logo
3. You should see it load from the CDN URL!

## 📁 New File Structure

### Backend
```
api/
├── src/
│   ├── services/
│   │   └── doSpacesService.ts    ← New! CDN service
│   └── routes/
│       └── upload.ts              ← Updated! Now uses CDN
```

### Frontend
```
front/
├── src/
│   ├── services/
│   │   └── receiptService.ts     ← Updated! New CDN methods
│   └── pages/
│       └── ReceiptConfig.tsx      ← Updated! Uses CDN URLs
```

## 🔧 What Works Now

### Upload Features
- ✅ Upload images to CDN
- ✅ Automatic CDN URL generation
- ✅ Support for multiple formats (JPEG, PNG, GIF, WEBP, SVG)
- ✅ Increased size limit to 5MB
- ✅ Unique filenames with timestamps
- ✅ Branch-based organization

### Management Features
- ✅ Delete files from CDN
- ✅ List all uploaded files
- ✅ Check if file exists
- ✅ Get CDN and direct URLs

### API Endpoints
- `POST /api/upload/logo` - Upload file
- `DELETE /api/upload/logo/:key` - Delete by key
- `POST /api/upload/logo/delete-by-url` - Delete by URL
- `GET /api/upload/files` - List files
- `POST /api/upload/check-file` - Check existence
- `POST /api/upload/test` - Test configuration

## 🧪 Testing Your Setup

### Quick Test
```bash
curl -X POST http://localhost:5001/api/upload/test \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "logo=@test-image.png"
```

Should return:
```json
{
  "success": true,
  "message": "Upload test successful - CDN configured",
  "data": {
    "cdnConfig": {
      "bucket": "your-bucket",
      "endpoint": "https://...",
      ...
    }
  }
}
```

### Full Upload Test
1. Log in to your application
2. Go to Receipt Configuration
3. Upload a logo
4. Check browser Network tab - you should see CDN URL!

## 🎯 Key Changes

### Before (Local Storage)
```typescript
// Logo URL
logoPath: "/uploads/logos/branch123_1234567890_logo.png"

// Preview URL
http://localhost:5001/uploads/logos/branch123_1234567890_logo.png
```

### After (CDN)
```typescript
// Logo URL (stored in database)
logoPath: "https://your-space.nyc3.cdn.digitaloceanspaces.com/campus-management/logos/branch123_1234567890_logo.png"

// Preview URL (same as logoPath - already full CDN URL)
https://your-space.nyc3.cdn.digitaloceanspaces.com/campus-management/logos/branch123_1234567890_logo.png
```

## 📊 File Naming Convention

Old files (local):
```
branch123_1234567890.png
```

New files (CDN):
```
branch123_1705412345678_school_logo.png
└─┬─┘ └──────┬──────┘ └────┬─────┘
  │         │               └─ Sanitized original name
  │         └─ Timestamp (unique)
  └─ Branch ID
```

## 🔒 Security

All endpoints require authentication:
- ✅ JWT token required
- ✅ File type validation
- ✅ Size limits (5MB)
- ✅ Branch-level access control
- ✅ Files publicly readable via CDN (needed for receipts)

## 💰 Cost Estimate

DigitalOcean Spaces pricing:
- **$5/month** - 250GB storage + 1TB transfer
- Perfect for small to medium installations
- Much cheaper than local storage at scale!

## 📚 Documentation

Detailed documentation available in:
- `api/CDN_IMPLEMENTATION.md` - Complete technical guide
- `api/ENV_TEMPLATE.md` - Environment variable setup

## ❓ Troubleshooting

### "Missing required environment variables"
→ Check your `.env` file has all 6 DO_SPACES_* variables

### Files upload but don't display
→ Verify DO_SPACES_CDN_ENDPOINT is correct and CDN is enabled

### "Access Denied" errors
→ Check DO_SPACES_KEY and DO_SPACES_SECRET are correct

### Still using old local storage
→ Make sure you restarted the backend server after adding env variables

## 🎉 You're All Set!

Your campus management system now has professional CDN storage! All new uploads will automatically use DigitalOcean Spaces.

**Need help?** Check the detailed docs in `api/CDN_IMPLEMENTATION.md`

---

**Created**: January 2026  
**Status**: ✅ Production Ready


