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
            const link = document.createElement('link')
            link.rel = 'preload'
            link.as = 'image'
            link.href = `${API_URL}/api/images/${params.id}/${i}`
            link.fetchPriority = i === 0 ? 'high' : 'auto'
            document.head.appendChild(link)
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
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                Complete Property Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <dl className="space-y-4">
                  {property.mlsNumber && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">MLS #</dt>
                      <dd className="text-gray-900 dark:text-white">{property.mlsNumber}</dd>
                    </div>
                  )}
                  {property.propertyDetails.subType && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Property Sub Type</dt>
                      <dd className="text-gray-900 dark:text-white">{property.propertyDetails.subType}</dd>
                    </div>
                  )}
                  {property.propertyDetails.appliances && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Appliances</dt>
                      <dd className="text-gray-900 dark:text-white">{property.propertyDetails.appliances}</dd>
                    </div>
                  )}
                  {property.propertyDetails.architecturalStyle && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Architectural Style</dt>
                      <dd className="text-gray-900 dark:text-white">{property.propertyDetails.architecturalStyle}</dd>
                    </div>
                  )}
                  {property.propertyDetails.attachedGarageYN !== null && property.propertyDetails.attachedGarageYN !== undefined && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Attached Garage</dt>
                      <dd className="text-gray-900 dark:text-white">{property.propertyDetails.attachedGarageYN ? 'Yes' : 'No'}</dd>
                    </div>
                  )}
                  {property.propertyDetails.buildingName && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Building Name</dt>
                      <dd className="text-gray-900 dark:text-white">{property.propertyDetails.buildingName}</dd>
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
                  {property.propertyDetails.carportYN !== null && property.propertyDetails.carportYN !== undefined && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Carport</dt>
                      <dd className="text-gray-900 dark:text-white">{property.propertyDetails.carportYN ? 'Yes' : 'No'}</dd>
                    </div>
                  )}
                  {property.propertyDetails.closeDate && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Close Date</dt>
                      <dd className="text-gray-900 dark:text-white">{new Date(property.propertyDetails.closeDate).toLocaleDateString()}</dd>
                    </div>
                  )}
                  {property.propertyDetails.closePrice !== null && property.propertyDetails.closePrice !== undefined && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Close Price</dt>
                      <dd className="text-gray-900 dark:text-white">${property.propertyDetails.closePrice.toLocaleString()}</dd>
                    </div>
                  )}
                  {property.propertyDetails.coveredSpaces !== null && property.propertyDetails.coveredSpaces !== undefined && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Covered Spaces</dt>
                      <dd className="text-gray-900 dark:text-white">{property.propertyDetails.coveredSpaces}</dd>
                    </div>
                  )}
                  {property.propertyDetails.cumulateDaysOnMarket !== null && property.propertyDetails.cumulateDaysOnMarket !== undefined && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Days on Market</dt>
                      <dd className="text-gray-900 dark:text-white">{property.propertyDetails.cumulateDaysOnMarket}</dd>
                    </div>
                  )}
                  {property.propertyDetails.elementarySchool && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Elementary School</dt>
                      <dd className="text-gray-900 dark:text-white">{property.propertyDetails.elementarySchool}</dd>
                    </div>
                  )}
                  {property.propertyDetails.exteriorFeatures && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Exterior Features</dt>
                      <dd className="text-gray-900 dark:text-white">{property.propertyDetails.exteriorFeatures}</dd>
                    </div>
                  )}
                  {property.propertyDetails.fireplaceFeatures && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Fireplace Features</dt>
                      <dd className="text-gray-900 dark:text-white">{property.propertyDetails.fireplaceFeatures}</dd>
                    </div>
                  )}
                  {property.propertyDetails.fireplaceYN !== null && property.propertyDetails.fireplaceYN !== undefined && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Fireplace</dt>
                      <dd className="text-gray-900 dark:text-white">{property.propertyDetails.fireplaceYN ? 'Yes' : 'No'}</dd>
                    </div>
                  )}
                  {property.propertyDetails.fireplacesTotal !== null && property.propertyDetails.fireplacesTotal !== undefined && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Fireplaces Total</dt>
                      <dd className="text-gray-900 dark:text-white">{property.propertyDetails.fireplacesTotal}</dd>
                    </div>
                  )}
                  {property.propertyDetails.flooring && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Flooring</dt>
                      <dd className="text-gray-900 dark:text-white">{property.propertyDetails.flooring}</dd>
                    </div>
                  )}
                  {property.propertyDetails.foundationDetails && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Foundation Details</dt>
                      <dd className="text-gray-900 dark:text-white">{property.propertyDetails.foundationDetails}</dd>
                    </div>
                  )}
                  {property.propertyDetails.furnished && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Furnished</dt>
                      <dd className="text-gray-900 dark:text-white">{property.propertyDetails.furnished}</dd>
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
                  {property.propertyDetails.inclusions && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Inclusions</dt>
                      <dd className="text-gray-900 dark:text-white">{property.propertyDetails.inclusions}</dd>
                    </div>
                  )}
                  {property.propertyDetails.interiorFeatures && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Interior Features</dt>
                      <dd className="text-gray-900 dark:text-white">{property.propertyDetails.interiorFeatures}</dd>
                    </div>
                  )}
                  {property.propertyDetails.levels && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Levels</dt>
                      <dd className="text-gray-900 dark:text-white">{property.propertyDetails.levels}</dd>
                    </div>
                  )}
                  {property.propertyDetails.listingAgentFullName && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Listing Agent</dt>
                      <dd className="text-gray-900 dark:text-white">{property.propertyDetails.listingAgentFullName}</dd>
                    </div>
                  )}
                  {property.propertyDetails.listOfficeName && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">List Office Name</dt>
                      <dd className="text-gray-900 dark:text-white">{property.propertyDetails.listOfficeName}</dd>
                    </div>
                  )}
                  {property.propertyDetails.listOfficePhone && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">List Office Phone</dt>
                      <dd className="text-gray-900 dark:text-white">{property.propertyDetails.listOfficePhone}</dd>
                    </div>
                  )}
                  {property.propertyDetails.listContractDate && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">List Contract Date</dt>
                      <dd className="text-gray-900 dark:text-white">{new Date(property.propertyDetails.listContractDate).toLocaleDateString()}</dd>
                    </div>
                  )}
                  {property.propertyDetails.listingTerms && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Listing Terms</dt>
                      <dd className="text-gray-900 dark:text-white">{property.propertyDetails.listingTerms}</dd>
                    </div>
                  )}
                  {property.propertyDetails.lotFeatures && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Lot Features</dt>
                      <dd className="text-gray-900 dark:text-white">{property.propertyDetails.lotFeatures}</dd>
                    </div>
                  )}
                  {property.propertyDetails.lotSizeAcres !== null && property.propertyDetails.lotSizeAcres !== undefined && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Lot Size (Acres)</dt>
                      <dd className="text-gray-900 dark:text-white">{property.propertyDetails.lotSizeAcres.toFixed(2)}</dd>
                    </div>
                  )}
                  {property.propertyDetails.lostSizeSquareFeet !== null && property.propertyDetails.lostSizeSquareFeet !== undefined && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Lost Size (Sq Ft)</dt>
                      <dd className="text-gray-900 dark:text-white">{property.propertyDetails.lostSizeSquareFeet}</dd>
                    </div>
                  )}
                  {property.propertyDetails.mlsStatus && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">MLS Status</dt>
                      <dd className="text-gray-900 dark:text-white">{property.propertyDetails.mlsStatus}</dd>
                    </div>
                  )}
                  {property.propertyDetails.newConstructionYN !== null && property.propertyDetails.newConstructionYN !== undefined && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">New Construction</dt>
                      <dd className="text-gray-900 dark:text-white">{property.propertyDetails.newConstructionYN ? 'Yes' : 'No'}</dd>
                    </div>
                  )}
                  {property.propertyDetails.offMarketDate && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Off Market Date</dt>
                      <dd className="text-gray-900 dark:text-white">{new Date(property.propertyDetails.offMarketDate).toLocaleDateString()}</dd>
                    </div>
                  )}
                  {property.propertyDetails.onMarketDate && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">On Market Date</dt>
                      <dd className="text-gray-900 dark:text-white">{new Date(property.propertyDetails.onMarketDate).toLocaleDateString()}</dd>
                    </div>
                  )}
                  {property.propertyDetails.originalListPrice !== null && property.propertyDetails.originalListPrice !== undefined && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Original List Price</dt>
                      <dd className="text-gray-900 dark:text-white">${property.propertyDetails.originalListPrice.toLocaleString()}</dd>
                    </div>
                  )}
                  {property.propertyDetails.parcelNumber && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Parcel Number</dt>
                      <dd className="text-gray-900 dark:text-white">{property.propertyDetails.parcelNumber}</dd>
                    </div>
                  )}
                  {property.propertyDetails.parkingFeatures && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Parking Features</dt>
                      <dd className="text-gray-900 dark:text-white">{property.propertyDetails.parkingFeatures}</dd>
                    </div>
                  )}
                  {property.propertyDetails.parkingTotal !== null && property.propertyDetails.parkingTotal !== undefined && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Parking Total</dt>
                      <dd className="text-gray-900 dark:text-white">{property.propertyDetails.parkingTotal}</dd>
                    </div>
                  )}
                  {property.propertyDetails.possession && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Possession</dt>
                      <dd className="text-gray-900 dark:text-white">{property.propertyDetails.possession}</dd>
                    </div>
                  )}
                  {property.propertyDetails.powerProductionType && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Power Production Type</dt>
                      <dd className="text-gray-900 dark:text-white">{property.propertyDetails.powerProductionType}</dd>
                    </div>
                  )}
                  {property.propertyDetails.propertyCondition && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Property Condition</dt>
                      <dd className="text-gray-900 dark:text-white">{property.propertyDetails.propertyCondition}</dd>
                    </div>
                  )}
                  {property.propertyDetails.purchaseContractDate && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Purchase Contract Date</dt>
                      <dd className="text-gray-900 dark:text-white">{new Date(property.propertyDetails.purchaseContractDate).toLocaleDateString()}</dd>
                    </div>
                  )}
                  {property.propertyDetails.roof && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Roof</dt>
                      <dd className="text-gray-900 dark:text-white">{property.propertyDetails.roof}</dd>
                    </div>
                  )}
                  {property.propertyDetails.securityFeatures && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Security Features</dt>
                      <dd className="text-gray-900 dark:text-white">{property.propertyDetails.securityFeatures}</dd>
                    </div>
                  )}
                  {property.propertyDetails.sewer && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Sewer</dt>
                      <dd className="text-gray-900 dark:text-white">{property.propertyDetails.sewer}</dd>
                    </div>
                  )}
                  {property.propertyDetails.sourceSystemName && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Source System Name</dt>
                      <dd className="text-gray-900 dark:text-white">{property.propertyDetails.sourceSystemName}</dd>
                    </div>
                  )}
                  {property.propertyDetails.specialListingConditions && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Special Listing Conditions</dt>
                      <dd className="text-gray-900 dark:text-white">{property.propertyDetails.specialListingConditions}</dd>
                    </div>
                  )}
                  {property.propertyDetails.subdivisionName && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Subdivision Name</dt>
                      <dd className="text-gray-900 dark:text-white">{property.propertyDetails.subdivisionName}</dd>
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
                  {property.propertyDetails.topography && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Topography</dt>
                      <dd className="text-gray-900 dark:text-white">{property.propertyDetails.topography}</dd>
                    </div>
                  )}
                  {property.propertyDetails.utilities && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Utilities</dt>
                      <dd className="text-gray-900 dark:text-white">{property.propertyDetails.utilities}</dd>
                    </div>
                  )}
                  {property.propertyDetails.vegetation && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Vegetation</dt>
                      <dd className="text-gray-900 dark:text-white">{property.propertyDetails.vegetation}</dd>
                    </div>
                  )}
                  {property.propertyDetails.view && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">View</dt>
                      <dd className="text-gray-900 dark:text-white">{property.propertyDetails.view}</dd>
                    </div>
                  )}
                  {property.propertyDetails.waterSource && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Water Source</dt>
                      <dd className="text-gray-900 dark:text-white">{property.propertyDetails.waterSource}</dd>
                    </div>
                  )}
                  {property.propertyDetails.waterfrontYN !== null && property.propertyDetails.waterfrontYN !== undefined && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Waterfront</dt>
                      <dd className="text-gray-900 dark:text-white">{property.propertyDetails.waterfrontYN ? 'Yes' : 'No'}</dd>
                    </div>
                  )}
                  {property.propertyDetails.zoningDescription && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Zoning Description</dt>
                      <dd className="text-gray-900 dark:text-white">{property.propertyDetails.zoningDescription}</dd>
                    </div>
                  )}
                  {/* NWM Fields */}
                  {property.propertyDetails.nwmOffers && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">NWM Offers</dt>
                      <dd className="text-gray-900 dark:text-white">{property.propertyDetails.nwmOffers}</dd>
                    </div>
                  )}
                  {property.propertyDetails.nwmOffersReviewDate && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">NWM Offers Review Date</dt>
                      <dd className="text-gray-900 dark:text-white">{new Date(property.propertyDetails.nwmOffersReviewDate).toLocaleDateString()}</dd>
                    </div>
                  )}
                  {property.propertyDetails.nwmPowerCompany && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">NWM Power Company</dt>
                      <dd className="text-gray-900 dark:text-white">{property.propertyDetails.nwmPowerCompany}</dd>
                    </div>
                  )}
                  {property.propertyDetails.nwmPreliminaryTitleOrdered && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">NWM Preliminary Title Ordered</dt>
                      <dd className="text-gray-900 dark:text-white">{property.propertyDetails.nwmPreliminaryTitleOrdered}</dd>
                    </div>
                  )}
                  {property.propertyDetails.nwmSellerDisclosure && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">NWM Seller Disclosure</dt>
                      <dd className="text-gray-900 dark:text-white">{property.propertyDetails.nwmSellerDisclosure}</dd>
                    </div>
                  )}
                  {property.propertyDetails.nwmSeniorExemption && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">NWM Senior Exemption</dt>
                      <dd className="text-gray-900 dark:text-white">{property.propertyDetails.nwmSeniorExemption}</dd>
                    </div>
                  )}
                  {property.propertyDetails.nwmSewerCompany && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">NWM Sewer Company</dt>
                      <dd className="text-gray-900 dark:text-white">{property.propertyDetails.nwmSewerCompany}</dd>
                    </div>
                  )}
                  {property.propertyDetails.nwmStyleCode && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">NWM Style Code</dt>
                      <dd className="text-gray-900 dark:text-white">{property.propertyDetails.nwmStyleCode}</dd>
                    </div>
                  )}
                  {property.propertyDetails.nwmWaterCompany && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">NWM Water Company</dt>
                      <dd className="text-gray-900 dark:text-white">{property.propertyDetails.nwmWaterCompany}</dd>
                    </div>
                  )}
                  {property.propertyDetails.nwmWaterHeaterLocation && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">NWM Water Heater Location</dt>
                      <dd className="text-gray-900 dark:text-white">{property.propertyDetails.nwmWaterHeaterLocation}</dd>
                    </div>
                  )}
                  {property.propertyDetails.nwmWaterHeaterType && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">NWM Water Heater Type</dt>
                      <dd className="text-gray-900 dark:text-white">{property.propertyDetails.nwmWaterHeaterType}</dd>
                    </div>
                  )}
                  {property.propertyDetails.nwmAppliancesIncluded && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">NWM Appliances Included</dt>
                      <dd className="text-gray-900 dark:text-white">{property.propertyDetails.nwmAppliancesIncluded}</dd>
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
                  {property.propertyDetails.nwmZoningJurisdiction && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">NWM Zoning Jurisdiction</dt>
                      <dd className="text-gray-900 dark:text-white">{property.propertyDetails.nwmZoningJurisdiction}</dd>
                    </div>
                  )}
                  {property.propertyDetails.nwmEnergySource && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">NWM Energy Source</dt>
                      <dd className="text-gray-900 dark:text-white">{property.propertyDetails.nwmEnergySource}</dd>
                    </div>
                  )}
                  {/* System Fields */}
                  {property.propertyDetails.concessionsComments && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Concessions Comments</dt>
                      <dd className="text-gray-900 dark:text-white">{property.propertyDetails.concessionsComments}</dd>
                    </div>
                  )}
                  {property.propertyDetails.concessions && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Concessions</dt>
                      <dd className="text-gray-900 dark:text-white">{property.propertyDetails.concessions}</dd>
                </div>
                  )}
                  {property.propertyDetails.originatingSystemName && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Originating System Name</dt>
                      <dd className="text-gray-900 dark:text-white">{property.propertyDetails.originatingSystemName}</dd>
                </div>
                  )}
                  {property.propertyDetails.mlgCanView !== null && property.propertyDetails.mlgCanView !== undefined && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">MLG Can View</dt>
                      <dd className="text-gray-900 dark:text-white">{property.propertyDetails.mlgCanView ? 'Yes' : 'No'}</dd>
                  </div>
                )}
                  {property.propertyDetails.mlgCanUse !== null && property.propertyDetails.mlgCanUse !== undefined && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">MLG Can Use</dt>
                      <dd className="text-gray-900 dark:text-white">{property.propertyDetails.mlgCanUse ? 'Yes' : 'No'}</dd>
                  </div>
                )}
              </dl>
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

