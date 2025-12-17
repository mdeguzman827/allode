'use client'

import { useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import PropertySearch from '@/components/PropertySearch'
import PropertyResults from '@/components/PropertyResults'
import Link from 'next/link'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface Property {
  id: string
  mlsNumber: string
  price: number
  address: {
    street: string
    city: string
    state: string
    zipCode: string
    full: string
  }
  propertyDetails: {
    type: string
    bedrooms: number
    bathrooms: number
    squareFeet: number
    status: string
  }
  images: Array<{ url: string }>
  description?: string
}

interface PropertiesResponse {
  properties: Property[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
  totalPages: number
}

const fetchProperties = async (
  address?: string,
  city?: string,
  state?: string
): Promise<PropertiesResponse> => {
  if (!address && !city) {
    return { properties: [], total: 0, page: 1, pageSize: 20, hasMore: false, totalPages: 0 }
  }

  const params = new URLSearchParams()
  if (address) {
    params.set('address', address)
  }
  if (city) {
    params.set('city', city)
  }
  if (state) {
    params.set('state', state)
  }

  const response = await fetch(
    `${API_URL}/api/properties?${params.toString()}`
  )
  
  if (!response.ok) {
    throw new Error('Failed to fetch properties')
  }
  
  return response.json()
}

export default function ResultsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const address = searchParams.get('address') || ''
  const city = searchParams.get('city') || ''
  const state = searchParams.get('state') || ''

  const { data, isLoading, error } = useQuery<PropertiesResponse>({
    queryKey: ['properties', address, city, state],
    queryFn: () => fetchProperties(address || undefined, city || undefined, state || undefined),
    enabled: address.length > 0 || city.length > 0,
  })

  const [searchQuery, setSearchQuery] = useState(
    address || (city ? `${city}${state ? `, ${state}` : ''}` : '')
  )

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/results?address=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  return (
    <main className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-2xl font-normal text-gray-900 dark:text-gray-100 hover:opacity-80">
            Allode
          </Link>
          <Link 
            href="/" 
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          >
            New Search
          </Link>
        </div>
      </header>

      {/* Search Bar */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
        <div className="max-w-4xl mx-auto">
          <PropertySearch
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onSearch={handleSearch}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        {address || city ? (
          <PropertyResults
            data={data ? {
              ...data,
              query: address || (city ? `${city}${state ? `, ${state}` : ''}` : '')
            } : undefined}
            isLoading={isLoading}
            error={error}
            searchQuery={address || (city ? `${city}${state ? `, ${state}` : ''}` : '')}
          />
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">
              Enter an address or city to search for properties
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="p-6 text-center text-sm text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700">
        <p>Allode Real Estate Platform</p>
      </footer>
    </main>
  )
}

