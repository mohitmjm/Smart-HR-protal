'use client'

export const dynamic = 'force-dynamic'

import { usePathname } from 'next/navigation'
import { ProfileSyncProvider } from '../../components/hr/ProfileSyncProvider'
import { RealTimeUpdateProvider } from '../../lib/contexts/RealTimeUpdateContext'
import { TimezoneProvider } from '../../lib/contexts/TimezoneContext'
import { TimezoneErrorBoundary } from '../../components/global/TimezoneErrorBoundary'

export default function HRPortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  
  // Skip timezone-dependent providers for auth pages
  const isAuthPage = pathname?.includes('/auth') || pathname === '/portal'
  
  if (isAuthPage) {
    return <>{children}</>
  }

  return (
    <TimezoneErrorBoundary>
      <TimezoneProvider>
        <ProfileSyncProvider>
          <RealTimeUpdateProvider>
            {children}
          </RealTimeUpdateProvider>
        </ProfileSyncProvider>
      </TimezoneProvider>
    </TimezoneErrorBoundary>
  )
}

