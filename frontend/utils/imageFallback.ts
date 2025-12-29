/**
 * Image fallback utilities for handling broken or missing images
 */

// Use data URI SVGs as fallbacks to prevent infinite loops from failed external requests
// Base64 encoded SVG placeholders that will always load successfully
export const PLACEHOLDER_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwMCIgaGVpZ2h0PSI2MDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2UwZTRlOSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5Qcm9wZXJ0eSBJbWFnZTwvdGV4dD48L3N2Zz4='
export const PLACEHOLDER_THUMBNAIL = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyIiBoZWlnaHQ9IjE5MiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZTBlNGU5Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzljYTNhZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg=='

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
 * Prevents infinite loops by tracking if fallback has been set
 */
export const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>, fallback: string = PLACEHOLDER_IMAGE) => {
  const target = e.target as HTMLImageElement
  // Prevent infinite loop by checking if we've already set the fallback
  if (!target.dataset.fallbackSet) {
    target.dataset.fallbackSet = 'true'
    target.src = fallback
  } else {
    // If fallback also failed, hide the image to prevent infinite loop
    target.style.display = 'none'
  }
}

