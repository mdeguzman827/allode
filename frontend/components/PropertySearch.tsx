'use client'

import { useState, useEffect, useRef, FormEvent } from 'react'
import { useRouter } from 'next/navigation'

interface Suggestion {
  type: 'address' | 'city' | 'zipcode'
  value: string
  city: string
  state: string
  propertyId?: string
  zipCode?: string
  count?: number
  display: string
  relevance?: string
}

interface AutocompleteResponse {
  suggestions: Suggestion[]
}

interface PropertySearchProps {
  searchQuery: string
  setSearchQuery: (query: string) => void
  onSearch: (e: FormEvent<HTMLFormElement>) => void
  isLoading: boolean
  size?: 'default' | 'large'
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function PropertySearch({
  searchQuery,
  setSearchQuery,
  onSearch,
  isLoading,
  size = 'default',
}: PropertySearchProps) {
  const isLarge = size === 'large'
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [isFetching, setIsFetching] = useState(false)
  const [isUserTyping, setIsUserTyping] = useState(false)
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Debounced autocomplete fetch - only when user is actively typing
  useEffect(() => {
    if (!isUserTyping || searchQuery.length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      setIsFetching(false)
      return
    }

    setIsFetching(true)
    const timeoutId = setTimeout(async () => {
      try {
        const response = await fetch(
          `${API_URL}/api/autocomplete?q=${encodeURIComponent(searchQuery)}&limit=8`
        )
        if (response.ok) {
          const data: AutocompleteResponse = await response.json()
          setSuggestions(data.suggestions)
          setShowSuggestions(data.suggestions.length > 0)
        } else {
          setSuggestions([])
          setShowSuggestions(false)
        }
      } catch (error) {
        console.error('Autocomplete error:', error)
        setSuggestions([])
        setShowSuggestions(false)
      } finally {
        setIsFetching(false)
      }
    }, 300) // 300ms debounce

    return () => {
      clearTimeout(timeoutId)
      setIsFetching(false)
    }
  }, [searchQuery, isUserTyping])

  const handleSuggestionClick = (suggestion: Suggestion) => {
    setIsUserTyping(false)
    setShowSuggestions(false)
    setSuggestions([])
    setSearchQuery(suggestion.value)
    
    if (suggestion.type === 'address' && suggestion.propertyId) {
      // Navigate directly to property detail page
      router.push(`/property/${suggestion.propertyId}`)
    } else if (suggestion.type === 'city') {
      // Navigate to results page with city
      const params = new URLSearchParams()
      params.set('city', suggestion.city)
      if (suggestion.state) {
        params.set('state', suggestion.state)
      }
      router.push(`/results?${params.toString()}`)
    } else if (suggestion.type === 'zipcode' && suggestion.zipCode) {
      // Navigate to results page with zip code
      router.push(`/results?zipcode=${encodeURIComponent(suggestion.zipCode)}`)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter') {
        setIsUserTyping(false)
        setShowSuggestions(false)
        setSuggestions([])
        onSearch(e as any)
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex((prev) => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
        break
      case 'Enter':
        e.preventDefault()
        setIsUserTyping(false)
        setShowSuggestions(false)
        setSuggestions([])
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionClick(suggestions[selectedIndex])
        } else {
          onSearch(e as any)
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        setSelectedIndex(-1)
        break
    }
  }

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <form onSubmit={onSearch} className="w-full">
      <div className="relative">
        <div className={`flex items-center border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 ${
          isLarge ? 'px-5 py-4' : 'px-4 py-2.5'
        }`}>
          <svg
            className={`text-gray-400 mr-3 flex-shrink-0 ${isLarge ? 'w-5 h-5' : 'w-4 h-4'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setIsUserTyping(true)
              setSearchQuery(e.target.value)
              setSelectedIndex(-1)
            }}
            onFocus={() => {
              if (suggestions.length > 0 && isUserTyping) setShowSuggestions(true)
            }}
            onKeyDown={handleKeyDown}
            placeholder="Address, city, or zip code"
            className={`flex-1 outline-none bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 ${isLarge ? 'text-lg' : 'text-sm'}`}
            disabled={isLoading}
            aria-label="Property search with autocomplete"
            aria-autocomplete="list"
            aria-expanded={showSuggestions}
            aria-controls="suggestions-list"
          />
          {(isLoading || isFetching) && (
            <div className="ml-3 flex-shrink-0">
              <div className={`animate-spin rounded-full border-b-2 border-gray-400 ${isLarge ? 'h-5 w-5' : 'h-4 w-4'}`}></div>
            </div>
          )}
          <button
            type="submit"
            disabled={isLoading}
            onClick={() => {
              setShowSuggestions(false)
              setSuggestions([])
            }}
            className={`ml-3 flex-shrink-0 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition-colors ${isLarge ? 'text-base' : 'text-sm'}`}
            aria-label="Search"
          >
            Search
          </button>
        </div>

        {/* Autocomplete Suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            id="suggestions-list"
            className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl max-h-96 overflow-y-auto"
            role="listbox"
          >
            {suggestions.map((suggestion, index) => (
              <button
                key={`${suggestion.type}-${suggestion.value}-${index}`}
                type="button"
                onClick={() => handleSuggestionClick(suggestion)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`w-full text-left px-6 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                  selectedIndex === index
                    ? 'bg-gray-100 dark:bg-gray-700'
                    : ''
                } ${
                  index === 0 ? 'rounded-t-lg' : ''
                } ${
                  index === suggestions.length - 1 ? 'rounded-b-lg' : 'border-b border-gray-200 dark:border-gray-700'
                }`}
                role="option"
                aria-selected={selectedIndex === index}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {suggestion.type === 'address' ? (
                      <svg
                        className="w-5 h-5 text-gray-400 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    ) : suggestion.type === 'zipcode' ? (
                      <svg
                        className="w-5 h-5 text-gray-400 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-5 h-5 text-gray-400 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    )}
                    <span className="text-gray-900 dark:text-gray-100">
                      {suggestion.display}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                    {suggestion.type === 'address' ? 'Property' : suggestion.type === 'zipcode' ? 'Zip Code' : 'City'}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </form>
  )
}

