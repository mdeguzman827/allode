# Frontend Environment Variables

Create a `.env.local` file in the `frontend/` directory with the following variables:

```bash
# Backend API URL
# For local development:
# NEXT_PUBLIC_API_URL=http://localhost:8000
# For staging/production:
# NEXT_PUBLIC_API_URL=https://your-backend.railway.app
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Instructions

1. Copy this content to `frontend/.env.local`
2. Update `NEXT_PUBLIC_API_URL` with your backend URL
3. **DO NOT commit `.env.local` to version control**

