'use client'

import Link from 'next/link'

export default function Header() {
  return (
    <header className="p-6 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link 
          href="/" 
          className="text-2xl font-normal text-gray-900 dark:text-gray-100 hover:opacity-80 transition-opacity"
          aria-label="Allode - Go to homepage"
        >
          Allode
        </Link>
        <Link 
          href="/" 
          className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
        >
          New Search
        </Link>
      </div>
    </header>
  )
}

