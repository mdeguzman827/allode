'use client'

import { useState, FormEvent } from 'react'

interface FormData {
  name: string
  email: string
  phone: string
  message: string
}

interface FormErrors {
  name?: string
  email?: string
  phone?: string
  message?: string
}

export default function ContactPage() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    message: '',
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validatePhone = (phone: string): boolean => {
    // Allow various phone formats: (123) 456-7890, 123-456-7890, 1234567890, etc.
    const phoneRegex = /^[\d\s\-\(\)]+$/
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    // Clear error for this field when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required'
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number'
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required'
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitStatus('idle')

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      // TODO: Replace with actual API endpoint
      // For now, simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      
      // In production, you would do:
      // const response = await fetch('/api/contact', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formData),
      // })
      // if (!response.ok) throw new Error('Failed to send message')

      setSubmitStatus('success')
      setFormData({ name: '', email: '', phone: '', message: '' })
      
      // Reset success message after 5 seconds
      setTimeout(() => {
        setSubmitStatus('idle')
      }, 5000)
    } catch (error) {
      console.error('Error submitting contact form:', error)
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-12">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Contact Us
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Have questions? We&apos;d love to hear from you. Send us a message and we&apos;ll respond as soon as possible.
            </p>
          </div>

          {/* Success Message */}
          {submitStatus === 'success' && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-green-800 dark:text-green-200">
                Thank you for your message! We&apos;ll get back to you soon.
              </p>
            </div>
          )}

          {/* Error Message */}
          {submitStatus === 'error' && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-800 dark:text-red-200">
                Something went wrong. Please try again later.
              </p>
            </div>
          )}

          {/* Contact Form */}
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            {/* Name Field */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                aria-required="true"
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? 'name-error' : undefined}
                className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.name
                    ? 'border-red-500 dark:border-red-500'
                    : 'border-gray-300 dark:border-gray-700'
                }`}
                placeholder="Your full name"
              />
              {errors.name && (
                <p id="name-error" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                  {errors.name}
                </p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                aria-required="true"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'email-error' : undefined}
                className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.email
                    ? 'border-red-500 dark:border-red-500'
                    : 'border-gray-300 dark:border-gray-700'
                }`}
                placeholder="your.email@example.com"
              />
              {errors.email && (
                <p id="email-error" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                  {errors.email}
                </p>
              )}
            </div>

            {/* Phone Field */}
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Phone <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                required
                aria-required="true"
                aria-invalid={!!errors.phone}
                aria-describedby={errors.phone ? 'phone-error' : undefined}
                className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.phone
                    ? 'border-red-500 dark:border-red-500'
                    : 'border-gray-300 dark:border-gray-700'
                }`}
                placeholder="(555) 123-4567"
              />
              {errors.phone && (
                <p id="phone-error" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                  {errors.phone}
                </p>
              )}
            </div>

            {/* Message Field */}
            <div>
              <label
                htmlFor="message"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Message <span className="text-red-500">*</span>
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                required
                aria-required="true"
                aria-invalid={!!errors.message}
                aria-describedby={errors.message ? 'message-error' : undefined}
                rows={6}
                className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                  errors.message
                    ? 'border-red-500 dark:border-red-500'
                    : 'border-gray-300 dark:border-gray-700'
                }`}
                placeholder="Tell us how we can help you..."
              />
              {errors.message && (
                <p id="message-error" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                  {errors.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors ${
                  isSubmitting
                    ? 'opacity-50 cursor-not-allowed'
                    : ''
                }`}
                aria-label="Submit contact form"
              >
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </button>
            </div>
          </form>

          {/* Contact Information */}
          <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Other Ways to Reach Us
            </h2>
            <div className="space-y-3 text-gray-600 dark:text-gray-400">
              <p>
                <span className="font-medium text-gray-900 dark:text-gray-100">Email:</span>{' '}
                <a
                  href="mailto:allodeinc@gmail.com"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  allodeinc@gmail.com
                </a>
              </p>
              <p>
                <span className="font-medium text-gray-900 dark:text-gray-100">Phone:</span>{' '}
                <a
                  href="tel:+19168950800"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  (916) 895-0800
                </a>
              </p>
              <p>
                <span className="font-medium text-gray-900 dark:text-gray-100">Business Hours:</span>{' '}
                Monday - Friday, 8:00 AM - 5:00 PM PST
              </p>
            </div>
          </div>
        </div>
      </div>

    </main>
  )
}

