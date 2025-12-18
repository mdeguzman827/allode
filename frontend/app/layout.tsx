import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { QueryClientProvider } from './providers'
import Header from '@/components/Header'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Allode - Real Estate Search',
  description: 'Search for properties with ease',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <QueryClientProvider>
          <Header />
          {children}
        </QueryClientProvider>
      </body>
    </html>
  )
}

