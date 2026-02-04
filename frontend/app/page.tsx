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
    <main className="flex-1 flex flex-col justify-center px-4 py-12 sm:py-16">
      {/* Hero and search - vertically centered in the page */}
      <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-10">
        <div className="text-center">
          <h2 className="text-4xl font-light text-gray-900 dark:text-gray-100 mb-4">
            The Flat Fee Brokerage for Homebuyers
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            We charge a flat fee of $4,995 after closing, and we&apos;ll walk you through the entire process. Buyers will receive all of the commission offered by the seller, minus our flat fee.
          </p>
        </div>
        <div className="w-full">
          <PropertySearch
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onSearch={handleSearch}
            isLoading={false}
            size="large"
          />
        </div>
      </div>
    </main>
  )
}

