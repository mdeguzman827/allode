/**
 * Image fallback utilities for handling broken or missing images
 */

export const PLACEHOLDER_IMAGE = 'https://via.placeholder.com/1200x600?text=Property+Image'
export const PLACEHOLDER_THUMBNAIL = 'https://via.placeholder.com/192x192?text=No+Image'

/**
 * Get image URL with fallback to placeholder
 */
export const getImageWithFallback = (url: string | null | undefined): string => {
  if (!url) {
    return PLACEHOLDER_IMAGE
  }
  return url
}

/**
 * Get thumbnail URL with fallback
 */
export const getThumbnailWithFallback = (url: string | null | undefined): string => {
  if (!url) {
    return PLACEHOLDER_THUMBNAIL
  }
  return url
}

/**
 * Handle image error by replacing with placeholder
 */
export const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>, fallback: string = PLACEHOLDER_IMAGE) => {
  const target = e.target as HTMLImageElement
  target.src = fallback
}

