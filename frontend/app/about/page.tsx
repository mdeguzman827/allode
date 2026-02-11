'use client'

import Link from 'next/link'

export default function AboutPage() {
  return (
    <main className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-12">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              About Allode
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              The flat fee real estate brokerage for homebuyers.
            </p>
          </div>

          <div className="space-y-6 text-gray-600 dark:text-gray-400">
            <p>
              Allode is a licensed real estate brokerage that represents homebuyers for a flat fee of $4,995. We provide full buyer representation—disclosures, tours, offers, negotiation, and closing support—so you get the same service as with a traditional agent while keeping more of the commission offered by the seller.
            </p>
            <p>
              We currently serve homebuyers in the state of Washington. Our goal is to make buying a home more transparent and affordable by replacing percentage-based commissions with one simple flat fee.
            </p>
            <p>
              To learn more about how we work, visit our{' '}
              <Link
                href="/how-it-works"
                className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                How it Works
              </Link>{' '}
              page. If you have questions, feel free to{' '}
              <Link
                href="/contact"
                className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                contact us
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
