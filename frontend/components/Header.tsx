'use client'

import Link from 'next/link'

export default function Header() {
  return (
    <header className="p-6 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link 
          href="/" 
          className="flex items-center gap-3 text-2xl font-normal text-gray-900 dark:text-gray-100 hover:opacity-80 transition-opacity"
          aria-label="Allode - Go to homepage"
        >
          <img
            src="/logo.svg"
            alt="Allode Logo"
            className="h-10 w-auto"
            width="40"
            height="40"
          />
          Allode
        </Link>
        <nav className="flex items-center gap-6">
          <Link 
            href="/terms" 
            className="text-base font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            aria-label="Terms of Use"
          >
            Terms of Use
          </Link>
          <Link 
            href="/contact" 
            className="text-base font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            aria-label="Contact us"
          >
            Contact
          </Link>
        </nav>
      </div>
    </header>
  )
}

