'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface ImageData {
  url: string
  order: number
  type: string
  width?: number
  height?: number
  isPreferred?: boolean
}

interface PropertyImageCarouselProps {
  images: ImageData[]
  propertyAddress: string
  propertyId: string
}

export default function PropertyImageCarousel({
  images,
  propertyAddress,
  propertyId,
}: PropertyImageCarouselProps) {
  const [showFullCarousel, setShowFullCarousel] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const loadedImagesRef = useRef<Set<number>>(new Set([0]))

  // Find primary/preferred image or use first image
  const getPrimaryImageIndex = () => {
    const preferredIndex = images.findIndex(img => img.isPreferred)
    return preferredIndex >= 0 ? preferredIndex : 0
  }

  const primaryIndex = getPrimaryImageIndex()
  const primaryImage = images[primaryIndex]
  
  // Get next 4 images (excluding primary)
  const getGalleryImages = () => {
    const otherImages = images.filter((_, index) => index !== primaryIndex)
    return otherImages.slice(0, 4)
  }

  const galleryImages = getGalleryImages()
  const galleryImageIndices = images
    .map((_, index) => index)
    .filter(index => index !== primaryIndex)
    .slice(0, 4)

  const handleImageClick = (index: number) => {
    setCurrentIndex(index)
    setShowFullCarousel(true)
  }

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
  }

  const handleThumbnailClick = (index: number) => {
    setCurrentIndex(index)
  }

  // Reset current index when images change
  useEffect(() => {
    if (currentIndex >= images.length && images.length > 0) {
      setCurrentIndex(0)
    }
  }, [images.length, currentIndex])

  // Preload next/previous images for full carousel
  useEffect(() => {
    if (!showFullCarousel) return
    
    const preloadAdjacentImages = (index: number) => {
      if (images.length <= 1) return
      
      const nextIndex = (index + 1) % images.length
      const prevIndex = (index - 1 + images.length) % images.length
      
      if (!loadedImagesRef.current.has(nextIndex)) {
        loadedImagesRef.current.add(nextIndex)
      }
      if (!loadedImagesRef.current.has(prevIndex)) {
        loadedImagesRef.current.add(prevIndex)
      }
    }

    preloadAdjacentImages(currentIndex)
  }, [currentIndex, images.length, showFullCarousel])

  // Keyboard navigation for full carousel
  useEffect(() => {
    if (!showFullCarousel) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
      } else if (e.key === 'ArrowRight') {
        setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
      } else if (e.key === 'Escape') {
        setShowFullCarousel(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [images.length, showFullCarousel])

  if (!images || images.length === 0) {
    return (
      <div className="w-full h-96 bg-gray-200 dark:bg-gray-800 rounded-lg flex items-center justify-center">
        <span className="text-gray-400 text-lg">No Images Available</span>
      </div>
    )
  }

  return (
    <>
      {/* Zillow-style Gallery Layout - Full Width */}
      <div className="w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 h-[400px] md:h-[450px]">
          {/* Primary Image - Large on Left */}
          <div 
            className="relative col-span-1 md:col-span-2 overflow-hidden bg-gray-100 dark:bg-gray-900 cursor-pointer group"
            onClick={() => handleImageClick(primaryIndex)}
          >
            {primaryImage ? (
              <>
                <Image
                  src={`${API_URL}/api/images/${propertyId}/${primaryIndex}`}
                  alt={`${propertyAddress} - Primary Image`}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                  priority
                  sizes="(max-width: 768px) 100vw, 66vw"
                  unoptimized={true}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                />
                {primaryImage.isPreferred && (
                  <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                    </svg>
                    Active
                  </div>
                )}
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-800">
                <span className="text-gray-400 text-lg">No Image Available</span>
              </div>
            )}
          </div>

          {/* Gallery Grid - 2x2 on Right */}
          <div className="grid grid-cols-2 gap-2 col-span-1">
            {galleryImageIndices.map((imageIndex, idx) => {
              const image = images[imageIndex]
              return (
                <div
                  key={imageIndex}
                  className="relative overflow-hidden bg-gray-100 dark:bg-gray-900 cursor-pointer group"
                  onClick={() => handleImageClick(imageIndex)}
                >
                  {image ? (
                    <>
                      <Image
                        src={`${API_URL}/api/images/${propertyId}/${imageIndex}`}
                        alt={`${propertyAddress} - Image ${imageIndex + 1}`}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                        sizes="(max-width: 768px) 50vw, 17vw"
                        loading="eager"
                        unoptimized={true}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                          e.preventDefault()
                          e.stopPropagation()
                        }}
                      />
                      {/* Show "See all X photos" overlay on last image if there are more */}
                      {idx === galleryImageIndices.length - 1 && images.length > 5 && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setShowFullCarousel(true)
                              setCurrentIndex(0)
                            }}
                            className="bg-white text-gray-900 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                            aria-label={`See all ${images.length} photos`}
                          >
                            See all {images.length} photos
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-800">
                      <span className="text-gray-400 text-xs">No Image</span>
                    </div>
                  )}
                </div>
              )
            })}
            
            {/* Fill empty slots if less than 4 gallery images */}
            {galleryImageIndices.length < 4 && Array.from({ length: 4 - galleryImageIndices.length }).map((_, idx) => (
              <div
                key={`empty-${idx}`}
                className="relative overflow-hidden bg-gray-200 dark:bg-gray-800"
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-gray-400 text-xs">No Image</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Full Carousel Modal */}
      {showFullCarousel && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setShowFullCarousel(false)}
        >
          <div className="relative w-full max-w-7xl max-h-[90vh]">
            {/* Close Button */}
            <button
              onClick={() => setShowFullCarousel(false)}
              className="absolute top-4 right-4 z-20 bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition-colors"
              aria-label="Close carousel"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Main Image */}
            <div className="relative w-full h-[80vh] bg-gray-900 rounded-lg overflow-hidden">
              {images[currentIndex] && (
                <Image
                  src={`${API_URL}/api/images/${propertyId}/${currentIndex}`}
                  alt={`${propertyAddress} - Image ${currentIndex + 1}`}
                  fill
                  className="object-contain"
                  priority={currentIndex < 5}
                  sizes="100vw"
                  unoptimized={true}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                />
              )}

              {/* Navigation Arrows */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handlePrevious()
                    }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition-colors z-10"
                    aria-label="Previous image"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleNext()
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition-colors z-10"
                    aria-label="Next image"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}

              {/* Image Counter */}
              {images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full text-sm">
                  {currentIndex + 1} / {images.length}
                </div>
              )}
            </div>

            {/* Thumbnail Strip */}
            {images.length > 1 && (
              <div className="mt-4 flex gap-2 overflow-x-auto pb-2 justify-center">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleThumbnailClick(index)
                    }}
                    className={`flex-shrink-0 relative w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      index === currentIndex
                        ? 'border-blue-400 ring-2 ring-blue-200'
                        : 'border-transparent hover:border-gray-400'
                    }`}
                    aria-label={`View image ${index + 1}`}
                  >
                    <Image
                      src={`${API_URL}/api/images/${propertyId}/${index}`}
                      alt={`Thumbnail ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="80px"
                      loading="lazy"
                      unoptimized={true}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                        e.preventDefault()
                        e.stopPropagation()
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
