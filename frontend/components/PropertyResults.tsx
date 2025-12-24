'use client'

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
}

export default function PropertyResults({
  data,
  isLoading,
  error,
  searchQuery,
}: PropertyResultsProps) {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/3c6262fb-453d-4746-a4ed-fa5ace1b05b9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'PropertyResults.tsx:48',message:'Component render',data:{isLoading,hasData:!!data,hasError:!!error,searchQuery:searchQuery?.substring(0,50)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion

  if (isLoading) {
    return (
      <div className="mt-12 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">Searching properties...</p>
      </div>
    )
  }

  if (error) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/3c6262fb-453d-4746-a4ed-fa5ace1b05b9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'PropertyResults.tsx:62',message:'Error state',data:{errorMessage:error?.message?.substring(0,100)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    return (
      <div className="mt-12 text-center">
        <p className="text-red-600 dark:text-red-400">
          Error searching properties. Please try again.
        </p>
      </div>
    )
  }

  if (!data || data.properties.length === 0) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/3c6262fb-453d-4746-a4ed-fa5ace1b05b9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'PropertyResults.tsx:73',message:'No data state',data:{hasData:!!data,propertiesLength:data?.properties?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
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

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/3c6262fb-453d-4746-a4ed-fa5ace1b05b9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'PropertyResults.tsx:95',message:'Rendering properties list',data:{propertiesCount:data.properties.length,firstPropertyId:data.properties[0]?.id,firstPropertyHasImage:!!data.properties[0]?.images?.[0]?.url},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
  // #endregion

  return (
    <div className="mt-12">
      <div className="mb-6">
        <p className="text-gray-600 dark:text-gray-400">
          Found {data.total} {data.total === 1 ? 'property' : 'properties'} for &quot;{searchQuery}&quot;
        </p>
      </div>

      <div className="space-y-6">
        {data.properties.map((property) => (
          <Link
            key={property.id}
            href={`/property/${property.id}`}
            className="block border border-gray-200 dark:border-gray-800 rounded-lg p-6 hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-700 transition-all bg-white dark:bg-gray-900 cursor-pointer"
            aria-label={`View details for ${property.address.full}`}
          >
            <div className="flex gap-6">
              {/* Image */}
              {property.images && property.images.length > 0 && property.images[0].url ? (
                <div className="flex-shrink-0">
                  <img
                    src={`${API_URL}/api/images/${property.id}/0`}
                    alt={property.address.full}
                    className="w-48 h-48 object-cover rounded-lg"
                    onError={(e) => {
                      // #region agent log
                      fetch('http://127.0.0.1:7242/ingest/3c6262fb-453d-4746-a4ed-fa5ace1b05b9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'PropertyResults.tsx:130',message:'Image load error',data:{propertyId:property.id,proxyUrl:`${API_URL}/api/images/${property.id}/0`},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
                      // #endregion
                      e.currentTarget.src = 'https://via.placeholder.com/192x192?text=No+Image'
                    }}
                  />
                </div>
              ) : (
                <div className="flex-shrink-0 w-48 h-48 bg-gray-200 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                  <span className="text-gray-400 text-sm">No Image</span>
                </div>
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
                    {property.propertyDetails.status}
                  </span>
                </div>

                <div className="flex gap-6 mt-4 text-sm text-gray-600 dark:text-gray-400">
                  {property.propertyDetails.bedrooms && (
                    <span>{property.propertyDetails.bedrooms} bed</span>
                  )}
                  {property.propertyDetails.bathrooms && (
                    <span>{property.propertyDetails.bathrooms} bath</span>
                  )}
                  {property.propertyDetails.squareFeet && (
                    <span>{property.propertyDetails.squareFeet.toLocaleString()} sq ft</span>
                  )}
                  {property.propertyDetails.type && (
                    <span>{property.propertyDetails.type}</span>
                  )}
                </div>

                {property.description && (
                  <p className="mt-4 text-gray-600 dark:text-gray-400 text-sm line-clamp-2">
                    {property.description}
                  </p>
                )}

                <div className="mt-4">
                  <span className="text-xs text-gray-500 dark:text-gray-500">
                    MLS: {property.mlsNumber}
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {data.hasMore && (
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Showing {data.properties.length} of {data.total} properties
          </p>
        </div>
      )}
    </div>
  )
}
