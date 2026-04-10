'use client'

import { SignIn, SignUp } from '@clerk/nextjs'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

export default function HRPortalAuthPage() {
  const [showSignUp, setShowSignUp] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check if Clerk is properly configured
    const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
    if (!publishableKey) {
      setError('Authentication is not configured. Please set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.')
    }
    setIsLoading(false)
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading authentication...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg border border-gray-100">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-red-600 mb-2">Configuration Error</h1>
            <p className="text-gray-600">Unable to load authentication</p>
          </div>
          <p className="text-gray-700 text-center mb-6">{error}</p>
          <Link 
            href="/hr" 
            className="inline-flex items-center justify-center w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to HR Module
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back to HR Home */}
        <div className="mb-6">
          <Link 
            href="/hr" 
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to HR Module
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-8 w-full">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">HR Portal</h1>
          <p className="text-base text-gray-600">
            {showSignUp ? 'Create your account to access the HR portal' : 'Please sign in to access the HR portal'}
          </p>
        </div>
        
        {/* Toggle between Sign In and Sign Up */}
        <div className="flex mb-8 bg-white rounded-xl p-1.5 shadow-sm border border-gray-200">
          <button
            onClick={() => setShowSignUp(false)}
            className={`flex-1 py-3 px-6 rounded-lg text-sm font-semibold transition-all duration-200 ${
              !showSignUp 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setShowSignUp(true)}
            className={`flex-1 py-3 px-6 rounded-lg text-sm font-semibold transition-all duration-200 ${
              showSignUp 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Authentication Form Container */}
        <div className="w-full flex justify-center">
          {showSignUp ? (
            <SignUp
              routing="hash"
              afterSignUpUrl="/hr/portal/dashboard"
              fallbackRedirectUrl="/hr/portal/dashboard"
              appearance={{
                elements: {
                  rootBox: 'w-full max-w-sm',
                  card: 'shadow-none bg-transparent p-0 m-0 border-0',
                  headerTitle: 'hidden',
                  headerSubtitle: 'hidden',
                  socialButtonsBlockButton: 'w-full h-11 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all duration-200 rounded-lg font-medium px-4 shadow-none',
                  socialButtonsBlockButtonText: 'text-gray-700 font-medium text-sm',
                  socialButtonsBlockButtonArrow: 'hidden',
                  socialButtonsBlockButtonIcon: 'w-5 h-5',
                  dividerLine: 'bg-gray-200 h-px',
                  dividerText: 'text-gray-500 bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-3 text-sm',
                  formButtonPrimary: 'w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-200 text-sm px-4 shadow-none',
                  formFieldInput: 'w-full h-11 border border-gray-200 rounded-lg px-4 py-2 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all duration-200 bg-white text-sm shadow-none',
                  formFieldLabel: 'text-gray-700 font-medium mb-2 text-sm',
                  formFieldLabelRow: 'mb-2',
                  formFieldInputShowPasswordButton: 'text-gray-500 hover:text-gray-700',
                  formFieldInputShowPasswordButtonIcon: 'w-4 h-4',
                  formFieldError: 'text-red-600 text-xs mt-1',
                  formResendCodeLink: 'text-blue-600 hover:text-blue-700 font-medium text-sm',
                  footerActionLink: 'text-blue-600 hover:text-blue-700 font-medium text-sm',
                  footerActionText: 'text-gray-600 text-sm',
                  identityPreviewText: 'text-gray-700 text-sm',
                  identityPreviewEditButton: 'text-blue-600 hover:text-blue-700 text-sm',
                  formHeaderTitle: 'hidden',
                  formHeaderSubtitle: 'hidden',
                  alert: 'rounded-lg border border-gray-200 p-3 bg-white shadow-none',
                  alertText: 'text-sm',
                  alertIcon: 'w-4 h-4',
                  verificationCodeFieldInput: 'w-12 h-11 border border-gray-200 rounded-lg px-2 text-center text-base font-mono focus:border-blue-600 focus:ring-2 focus:ring-blue-100 bg-white shadow-none',
                  formFieldCheckbox: 'rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4',
                  formFieldCheckboxLabel: 'text-gray-700 text-sm ml-2',
                  formFieldCheckboxLabelRow: 'items-center',
                  formFieldRow: 'mb-4',
                  formField: 'mb-4',
                  form: 'space-y-4',
                  socialButtonsBlock: 'space-y-3 mb-4',
                  formFields: 'space-y-4',
                  formActions: 'mt-6',
                  footer: 'mt-6 pt-4 border-t border-gray-200',
                  // Override any potential card-like styling
                  main: 'shadow-none bg-transparent p-0 m-0 border-0',
                  pageScrollBox: 'shadow-none bg-transparent p-0 m-0 border-0',
                  scrollBox: 'shadow-none bg-transparent p-0 m-0 border-0',
                  page: 'shadow-none bg-transparent p-0 m-0 border-0',
                  content: 'shadow-none bg-transparent p-0 m-0 border-0',
                  container: 'shadow-none bg-transparent p-0 m-0 border-0',
                },
                variables: {
                  colorPrimary: '#2563eb',
                  colorText: '#111827',
                  colorTextSecondary: '#4b5563',
                  colorBackground: 'transparent',
                  colorInputBackground: '#ffffff',
                  colorInputText: '#111827',
                  colorBorder: '#e5e7eb',
                  colorSuccess: '#059669',
                  colorDanger: '#dc2626',
                  colorWarning: '#d97706',
                  colorNeutral: '#6b7280',
                  borderRadius: '0.5rem',
                  fontFamily: 'Inter, system-ui, sans-serif',
                  fontSize: '14px',
                  fontWeight: {
                    normal: '400',
                    medium: '500',
                    semibold: '600',
                    bold: '700',
                  },
                  spacingUnit: '4px',
                },
              }}
            />
          ) : (
            <SignIn
              routing="hash"
              afterSignInUrl="/hr/portal/dashboard"
              fallbackRedirectUrl="/hr/portal/dashboard"
              appearance={{
                elements: {
                  rootBox: 'w-full max-w-sm',
                  card: 'shadow-none bg-transparent p-0 m-0 border-0',
                  headerTitle: 'hidden',
                  headerSubtitle: 'hidden',
                  socialButtonsBlockButton: 'w-full h-11 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all duration-200 rounded-lg font-medium px-4 shadow-none',
                  socialButtonsBlockButtonText: 'text-gray-700 font-medium text-sm',
                  socialButtonsBlockButtonArrow: 'hidden',
                  socialButtonsBlockButtonIcon: 'w-5 h-5',
                  dividerLine: 'bg-gray-200 h-px',
                  dividerText: 'text-gray-500 bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-3 text-sm',
                  formButtonPrimary: 'w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-200 text-sm px-4 shadow-none',
                  formFieldInput: 'w-full h-11 border border-gray-200 rounded-lg px-4 py-2 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all duration-200 bg-white text-sm shadow-none',
                  formFieldLabel: 'text-gray-700 font-medium mb-2 text-sm',
                  formFieldLabelRow: 'mb-2',
                  formFieldInputShowPasswordButton: 'text-gray-500 hover:text-gray-700',
                  formFieldInputShowPasswordButtonIcon: 'w-4 h-4',
                  formFieldError: 'text-red-600 text-xs mt-1',
                  formResendCodeLink: 'text-blue-600 hover:text-blue-700 font-medium text-sm',
                  footerActionLink: 'text-blue-600 hover:text-blue-700 font-medium text-sm',
                  footerActionText: 'text-gray-600 text-sm',
                  identityPreviewText: 'text-gray-700 text-sm',
                  identityPreviewEditButton: 'text-blue-600 hover:text-blue-700 text-sm',
                  formHeaderTitle: 'hidden',
                  formHeaderSubtitle: 'hidden',
                  alert: 'rounded-lg border border-gray-200 p-3 bg-white shadow-none',
                  alertText: 'text-sm',
                  alertIcon: 'w-4 h-4',
                  verificationCodeFieldInput: 'w-12 h-11 border border-gray-200 rounded-lg px-2 text-center text-base font-mono focus:border-blue-600 focus:ring-2 focus:ring-blue-100 bg-white shadow-none',
                  formFieldRow: 'mb-4',
                  formField: 'mb-4',
                  form: 'space-y-4',
                  socialButtonsBlock: 'space-y-3 mb-4',
                  formFields: 'space-y-4',
                  formActions: 'mt-6',
                  footer: 'mt-6 pt-4 border-t border-gray-200',
                  // Override any potential card-like styling
                  main: 'shadow-none bg-transparent p-0 m-0 border-0',
                  pageScrollBox: 'shadow-none bg-transparent p-0 m-0 border-0',
                  scrollBox: 'shadow-none bg-transparent p-0 m-0 border-0',
                  page: 'shadow-none bg-transparent p-0 m-0 border-0',
                  content: 'shadow-none bg-transparent p-0 m-0 border-0',
                  container: 'shadow-none bg-transparent p-0 m-0 border-0',
                },
                variables: {
                  colorPrimary: '#2563eb',
                  colorText: '#111827',
                  colorTextSecondary: '#4b5563',
                  colorBackground: 'transparent',
                  colorInputBackground: '#ffffff',
                  colorInputText: '#111827',
                  colorBorder: '#e5e7eb',
                  colorSuccess: '#059669',
                  colorDanger: '#dc2626',
                  colorWarning: '#d97706',
                  colorNeutral: '#6b7280',
                  borderRadius: '0.5rem',
                  fontFamily: 'Inter, system-ui, sans-serif',
                  fontSize: '14px',
                  fontWeight: {
                    normal: '400',
                    medium: '500',
                    semibold: '600',
                    bold: '700',
                  },
                  spacingUnit: '4px',
                },
              }}
            />
          )}
        </div>
      </div>
    </div>
  )
}
