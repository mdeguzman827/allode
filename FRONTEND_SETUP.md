# Frontend Setup Guide

## Quick Start

1. **Navigate to frontend directory:**
```bash
cd frontend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Create environment file:**
```bash
cp .env.local.example .env.local
```

4. **Start the development server:**
```bash
npm run dev
```

5. **Open your browser:**
Visit [http://localhost:3000](http://localhost:3000)

## Prerequisites

- Node.js 18+ installed
- FastAPI backend running on http://localhost:8000

## Features

✅ Minimal, clean design (ChatGPT/Google style)
✅ Centered search bar
✅ Real-time property search
✅ Property results with images
✅ Responsive design
✅ Dark mode support

## Project Structure

```
frontend/
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Landing page
│   ├── globals.css         # Global styles
│   └── providers.tsx       # React Query provider
├── components/
│   ├── PropertySearch.tsx  # Search bar component
│   └── PropertyResults.tsx # Results display component
└── package.json
```

## Troubleshooting

**Port 3000 already in use:**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

**API connection errors:**
- Make sure FastAPI backend is running on http://localhost:8000
- Check `.env.local` has correct `NEXT_PUBLIC_API_URL`

**Build errors:**
```bash
# Clear Next.js cache
rm -rf .next
npm run dev
```

