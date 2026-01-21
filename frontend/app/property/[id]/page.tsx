'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import PropertyImageCarousel from '@/components/PropertyImageCarousel'

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
    // All additional property details
    appliances?: string | null
    architecturalStyle?: string | null
    attachedGarageYN?: boolean | null
    buildingName?: string | null
    buyerAgentFullName?: string | null
    buyerOfficeName?: string | null
    carportYN?: boolean | null
    closeDate?: string | null
    closePrice?: number | null
    coveredSpaces?: number | null
    cumulateDaysOnMarket?: number | null
    elementarySchool?: string | null
    exteriorFeatures?: string | null
    fireplaceFeatures?: string | null
    fireplaceYN?: boolean | null
    fireplacesTotal?: number | null
    flooring?: string | null
    foundationDetails?: string | null
    furnished?: string | null
    garageSpaces?: number | null
    garageYN?: boolean | null
    highSchool?: string | null
    highSchoolDistrict?: string | null
    inclusions?: string | null
    interiorFeatures?: string | null
    levels?: string | null
    listingAgentFullName?: string | null
    listOfficeName?: string | null
    listOfficePhone?: string | null
    listContractDate?: string | null
    listingTerms?: string | null
    lotFeatures?: string | null
    lotSizeAcres?: number | null
    lostSizeSquareFeet?: number | null
    mlsStatus?: string | null
    newConstructionYN?: boolean | null
    offMarketDate?: string | null
    onMarketDate?: string | null
    originalListPrice?: number | null
    parcelNumber?: string | null
    parkingFeatures?: string | null
    parkingTotal?: number | null
    possession?: string | null
    powerProductionType?: string | null
    propertyCondition?: string | null
    purchaseContractDate?: string | null
    roof?: string | null
    securityFeatures?: string | null
    sewer?: string | null
    sourceSystemName?: string | null
    specialListingConditions?: string | null
    subdivisionName?: string | null
    taxAnnualAmount?: number | null
    taxYear?: number | null
    topography?: string | null
    utilities?: string | null
    vegetation?: string | null
    view?: string | null
    waterSource?: string | null
    waterfrontYN?: boolean | null
    zoningDescription?: string | null
    // NWM specific fields
    nwmOffers?: string | null
    nwmOffersReviewDate?: string | null
    nwmPowerCompany?: string | null
    nwmPreliminaryTitleOrdered?: string | null
    nwmSellerDisclosure?: string | null
    nwmSeniorExemption?: string | null
    nwmSewerCompany?: string | null
    nwmStyleCode?: string | null
    nwmWaterCompany?: string | null
    nwmWaterHeaterLocation?: string | null
    nwmWaterHeaterType?: string | null
    nwmAppliancesIncluded?: string | null
    nwmBuildingInformation?: string | null
    nwmSiteFeatures?: string | null
    nwmZoningJurisdiction?: string | null
    nwmEnergySource?: string | null
    // Additional system fields
    concessionsComments?: string | null
    concessions?: string | null
    originatingSystemName?: string | null
    mlgCanView?: boolean | null
    mlgCanUse?: boolean | null
  }
  images: { url: string; order: number; type: string; width?: number; height?: number; isPreferred?: boolean }[]
  description: string | null
  coordinates: { lat: number; lng: number } | null
  agent: { name: string; email: string; phone: string } | null
  listingDate: string | null
  lastUpdated: string | null
}

