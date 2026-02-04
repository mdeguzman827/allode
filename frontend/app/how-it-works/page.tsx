'use client'

import { useState } from 'react'
import Link from 'next/link'

const FAQ_ITEMS = [
  {
    id: 'what-is-flat-fee',
    question: 'What does the flat fee cover?',
    answer:
      'The $4,995 flat fee covers full buyer representation: your licensed agent helps you search, make offers, negotiate, manage inspections and contingencies, and guide you to closing. You keep any commission offered by the seller minus our fee—no percentage of the sale price.',
  },
  {
    id: 'when-do-i-pay',
    question: 'When do I pay the $4,995?',
    answer:
      'You pay Allode’s flat fee after closing, when the sale is complete. There’s no upfront cost to work with us.',
  },
  {
    id: 'full-representation',
    question: 'Do I get the same service as with a traditional agent?',
    answer:
      'Yes. You get a licensed buyer’s agent who represents only you, writes and submits offers, negotiates on your behalf, and coordinates inspections, appraisals, and closing—the same full service you’d expect from a traditional brokerage.',
  },
  {
    id: 'areas-served',
    question: 'What areas do you serve?',
    answer:
      'We serve homebuyers in our service areas. Use our site to search listings and reach out via the Contact page to confirm we can represent you in your target area.',
  },
  {
    id: 'selling-and-buying',
    question: 'Can I use Allode if I’m also selling a home?',
    answer:
      'Allode focuses on representing buyers. If you’re selling and buying, contact us and we can discuss how we can help with your purchase.',
  },
] as const

const STEPS = [
  {
    number: 1,
    title: 'Search for properties',
    description:
      'Use our site to search for homes by address, city, or neighborhood. Browse listings, view photos and details, and save the properties you like.',
  },
  {
    number: 2,
    title: 'Connect with us',
    description:
      'Reach out through our Contact page or by phone. We’ll pair you with a licensed agent who will represent you as your buyer’s agent at no upfront cost.',
  },
  {
    number: 3,
    title: 'Make an offer & negotiate',
    description:
      'Your agent will help you make competitive offers, negotiate terms, and coordinate inspections and contingencies—the same full service you’d expect from a traditional brokerage.',
  },
  {
    number: 4,
    title: 'Close & pay one flat fee',
    description:
      'After closing, you pay Allode a flat fee of $4,995. You keep the rest of the commission offered by the seller. No percentage of the sale, no surprises.',
  },
] as const

export default function HowItWorksPage() {
  const [openFaqId, setOpenFaqId] = useState<string | null>(null)

  const handleFaqToggle = (id: string) => {
    setOpenFaqId((prev) => (prev === id ? null : id))
  }

  const handleFaqKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleFaqToggle(id)
    }
  }

  return (
    <main className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-12">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
          <div className="mb-10">
            <h1 className="text-3xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              How it Works
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Allode is the flat fee brokerage for homebuyers. Here’s how we help you buy a home—with full representation and one simple fee at the end.
            </p>
          </div>

          <div className="mb-10 w-full aspect-video max-w-3xl mx-auto rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700">
            <iframe
              className="w-full h-full"
              src="https://www.youtube.com/embed/IiSGyeNRsDM?si=k_Qsa74Bq8dFEd3U"
              title="YouTube video player"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>

          <div className="space-y-8">
            {STEPS.map((step) => (
              <section
                key={step.number}
                className="flex gap-6"
                aria-labelledby={`step-${step.number}-title`}
              >
                <div
                  className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center"
                  aria-hidden
                >
                  <span className="text-lg font-semibold text-blue-700 dark:text-blue-300">
                    {step.number}
                  </span>
                </div>
                <div>
                  <h2
                    id={`step-${step.number}-title`}
                    className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2"
                  >
                    {step.title}
                  </h2>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </section>
            ))}
          </div>

          <section className="mt-12" aria-labelledby="faq-heading">
            <h2
              id="faq-heading"
              className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6"
            >
              Frequently asked questions
            </h2>
            <ul className="space-y-2" role="list">
              {FAQ_ITEMS.map((item) => {
                const isOpen = openFaqId === item.id
                const answerId = `${item.id}-answer`
                const buttonId = `${item.id}-button`
                return (
                  <li
                    key={item.id}
                    className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden"
                  >
                    <button
                      id={buttonId}
                      type="button"
                      onClick={() => handleFaqToggle(item.id)}
                      onKeyDown={(e) => handleFaqKeyDown(e, item.id)}
                      aria-expanded={isOpen}
                      aria-controls={answerId}
                      className="w-full flex items-center justify-between gap-4 px-4 py-4 text-left bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
                      tabIndex={0}
                    >
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {item.question}
                      </span>
                      <span
                        className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                        aria-hidden
                      >
                        {isOpen ? '−' : '+'}
                      </span>
                    </button>
                    <div
                      id={answerId}
                      role="region"
                      aria-labelledby={buttonId}
                      hidden={!isOpen}
                      className="border-t border-gray-200 dark:border-gray-600"
                    >
                      <p className="px-4 py-4 text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/30">
                        {item.answer}
                      </p>
                    </div>
                  </li>
                )
              })}
            </ul>
          </section>

          <div className="mt-10 p-6 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-200 dark:border-gray-600">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Ready to get started?
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Search for properties on our homepage or get in touch to speak with our team.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/"
                className="inline-flex items-center justify-center px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                aria-label="Search properties on homepage"
              >
                Search properties
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center px-5 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                aria-label="Contact us"
              >
                Contact us
              </Link>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Link
              href="/"
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
              aria-label="Back to home"
            >
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
