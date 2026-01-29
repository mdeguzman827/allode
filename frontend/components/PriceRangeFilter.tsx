'use client'

import { useState, useRef, useEffect } from 'react'

interface PriceRangeFilterProps {
  minPrice: number | null
  maxPrice: number | null
  onChange: (minPrice: number | null, maxPrice: number | null) => void
  minValue?: number
  maxValue?: number
  className?: string
}

const PriceRangeFilter = ({
  minPrice,
  maxPrice,
  onChange,
  minValue = 0,
  maxValue = 10000000, // $10M
  className = '',
}: PriceRangeFilterProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [localMin, setLocalMin] = useState<number | null>(minPrice)
  const [localMax, setLocalMax] = useState<number | null>(maxPrice)
  const [minInputValue, setMinInputValue] = useState<string>('')
  const [maxInputValue, setMaxInputValue] = useState<string>('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Sync local state with props when they change externally
  useEffect(() => {
    setLocalMin(minPrice)
    setLocalMax(maxPrice)
    setMinInputValue(minPrice !== null ? minPrice.toLocaleString() : '')
    setMaxInputValue(maxPrice !== null ? maxPrice.toLocaleString() : '')
  }, [minPrice, maxPrice])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const formatPrice = (price: number | null): string => {
    if (price === null) return ''
    if (price >= 1000000) {
      return `$${(price / 1000000).toFixed(1)}M`
    }
    return `$${(price / 1000).toFixed(0)}k`
  }

  const getDisplayText = (): string => {
    if (!localMin && !localMax) return 'Price'
    if (localMin && localMax) {
      return `${formatPrice(localMin)} - ${formatPrice(localMax)}`
    }
    if (localMin) return `From ${formatPrice(localMin)}`
    if (localMax) return `Up to ${formatPrice(localMax)}`
    return 'Price'
  }


  const handleMinInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, '')
    setMinInputValue(rawValue === '' ? '' : parseInt(rawValue, 10).toLocaleString())
    
    if (rawValue === '') {
      setLocalMin(null)
    } else {
      const numValue = parseInt(rawValue, 10)
      if (!isNaN(numValue)) {
        setLocalMin(Math.min(numValue, localMax ?? maxValue))
      }
    }
  }

  const handleMaxInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, '')
    setMaxInputValue(rawValue === '' ? '' : parseInt(rawValue, 10).toLocaleString())
    
    if (rawValue === '') {
      setLocalMax(null)
    } else {
      const numValue = parseInt(rawValue, 10)
      if (!isNaN(numValue)) {
        setLocalMax(Math.max(numValue, localMin ?? minValue))
      }
    }
  }

  const handleApply = () => {
    onChange(localMin, localMax)
    setIsOpen(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    setLocalMin(null)
    setLocalMax(null)
    onChange(null, null)
    setIsOpen(false)
  }

  const hasActiveFilter = localMin !== null || localMax !== null

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all ${
          hasActiveFilter
            ? 'border-blue-500 bg-white dark:bg-gray-800 text-blue-700 dark:text-blue-300'
            : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-600'
        }`}
        aria-label="Price filter"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        <span className="text-sm font-medium whitespace-nowrap">
          {getDisplayText()}
        </span>
        {hasActiveFilter && (
          <button
            type="button"
            onClick={handleClear}
            className="ml-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0"
            aria-label="Clear filter"
            tabIndex={-1}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
        <svg
          className={`w-4 h-4 flex-shrink-0 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-4">
          {/* Min/Max Input Fields */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Min
              </label>
              <input
                type="text"
                value={minInputValue}
                onChange={handleMinInputChange}
                placeholder="No min"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="pt-6 text-gray-400">-</div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Max
              </label>
              <input
                type="text"
                value={maxInputValue}
                onChange={handleMaxInputChange}
                placeholder="No max"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Apply Button */}
          <button
            type="button"
            onClick={handleApply}
            className="w-full px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Apply
          </button>
        </div>
      )}
    </div>
  )
}

export default PriceRangeFilter
