'use client'

import Link from 'next/link'

export default function TermsOfUsePage() {
  return (
    <main className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-12">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Terms of Use
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>

          <div className="prose prose-gray dark:prose-invert max-w-none space-y-6 text-gray-700 dark:text-gray-300">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                1. Acceptance of Terms
              </h2>
              <p>
                By accessing or using the Allode website and services, you agree to be bound by these Terms of Use. If you do not agree to these terms, please do not use this website or our services.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                2. Use of Service
              </h2>
              <p>
                Allode provides property listing information and related real estate services. You may use this website for lawful purposes only. You agree not to use the service to:
              </p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>Violate any applicable laws or regulations</li>
                <li>Infringe on the rights of others</li>
                <li>Transmit harmful, offensive, or unauthorized content</li>
                <li>Attempt to gain unauthorized access to our systems or data</li>
                <li>Use automated means to scrape or collect data without permission</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                3. Property Information Disclaimer
              </h2>
              <p>
                Property information displayed on this website is obtained from various sources, including the MLS GRID, and may not have been verified by the broker or MLS GRID. All data is subject to errors, omissions, and changes. You should independently verify any information before relying on it for decisions. Properties may or may not be listed by the office or agent presenting the information.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                4. Intellectual Property
              </h2>
              <p>
                The Allode name, logo, and all related content on this website are the property of Allode or its licensors. You may not copy, modify, distribute, or use our trademarks or content without prior written permission.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                5. Limitation of Liability
              </h2>
              <p>
                To the fullest extent permitted by law, Allode and its affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of this website or the information provided. Our total liability shall not exceed the amount you paid, if any, for use of the service in the twelve months preceding the claim.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                6. DMCA; Copyright Infringement Notices &amp; Counter-Notices
              </h2>
              <p className="mb-3">
                We respect the intellectual property rights of others and ask that everyone using the Services do the same. Anyone who believes that their work has been reproduced on the Services in a way that constitutes copyright infringement may notify our copyright agent in accordance with Title 17, United States Code, Section 512(c)(3) and must provide the following information:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-3">
                <li>
                  <strong>(i)</strong> A physical or electronic signature of the person authorized to act for the owner of the allegedly infringed right (an electronic signature, including &quot;/s/ Full Name,&quot; is sufficient).
                </li>
                <li>
                  <strong>(ii)</strong> Identification of the copyrighted work claimed to have been infringed, or, if multiple works at a single online site are covered by a single notification, a representative list of such works.
                </li>
                <li>
                  <strong>(iii)</strong> Identification of the material that is claimed to be infringing or to be the subject of infringing activity and that is to be removed or access to which is to be disabled, and information reasonably sufficient to permit us to locate the material (e.g., full URL(s)).
                </li>
                <li>
                  <strong>(iv)</strong> Your contact information reasonably sufficient for us to reach you, such as a name, address, telephone number, and/or email address.
                </li>
                <li>
                  <strong>(v)</strong> A statement that information in the notice is accurate, that you have a good faith belief that the identified use of the material is not authorized by the copyright owner, its agent, or the law, and under penalty of perjury, that you are the copyright owner or are authorized to act on the copyright owner&apos;s behalf in this situation.
                </li>
              </ul>
              <p className="mb-2">
                Notices of copyright infringement claims can be sent as follows:
              </p>
              <p className="mb-3 font-medium">
                allodeinc@gmail.com<br />
                Allode LLC<br />
                1105 Spring St Apt 407<br />
                Seattle, WA 98104<br />
                Attention: Legal Department – Copyright Agent
              </p>
              <p>
                We may begin investigating based on email submissions. We will only process notices that satisfy § 512(c)(3).
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                7. Changes to Terms
              </h2>
              <p>
                We may update these Terms of Use from time to time. We will post the updated terms on this page and update the &quot;Last updated&quot; date. Your continued use of the website after changes constitutes acceptance of the revised terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                8. Contact
              </h2>
              <p>
                If you have questions about these Terms of Use, please contact us through our{' '}
                <Link href="/contact" className="text-blue-600 dark:text-blue-400 hover:underline">
                  Contact
                </Link>{' '}
                page.
              </p>
            </section>
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
