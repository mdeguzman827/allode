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
      {/* Main Content - Search bar centered in viewport */}
      <div className="flex-1 grid grid-rows-[1fr_auto_1fr] min-h-0 px-4">
        {/* Top row: title and description aligned to bottom */}
        <div className="flex flex-col justify-end items-center pb-6">
          <div className="w-full max-w-2xl text-center">
            <h2 className="text-4xl font-light text-gray-900 dark:text-gray-100 mb-4">
              The Flat Fee Brokerage for Homebuyers
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              We charge a flat fee of $4,995 after closing, and we'll walk you through the entire process. Buyers will receive all of the commission offered by the seller, minus our flat fee.
            </p>
          </div>
        </div>
        {/* Middle row: search bar (vertically centered on page) */}
        <div className="flex justify-center items-center">
          <div className="w-full max-w-2xl">
            <PropertySearch
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onSearch={handleSearch}
              isLoading={false}
              size="large"
            />
          </div>
        </div>
        {/* Bottom row: empty spacer */}
        <div />
      </div>

      {/* Footer */}
      <footer className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">
        <p>Allode Real Estate Platform</p>
      </footer>
    </main>
  )
}

