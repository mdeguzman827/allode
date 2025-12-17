'use client'

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
      <div className="mb-6">
        <p className="text-gray-600 dark:text-gray-400">
          Found {data.total} {data.total === 1 ? 'property' : 'properties'} for &quot;{searchQuery}&quot;
        </p>
      </div>

      <div className="space-y-6">
        {data.properties.map((property) => (
          <div
            key={property.id}
            className="border border-gray-200 dark:border-gray-800 rounded-lg p-6 hover:shadow-lg transition-shadow bg-white dark:bg-gray-900"
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
          </div>
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

