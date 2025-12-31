# Cloudflare R2 Image Storage Setup Guide

This guide explains how to set up and use Cloudflare R2 for storing property images.

## Overview

The system now supports storing property images in Cloudflare R2, which provides:
- **Low cost**: $0.015/GB/month storage, no egress fees
- **Fast delivery**: Global CDN included
- **Compliance**: Meets MLS Grid requirement to store images locally

## Setup Steps

### 1. Create Cloudflare R2 Bucket

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **R2** in the sidebar
3. Click **Create bucket**
4. Name it (e.g., `allode-property-images`)
5. Note your **Account ID** (found in the right sidebar)

### 2. Create API Token

1. In R2, go to **Manage R2 API Tokens**
2. Click **Create API token**
3. Set permissions:
   - **Object Read & Write**
   - Select your bucket
4. Save the **Access Key ID** and **Secret Access Key**

### 3. Configure Public Access (Optional but Recommended)

To serve images via CDN, you need to make the bucket publicly accessible:

1. Go to your R2 bucket
2. Click **Settings** tab
3. Under **Public Access**, enable it
4. (Optional) Set up a custom domain for better performance

### 4. Set Environment Variables

Add to your `.env` file (see `backend/ENV_EXAMPLE.md`):

```bash
CLOUDFLARE_ACCOUNT_ID=your_account_id_here
CLOUDFLARE_R2_ACCESS_KEY_ID=your_access_key_id_here
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your_secret_access_key_here
CLOUDFLARE_R2_BUCKET_NAME=property-images
# Optional: Custom CDN domain
CLOUDFLARE_R2_CDN_DOMAIN=images.yourdomain.com
```

### 5. Install Dependencies

```bash
pip install -r requirements.txt
```

This will install `boto3` (for S3-compatible API) and `Pillow` (for image optimization).

### 6. Update Database Schema

The database models have been updated with R2 storage fields. Run the migration script to add the new columns:

```bash
python scripts/migrate_r2_columns.py
```

This script will:
- Check if columns already exist (safe to run multiple times)
- Add missing columns to both `property_media` and `properties` tables
- Work with both SQLite (local) and PostgreSQL (production)
- Provide clear feedback on what was added

**Alternative: Manual SQL** (if you prefer)

For SQLite:
```sql
ALTER TABLE property_media ADD COLUMN r2_key VARCHAR;
ALTER TABLE property_media ADD COLUMN r2_url TEXT;
ALTER TABLE property_media ADD COLUMN stored_at DATETIME;
ALTER TABLE property_media ADD COLUMN file_size INTEGER;
ALTER TABLE property_media ADD COLUMN content_type VARCHAR;
ALTER TABLE properties ADD COLUMN primary_image_r2_key VARCHAR;
ALTER TABLE properties ADD COLUMN primary_image_r2_url TEXT;
ALTER TABLE properties ADD COLUMN primary_image_stored_at DATETIME;
```

For PostgreSQL:
```sql
ALTER TABLE property_media ADD COLUMN IF NOT EXISTS r2_key VARCHAR;
ALTER TABLE property_media ADD COLUMN IF NOT EXISTS r2_url TEXT;
ALTER TABLE property_media ADD COLUMN IF NOT EXISTS stored_at TIMESTAMP;
ALTER TABLE property_media ADD COLUMN IF NOT EXISTS file_size INTEGER;
ALTER TABLE property_media ADD COLUMN IF NOT EXISTS content_type VARCHAR;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS primary_image_r2_key VARCHAR;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS primary_image_r2_url TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS primary_image_stored_at TIMESTAMP;
```

## Usage

### Process Images for a Single Property

Via API:
```bash
curl -X POST "http://localhost:8000/api/properties/NWM123/process-images"
```

Force reprocess (even if already stored):
```bash
curl -X POST "http://localhost:8000/api/properties/NWM123/process-images?force=true"
```

### Migrate All Existing Images

Run the migration script:

```bash
# Migrate all properties
python scripts/migrate_images_to_r2.py

# Migrate with batch size of 20
python scripts/migrate_images_to_r2.py --batch-size 20

# Test with first 10 properties
python scripts/migrate_images_to_r2.py --limit 10
```

### Automatic Processing

You can integrate image processing into your property import workflow:

```python
from services.image_processor import ImageProcessor

processor = ImageProcessor()
results = processor.process_property_images(
    property_id="NWM123",
    db=db_session,
    force_reprocess=False
)
```

## How It Works

1. **Image Download**: System downloads images from NWMLS MediaURL
2. **Optimization**: Images are automatically optimized (resized, converted to WebP)
3. **Upload to R2**: Images are uploaded to R2 with organized paths: `properties/{property_id}/{image_index}.webp`
4. **CDN Delivery**: Images are served via Cloudflare's global CDN
5. **Fallback**: If image not in R2 yet, system falls back to proxying from NWMLS

## Image Endpoint Behavior

The `/api/images/{property_id}/{image_index}` endpoint now:

1. **First**: Checks if image is stored in R2
   - If yes: Returns 302 redirect to CDN URL (fast!)
   - If no: Falls back to proxy method

2. **Fallback**: Proxies from NWMLS (for images not yet migrated)

This ensures backward compatibility during migration.

## Cost Estimates

For **10,000 properties** with **~10 images each** (100,000 images):

- **Storage**: 50GB × $0.015 = **$0.75/month**
- **CDN Transfer**: **$0** (no egress fees!)
- **Total**: **~$0.75/month**

Compare to AWS S3 + CloudFront: ~$9.65/month

## Troubleshooting

### "R2 storage not configured" error

- Check that all environment variables are set
- Verify credentials are correct
- Restart the backend server after setting environment variables

### Images not uploading

- Check R2 bucket permissions
- Verify bucket name matches `CLOUDFLARE_R2_BUCKET_NAME`
- Check network connectivity to Cloudflare

### Images not serving via CDN

- Ensure public access is enabled on the bucket
- If using custom domain, verify DNS is configured
- Check that `r2_url` is being set correctly in database

### Migration script fails

- Ensure database has new columns (run migration)
- Check that properties have `primary_image_url` or `PropertyMedia` entries
- Verify R2 credentials are correct

## Next Steps

1. Set up R2 bucket and credentials
2. Run database migration to add new columns
3. Test with a single property: `POST /api/properties/{id}/process-images`
4. Run full migration: `python scripts/migrate_images_to_r2.py`
5. Monitor image serving (should see 302 redirects to CDN URLs)

## Benefits

✅ **13x cheaper** than AWS S3 + CloudFront  
✅ **No egress fees** - unlimited bandwidth  
✅ **Fast global CDN** - images served from edge locations  
✅ **Automatic optimization** - WebP conversion, resizing  
✅ **Compliance** - meets MLS Grid local storage requirement  
✅ **Backward compatible** - falls back to proxy if not in R2  

