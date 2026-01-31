'use client'

import { useEffect, useRef } from 'react'
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
    homeType?: string
    bedrooms: number
    bathrooms: number
    squareFeet: number
    status: string
    mlsStatus?: string
  }
  images: Array<{ url: string }>
  description?: string
}

interface SearchResponse {
  properties: Property[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
  query?: string
  totalPages?: number
}

interface PropertyResultsProps {
  data: SearchResponse | undefined
  isLoading: boolean
  error: Error | null
  searchQuery: string
  currentPage: number
  onPageChange: (page: number) => void
  sortBy: string
  onSortChange: (sortBy: string) => void
}

// Component to handle "No Image" placeholder with debug logging
const NoImagePlaceholder = ({ property }: { property: Property }) => {
  const hasLoggedRef = useRef(false)

  useEffect(() => {
    if (!hasLoggedRef.current) {
      hasLoggedRef.current = true
      // Verbose debug logging for missing images
      console.warn('[NO IMAGE DATA] Property has no images:', {
        propertyId: property.id,
        mlsNumber: property.mlsNumber,
        propertyAddress: property.address.full,
        hasImagesArray: !!property.images,
        imagesArray: property.images,
        imagesArrayLength: property.images?.length || 0,
        firstImageUrl: property.images?.[0]?.url || 'N/A',
        firstImageObject: property.images?.[0] || null,
        propertyData: {
          id: property.id,
          mlsNumber: property.mlsNumber,
          price: property.price,
          address: property.address,
        },
        timestamp: new Date().toISOString(),
      })
    }
  }, [property])

  return (
    <div className="flex-shrink-0 w-48 h-48 bg-gray-200 dark:bg-gray-800 rounded-lg flex items-center justify-center">
      <span className="text-gray-400 text-sm">No Image</span>
    </div>
  )
}

export default function PropertyResults({
  data,
  isLoading,
  error,
  searchQuery,
  currentPage,
  onPageChange,
  sortBy,
  onSortChange,
}: PropertyResultsProps) {
  if (isLoading) {
    return (
      <div className="mt-12 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">Searching properties...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mt-12 text-center">
        <p className="text-red-600 dark:text-red-400">
          Error searching properties. Please try again.
        </p>
      </div>
    )
  }

  if (!data || data.properties.length === 0) {
    return (
      <div className="mt-12 text-center">
        <p className="text-gray-600 dark:text-gray-400">
          No properties found for &quot;{searchQuery}&quot;
        </p>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-500">
          Try searching with a different address or partial address
        </p>
      </div>
    )
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(price)
  }

  return (
    <div className="mt-12">
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <p className="text-gray-600 dark:text-gray-400">
          Found {data.total} {data.total === 1 ? 'property' : 'properties'} for &quot;{searchQuery}&quot;
        </p>
        
        {/* Sort Dropdown */}
        <div className="flex items-center gap-2">
          <label htmlFor="sort-select" className="text-sm text-gray-600 dark:text-gray-400">
            Sort by:
          </label>
          <select
            id="sort-select"
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            aria-label="Sort properties"
          >
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="sqft_desc">Square Feet</option>
            <option value="lot_size_desc">Lot Size</option>
            <option value="beds_desc">Beds</option>
            <option value="baths_desc">Baths</option>
          </select>
        </div>
      </div>

      <div className="space-y-6">
        {data.properties.map((property) => (
          <Link
            key={property.id}
            href={`/property/${property.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block border border-gray-200 dark:border-gray-800 rounded-lg p-6 hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-700 transition-all bg-white dark:bg-gray-900 cursor-pointer"
            aria-label={`View details for ${property.address.full}`}
          >
            <div className="flex gap-6">
              {/* Image */}
              {property.images && property.images.length > 0 && property.images[0].url ? (
                <div className="flex-shrink-0">
                  <img
                    src={property.images[0].url}
                    alt={property.address.full}
                    className="w-48 h-48 object-cover rounded-lg"
                    onError={(e) => {
                      const target = e.currentTarget
                      const attemptedUrl = target.src
                      const originalImageUrl = property.images[0]?.url
                      
                      // Verbose debug logging for image load failure
                      console.error('[IMAGE LOAD ERROR] Image failed to load:', {
                        propertyId: property.id,
                        mlsNumber: property.mlsNumber,
                        propertyAddress: property.address.full,
                        attemptedImageUrl: attemptedUrl,
                        originalImageUrl: originalImageUrl,
                        apiBaseUrl: API_URL,
                        imageEndpoint: `${API_URL}/api/images/${property.id}/0`,
                        propertyImagesArray: property.images,
                        imagesArrayLength: property.images?.length || 0,
                        firstImageObject: property.images[0],
                        errorEvent: {
                          type: e.type,
                          target: {
                            tagName: target.tagName,
                            src: target.src,
                            complete: target.complete,
                            naturalWidth: target.naturalWidth,
                            naturalHeight: target.naturalHeight,
                          },
                        },
                        timestamp: new Date().toISOString(),
                        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'N/A',
                      })
                      
                      // Prevent infinite loop by checking if we've already set the fallback
                      if (!target.dataset.fallbackSet) {
                        target.dataset.fallbackSet = 'true'
                        console.warn('[IMAGE FALLBACK] Setting fallback placeholder for property:', property.id)
                        // Use a data URI SVG as fallback (can't fail to load)
                        target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyIiBoZWlnaHQ9IjE5MiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZTBlNGU5Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzljYTNhZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg=='
                      } else {
                        // If fallback also failed, hide the image to prevent infinite loop
                        console.error('[IMAGE FALLBACK ERROR] Fallback also failed, hiding image for property:', property.id)
                        target.style.display = 'none'
                      }
                    }}
                  />
                </div>
              ) : (
                <NoImagePlaceholder property={property} />
              )}

              {/* Property Details */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                      {formatPrice(property.price)}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      {property.address.full}
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-sm">
                    {property.propertyDetails.mlsStatus ?? property.propertyDetails.status}
                  </span>
                </div>

                <div className="flex gap-6 mt-4 text-sm text-gray-600 dark:text-gray-400">
                  {property.propertyDetails.type?.toLowerCase() !== 'land' && 
                   property.propertyDetails.type?.toLowerCase() !== 'commercial sale' && (
                    <>
                      {property.propertyDetails.bedrooms && (
                        <span>{property.propertyDetails.bedrooms} bed</span>
                      )}
                      {property.propertyDetails.bathrooms && (
                        <span>{property.propertyDetails.bathrooms} bath</span>
                      )}
                      {property.propertyDetails.squareFeet != null && (
                        <span>{property.propertyDetails.squareFeet.toLocaleString()} sq ft</span>
                      )}
                    </>
                  )}
                  {(property.propertyDetails.homeType || property.propertyDetails.type) && (
                    <span>{property.propertyDetails.homeType || property.propertyDetails.type}</span>
                  )}
                </div>

                {property.description && (
                  <p className="mt-4 text-gray-600 dark:text-gray-400 text-sm line-clamp-2">
                    {property.description}
                  </p>
                )}

                <div className="mt-4">
                  <span className="text-xs text-gray-500 dark:text-gray-500">
                    MLS: {(() => {
                      const mlsNumber = property.mlsNumber || ''
                      // Replace "NWM" prefix with "#" if present
                      return mlsNumber.startsWith('NWM') 
                        ? `#${mlsNumber.substring(3)}`
                        : mlsNumber
                    })()}
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Pagination */}
      {data.totalPages && data.totalPages > 1 && (
        <div className="mt-8 flex flex-col items-center gap-4">
          <div className="flex items-center gap-2">
            {/* Previous Button */}
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                currentPage === 1
                  ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
              aria-label="Previous page"
            >
              Previous
            </button>

            {/* Page Numbers */}
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, data.totalPages || 1) }, (_, i) => {
                let pageNum: number
                const totalPages = data.totalPages || 1
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => onPageChange(pageNum)}
                    className={`min-w-[40px] px-3 py-2 rounded-lg font-medium transition-colors ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                    aria-label={`Go to page ${pageNum}`}
                    aria-current={currentPage === pageNum ? 'page' : undefined}
                  >
                    {pageNum}
                  </button>
                )
              })}
            </div>

            {/* Next Button */}
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= (data.totalPages || 1)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                currentPage >= data.totalPages
                  ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
              aria-label="Next page"
            >
              Next
            </button>
          </div>

          {/* Page Info */}
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Showing {((currentPage - 1) * data.pageSize) + 1} to {Math.min(currentPage * data.pageSize, data.total)} of {data.total} properties
          </p>
        </div>
      )}
    </div>
  )
}
