# Environment Variables Template for DigitalOcean Spaces

Add these variables to your `.env` file:

```env
# DigitalOcean Spaces CDN Configuration
# ==================================================
# Required for file uploads and CDN storage

# Your DigitalOcean Spaces Access Key
# Get from: DigitalOcean Dashboard → API → Spaces Keys → Generate New Key
DO_SPACES_KEY=your_spaces_access_key_here

# Your DigitalOcean Spaces Secret Key
# Get from: DigitalOcean Dashboard → API → Spaces Keys → Generate New Key
DO_SPACES_SECRET=your_spaces_secret_key_here

# DigitalOcean Spaces Endpoint
# Format: https://[region].digitaloceanspaces.com
# Common regions: nyc3, sfo3, sgp1, fra1, ams3
# Example: https://nyc3.digitaloceanspaces.com
DO_SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com

# DigitalOcean Spaces CDN Endpoint
# Get from: Your Space → Settings → Enable CDN → Copy CDN Endpoint
# Format: https://[space-name].[region].cdn.digitaloceanspaces.com
# Example: https://my-campus-space.nyc3.cdn.digitaloceanspaces.com
DO_SPACES_CDN_ENDPOINT=https://your-space-name.nyc3.cdn.digitaloceanspaces.com

# Your Space (Bucket) Name
# The name you gave to your Space when creating it
# Example: campus-management-files
DO_SPACES_BUCKET=your-bucket-name

# Folder path within your Space for organizing files
# Can be any path structure you want
# Example: campus-management/logos
# Example: uploads/images
# Example: production/assets/logos
DO_SPACES_FOLDER=campus-management/logos
```

## Setup Instructions

### 1. Create a DigitalOcean Space

1. Log in to [DigitalOcean](https://cloud.digitalocean.com/)
2. Go to **Spaces** → **Create Space**
3. Choose a datacenter region (e.g., NYC3)
4. Give it a name (e.g., `campus-management-files`)
5. **Enable CDN** (recommended for faster access)
6. Set file listing to **Private** (files will still be publicly readable via CDN)
7. Click **Create Space**

### 2. Get Your Spaces Keys

1. Go to **API** → **Spaces Keys**
2. Click **Generate New Key**
3. Give it a name (e.g., "Campus Management API")
4. Copy both the **Access Key** and **Secret Key**
5. Store them securely - you won't be able to see the secret again!

### 3. Get Your CDN Endpoint

1. Go to your Space → **Settings**
2. Scroll to **CDN** section
3. If not enabled, click **Enable CDN**
4. Copy the CDN Endpoint URL (looks like `https://space-name.region.cdn.digitaloceanspaces.com`)

### 4. Configure Your Environment

1. Open your `.env` file in the `api` directory
2. Add all the DO_SPACES_* variables with your actual values
3. Save the file
4. Restart your backend server

### 5. Verify Configuration

Test your setup:

```bash
# Using curl
curl -X POST http://localhost:5001/api/upload/test \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "logo=@test-image.png"
```

You should see a success response with your configuration details.

## Security Notes

⚠️ **Important Security Practices:**

1. **Never commit your .env file** - it's already in .gitignore
2. **Use different keys** for development and production
3. **Rotate keys periodically** for better security
4. **Limit key permissions** if possible in DigitalOcean settings
5. **Use environment variables** in production (e.g., in hosting platform settings)

## Troubleshooting

### "Missing required environment variables" error

**Cause**: One or more DO_SPACES_* variables are not set in .env

**Solution**: 
- Check that all 6 variables are present in .env
- Ensure variable names are exactly as specified (case-sensitive)
- Make sure there are no spaces around the `=` sign
- Restart your backend server after adding variables

### Files upload but URLs don't work

**Cause**: CDN not properly configured or wrong endpoint

**Solution**:
- Verify CDN is enabled in your Space settings
- Check that DO_SPACES_CDN_ENDPOINT is correct
- Ensure files have public-read permissions (automatic in our setup)
- Try using the direct URL instead of CDN URL temporarily

### "Access Denied" when uploading

**Cause**: Invalid or incorrect Spaces keys

**Solution**:
- Verify DO_SPACES_KEY and DO_SPACES_SECRET are correct
- Check that the keys have not been revoked
- Ensure the Space name (DO_SPACES_BUCKET) is correct
- Verify your DigitalOcean account is active

## Cost Information

DigitalOcean Spaces pricing (as of 2024):
- **$5/month** for 250 GB storage
- Includes **1 TB outbound transfer**
- Additional storage: $0.02/GB
- Additional transfer: $0.01/GB

For a typical campus management system:
- Estimated storage: 1-5 GB (thousands of logos)
- Estimated transfer: 10-50 GB/month
- **Expected cost: $5-10/month**

Much cheaper than local storage at scale! 💰

## Example Values (for reference)

Here's what real values look like (don't use these!):

```env
DO_SPACES_KEY=DO00ABCDEFGHIJKLMNOP
DO_SPACES_SECRET=1234567890abcdefghijklmnopqrstuvwxyz1234567890abcd
DO_SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com
DO_SPACES_CDN_ENDPOINT=https://campus-files.nyc3.cdn.digitaloceanspaces.com
DO_SPACES_BUCKET=campus-files
DO_SPACES_FOLDER=production/logos
```


