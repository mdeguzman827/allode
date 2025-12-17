'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import PropertySearch from '@/components/PropertySearch'

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()

  const handleSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      // Navigate to results page with search query as URL parameter
      router.push(`/results?address=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-normal text-gray-900 dark:text-gray-100">
            Allode
          </h1>
        </div>
      </header>

      {/* Main Content - Centered */}
      <div className="flex-1 flex items-center justify-center px-4 -mt-20">
        <div className="w-full max-w-2xl">
          {/* Logo/Title */}
          <div className="text-center mb-12">
            <h2 className="text-4xl font-light text-gray-900 dark:text-gray-100 mb-4">
              The Flat Fee Brokerage for Buyers
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              We charge a flat fee of $4,995 after closing, and we'll walk you through the entire process. Buyers will receive all of the commission offered by the seller, minus our flat fee.
            </p>
          </div>

          {/* Search Bar */}
          <PropertySearch
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onSearch={handleSearch}
            isLoading={false}
          />
        </div>
      </div>

      {/* Footer */}
      <footer className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">
        <p>Allode Real Estate Platform</p>
      </footer>
    </main>
  )
}

