'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
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
  state?: string,
  zipcode?: string,
  page: number = 1,
  sortBy: string = 'price_asc'
): Promise<PropertiesResponse> => {
  if (!address && !city && !zipcode) {
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
  if (zipcode) {
    params.set('zipcode', zipcode)
  }
  params.set('page', page.toString())
  params.set('page_size', '20')
  params.set('sort_by', sortBy)

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
  const zipcode = searchParams.get('zipcode') || ''
  const page = parseInt(searchParams.get('page') || '1', 10)
  const sortBy = searchParams.get('sort_by') || 'price_asc'

  // Memoize display query to prevent unnecessary re-renders
  const displayQuery = useMemo(() => {
    if (address) return address
    if (zipcode) return zipcode
    if (city) return `${city}${state ? `, ${state}` : ''}`
    return ''
  }, [address, city, state, zipcode])

  const [searchQuery, setSearchQuery] = useState(displayQuery)

  // Sync searchQuery state with URL params only if it actually changed
  // Use useMemo to stabilize the comparison and prevent unnecessary updates
  useEffect(() => {
    if (displayQuery !== searchQuery) {
      setSearchQuery(displayQuery)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayQuery]) // Only depend on displayQuery, searchQuery is intentionally excluded

  // Normalize search params - convert empty strings to undefined for stable query keys
  const normalizedAddress = useMemo(() => address || undefined, [address])
  const normalizedCity = useMemo(() => city || undefined, [city])
  const normalizedState = useMemo(() => state || undefined, [state])
  const normalizedZipcode = useMemo(() => zipcode || undefined, [zipcode])
  
  // Check if we have any search criteria
  const hasSearchCriteria = useMemo(() => {
    return !!(normalizedAddress || normalizedCity || normalizedZipcode)
  }, [normalizedAddress, normalizedCity, normalizedZipcode])
  
  // Memoize the query function to prevent unnecessary re-renders
  const queryFn = useCallback(() => {
    return fetchProperties(normalizedAddress, normalizedCity, normalizedState, normalizedZipcode, page, sortBy)
  }, [normalizedAddress, normalizedCity, normalizedState, normalizedZipcode, page, sortBy])
  
  const { data, isLoading, error } = useQuery<PropertiesResponse>({
    queryKey: ['properties', normalizedAddress, normalizedCity, normalizedState, normalizedZipcode, page, sortBy],
    queryFn,
    enabled: hasSearchCriteria,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  })

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/results?address=${encodeURIComponent(searchQuery.trim())}&page=1&sort_by=${sortBy}`)
    }
  }

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams()
    if (address) params.set('address', address)
    if (city) params.set('city', city)
    if (state) params.set('state', state)
    if (zipcode) params.set('zipcode', zipcode)
    params.set('page', newPage.toString())
    params.set('sort_by', sortBy)
    router.push(`/results?${params.toString()}`)
    // Scroll to top of results
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSortChange = (newSortBy: string) => {
    const params = new URLSearchParams()
    if (address) params.set('address', address)
    if (city) params.set('city', city)
    if (state) params.set('state', state)
    if (zipcode) params.set('zipcode', zipcode)
    params.set('page', '1') // Reset to page 1 when sorting changes
    params.set('sort_by', newSortBy)
    router.push(`/results?${params.toString()}`)
    // Scroll to top of results
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <main className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
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
        {hasSearchCriteria ? (
          <PropertyResults
            data={data ? {
              ...data,
              query: displayQuery
            } : undefined}
            isLoading={isLoading}
            error={error}
            searchQuery={displayQuery}
            currentPage={page}
            onPageChange={handlePageChange}
            sortBy={sortBy}
            onSortChange={handleSortChange}
          />
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">
              Enter an address, city, or zip code to search for properties
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

