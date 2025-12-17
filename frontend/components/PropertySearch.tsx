'use client'

import { FormEvent } from 'react'

interface PropertySearchProps {
  searchQuery: string
  setSearchQuery: (query: string) => void
  onSearch: (e: FormEvent<HTMLFormElement>) => void
  isLoading: boolean
}

export default function PropertySearch({
  searchQuery,
  setSearchQuery,
  onSearch,
  isLoading,
}: PropertySearchProps) {
  return (
    <form onSubmit={onSearch} className="w-full">
      <div className="relative">
        <div className="flex items-center border border-gray-300 dark:border-gray-700 rounded-full shadow-lg hover:shadow-xl transition-shadow px-6 py-4 bg-white dark:bg-gray-900">
          <svg
            className="w-5 h-5 text-gray-400 mr-4"
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
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Enter property address"
            className="flex-1 outline-none bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 text-lg"
            disabled={isLoading}
          />
          {isLoading && (
            <div className="ml-4">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-400"></div>
            </div>
          )}
        </div>
      </div>
    </form>
  )
}

