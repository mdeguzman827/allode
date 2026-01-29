'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import PropertySearch from '@/components/PropertySearch'
import PropertyResults from '@/components/PropertyResults'
import FilterDropdown from '@/components/FilterDropdown'
import MultiSelectFilter from '@/components/MultiSelectFilter'
import PriceRangeFilter from '@/components/PriceRangeFilter'
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
  sortBy: string = 'price_asc',
  filters?: {
    status?: string[] | null
    minPrice?: number | null
    maxPrice?: number | null
    bedrooms?: number | null
    bathrooms?: number | null
    homeType?: string[] | null
  }
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

  if (filters) {
    if (filters.status && filters.status.length > 0) {
      params.set('status', filters.status.join(','))
    }
    if (filters.minPrice) {
      params.set('min_price', filters.minPrice.toString())
    }
    if (filters.maxPrice) {
      params.set('max_price', filters.maxPrice.toString())
    }
    if (filters.bedrooms) {
      params.set('bedrooms', filters.bedrooms.toString())
    }
    if (filters.bathrooms) {
      params.set('bathrooms', filters.bathrooms.toString())
    }
    if (filters.homeType && filters.homeType.length > 0) {
      params.set('home_type', filters.homeType.join(','))
    }
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
  const zipcode = searchParams.get('zipcode') || ''
  const page = parseInt(searchParams.get('page') || '1', 10)
  const sortBy = searchParams.get('sort_by') || 'price_asc'
  
  // Filter params
  const statusFilterParam = searchParams.get('status') || ''
  const statusFilter = statusFilterParam ? statusFilterParam.split(',').filter(Boolean) : []
  const minPriceFilter = searchParams.get('min_price') ? parseInt(searchParams.get('min_price')!, 10) : null
  const maxPriceFilter = searchParams.get('max_price') ? parseInt(searchParams.get('max_price')!, 10) : null
  const bedroomsFilter = searchParams.get('bedrooms') ? parseInt(searchParams.get('bedrooms')!, 10) : null
  const bathroomsFilter = searchParams.get('bathrooms') ? parseInt(searchParams.get('bathrooms')!, 10) : null
  const homeTypeFilterParam = searchParams.get('home_type') || ''
  const homeTypeFilter = homeTypeFilterParam ? homeTypeFilterParam.split(',').filter(Boolean) : []

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
  
  // Memoize filters object
  const filters = useMemo(() => ({
    status: statusFilter,
    minPrice: minPriceFilter,
    maxPrice: maxPriceFilter,
    bedrooms: bedroomsFilter,
    bathrooms: bathroomsFilter,
    homeType: homeTypeFilter,
  }), [statusFilter, minPriceFilter, maxPriceFilter, bedroomsFilter, bathroomsFilter, homeTypeFilter])

  // Memoize the query function to prevent unnecessary re-renders
  const queryFn = useCallback(() => {
    return fetchProperties(normalizedAddress, normalizedCity, normalizedState, normalizedZipcode, page, sortBy, filters)
  }, [normalizedAddress, normalizedCity, normalizedState, normalizedZipcode, page, sortBy, filters])
  
  const { data, isLoading, error } = useQuery<PropertiesResponse>({
    queryKey: ['properties', normalizedAddress, normalizedCity, normalizedState, normalizedZipcode, page, sortBy, filters],
    queryFn,
    enabled: hasSearchCriteria,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  })

  const updateURLParams = useCallback((updates: {
    address?: string
    city?: string
    state?: string
    zipcode?: string
    page?: number
    sortBy?: string
    status?: string | null
    minPrice?: number | null
    maxPrice?: number | null
    bedrooms?: number | null
    bathrooms?: number | null
    homeType?: string[] | null
  }) => {
    const params = new URLSearchParams()
    
    // Preserve existing search params
    const currentAddress = updates.address !== undefined ? updates.address : address
    const currentCity = updates.city !== undefined ? updates.city : city
    const currentState = updates.state !== undefined ? updates.state : state
    const currentZipcode = updates.zipcode !== undefined ? updates.zipcode : zipcode
    const currentPage = updates.page !== undefined ? updates.page : page
    const currentSortBy = updates.sortBy !== undefined ? updates.sortBy : sortBy
    const currentStatus = updates.status !== undefined ? updates.status : (statusFilter.length > 0 ? statusFilter : null)
    const currentMinPrice = updates.minPrice !== undefined ? updates.minPrice : minPriceFilter
    const currentMaxPrice = updates.maxPrice !== undefined ? updates.maxPrice : maxPriceFilter
    const currentBedrooms = updates.bedrooms !== undefined ? updates.bedrooms : bedroomsFilter
    const currentBathrooms = updates.bathrooms !== undefined ? updates.bathrooms : bathroomsFilter
    const currentHomeType = updates.homeType !== undefined ? updates.homeType : (homeTypeFilter.length > 0 ? homeTypeFilter : null)
    
    if (currentAddress) params.set('address', currentAddress)
    if (currentCity) params.set('city', currentCity)
    if (currentState) params.set('state', currentState)
    if (currentZipcode) params.set('zipcode', currentZipcode)
    params.set('page', currentPage.toString())
    params.set('sort_by', currentSortBy)
    
    if (currentStatus && Array.isArray(currentStatus) && currentStatus.length > 0) {
      params.set('status', currentStatus.join(','))
    } else if (currentStatus && !Array.isArray(currentStatus)) {
      params.set('status', currentStatus)
    }
    if (currentMinPrice) params.set('min_price', currentMinPrice.toString())
    if (currentMaxPrice) params.set('max_price', currentMaxPrice.toString())
    if (currentBedrooms) params.set('bedrooms', currentBedrooms.toString())
    if (currentBathrooms) params.set('bathrooms', currentBathrooms.toString())
    if (currentHomeType && Array.isArray(currentHomeType) && currentHomeType.length > 0) {
      params.set('home_type', currentHomeType.join(','))
    } else if (currentHomeType && !Array.isArray(currentHomeType)) {
      params.set('home_type', currentHomeType)
    }
    
    router.push(`/results?${params.toString()}`)
  }, [address, city, state, zipcode, page, sortBy, statusFilter, minPriceFilter, maxPriceFilter, bedroomsFilter, bathroomsFilter, homeTypeFilter, router])

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      updateURLParams({ address: searchQuery.trim(), page: 1 })
    }
  }

  const handlePageChange = (newPage: number) => {
    updateURLParams({ page: newPage })
    // Scroll to top of results
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSortChange = (newSortBy: string) => {
    updateURLParams({ sortBy: newSortBy, page: 1 })
    // Scroll to top of results
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleFilterChange = (filterType: 'status' | 'minPrice' | 'maxPrice' | 'bedrooms' | 'bathrooms' | 'homeType', value: string | number | string[] | null) => {
    const updates: any = { page: 1 }
    if (filterType === 'status') {
      updates.status = value as string[] | null
    } else if (filterType === 'minPrice') {
      updates.minPrice = value as number | null
    } else if (filterType === 'maxPrice') {
      updates.maxPrice = value as number | null
    } else if (filterType === 'bedrooms') {
      updates.bedrooms = value as number | null
    } else if (filterType === 'bathrooms') {
      updates.bathrooms = value as number | null
    } else if (filterType === 'homeType') {
      updates.homeType = value as string[] | null
    }
    updateURLParams(updates)
  }

  const handleHomeTypeChange = (values: string[]) => {
    updateURLParams({ homeType: values.length > 0 ? values : null, page: 1 })
  }

  const handleStatusChange = (values: string[]) => {
    updateURLParams({ status: values.length > 0 ? values : null, page: 1 })
  }

  const hasActiveFilters = useMemo(() => {
    return (
      statusFilter.length > 0 ||
      minPriceFilter !== null ||
      maxPriceFilter !== null ||
      bedroomsFilter !== null ||
      bathroomsFilter !== null ||
      homeTypeFilter.length > 0
    )
  }, [statusFilter.length, minPriceFilter, maxPriceFilter, bedroomsFilter, bathroomsFilter, homeTypeFilter.length])

  const handleClearAllFilters = () => {
    const params = new URLSearchParams()
    if (address) params.set('address', address)
    if (city) params.set('city', city)
    if (state) params.set('state', state)
    if (zipcode) params.set('zipcode', zipcode)
    params.set('page', '1')
    params.set('sort_by', sortBy)
    router.push(`/results?${params.toString()}`)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Filter options
  const statusOptions = [
    { value: 'Active', label: 'For Sale' },
    { value: 'Pending', label: 'Pending' },
    { value: 'Sold', label: 'Sold' },
    { value: 'Withdrawn', label: 'Withdrawn' },
    { value: 'Expired', label: 'Expired' },
  ]

  const priceOptions = [
    { value: '0-200000', label: 'Under $200k' },
    { value: '200000-400000', label: '$200k - $400k' },
    { value: '400000-600000', label: '$400k - $600k' },
    { value: '600000-800000', label: '$600k - $800k' },
    { value: '800000-1000000', label: '$800k - $1M' },
    { value: '1000000-2000000', label: '$1M - $2M' },
    { value: '2000000-', label: '$2M+' },
  ]

  const bedsOptions = [
    { value: '1', label: '1+ bed' },
    { value: '2', label: '2+ beds' },
    { value: '3', label: '3+ beds' },
    { value: '4', label: '4+ beds' },
    { value: '5', label: '5+ beds' },
  ]

  const bathsOptions = [
    { value: '1', label: '1+ bath' },
    { value: '2', label: '2+ baths' },
    { value: '3', label: '3+ baths' },
    { value: '4', label: '4+ baths' },
    { value: '5', label: '5+ baths' },
  ]

  const homeTypeOptions = [
    { value: 'Single Family', label: 'Single Family' },
    { value: 'Multi Family', label: 'Multi Family' },
    { value: 'Condo', label: 'Condo' },
    { value: 'Land', label: 'Land' },
    { value: 'Manufactured', label: 'Manufactured' },
    { value: 'Other', label: 'Other' },
  ]

  return (
    <main className="min-h-screen flex flex-col bg-white dark:bg-gray-800">
      {/* Search Bar and Filters */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
            {/* Search Bar */}
            <div className="flex-1 w-full lg:w-auto">
              <PropertySearch
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onSearch={handleSearch}
                isLoading={isLoading}
              />
            </div>
            
            {/* Filters */}
            <div className="flex flex-wrap gap-3 w-full lg:w-auto">
              <MultiSelectFilter
                label="Status"
                values={statusFilter}
                options={statusOptions}
                onChange={handleStatusChange}
                placeholder="For Sale"
              />
              <PriceRangeFilter
                minPrice={minPriceFilter}
                maxPrice={maxPriceFilter}
                onChange={(min, max) => {
                  updateURLParams({ minPrice: min, maxPrice: max, page: 1 })
                }}
              />
              <FilterDropdown
                label="Beds"
                value={bedroomsFilter?.toString() || null}
                options={bedsOptions}
                onChange={(value) => handleFilterChange('bedrooms', value ? parseInt(value, 10) : null)}
                placeholder="Beds"
              />
              <FilterDropdown
                label="Baths"
                value={bathroomsFilter?.toString() || null}
                options={bathsOptions}
                onChange={(value) => handleFilterChange('bathrooms', value ? parseInt(value, 10) : null)}
                placeholder="Baths"
              />
              <MultiSelectFilter
                label="Home Type"
                values={homeTypeFilter}
                options={homeTypeOptions}
                onChange={handleHomeTypeChange}
                placeholder="Home Type"
              />
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleClearAllFilters}
                  className="px-4 py-2.5 rounded-lg bg-transparent text-gray-900 dark:text-gray-100 text-sm font-medium hover:opacity-80 transition-opacity"
                  aria-label="Clear filters"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Results - same width as filter pane (p-6 + max-w-7xl) */}
      <div className="flex-1 px-6 pt-4 pb-8">
        <div className="max-w-7xl mx-auto">
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
      </div>

      {/* Footer */}
      <footer className="p-6 text-center text-sm text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700">
        <p>Allode Real Estate Platform</p>
      </footer>
    </main>
  )
}

