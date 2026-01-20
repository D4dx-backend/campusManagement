# Migration Guide - Local Storage to CDN

## Overview

This guide helps you migrate existing logo files from local storage (`uploads/logos/`) to DigitalOcean Spaces CDN.

## Migration Status

### ✅ What's Already Working

- **New uploads**: Automatically go to CDN
- **Backward compatibility**: Old local files still work
- **No data loss**: Existing receipts continue to work

### 📋 Optional Migration Steps

You can choose to migrate existing files to CDN for consistency, or leave them as-is.

## Option 1: Keep Existing Files (Recommended for most)

### Pros
- ✅ Zero downtime
- ✅ No data migration needed
- ✅ Existing receipts work perfectly
- ✅ Simple and safe

### Cons
- ⚠️ Mixed storage (some files local, new ones on CDN)
- ⚠️ Old files not on CDN

### What to Do
**Nothing!** Just use the new system. Old receipts continue to work, new uploads go to CDN automatically.

## Option 2: Migrate All Files to CDN

### When to Use
- You want all files on CDN
- You want to clean up local storage
- You have time for migration

### Prerequisites
- ✅ CDN fully configured and tested
- ✅ Backup of database and files
- ✅ Access to production database

### Migration Steps

#### Step 1: Backup Everything

```bash
# Backup database
mongodump --uri="your_mongodb_uri" --out=./backup/$(date +%Y%m%d)

# Backup local files
cp -r uploads/logos ./backup/logos_$(date +%Y%m%d)
```

#### Step 2: Create Migration Script

Create `api/src/scripts/migrateToCDN.ts`:

```typescript
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { ReceiptConfig } from '../models/ReceiptConfig';
import { doSpacesService } from '../services/doSpacesService';
import dotenv from 'dotenv';

dotenv.config();

async function migrateLogos() {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('Connected to database');

    // Get all receipt configs with local logo paths
    const configs = await ReceiptConfig.find({
      logo: { $regex: '^/uploads/logos/' }
    });

    console.log(`Found ${configs.length} configs to migrate`);

    for (const config of configs) {
      try {
        const localPath = path.join(process.cwd(), config.logo);
        
        // Check if file exists
        if (!fs.existsSync(localPath)) {
          console.log(`⚠️  File not found: ${config.logo}`);
          continue;
        }

        // Read file
        const fileBuffer = fs.readFileSync(localPath);
        const filename = path.basename(localPath);
        const ext = path.extname(filename);
        
        // Determine mime type
        const mimeTypes: { [key: string]: string } = {
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.png': 'image/png',
          '.gif': 'image/gif',
          '.webp': 'image/webp'
        };
        const mimeType = mimeTypes[ext.toLowerCase()] || 'image/jpeg';

        // Upload to CDN
        const result = await doSpacesService.uploadFile(
          fileBuffer,
          filename,
          mimeType,
          config.branchId.toString()
        );

        if (result.success && result.cdnUrl) {
          // Update database
          config.logo = result.cdnUrl;
          await config.save();
          
          console.log(`✅ Migrated: ${filename} → ${result.cdnUrl}`);
        } else {
          console.log(`❌ Failed to upload: ${filename}`);
        }

      } catch (error) {
        console.error(`Error migrating ${config.logo}:`, error);
      }
    }

    console.log('\n✅ Migration complete!');
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

migrateLogos();
```

#### Step 3: Add Migration Script to package.json

```json
{
  "scripts": {
    "migrate:cdn": "ts-node src/scripts/migrateToCDN.ts"
  }
}
```

#### Step 4: Test Migration (Dry Run)

First, test with a single file manually:

```bash
# In your code or Postman, upload a test file
# Verify it works correctly
# Check database has CDN URL
```

#### Step 5: Run Migration

```bash
cd api
npm run migrate:cdn
```

Watch the output for any errors.

#### Step 6: Verify Migration

