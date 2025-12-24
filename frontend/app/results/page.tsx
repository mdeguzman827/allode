'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import PropertySearch from '@/components/PropertySearch'
import PropertyResults from '@/components/PropertyResults'
import Link from 'next/link'

// #region agent log
fetch('http://127.0.0.1:7242/ingest/3c6262fb-453d-4746-a4ed-fa5ace1b05b9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'results/page.tsx:8',message:'Import check',data:{propertyResultsType:typeof PropertyResults,isFunction:typeof PropertyResults === 'function',isObject:typeof PropertyResults === 'object',hasDefault:!!PropertyResults},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
// #endregion

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
  zipcode?: string
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

  const response = await fetch(
    `${API_URL}/api/properties?${params.toString()}`
  )
  
  if (!response.ok) {
    throw new Error('Failed to fetch properties')
  }
  
  return response.json()
}

export default function ResultsPage() {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/3c6262fb-453d-4746-a4ed-fa5ace1b05b9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'results/page.tsx:78',message:'ResultsPage render start',data:{propertyResultsType:typeof PropertyResults,isFunction:typeof PropertyResults === 'function'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion

  const searchParams = useSearchParams()
  const router = useRouter()
  const address = searchParams.get('address') || ''
  const city = searchParams.get('city') || ''
  const state = searchParams.get('state') || ''
  const zipcode = searchParams.get('zipcode') || ''

  const getDisplayQuery = () => {
    if (address) return address
    if (zipcode) return zipcode
    if (city) return `${city}${state ? `, ${state}` : ''}`
    return ''
  }

  const [searchQuery, setSearchQuery] = useState(() => getDisplayQuery())

  // Sync searchQuery state with URL params to prevent infinite loops
  useEffect(() => {
    const displayQuery = getDisplayQuery()
    setSearchQuery(displayQuery)
  }, [address, city, state, zipcode])

  const { data, isLoading, error } = useQuery<PropertiesResponse>({
    queryKey: ['properties', address, city, state, zipcode],
    queryFn: () => fetchProperties(address || undefined, city || undefined, state || undefined, zipcode || undefined),
    enabled: address.length > 0 || city.length > 0 || zipcode.length > 0,
  })

  // #region agent log
  useEffect(() => {
    fetch('http://127.0.0.1:7242/ingest/3c6262fb-453d-4746-a4ed-fa5ace1b05b9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'results/page.tsx:105',message:'Before PropertyResults render',data:{propertyResultsType:typeof PropertyResults,isFunction:typeof PropertyResults === 'function',hasData:!!data,isLoading,hasError:!!error,shouldRender:!!(address || city || zipcode)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  }, [data, isLoading, error, address, city, zipcode]);
  // #endregion

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/results?address=${encodeURIComponent(searchQuery.trim())}`)
    }
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
        {address || city || zipcode ? (
          <PropertyResults
            data={data ? {
              ...data,
              query: getDisplayQuery()
            } : undefined}
            isLoading={isLoading}
            error={error}
            searchQuery={getDisplayQuery()}
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

