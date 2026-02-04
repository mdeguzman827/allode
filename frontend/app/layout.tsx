import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { QueryClientProvider } from './providers'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Allode - The Flat Fee Real Estate Brokerage for Homebuyers',
  description: 'Search for properties with ease',
  icons: {
    icon: '/logo.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} flex flex-col min-h-screen`}>
        <QueryClientProvider>
          <Header />
          <div className="flex-1 flex flex-col">
            {children}
          </div>
          <Footer />
        </QueryClientProvider>
      </body>
    </html>
  )
}

