# Backend Environment Variables

Create a `.env` file in the `backend/` directory with the following variables:

```bash
# CORS Configuration
# Comma-separated list of allowed origins (frontend URLs)
# Example: http://localhost:3000,https://your-frontend.vercel.app
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# Database Configuration
# For local development (SQLite):
# DATABASE_URL=sqlite:///properties.db
# For production/staging (PostgreSQL):
# DATABASE_URL=postgresql://user:password@host:port/dbname
# Railway will automatically provide DATABASE_URL if you add a PostgreSQL service
DATABASE_URL=

# NWMLS API Credentials (if needed for data fetching)
NWMLS_USERNAME=130725
NWMLS_PASSWORD=SexyDexy082790/

# MLS Grid API (for populate_database and scripts that need property/media data)
# Get bearer token from your MLS Grid account; API URL is the OData Property endpoint with $expand=Media
MLSGRID_BEARER_TOKEN=your_mlsgrid_bearer_token_here
MLSGRID_API_URL=https://api-demo.mlsgrid.com/v2/Property?$filter=OriginatingSystemName%20eq%20'nwmls'%20and%20MlgCanView%20eq%20true&$expand=Media&$top=1000

# Cloudflare R2 Storage Configuration
# Get these from Cloudflare Dashboard > R2 > Manage R2 API Tokens
# Account ID is found in the right sidebar of your Cloudflare dashboard
CLOUDFLARE_ACCOUNT_ID=1cb2ffe1db4f0657b01f8c304df0a36f
CLOUDFLARE_R2_ACCESS_KEY_ID=995b19a393612577dedacbf7923adb9c
CLOUDFLARE_R2_SECRET_ACCESS_KEY=4325c657d5232abc984e6505fa54687f83ed4f6340bb2e6d4befb2bf2804c57a
CLOUDFLARE_R2_BUCKET_NAME=allode-property-images
# Optional: Custom domain for CDN (e.g., images.yourdomain.com)
# If not set, will use R2's default public URL
# CLOUDFLARE_R2_CDN_DOMAIN=images.yourdomain.com

# Optional: Port configuration (Railway will set PORT automatically)
# PORT=8000
```

## Instructions

1. Copy this content to `backend/.env`
2. Fill in your actual values
3. **DO NOT commit `.env` to version control**

