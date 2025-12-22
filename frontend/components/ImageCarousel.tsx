'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

interface ImageData {
  thumbnail?: string
  small?: string
  medium?: string
  large?: string
  original: string
  order: number
  type?: string
  width?: number
  height?: number
}

interface ImageCarouselProps {
  images: ImageData[]
  propertyAddress: string
}

export default function ImageCarousel({ images, propertyAddress }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set())
  const [isLoading, setIsLoading] = useState(true)

  // Preload next and previous images
  useEffect(() => {
    if (images.length === 0) {
      setIsLoading(false)
      return
    }

    // Load first image immediately
    const preloadImage = (src: string) => {
      const img = new window.Image()
      img.src = src
    }

    // Preload current, next, and previous images
    const currentImage = images[currentIndex]
    if (currentImage) {
      preloadImage(currentImage.large || currentImage.medium || currentImage.original)
    }

    const nextIndex = (currentIndex + 1) % images.length
    const nextImage = images[nextIndex]
    if (nextImage) {
      preloadImage(nextImage.large || nextImage.medium || nextImage.original)
    }

    const prevIndex = (currentIndex - 1 + images.length) % images.length
    const prevImage = images[prevIndex]
    if (prevImage) {
      preloadImage(prevImage.large || prevImage.medium || prevImage.original)
    }
  }, [currentIndex, images])

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length)
  }

  const handleThumbnailClick = (index: number) => {
    setCurrentIndex(index)
  }

  const handleImageLoad = (index: number) => {
    setLoadedImages((prev) => new Set(prev).add(index))
    if (index === 0) {
      setIsLoading(false)
    }
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handlePrevious()
      } else if (e.key === 'ArrowRight') {
        handleNext()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  if (images.length === 0) {
    return (
      <div className="w-full h-96 bg-gray-200 dark:bg-gray-800 rounded-lg flex items-center justify-center">
        <span className="text-gray-400 text-lg">No images available</span>
      </div>
    )
  }

  const currentImage = images[currentIndex]
  const imageUrl = currentImage.large || currentImage.medium || currentImage.original
  const thumbnailUrl = currentImage.thumbnail || currentImage.small || currentImage.original

  return (
    <div className="w-full space-y-4">
      {/* Main Image Display */}
      <div className="relative w-full aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
        {isLoading && !loadedImages.has(currentIndex) && thumbnailUrl && (
          <div className="absolute inset-0">
            <Image
              src={thumbnailUrl}
              alt={`${propertyAddress} - Image ${currentIndex + 1} (thumbnail)`}
              fill
              className="object-contain blur-sm"
              sizes="100vw"
              priority={currentIndex === 0}
            />
          </div>
        )}
        
                <Image
                  src={imageUrl}
                  alt={`${propertyAddress} - Image ${currentIndex + 1}`}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
                  priority={currentIndex === 0}
                  onLoad={() => handleImageLoad(currentIndex)}
                  onError={() => {
                    // Image failed to load, mark as loaded to hide loading indicator
                    handleImageLoad(currentIndex)
                  }}
                />

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={handlePrevious}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handlePrevious()
                }
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-all z-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Previous image"
              tabIndex={0}
            >
              <svg
                className="w-6 h-6"
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
            </button>
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-all z-10"
              aria-label="Next image"
              tabIndex={0}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
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

        {/* Loading Indicator */}
        {isLoading && !loadedImages.has(currentIndex) && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100/50 dark:bg-gray-800/50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>

      {/* Thumbnail Strip */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {images.map((image, index) => {
            const thumbUrl = image.thumbnail || image.small || image.original
            const isActive = index === currentIndex

            return (
              <button
                key={index}
                onClick={() => handleThumbnailClick(index)}
                className={`flex-shrink-0 relative w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                  isActive
                    ? 'border-blue-600 ring-2 ring-blue-400'
                    : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600'
                }`}
                aria-label={`View image ${index + 1}`}
                tabIndex={0}
              >
                <Image
                  src={thumbUrl}
                  alt={`${propertyAddress} - Thumbnail ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="80px"
                  loading="lazy"
                />
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

