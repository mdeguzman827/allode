'use client'

import { useState, useRef, useEffect } from 'react'

interface FilterOption {
  value: string
  label: string
}

interface FilterDropdownProps {
  label: string
  value: string | null
  options: FilterOption[]
  onChange: (value: string | null) => void
  placeholder?: string
  className?: string
}

const FilterDropdown = ({
  label,
  value,
  options,
  onChange,
  placeholder = 'Any',
  className = '',
}: FilterDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find((opt) => opt.value === value)

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

  const handleSelect = (optionValue: string) => {
    if (optionValue === value) {
      onChange(null)
    } else {
      onChange(optionValue)
    }
    setIsOpen(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(null)
    setIsOpen(false)
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all ${
          value
            ? 'border-blue-500 bg-white dark:bg-gray-800 text-blue-700 dark:text-blue-300'
            : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-600'
        }`}
        aria-label={label}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="text-sm font-medium whitespace-nowrap">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        {value && (
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
        <div className="absolute z-50 mt-2 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl max-h-96 overflow-y-auto">
          <div role="listbox">
            <button
              type="button"
              onClick={() => handleSelect('')}
              className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                !value ? 'bg-gray-100 dark:bg-gray-700' : ''
              } ${options.length > 0 ? 'border-b border-gray-200 dark:border-gray-700' : ''}`}
              role="option"
              aria-selected={!value}
            >
              {placeholder}
            </button>
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                  value === option.value
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium'
                    : ''
                }`}
                role="option"
                aria-selected={value === option.value}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default FilterDropdown
