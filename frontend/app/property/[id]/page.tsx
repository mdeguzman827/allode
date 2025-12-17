'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface Property {
  id: string
  mlsNumber: string
  price: number | null
  address: {
    street: string
    city: string
    state: string
    zipCode: string
    full: string
  }
  propertyDetails: {
    type: string | null
    subType: string | null
    bedrooms: number | null
    bathrooms: number | null
    squareFeet: number | null
    lotSize: number | null
    yearBuilt: number | null
    status: string | null
  }
  images: { url: string; order: number; type: string }[]
  description: string | null
  coordinates: { lat: number; lng: number } | null
  agent: { name: string; email: string; phone: string } | null
  listingDate: string | null
  lastUpdated: string | null
}

export default function PropertyPage() {
  const params = useParams()
  const router = useRouter()
  const [property, setProperty] = useState<Property | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const response = await fetch(`${API_URL}/api/properties/${params.id}`)
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Property not found')
          }
          throw new Error('Failed to load property')
        }
        const data = await response.json()
        setProperty(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load property')
      } finally {
        setIsLoading(false)
      }
    }

    if (params.id) {
      fetchProperty()
    }
  }, [params.id])

  const handleGoBack = () => {
    router.back()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center gap-4">
        <p className="text-red-500 text-lg">{error}</p>
        <Link
          href="/"
          className="text-blue-600 hover:text-blue-700 underline"
        >
          Go back to search
        </Link>
      </div>
    )
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center gap-4">
        <p className="text-gray-600 dark:text-gray-400 text-lg">Property not found</p>
        <Link
          href="/"
          className="text-blue-600 hover:text-blue-700 underline"
        >
          Go back to search
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={handleGoBack}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            aria-label="Go back"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Property Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                {property.address.street || property.address.full}
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400 mt-1">
                {property.address.city}, {property.address.state} {property.address.zipCode}
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {property.price ? `$${property.price.toLocaleString()}` : 'Price N/A'}
              </p>
              {property.price && property.propertyDetails.squareFeet && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  ${Math.round(property.price / property.propertyDetails.squareFeet).toLocaleString()}/sq ft
                </p>
              )}
            </div>
          </div>

          {/* Status Badge */}
          {property.propertyDetails.status && (
            <div className="mt-4">
              <span
                className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                  property.propertyDetails.status === 'Active'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : property.propertyDetails.status === 'Pending'
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                }`}
              >
                {property.propertyDetails.status}
              </span>
            </div>
          )}
        </div>

        {/* Property Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Key Features */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Property Details
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {property.propertyDetails.bedrooms ?? '-'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Bedrooms</p>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {property.propertyDetails.bathrooms ?? '-'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Bathrooms</p>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {property.propertyDetails.squareFeet?.toLocaleString() || '-'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Sq Ft</p>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {property.propertyDetails.yearBuilt ?? '-'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Year Built</p>
                </div>
              </div>
            </div>

            {/* Description */}
            {property.description && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Description
                </h2>
                <p className="text-gray-600 dark:text-gray-300 whitespace-pre-line leading-relaxed">
                  {property.description}
                </p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Additional Info */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Additional Info
              </h2>
              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-gray-500 dark:text-gray-400">Property Type</dt>
                  <dd className="text-gray-900 dark:text-white font-medium">
                    {property.propertyDetails.type || '-'}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500 dark:text-gray-400">MLS #</dt>
                  <dd className="text-gray-900 dark:text-white font-medium">
                    {property.mlsNumber || '-'}
                  </dd>
                </div>
                {property.propertyDetails.lotSize && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500 dark:text-gray-400">Lot Size</dt>
                    <dd className="text-gray-900 dark:text-white font-medium">
                      {property.propertyDetails.lotSize.toLocaleString()} sq ft
                    </dd>
                  </div>
                )}
                {property.listingDate && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500 dark:text-gray-400">List Date</dt>
                    <dd className="text-gray-900 dark:text-white font-medium">
                      {new Date(property.listingDate).toLocaleDateString()}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Location */}
            {property.coordinates && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Location
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Coordinates: {property.coordinates.lat.toFixed(6)}, {property.coordinates.lng.toFixed(6)}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

