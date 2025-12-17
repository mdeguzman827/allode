# Allode Frontend

Minimal landing page for Allode real estate platform.

## Setup

1. Install dependencies:
```bash
npm install
# or
yarn install
```

2. Create `.env.local` file:
```bash
cp .env.local.example .env.local
```

Update `NEXT_PUBLIC_API_URL` if your backend is running on a different port.

3. Run the development server:
```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Features

- Minimal, clean design inspired by ChatGPT/Google
- Centered search bar for property address search
- Real-time property search results
- Responsive design
- Dark mode support

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- TailwindCSS
- React Query (@tanstack/react-query)

