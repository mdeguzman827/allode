'use client'

import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            © {new Date().getFullYear()} Allode. All rights reserved.
          </p>
          <nav className="flex items-center gap-6" aria-label="Footer navigation">
            <Link
              href="/terms"
              className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              aria-label="Terms of Use"
            >
              Terms of Use
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  )
}
