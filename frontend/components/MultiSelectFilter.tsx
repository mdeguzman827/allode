'use client'

import { useState, useRef, useEffect } from 'react'

interface FilterOption {
  value: string
  label: string
}

interface MultiSelectFilterProps {
  label: string
  values: string[]
  options: FilterOption[]
  onChange: (values: string[]) => void
  placeholder?: string
  className?: string
}

const MultiSelectFilter = ({
  label,
  values,
  options,
  onChange,
  placeholder = 'Any',
  className = '',
}: MultiSelectFilterProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectedOptions = options.filter((opt) => values.includes(opt.value))

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

  const handleToggle = (optionValue: string) => {
    const newValues = values.includes(optionValue)
      ? values.filter((v) => v !== optionValue)
      : [...values, optionValue]
    onChange(newValues)
    setIsOpen(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange([])
    setIsOpen(false)
  }

  const getDisplayText = () => {
    if (values.length === 0) return placeholder
    if (values.length === 1) {
      const option = options.find((opt) => opt.value === values[0])
      return option ? option.label : placeholder
    }
    return `${values.length} selected`
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all ${
          values.length > 0
            ? 'border-blue-500 bg-white dark:bg-gray-800 text-blue-700 dark:text-blue-300'
            : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-600'
        }`}
        aria-label={label}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="text-sm font-medium whitespace-nowrap">
          {getDisplayText()}
        </span>
        {values.length > 0 && (
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
            {values.length > 0 && (
              <button
                type="button"
                onClick={() => onChange([])}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-b border-gray-200 dark:border-gray-700"
                role="option"
              >
                Clear all
              </button>
            )}
            {options.map((option) => {
              const isSelected = values.includes(option.value)
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleToggle(option.value)}
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium'
                      : ''
                  }`}
                  role="option"
                  aria-selected={isSelected}
                >
                  <div
                    className={`w-4 h-4 border rounded flex items-center justify-center flex-shrink-0 ${
                      isSelected
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    {isSelected && (
                      <svg
                        className="w-3 h-3 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </div>
                  <span>{option.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default MultiSelectFilter
