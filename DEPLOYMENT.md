# Deployment Guide

This guide will help you deploy your Allode application to staging using Vercel (frontend) and Railway (backend).

## Prerequisites

- GitHub account (for connecting repositories)
- Vercel account (free tier available)
- Railway account (free tier with $5 credit/month)

## Configuration Files Created

✅ Backend CORS configuration updated to use environment variables
✅ Database configuration updated to support PostgreSQL
✅ `backend/Procfile` created for Railway
✅ `backend/runtime.txt` created for Railway
✅ `requirements.txt` updated with python-dotenv

## Step 1: Prepare Environment Variables

### Backend Environment Variables

Create `backend/.env` file (see `backend/ENV_EXAMPLE.md` for template):

```bash
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
DATABASE_URL=sqlite:///properties.db  # For local, Railway will provide PostgreSQL URL
NWMLS_USERNAME=your_username
NWMLS_PASSWORD=your_password
```

### Frontend Environment Variables

Create `frontend/.env.local` file (see `frontend/ENV_EXAMPLE.md` for template):

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Step 2: Deploy Backend to Railway

1. **Sign up/Login to Railway**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Select your repository

3. **Add PostgreSQL Database**
   - In your Railway project, click "New"
   - Select "Database" → "Add PostgreSQL"
   - Railway will automatically create a `DATABASE_URL` environment variable

4. **Configure Service**
   - Railway should auto-detect your Python app
   - If not, set:
     - **Root Directory**: `/` (project root)
     - **Start Command**: (auto-detected from Procfile)
   - The `Procfile` will be used automatically

5. **Set Environment Variables**
   - Go to your service → Variables
   - Add:
     ```
     ALLOWED_ORIGINS=http://localhost:3000,https://your-frontend.vercel.app
     ```
   - Note: Update this after you get your Vercel URL
   - `DATABASE_URL` is automatically set by Railway PostgreSQL service

6. **Deploy**
   - Railway will automatically deploy on push to your main branch
   - Wait for deployment to complete
   - Copy your backend URL (e.g., `https://your-app.railway.app`)

## Step 3: Deploy Frontend to Vercel

1. **Sign up/Login to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with GitHub

2. **Import Project**
   - Click "Add New" → "Project"
   - Import your GitHub repository
   - Select the `frontend` folder as the root directory

3. **Configure Build Settings**
   - Framework Preset: Next.js (auto-detected)
   - Root Directory: `frontend`
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)

4. **Set Environment Variables**
   - Go to Settings → Environment Variables
   - Add:
     ```
     NEXT_PUBLIC_API_URL=https://your-backend.railway.app
     ```
   - Replace with your actual Railway backend URL

5. **Deploy**
   - Click "Deploy"
   - Wait for deployment to complete
   - Copy your frontend URL (e.g., `https://your-app.vercel.app`)

## Step 4: Update CORS in Railway

1. Go back to Railway dashboard
2. Update `ALLOWED_ORIGINS` environment variable:
   ```
   ALLOWED_ORIGINS=http://localhost:3000,https://your-frontend.vercel.app
   ```
3. Railway will automatically redeploy

## Step 5: Database Migration (SQLite → PostgreSQL)

If you have existing data in SQLite:

1. **Export data from SQLite** (optional, if you have existing data):
   ```bash
   # You may need to write a migration script
   python scripts/migrate_to_postgres.py
   ```

2. **Railway PostgreSQL**:
   - Railway automatically creates the database
   - Your app will create tables on first run (via SQLAlchemy)
   - Or run your init script:
     ```bash
     python scripts/init_database.py
     ```

## Step 6: Test Your Staging Environment

1. Visit your Vercel frontend URL
2. Test property search functionality
3. Check browser console for any CORS errors
4. Verify images are loading correctly
5. Test property detail pages

## Troubleshooting

### CORS Errors
- Make sure `ALLOWED_ORIGINS` in Railway includes your Vercel URL
- Check that URLs don't have trailing slashes
- Verify environment variables are set correctly

### Database Connection Issues
- Verify `DATABASE_URL` is set in Railway
- Check that PostgreSQL service is running
- Ensure database tables are created (run init script if needed)

### Build Failures
- Check build logs in Vercel/Railway
- Verify all dependencies are in `package.json` and `requirements.txt`
- Ensure Python version matches `runtime.txt`

### Image Loading Issues
- Check that backend image proxy endpoint is working
- Verify CORS allows image requests
- Check Railway logs for image fetching errors

## Environment-Specific URLs

After deployment, you'll have:
- **Frontend (Vercel)**: `https://your-app.vercel.app`
- **Backend (Railway)**: `https://your-app.railway.app`
- **Database (Railway PostgreSQL)**: Automatically managed

## Next Steps

- Set up production environment (separate from staging)
- Configure custom domains
- Set up monitoring and error tracking (Sentry)
- Configure CI/CD for automatic deployments
- Set up database backups

## Cost Estimate

- **Vercel**: Free (Hobby plan) - unlimited personal projects
- **Railway**: Free ($5 credit/month) - usually enough for staging
- **Total**: $0/month for staging environment

