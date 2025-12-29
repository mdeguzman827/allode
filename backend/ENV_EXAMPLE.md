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
NWMLS_USERNAME=your_username_here
NWMLS_PASSWORD=your_password_here

# Optional: Port configuration (Railway will set PORT automatically)
# PORT=8000
```

## Instructions

1. Copy this content to `backend/.env`
2. Fill in your actual values
3. **DO NOT commit `.env` to version control**

