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
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/3c6262fb-453d-4746-a4ed-fa5ace1b05b9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'PropertyImageCarousel.tsx:20',message:'Component render',data:{imagesLength:images?.length,imagesRef:images?.map(i=>i.url).join(',').substring(0,50)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  const [currentIndex, setCurrentIndex] = useState(0)
  // Use ref instead of state to avoid infinite loop - refs don't trigger re-renders
  const loadedImagesRef = useRef<Set<number>>(new Set([0]))

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
  }

  const handleThumbnailClick = (index: number) => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/3c6262fb-453d-4746-a4ed-fa5ace1b05b9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'PropertyImageCarousel.tsx:36',message:'handleThumbnailClick',data:{newIndex:index,oldIndex:currentIndex},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
    // #endregion
    setCurrentIndex(index)
  }

  // Preload next/previous images
  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/3c6262fb-453d-4746-a4ed-fa5ace1b05b9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'PropertyImageCarousel.tsx:41',message:'useEffect preload triggered',data:{currentIndex,imagesLength:images?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    const preloadAdjacentImages = (index: number) => {
      if (images.length <= 1) return
      
      const nextIndex = (index + 1) % images.length
      const prevIndex = (index - 1 + images.length) % images.length
      
      // Use ref to track loaded images without causing re-renders
      if (!loadedImagesRef.current.has(nextIndex)) {
        loadedImagesRef.current.add(nextIndex)
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/3c6262fb-453d-4746-a4ed-fa5ace1b05b9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'PropertyImageCarousel.tsx:49',message:'Adding nextIndex to loadedImagesRef',data:{nextIndex,loadedCount:loadedImagesRef.current.size},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
      }
      if (!loadedImagesRef.current.has(prevIndex)) {
        loadedImagesRef.current.add(prevIndex)
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/3c6262fb-453d-4746-a4ed-fa5ace1b05b9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'PropertyImageCarousel.tsx:53',message:'Adding prevIndex to loadedImagesRef',data:{prevIndex,loadedCount:loadedImagesRef.current.size},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
      }
    }

    preloadAdjacentImages(currentIndex)
  }, [currentIndex, images.length]) // Removed loadedImages from deps to fix infinite loop

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
      } else if (e.key === 'ArrowRight') {
        setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [images.length])

  if (!images || images.length === 0) {
    return (
      <div className="w-full h-96 bg-gray-200 dark:bg-gray-800 rounded-lg flex items-center justify-center">
        <span className="text-gray-400 text-lg">No Images Available</span>
      </div>
    )
  }

  const currentImage = images[currentIndex]
  const PLACEHOLDER_IMAGE = 'https://via.placeholder.com/1200x600?text=Image+Not+Available'

  return (
    <div className="w-full space-y-4">
      {/* Main Image Display */}
      <div className="relative w-full h-96 md:h-[600px] bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden group">
        {/* Placeholder shown when image fails or no images */}
        {(images.length === 0 || !images[currentIndex]) && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-800">
            <span className="text-gray-400 text-lg">No Image Available</span>
          </div>
        )}
        {/* Main Image */}
        {images.length > 0 && images[currentIndex] && (
          <Image
            src={`${API_URL}/api/images/${propertyId}/${currentIndex}`}
            alt={`${propertyAddress} - Image ${currentIndex + 1}`}
            fill
            className="object-cover"
            priority={currentIndex === 0}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
            unoptimized={true}
            onLoad={() => {
              // #region agent log
              fetch('http://127.0.0.1:7242/ingest/3c6262fb-453d-4746-a4ed-fa5ace1b05b9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'PropertyImageCarousel.tsx:90',message:'Main image onLoad',data:{currentIndex,imageUrl:currentImage.url?.substring(0,50)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
              // #endregion
            }}
            onError={(e) => {
              // #region agent log
              fetch('http://127.0.0.1:7242/ingest/3c6262fb-453d-4746-a4ed-fa5ace1b05b9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'PropertyImageCarousel.tsx:97',message:'Main image onError',data:{currentIndex,imageUrl:currentImage.url?.substring(0,50)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
              // #endregion
              // Hide the image on error - placeholder div will show instead
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
              onClick={handlePrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
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
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
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
      </div>

      {/* Thumbnail Strip */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => handleThumbnailClick(index)}
              className={`flex-shrink-0 relative w-24 h-24 rounded-lg overflow-hidden border-2 transition-all ${
                index === currentIndex
                  ? 'border-blue-600 dark:border-blue-400 ring-2 ring-blue-200 dark:ring-blue-800'
                  : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
              }`}
              aria-label={`View image ${index + 1}`}
              tabIndex={0}
            >
              {images.length > 0 ? (
                <Image
                  src={`${API_URL}/api/images/${propertyId}/${index}`}
                  alt={`Thumbnail ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="96px"
                  loading={index < 5 ? 'eager' : 'lazy'}
                  unoptimized={true}
                onLoad={() => {
                  // #region agent log
                  if (index === 0 || index === 1) fetch('http://127.0.0.1:7242/ingest/3c6262fb-453d-4746-a4ed-fa5ace1b05b9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'PropertyImageCarousel.tsx:173',message:'Thumbnail onLoad',data:{index,imageUrl:image.url?.substring(0,50)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
                  // #endregion
                }}
                onError={(e) => {
                  // #region agent log
                  fetch('http://127.0.0.1:7242/ingest/3c6262fb-453d-4746-a4ed-fa5ace1b05b9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'PropertyImageCarousel.tsx:180',message:'Thumbnail onError',data:{index,imageUrl:image.url?.substring(0,50)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
                  // #endregion
                  // Hide the image on error
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                  e.preventDefault()
                  e.stopPropagation()
                }}
              />
              ) : (
                <div className="w-full h-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
                  <span className="text-gray-400 text-xs">No Image</span>
                </div>
              )}
              {image.isPreferred && (
                <div className="absolute top-1 right-1 bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded">
                  ★
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