export default function PropertyPage() {
  const params = useParams()
  const [property, setProperty] = useState<Property | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    interior: false,
    exterior: false,
    parking: false,
    utilities: false,
    publicFacts: false,
    location: false,
    other: false,
  })

  const handleToggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const handleExpandAll = () => {
    const allExpanded = Object.values(expandedSections).every(val => val === true)
    setExpandedSections({
      interior: !allExpanded,
      exterior: !allExpanded,
      parking: !allExpanded,
      utilities: !allExpanded,
      publicFacts: !allExpanded,
      location: !allExpanded,
      other: !allExpanded,
    })
  }

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
        
        // Preload critical images (primary + next 4) for faster rendering
        if (data.images && data.images.length > 0) {
          const imagesToPreload = Math.min(5, data.images.length)
          for (let i = 0; i < imagesToPreload; i++) {
            if (data.images[i]?.url) {
              const link = document.createElement('link')
              link.rel = 'preload'
              link.as = 'image'
              link.href = data.images[i].url
              link.fetchPriority = i === 0 ? 'high' : 'auto'
              document.head.appendChild(link)
            }
          }
        }
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
      {/* Image Gallery - Full Width */}
      {property.images && property.images.length > 0 && (
        <div className="relative w-full">
          <PropertyImageCarousel
            images={property.images}
            propertyAddress={property.address.full}
            propertyId={property.id}
            mlsStatus={property.propertyDetails.mlsStatus}
            closeDate={property.propertyDetails.closeDate}
          />
      </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 mt-8">
        {/* Property Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Key Features */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              {/* Address and Price */}
              <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {(() => {
                    const isSold = property.propertyDetails.mlsStatus?.toLowerCase() === 'sold'
                    const displayPrice = isSold && property.propertyDetails.closePrice 
                      ? property.propertyDetails.closePrice 
                      : property.price
                    return displayPrice ? `$${displayPrice.toLocaleString()}` : 'Price N/A'
                  })()}
                </p>
                <h1 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
                  {property.address.full || `${property.address.street || ''}, ${property.address.city}, ${property.address.state} ${property.address.zipCode}`.trim()}
                </h1>
              </div>

              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Property Details
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Row 1: Property Type, Bedrooms, Bathrooms, Sq Ft */}
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {property.propertyDetails.type || '-'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Property Type</p>
                </div>
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
                {/* Row 2: Year Built, Parking Total, Lot Size, Price per Sq Ft */}
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {property.propertyDetails.yearBuilt ?? '-'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Year Built</p>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {property.propertyDetails.parkingTotal ?? '-'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Parking Total</p>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {property.propertyDetails.lotSizeAcres !== null && property.propertyDetails.lotSizeAcres !== undefined
                      ? property.propertyDetails.lotSizeAcres.toFixed(2)
                      : '-'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Lot Size (Acres)</p>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {(() => {
                      const isSold = property.propertyDetails.mlsStatus?.toLowerCase() === 'sold'
                      const price = isSold && property.propertyDetails.closePrice 
                        ? property.propertyDetails.closePrice 
                        : property.price
                      return price && property.propertyDetails.squareFeet
                        ? `$${Math.round(price / property.propertyDetails.squareFeet).toLocaleString()}`
                        : '-'
                    })()}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Price/sq ft</p>
                </div>
              </div>
            </div>

            {/* Description */}
            {property.description && (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Description
                </h2>
                <p className="text-gray-600 dark:text-gray-300 whitespace-pre-line leading-relaxed">
                  {property.description}
                </p>
              </div>
            )}

            {/* Complete Property Details */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Complete Property Details
                </h2>
                <button
                  onClick={handleExpandAll}
                  className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors"
                  aria-label={Object.values(expandedSections).every(val => val === true) ? 'Collapse All' : 'Expand All'}
                >
                  {Object.values(expandedSections).every(val => val === true) ? 'Collapse All' : 'Expand All'}
                </button>
              </div>
              <div className="space-y-4">
                {/* Interior Section */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <button
                    onClick={() => handleToggleSection('interior')}
                    className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    aria-label="Toggle Interior section"
                    aria-expanded={expandedSections.interior}
                  >
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Interior
                    </h3>
                    <svg
                      className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform ${expandedSections.interior ? 'transform rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {expandedSections.interior && (
                    <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <dl className="space-y-4">
                      {property.propertyDetails.bedrooms !== null && property.propertyDetails.bedrooms !== undefined && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Bedrooms</dt>
                          <dd className="text-gray-900 dark:text-white">{property.propertyDetails.bedrooms}</dd>
                        </div>
                      )}
                      {property.propertyDetails.bathrooms !== null && property.propertyDetails.bathrooms !== undefined && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Bathrooms</dt>
                          <dd className="text-gray-900 dark:text-white">{property.propertyDetails.bathrooms}</dd>
                        </div>
                      )}
                      {property.propertyDetails.squareFeet !== null && property.propertyDetails.squareFeet !== undefined && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Square Feet</dt>
                          <dd className="text-gray-900 dark:text-white">{property.propertyDetails.squareFeet.toLocaleString()}</dd>
                        </div>
                      )}
                      {property.propertyDetails.flooring && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Flooring</dt>
                          <dd className="text-gray-900 dark:text-white">{property.propertyDetails.flooring}</dd>
                        </div>
                      )}
                      {property.propertyDetails.nwmAppliancesIncluded && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">NWM Appliances Included</dt>
                          <dd className="text-gray-900 dark:text-white">{property.propertyDetails.nwmAppliancesIncluded}</dd>
                        </div>
                      )}
                      {property.propertyDetails.interiorFeatures && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Interior Features</dt>
                          <dd className="text-gray-900 dark:text-white">{property.propertyDetails.interiorFeatures}</dd>
                        </div>
                      )}
                      {property.propertyDetails.fireplacesTotal !== null && property.propertyDetails.fireplacesTotal !== undefined && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Fireplace Total</dt>
                          <dd className="text-gray-900 dark:text-white">{property.propertyDetails.fireplacesTotal}</dd>
                        </div>
                      )}
                      {property.propertyDetails.fireplaceFeatures && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Fireplace Features</dt>
                          <dd className="text-gray-900 dark:text-white">{property.propertyDetails.fireplaceFeatures}</dd>
                        </div>
                      )}
                      {property.propertyDetails.levels && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Levels</dt>
                          <dd className="text-gray-900 dark:text-white">{property.propertyDetails.levels}</dd>
                        </div>
                      )}
                      {property.propertyDetails.furnished && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Furnished</dt>
                          <dd className="text-gray-900 dark:text-white">{property.propertyDetails.furnished}</dd>
                        </div>
                      )}
                      </dl>
                    </div>
                    </div>
                  )}
                </div>

                {/* Exterior Section */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <button
                    onClick={() => handleToggleSection('exterior')}
                    className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    aria-label="Toggle Exterior section"
                    aria-expanded={expandedSections.exterior}
                  >
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Exterior
                    </h3>
                    <svg
                      className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform ${expandedSections.exterior ? 'transform rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {expandedSections.exterior && (
                    <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <dl className="space-y-4">
                      {property.propertyDetails.exteriorFeatures && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Exterior Features</dt>
                          <dd className="text-gray-900 dark:text-white">{property.propertyDetails.exteriorFeatures}</dd>
                        </div>
                      )}
                      {property.propertyDetails.architecturalStyle && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Architectural Style</dt>
                          <dd className="text-gray-900 dark:text-white">{property.propertyDetails.architecturalStyle}</dd>
                        </div>
                      )}
                      {property.propertyDetails.roof && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Roof</dt>
                          <dd className="text-gray-900 dark:text-white">{property.propertyDetails.roof}</dd>
                        </div>
                      )}
                      {property.propertyDetails.foundationDetails && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Foundation Details</dt>
                          <dd className="text-gray-900 dark:text-white">{property.propertyDetails.foundationDetails}</dd>
                        </div>
                      )}
                      {property.propertyDetails.lotFeatures && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Lot Features</dt>
                          <dd className="text-gray-900 dark:text-white">{property.propertyDetails.lotFeatures}</dd>
                        </div>
                      )}
                      {property.propertyDetails.view && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">View</dt>
                          <dd className="text-gray-900 dark:text-white">{property.propertyDetails.view}</dd>
                        </div>
                      )}
                      {property.propertyDetails.newConstructionYN !== null && property.propertyDetails.newConstructionYN !== undefined && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">New Construction</dt>
                          <dd className="text-gray-900 dark:text-white">{property.propertyDetails.newConstructionYN ? 'Yes' : 'No'}</dd>
                        </div>
                      )}
                      {property.propertyDetails.propertyCondition && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Property Condition</dt>
                          <dd className="text-gray-900 dark:text-white">{property.propertyDetails.propertyCondition}</dd>
                        </div>
                      )}
                      {property.propertyDetails.topography && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Topography</dt>
                          <dd className="text-gray-900 dark:text-white">{property.propertyDetails.topography}</dd>
                        </div>
                      )}
                      {property.propertyDetails.vegetation && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Vegetation</dt>
                          <dd className="text-gray-900 dark:text-white">{property.propertyDetails.vegetation}</dd>
                        </div>
                      )}
                      {property.propertyDetails.waterfrontYN !== null && property.propertyDetails.waterfrontYN !== undefined && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Waterfront</dt>
                          <dd className="text-gray-900 dark:text-white">{property.propertyDetails.waterfrontYN ? 'Yes' : 'No'}</dd>
                        </div>
                      )}
                      {property.propertyDetails.nwmStyleCode && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">NWM Style Code</dt>
                          <dd className="text-gray-900 dark:text-white">{property.propertyDetails.nwmStyleCode}</dd>
                        </div>
                      )}
                      {property.propertyDetails.nwmBuildingInformation && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">NWM Building Information</dt>
                          <dd className="text-gray-900 dark:text-white">{property.propertyDetails.nwmBuildingInformation}</dd>
                        </div>
                      )}
                      {property.propertyDetails.nwmSiteFeatures && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">NWM Site Features</dt>
                          <dd className="text-gray-900 dark:text-white">{property.propertyDetails.nwmSiteFeatures}</dd>
                        </div>
                      )}
                      </dl>
                    </div>
                    </div>
                  )}
                </div>

                {/* Parking Section */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <button
                    onClick={() => handleToggleSection('parking')}
                    className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    aria-label="Toggle Parking section"
                    aria-expanded={expandedSections.parking}
                  >
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Parking
                    </h3>
                    <svg
                      className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform ${expandedSections.parking ? 'transform rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {expandedSections.parking && (
                    <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <dl className="space-y-4">
                      {property.propertyDetails.parkingTotal !== null && property.propertyDetails.parkingTotal !== undefined && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Parking Total</dt>
                          <dd className="text-gray-900 dark:text-white">{property.propertyDetails.parkingTotal}</dd>
                        </div>
                      )}
                      {property.propertyDetails.attachedGarageYN !== null && property.propertyDetails.attachedGarageYN !== undefined && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Attached Garage</dt>
                          <dd className="text-gray-900 dark:text-white">{property.propertyDetails.attachedGarageYN ? 'Yes' : 'No'}</dd>
                        </div>
                      )}
                      {property.propertyDetails.coveredSpaces !== null && property.propertyDetails.coveredSpaces !== undefined && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Covered Spaces</dt>
                          <dd className="text-gray-900 dark:text-white">{property.propertyDetails.coveredSpaces}</dd>
                        </div>
                      )}
                      {property.propertyDetails.garageSpaces !== null && property.propertyDetails.garageSpaces !== undefined && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Garage Spaces</dt>
                          <dd className="text-gray-900 dark:text-white">{property.propertyDetails.garageSpaces}</dd>
                        </div>
                      )}
                      {property.propertyDetails.garageYN !== null && property.propertyDetails.garageYN !== undefined && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Garage</dt>
                          <dd className="text-gray-900 dark:text-white">{property.propertyDetails.garageYN ? 'Yes' : 'No'}</dd>
                        </div>
                      )}
                      {property.propertyDetails.carportYN !== null && property.propertyDetails.carportYN !== undefined && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Carport</dt>
                          <dd className="text-gray-900 dark:text-white">{property.propertyDetails.carportYN ? 'Yes' : 'No'}</dd>
                        </div>
                      )}
                      {property.propertyDetails.securityFeatures && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Security Features</dt>
                          <dd className="text-gray-900 dark:text-white">{property.propertyDetails.securityFeatures}</dd>
                        </div>
                      )}
                      </dl>
                    </div>
                    </div>
                  )}
                </div>

                {/* Utilities Section */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <button
                    onClick={() => handleToggleSection('utilities')}
                    className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    aria-label="Toggle Utilities section"
                    aria-expanded={expandedSections.utilities}
                  >
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Utilities
                    </h3>
                    <svg
                      className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform ${expandedSections.utilities ? 'transform rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {expandedSections.utilities && (
                    <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <dl className="space-y-4">
                      {property.propertyDetails.powerProductionType && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Power Production Type</dt>
                          <dd className="text-gray-900 dark:text-white">{property.propertyDetails.powerProductionType}</dd>
                        </div>
                      )}
                      {property.propertyDetails.sewer && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Sewer</dt>
                          <dd className="text-gray-900 dark:text-white">{property.propertyDetails.sewer}</dd>
                        </div>
                      )}
                      {property.propertyDetails.utilities && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Utilities</dt>
                          <dd className="text-gray-900 dark:text-white">{property.propertyDetails.utilities}</dd>
                        </div>
                      )}
                      {property.propertyDetails.waterSource && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Water Source</dt>
                          <dd className="text-gray-900 dark:text-white">{property.propertyDetails.waterSource}</dd>
                        </div>
                      )}
                      {property.propertyDetails.nwmPowerCompany && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">NWM Power Company</dt>
                          <dd className="text-gray-900 dark:text-white">{property.propertyDetails.nwmPowerCompany}</dd>
                        </div>
                      )}
                      {property.propertyDetails.nwmSewerCompany && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">NWM Sewer Company</dt>
                          <dd className="text-gray-900 dark:text-white">{property.propertyDetails.nwmSewerCompany}</dd>
                        </div>
                      )}
                      {property.propertyDetails.nwmWaterCompany && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">NWM Water Company</dt>
                          <dd className="text-gray-900 dark:text-white">{property.propertyDetails.nwmWaterCompany}</dd>
                        </div>
                      )}
                      </dl>
                    </div>
                    </div>
                  )}
                </div>

                {/* Public Facts Section */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <button
                    onClick={() => handleToggleSection('publicFacts')}
                    className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    aria-label="Toggle Public Facts section"
                    aria-expanded={expandedSections.publicFacts}
                  >
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Public Facts
                    </h3>
                    <svg
                      className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform ${expandedSections.publicFacts ? 'transform rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {expandedSections.publicFacts && (
                    <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <dl className="space-y-4">
                      {property.propertyDetails.parcelNumber && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Parcel Number</dt>
                          <dd className="text-gray-900 dark:text-white">{property.propertyDetails.parcelNumber}</dd>
                        </div>
                      )}
                      {property.propertyDetails.taxAnnualAmount !== null && property.propertyDetails.taxAnnualAmount !== undefined && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Tax Annual Amount</dt>
                          <dd className="text-gray-900 dark:text-white">${property.propertyDetails.taxAnnualAmount.toLocaleString()}</dd>
                        </div>
                      )}
                      {property.propertyDetails.taxYear !== null && property.propertyDetails.taxYear !== undefined && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Tax Year</dt>
                          <dd className="text-gray-900 dark:text-white">{property.propertyDetails.taxYear}</dd>
                        </div>
                      )}
                      </dl>
                    </div>
                    </div>
                  )}
                </div>

                {/* Location Section */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <button
                    onClick={() => handleToggleSection('location')}
                    className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    aria-label="Toggle Location section"
                    aria-expanded={expandedSections.location}
                  >
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Location
                    </h3>
                    <svg
                      className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform ${expandedSections.location ? 'transform rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {expandedSections.location && (
                    <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <dl className="space-y-4">
                      {property.propertyDetails.elementarySchool && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Elementary School</dt>
                          <dd className="text-gray-900 dark:text-white">{property.propertyDetails.elementarySchool}</dd>
                        </div>
                      )}
                      {property.propertyDetails.highSchool && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">High School</dt>
                          <dd className="text-gray-900 dark:text-white">{property.propertyDetails.highSchool}</dd>
                        </div>
                      )}
                      {property.propertyDetails.highSchoolDistrict && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">High School District</dt>
                          <dd className="text-gray-900 dark:text-white">{property.propertyDetails.highSchoolDistrict}</dd>
                        </div>
                      )}
                      {property.propertyDetails.subdivisionName && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Subdivision Name</dt>
                          <dd className="text-gray-900 dark:text-white">{property.propertyDetails.subdivisionName}</dd>
                        </div>
                      )}
                      {property.propertyDetails.nwmZoningJurisdiction && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">NWM Zoning Jurisdiction</dt>
                          <dd className="text-gray-900 dark:text-white">{property.propertyDetails.nwmZoningJurisdiction}</dd>
                        </div>
                      )}
                      </dl>
                    </div>
                    </div>
                  )}
                </div>

                {/* Other Section */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <button
                    onClick={() => handleToggleSection('other')}
                    className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    aria-label="Toggle Other section"
                    aria-expanded={expandedSections.other}
                  >
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Other
                    </h3>
                    <svg
                      className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform ${expandedSections.other ? 'transform rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {expandedSections.other && (
                    <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <dl className="space-y-4">
                      {property.propertyDetails.listingTerms && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Listing Terms</dt>
                          <dd className="text-gray-900 dark:text-white">{property.propertyDetails.listingTerms}</dd>
                        </div>
                      )}
                      {property.propertyDetails.possession && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Possession</dt>
                          <dd className="text-gray-900 dark:text-white">{property.propertyDetails.possession}</dd>
                        </div>
                      )}
                      {property.propertyDetails.nwmOffers && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">NWM Offers</dt>
                          <dd className="text-gray-900 dark:text-white">{property.propertyDetails.nwmOffers}</dd>
                        </div>
                      )}
                      {property.propertyDetails.listOfficeName && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">List Office Name</dt>
                          <dd className="text-gray-900 dark:text-white">{property.propertyDetails.listOfficeName}</dd>
                        </div>
                      )}
                      {property.propertyDetails.buyerAgentFullName && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Buyer Agent</dt>
                          <dd className="text-gray-900 dark:text-white">{property.propertyDetails.buyerAgentFullName}</dd>
                        </div>
                      )}
                      {property.propertyDetails.buyerOfficeName && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Buyer Office</dt>
                          <dd className="text-gray-900 dark:text-white">{property.propertyDetails.buyerOfficeName}</dd>
                        </div>
                      )}
                      {property.propertyDetails.sourceSystemName && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Source System Name</dt>
                          <dd className="text-gray-900 dark:text-white">{property.propertyDetails.sourceSystemName}</dd>
                        </div>
                      )}
                      {property.propertyDetails.originatingSystemName && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Originating System Name</dt>
                          <dd className="text-gray-900 dark:text-white">{property.propertyDetails.originatingSystemName}</dd>
                        </div>
                      )}
                      {property.propertyDetails.specialListingConditions && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Special Listing Conditions</dt>
                          <dd className="text-gray-900 dark:text-white">{property.propertyDetails.specialListingConditions}</dd>
                        </div>
                      )}
                      </dl>
                    </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Request a Tour, Request Disclosures, and Make an Offer Buttons */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-4 sticky top-8">
              <button
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                aria-label="Request a Tour"
              >
                Request a Tour
              </button>
              <button
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                aria-label="Request Disclosures"
              >
                Request Disclosures
              </button>
              <button
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                aria-label="Make an Offer"
              >
                Make an Offer
              </button>
              </div>
          </div>
        </div>
      </main>
    </div>
  )
}