```bash
# Check database - all logos should have CDN URLs now
mongo your_database
> db.receiptconfigs.find({ logo: /^https:\/\// }).count()
```

#### Step 7: Test Receipts

- Generate some receipts
- Verify logos display correctly
- Check both old and new receipts

#### Step 8: Clean Up Local Files (Optional)

```bash
# Only after verifying everything works!
# Keep backup for a while before deleting

# Move to archive instead of deleting
mkdir -p uploads/logos_archive
mv uploads/logos/* uploads/logos_archive/
```

## Option 3: Hybrid Approach

### Strategy
- Keep old files local
- New uploads go to CDN
- Migrate important/frequently accessed files only

### How to Implement

1. Identify important branches/configs
2. Manually upload their logos through the Receipt Config page
3. The new upload will replace the old local file with CDN version
4. No script needed!

## Rollback Plan

### If Something Goes Wrong

#### Rollback Database
```bash
# Restore from backup
mongorestore --uri="your_mongodb_uri" ./backup/YYYYMMDD/
```

#### Rollback Code
```bash
git checkout previous_commit
npm install
npm run dev
```

#### Restore Local Files
```bash
cp -r backup/logos_YYYYMMDD/* uploads/logos/
```

## Verification Checklist

After migration, verify:

- [ ] All receipt configs have valid logo URLs
- [ ] New uploads work correctly
- [ ] Old receipts display correctly (if migrated)
- [ ] No broken images on receipts
- [ ] CDN URLs are accessible
- [ ] Database backup is safe
- [ ] Local files backup is safe

## Performance Comparison

### Before (Local Storage)
```
First load: 200-500ms
Subsequent: 50-100ms (browser cache)
Server bandwidth: High
Scalability: Limited by disk
```

### After (CDN)
```
First load: 50-150ms (CDN cache)
Subsequent: 10-30ms (CDN + browser cache)
Server bandwidth: Minimal
Scalability: Unlimited
```

## Cost Analysis

### Local Storage
- Storage: Free (but limited)
- Bandwidth: Included in hosting
- Scalability: Expensive to scale
- Reliability: Single point of failure

### CDN Storage
- Storage: $5/month for 250GB
- Bandwidth: 1TB included
- Scalability: Automatic
- Reliability: 99.9% uptime

## FAQs

### Q: Will old receipts break after migration?
**A**: No! If you don't migrate files, old local files continue to work. If you do migrate, the database is updated with new CDN URLs.

### Q: What happens if migration fails halfway?
**A**: The script processes files one-by-one. Failed files are logged but don't stop the process. You can re-run for failed files.

### Q: Can I undo the migration?
**A**: Yes! Restore from database backup. Local files are not deleted during migration.

### Q: How long does migration take?
**A**: Depends on file count. Roughly 1-2 seconds per file. 100 files ≈ 2-3 minutes.

### Q: Do I need to migrate immediately?
**A**: No! The system works fine with mixed storage. Migrate when convenient.

### Q: What if I don't want to migrate at all?
**A**: That's fine! Just use the new CDN for new uploads. Old files stay local.

## Best Practices

1. **Always backup** before migration
2. **Test in development** first
3. **Migrate during low-traffic** hours
4. **Keep backups** for at least 30 days
5. **Monitor logs** during and after migration
6. **Verify receipts** work after migration
7. **Don't delete local files** immediately

## Timeline Recommendation

### Week 1
- Set up CDN
- Configure environment variables
- Test with new uploads
- Verify everything works

### Week 2-3
- Monitor new uploads
- Ensure stability
- Plan migration if needed

### Week 4+
- Optional: Migrate existing files
- Clean up local storage
- Monitor and optimize

## Support

If you encounter issues:

1. Check migration script logs
2. Verify CDN configuration
3. Check database for consistency
4. Restore from backup if needed
5. Review `api/CDN_IMPLEMENTATION.md`

---

**Remember**: Migration is optional. The system works perfectly with mixed storage (old local, new CDN).


