# CDN Setup Checklist ✅

Use this checklist to set up DigitalOcean Spaces CDN for your campus management system.

---

## Prerequisites

- [ ] DigitalOcean account (sign up at https://digitalocean.com)
- [ ] Access to project's `.env` file
- [ ] Backend server access

---

## Step 1: DigitalOcean Spaces Setup

### Create a Space
- [ ] Go to https://cloud.digitalocean.com/spaces
- [ ] Click "Create Space"
- [ ] Choose datacenter region (e.g., NYC3, SFO3, SGP1)
- [ ] Enter Space name (e.g., `campus-management-files`)
- [ ] **Enable CDN** (toggle switch)
- [ ] Set file listing to "Private"
- [ ] Click "Create Space"
- [ ] ✅ Space created successfully

### Get API Keys
- [ ] Go to API → Spaces Keys
- [ ] Click "Generate New Key"
- [ ] Enter key name (e.g., "Campus Management API")
- [ ] Copy **Access Key** → Save it somewhere safe
- [ ] Copy **Secret Key** → Save it somewhere safe ⚠️ (you won't see it again!)
- [ ] ✅ Keys saved securely

### Get CDN Endpoint
- [ ] Go to your Space
- [ ] Click "Settings"
- [ ] Scroll to "CDN" section
- [ ] Verify CDN is enabled ✅
- [ ] Copy the **CDN Endpoint URL**
  - Looks like: `https://your-space-name.nyc3.cdn.digitaloceanspaces.com`
- [ ] ✅ CDN endpoint copied

---

## Step 2: Configure Environment Variables

### Edit `.env` file
- [ ] Open `api/.env` in your editor
- [ ] Add these 6 variables:

```env
DO_SPACES_KEY=your_access_key_here
DO_SPACES_SECRET=your_secret_key_here
DO_SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com
DO_SPACES_CDN_ENDPOINT=https://your-space-name.nyc3.cdn.digitaloceanspaces.com
DO_SPACES_BUCKET=your-space-name
DO_SPACES_FOLDER=campus-management/logos
```

- [ ] Replace `your_access_key_here` with actual Access Key
- [ ] Replace `your_secret_key_here` with actual Secret Key
- [ ] Replace region in ENDPOINT (e.g., nyc3, sfo3)
- [ ] Replace `your-space-name` in CDN_ENDPOINT with actual Space name
- [ ] Replace `your-space-name` in BUCKET with actual Space name
- [ ] Customize FOLDER path if desired (or keep default)
- [ ] Save the file
- [ ] ✅ Environment variables configured

### Verify `.env` file
- [ ] Check for typos
- [ ] Ensure no extra spaces around `=`
- [ ] Verify all 6 variables are present
- [ ] Confirm quotes are NOT around values
- [ ] ✅ Configuration verified

---

## Step 3: Restart Backend Server

### Stop current server
- [ ] Press `Ctrl+C` in terminal running backend
- [ ] Wait for server to stop completely

### Start server again
```bash
cd api
npm run dev
```

- [ ] Server starts without errors
- [ ] No "Missing required environment variables" error
- [ ] ✅ Server running with CDN configured

---

## Step 4: Test Configuration

### Test via API endpoint
```bash
curl -X POST http://localhost:5001/api/upload/test \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

- [ ] Request succeeds (status 200)
- [ ] Response includes `cdnConfig` object
- [ ] `bucket`, `endpoint`, `cdnEndpoint` values are correct
- [ ] ✅ API test passed

### Test via Frontend
- [ ] Log in to application
- [ ] Go to Receipt Configuration page
- [ ] Page loads without errors
- [ ] ✅ Frontend accessible

---

## Step 5: Upload Test

### Upload a logo
- [ ] On Receipt Config page, click "Upload Logo"
- [ ] Select an image file (PNG, JPG, etc.)
- [ ] Click upload/save
- [ ] Upload completes successfully
- [ ] Success message appears
- [ ] ✅ Upload successful

### Verify CDN URL
- [ ] Open browser Developer Tools (F12)
- [ ] Go to Network tab
- [ ] Look at the logo image request
- [ ] Verify URL starts with your CDN endpoint
  - Should be: `https://your-space-name.nyc3.cdn.digitaloceanspaces.com/...`
  - NOT: `http://localhost:5001/uploads/...`
- [ ] ✅ Using CDN URL

### Verify Image Display
- [ ] Logo displays correctly on Receipt Config page
- [ ] No broken image icon
- [ ] Image loads quickly
- [ ] ✅ Image displays correctly

---

## Step 6: Test Receipt Generation

### Generate a receipt
- [ ] Go to Fee Management
- [ ] Record a fee payment
- [ ] Generate receipt for that payment
- [ ] Receipt PDF downloads/displays
- [ ] Logo appears on receipt
- [ ] ✅ Receipt with logo works

---

## Step 7: Test Multiple Operations

### Test update
- [ ] Upload a different logo (replace existing)
- [ ] New logo displays
- [ ] ✅ Update works

### Test with different branch (if applicable)
- [ ] Log in as user from different branch
- [ ] Upload logo for that branch
- [ ] Logo saves and displays
- [ ] ✅ Multi-branch works

---

## Troubleshooting Checklist

If something doesn't work, check:

### Server won't start
- [ ] All 6 environment variables present?
- [ ] No typos in variable names?
- [ ] Values are correct (no placeholder text)?
- [ ] Restarted server after adding variables?

### Upload fails
- [ ] CDN endpoint URL is correct?
- [ ] API keys are valid?
- [ ] Space name matches BUCKET variable?
- [ ] Internet connection working?

### Image doesn't display
- [ ] CDN is enabled in Space settings?
- [ ] File uploaded successfully (check logs)?
- [ ] CDN endpoint URL is correct?
- [ ] Browser can access CDN URL directly?

### "Access Denied" error
- [ ] Access Key is correct?
- [ ] Secret Key is correct?
- [ ] Keys haven't been revoked?
- [ ] Space name is correct?

---

## Documentation Reference

If you need help:

1. **Quick issues**: See `QUICK_START_CDN.md`
2. **Environment setup**: See `api/ENV_TEMPLATE.md`
3. **Technical details**: See `api/CDN_IMPLEMENTATION.md`
4. **Troubleshooting**: See `api/CDN_IMPLEMENTATION.md` → Troubleshooting section

---

## Final Verification

- [ ] ✅ DigitalOcean Space created and CDN enabled
- [ ] ✅ API keys obtained and saved
- [ ] ✅ Environment variables configured
- [ ] ✅ Backend server running without errors
- [ ] ✅ Test upload successful
- [ ] ✅ Images load from CDN
- [ ] ✅ Receipts display logos correctly
- [ ] ✅ Multiple branches work (if applicable)

---

## 🎉 Congratulations!

Your campus management system is now using professional CDN storage!

**What you got:**
- ✅ Faster file loading (CDN caching)
- ✅ Unlimited storage capacity
- ✅ Global availability
- ✅ Better reliability
- ✅ Lower server load

**Next steps:**
- Use the system normally
- Monitor CDN usage in DigitalOcean dashboard
- Optionally migrate old files (see `api/MIGRATION_GUIDE.md`)

---

## Notes

- Keep your API keys secure and private
- Monitor your DigitalOcean usage/costs
- First month costs ~$5 for Spaces
- Old local files still work (backward compatible)
- You can migrate old files anytime (optional)

---

**Setup Date**: _____________  
**Completed By**: _____________  
**Space Name**: _____________  
**Region**: _____________

---

🌟 **You're all set!** Happy coding! 🚀


