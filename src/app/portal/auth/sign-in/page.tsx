'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SignInRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the main auth page
    const isPortalSubdomain = window.location.hostname === 'portal.tielo.io'
    const redirectPath = isPortalSubdomain ? '/auth' : '/hr/portal/auth'
    router.replace(redirectPath)
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to authentication...</p>
      </div>
    </div>
  )
}
