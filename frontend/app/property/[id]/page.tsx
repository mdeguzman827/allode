'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import PropertyImageCarousel from '@/components/PropertyImageCarousel'

const TOUR_MESSAGE_PREFIX = (address: string) =>
  `I would like to schedule a tour for ${address} at ...`
const DISCLOSURES_MESSAGE_PREFIX = (address: string) =>
  `I would like to request disclosures for ${address}. `
const OFFER_MESSAGE_PREFIX = (address: string) =>
  `I would like to make an offer for ${address}. `

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
    homeType?: string | null
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
  lastPopulateRun?: string | null
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
  })
  const [isTourModalOpen, setIsTourModalOpen] = useState(false)
  const [tourMessage, setTourMessage] = useState('')
  const [tourMessageSent, setTourMessageSent] = useState(false)
  const tourModalRef = useRef<HTMLDivElement>(null)

  const [isDisclosuresModalOpen, setIsDisclosuresModalOpen] = useState(false)
  const [disclosuresMessage, setDisclosuresMessage] = useState('')
  const [disclosuresMessageSent, setDisclosuresMessageSent] = useState(false)
  const disclosuresModalRef = useRef<HTMLDivElement>(null)

  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false)
  const [offerMessage, setOfferMessage] = useState('')
  const [offerMessageSent, setOfferMessageSent] = useState(false)
  const offerModalRef = useRef<HTMLDivElement>(null)

  const handleOpenTourModal = () => {
    const address = property?.address?.full || ''
    setTourMessage(TOUR_MESSAGE_PREFIX(address))
    setTourMessageSent(false)
    setIsTourModalOpen(true)
  }

  const handleCloseTourModal = () => {
    setIsTourModalOpen(false)
    setTourMessageSent(false)
  }

  const handleSendTourMessage = () => {
    setTourMessageSent(true)
  }

  const handleOpenDisclosuresModal = () => {
    const address = property?.address?.full || ''
    setDisclosuresMessage(DISCLOSURES_MESSAGE_PREFIX(address))
    setDisclosuresMessageSent(false)
    setIsDisclosuresModalOpen(true)
  }

  const handleCloseDisclosuresModal = () => {
    setIsDisclosuresModalOpen(false)
    setDisclosuresMessageSent(false)
  }

  const handleSendDisclosuresMessage = () => {
    setDisclosuresMessageSent(true)
  }

  const handleOpenOfferModal = () => {
    const address = property?.address?.full || ''
    setOfferMessage(OFFER_MESSAGE_PREFIX(address))
    setOfferMessageSent(false)
    setIsOfferModalOpen(true)
  }

  const handleCloseOfferModal = () => {
    setIsOfferModalOpen(false)
    setOfferMessageSent(false)
  }

  const handleSendOfferMessage = () => {
    setOfferMessageSent(true)
  }

  const handleTourModalKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') handleCloseTourModal()
  }

  const handleDisclosuresModalKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') handleCloseDisclosuresModal()
  }

  const handleOfferModalKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') handleCloseOfferModal()
  }

  useEffect(() => {
    if (!isTourModalOpen) return
    const handleClickOutside = (event: MouseEvent) => {
      if (
        tourModalRef.current &&
        !tourModalRef.current.contains(event.target as Node)
      ) {
        handleCloseTourModal()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isTourModalOpen])

  useEffect(() => {
    if (!isDisclosuresModalOpen) return
    const handleClickOutside = (event: MouseEvent) => {
      if (
        disclosuresModalRef.current &&
        !disclosuresModalRef.current.contains(event.target as Node)
      ) {
        handleCloseDisclosuresModal()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isDisclosuresModalOpen])

  useEffect(() => {
    if (!isOfferModalOpen) return
    const handleClickOutside = (event: MouseEvent) => {
      if (
        offerModalRef.current &&
        !offerModalRef.current.contains(event.target as Node)
      ) {
        handleCloseOfferModal()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOfferModalOpen])

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

  const formatDataUpdatedDate = (dateStr: string | null | undefined): string => {
    if (!dateStr) return 'N/A'
    try {
      const d = new Date(dateStr)
      if (Number.isNaN(d.getTime())) return dateStr
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Los_Angeles',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
      const parts = formatter.formatToParts(d)
      const get = (type: Intl.DateTimeFormatPart['type']) => parts.find((p) => p.type === type)?.value ?? ''
      const month = get('month')
      const day = get('day')
      const year = get('year')
      const hour = get('hour')
      const minute = get('minute')
      const dayPeriod = get('dayPeriod').toLowerCase()
      const minStr = minute ? `:${minute}` : ''
      return `${month} ${day}, ${year} ${hour}${minStr} ${dayPeriod} PST`
    } catch {
      return dateStr
    }
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
            mlsStatus={property.propertyDetails.mlsStatus ?? undefined}
            closeDate={property.propertyDetails.closeDate}
          />
      </div>
      )}

      {/* Listing Agent, Office - Below Image Gallery */}
      {(property.propertyDetails.listingAgentFullName || property.propertyDetails.listOfficeName || 
        (property.propertyDetails.mlsStatus?.toLowerCase() === 'sold' && 
         (property.propertyDetails.buyerAgentFullName || property.propertyDetails.buyerOfficeName))) && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <p className="text-gray-900 dark:text-white">
            {(property.propertyDetails.listingAgentFullName || property.propertyDetails.listOfficeName) && (
              <>
                <span className="font-medium">Listed by: </span>
                {(() => {
                  const agent = property.propertyDetails.listingAgentFullName || ''
                  const office = property.propertyDetails.listOfficeName || ''
                  const parts = []
                  if (agent) parts.push(agent)
                  if (office) parts.push(office)
                  return parts.length > 0 ? parts.join(', ') : null
                })()}
              </>
            )}
            {property.propertyDetails.mlsStatus?.toLowerCase() === 'sold' && 
             (property.propertyDetails.buyerAgentFullName || property.propertyDetails.buyerOfficeName) && (
              <>
                {(property.propertyDetails.listingAgentFullName || property.propertyDetails.listOfficeName) && ' • '}
                <span className="font-medium">Bought by: </span>
                {(() => {
                  const agent = property.propertyDetails.buyerAgentFullName || ''
                  const office = property.propertyDetails.buyerOfficeName || ''
                  const parts = []
                  if (agent) parts.push(agent)
                  if (office) parts.push(office)
                  return parts.length > 0 ? parts.join(', ') : null
                })()}
              </>
            )}
          </p>
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
                {/* Row 1: Home Type, Bedrooms, Bathrooms, Sq Ft */}
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {property.propertyDetails.homeType || property.propertyDetails.type || '-'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Home Type</p>
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
            {(property.description || property.propertyDetails.sourceSystemName || property.mlsNumber || property.lastPopulateRun) && (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Description
                </h2>
                {property.description && (
                  <p className="text-gray-600 dark:text-gray-300 whitespace-pre-line leading-relaxed">
                    {property.description}
                  </p>
                )}
                {(property.propertyDetails.sourceSystemName || property.mlsNumber) && (
                  <div className={property.description ? "mt-4 pt-4 border-t border-gray-200 dark:border-gray-700" : ""}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-500 dark:text-gray-400">Source</span>
                      <span className="text-gray-900 dark:text-white flex items-center gap-2 flex-wrap">
                      {(() => {
                        const sourceSystemName = property.propertyDetails.sourceSystemName || ''
                        const mlsNumber = property.mlsNumber || ''
                        // Remove "NWM" prefix from Listing ID if present
                        const listingIdWithoutPrefix = mlsNumber.startsWith('NWM') 
                          ? mlsNumber.substring(3) 
                          : mlsNumber
                        
                        const parts = []
                        if (sourceSystemName) {
                          parts.push(sourceSystemName)
                        }
                        if (listingIdWithoutPrefix) {
                          parts.push(`MLS #${listingIdWithoutPrefix}`)
                        }
                        
                        const text = parts.length > 0 ? parts.join(', ') : null
                        const showLogo = sourceSystemName === 'NWMLS' && listingIdWithoutPrefix
                        
                        return (
                          <>
                            {text}
                            {showLogo && (
                              <img
                                src="/nwmls-logo.jpg"
                                alt="NWMLS"
                                width={20}
                                height={20}
                                className="inline-block"
                              />
                            )}
                          </>
                        )
                      })()}
                      </span>
                    </div>
                  </div>
                )}
                {property.lastPopulateRun && (
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-500 dark:text-gray-400">Data last refreshed</span>
                      <span className="text-gray-900 dark:text-white">{formatDataUpdatedDate(property.lastPopulateRun)}</span>
                    </div>
                  </div>
                )}
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
              </div>
            </div>
            </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Request Disclosures, Schedule a Tour, and Make an Offer Buttons */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-4 sticky top-8">
              <button
                type="button"
                onClick={handleOpenDisclosuresModal}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                aria-label="Request Disclosures"
              >
                Request Disclosures
              </button>
              <button
                type="button"
                onClick={handleOpenTourModal}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                aria-label="Schedule a Tour"
              >
                Schedule a Tour
              </button>
              <button
                type="button"
                onClick={handleOpenOfferModal}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                aria-label="Make an Offer"
              >
                Make an Offer
              </button>
              </div>
          </div>
        </div>

        {/* MLS disclaimer */}
        <div className="text-sm text-gray-500 dark:text-gray-400 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 space-y-3">
          <p>
            Based on information submitted to the MLS GRID as of {formatDataUpdatedDate(property.lastPopulateRun)}. All data is obtained from various sources and may not have been verified by broker or MLS GRID. Supplied Open House Information is subject to change without notice. All information should be independently reviewed and verified for accuracy. Properties may or may not be listed by the office/agent presenting the information.
          </p>
          <p>
            IDX information is provided exclusively for consumers&apos; personal noncommercial use, that it may not be used for any purpose other than to identify prospective properties consumers may be interested in purchasing, that the data is deemed reliable but is not guaranteed by MLS GRID, and that the use of the MLS GRID Data may be subject to an end user license agreement prescribed by the Member Participant&apos;s applicable MLS if any and as amended from time to time.
          </p>
        </div>
      </main>

      {/* Schedule a Tour modal */}
      {isTourModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="tour-modal-title"
          onKeyDown={handleTourModalKeyDown}
        >
          <div
            ref={tourModalRef}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg border border-gray-200 dark:border-gray-700"
            tabIndex={-1}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 id="tour-modal-title" className="text-lg font-semibold text-gray-900 dark:text-white">
                Schedule a Tour
              </h2>
              <button
                type="button"
                onClick={handleCloseTourModal}
                className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Close modal"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              {tourMessageSent ? (
                <div
                  className="flex flex-col items-center justify-center py-8 text-center"
                  role="status"
                  aria-live="polite"
                >
                  <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                    Message sent
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    We&apos;ll be in touch soon to schedule your tour.
                  </p>
                </div>
              ) : (
                <>
                  <label htmlFor="tour-message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Message
                  </label>
                  <textarea
                    id="tour-message"
                    value={tourMessage}
                    onChange={(e) => setTourMessage(e.target.value)}
                    rows={5}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="I would like to schedule a tour for [address] at ..."
                    aria-label="Tour request message"
                  />
                </>
              )}
            </div>
            <div className="flex justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
              {tourMessageSent ? (
                <button
                  type="button"
                  onClick={handleCloseTourModal}
                  className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
                >
                  Close
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleCloseTourModal}
                    className="px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={handleSendTourMessage}
                    className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
                    aria-label="Send message"
                  >
                    Send message
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Request Disclosures modal */}
      {isDisclosuresModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="disclosures-modal-title"
          onKeyDown={handleDisclosuresModalKeyDown}
        >
          <div
            ref={disclosuresModalRef}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg border border-gray-200 dark:border-gray-700"
            tabIndex={-1}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 id="disclosures-modal-title" className="text-lg font-semibold text-gray-900 dark:text-white">
                Request Disclosures
              </h2>
              <button
                type="button"
                onClick={handleCloseDisclosuresModal}
                className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Close modal"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              {disclosuresMessageSent ? (
                <div
                  className="flex flex-col items-center justify-center py-8 text-center"
                  role="status"
                  aria-live="polite"
                >
                  <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                    Message sent
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    We&apos;ll send the disclosures to you soon.
                  </p>
                </div>
              ) : (
                <>
                  <label htmlFor="disclosures-message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Message
                  </label>
                  <textarea
                    id="disclosures-message"
                    value={disclosuresMessage}
                    onChange={(e) => setDisclosuresMessage(e.target.value)}
                    rows={5}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="I would like to request disclosures for [address]. "
                    aria-label="Disclosures request message"
                  />
                </>
              )}
            </div>
            <div className="flex justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
              {disclosuresMessageSent ? (
                <button
                  type="button"
                  onClick={handleCloseDisclosuresModal}
                  className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
                >
                  Close
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleCloseDisclosuresModal}
                    className="px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={handleSendDisclosuresMessage}
                    className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
                    aria-label="Send message"
                  >
                    Send message
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Make an Offer modal */}
      {isOfferModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="offer-modal-title"
          onKeyDown={handleOfferModalKeyDown}
        >
          <div
            ref={offerModalRef}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg border border-gray-200 dark:border-gray-700"
            tabIndex={-1}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 id="offer-modal-title" className="text-lg font-semibold text-gray-900 dark:text-white">
                Make an Offer
              </h2>
              <button
                type="button"
                onClick={handleCloseOfferModal}
                className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Close modal"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              {offerMessageSent ? (
                <div
                  className="flex flex-col items-center justify-center py-8 text-center"
                  role="status"
                  aria-live="polite"
                >
                  <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                    Message sent
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    We&apos;ll be in touch soon regarding your offer.
                  </p>
                </div>
              ) : (
                <>
                  <label htmlFor="offer-message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Message
                  </label>
                  <textarea
                    id="offer-message"
                    value={offerMessage}
                    onChange={(e) => setOfferMessage(e.target.value)}
                    rows={5}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="I would like to make an offer for [address]. "
                    aria-label="Offer message"
                  />
                </>
              )}
            </div>
            <div className="flex justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
              {offerMessageSent ? (
                <button
                  type="button"
                  onClick={handleCloseOfferModal}
                  className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
                >
                  Close
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleCloseOfferModal}
                    className="px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={handleSendOfferMessage}
                    className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
                    aria-label="Send message"
                  >
                    Send message
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

