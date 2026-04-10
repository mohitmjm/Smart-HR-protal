'use client'

import { useState, useEffect } from 'react'
import { DEV_BYPASS_ENABLED, DEV_USER } from '../../../lib/devAuth'

// Dev-safe useUser hook
function useDevSafeUser() {
  if (DEV_BYPASS_ENABLED) {
    return {
      user: {
        id: DEV_USER.userId,
        firstName: DEV_USER.firstName,
        lastName: DEV_USER.lastName,
        emailAddresses: [{ emailAddress: DEV_USER.email }],
      },
      isLoaded: true,
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useUser } = require('@clerk/nextjs')
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useUser()
}
import HRPortalLayout from '../../../components/hr/HRPortalLayout'
import DashboardSummaryCards from '../../../components/hr/DashboardSummaryCards'
import RecentActivityWidget from '../../../components/hr/RecentActivityWidget'
import TeamStatsView from '../../../components/hr/TeamStatsView'
import { ProfileSyncStatus } from '../../../components/hr/ProfileSyncProvider'
import { useProfileSync } from '../../../lib/hooks/useProfileSync'
import { getHRPortalPath } from '../../../lib/urlUtils'
import { useTimezone } from '../../../lib/hooks/useTimezone'
import { logger } from '../../../lib/logger'

import { 
  ClockIcon, 
  CalendarIcon, 
  UserIcon, 
  DocumentTextIcon, 
  Cog6ToothIcon,
  UsersIcon,
  ArrowRightIcon,
  TagIcon,
  ChartBarIcon as TrendingUpIcon,
  BoltIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'


export default function HRPortalDashboard() {
  const { user, isLoaded } = useDevSafeUser()
  const { profile } = useProfileSync()
  const { timezone, formatTime, getToday } = useTimezone()
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [greeting, setGreeting] = useState('Welcome')

  useEffect(() => {
    const updateTime = () => {
      const now = getToday()
      setCurrentTime(now)
      
      const hour = now.getHours()
      if (hour < 12) {
        setGreeting('Good Morning')
      } else if (hour < 17) {
        setGreeting('Good Afternoon')
      } else {
        setGreeting('Good Evening')
      }
    }
    
    updateTime()
    const timer = setInterval(updateTime, 1000)

    return () => clearInterval(timer)
  }, [getToday])

  const quickActions = [
    {
      title: 'Clock In/Out',
      description: 'Record your attendance',
      icon: ClockIcon,
      href: getHRPortalPath('attendance'),
      gradient: 'from-blue-500 to-indigo-600',
      hoverGradient: 'from-blue-600 to-indigo-700'
    },
    {
      title: 'Request Leave',
      description: 'Submit leave application',
      icon: CalendarIcon,
      href: getHRPortalPath('leaves'),
      gradient: 'from-green-500 to-emerald-600',
      hoverGradient: 'from-green-600 to-emerald-700'
    },
    {
      title: 'Update Profile',
      description: 'Manage your information',
      icon: UserIcon,
      href: getHRPortalPath('profile'),
      gradient: 'from-purple-500 to-pink-600',
      hoverGradient: 'from-purple-600 to-pink-700'
    },
    {
      title: 'View Documents',
      description: 'Access HR documents',
      icon: DocumentTextIcon,
      href: getHRPortalPath('documents'),
      gradient: 'from-orange-500 to-red-600',
      hoverGradient: 'from-orange-600 to-red-700'
    }
  ]

  if (!isLoaded) {
    return (
      <HRPortalLayout currentPage="dashboard">
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
          <div className="text-center">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-6"></div>
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-400 animate-pulse"></div>
            </div>
            <p className="text-gray-600 text-lg font-medium">Loading dashboard...</p>
            <p className="text-gray-400 text-sm mt-2">Preparing your workspace</p>
          </div>
        </div>
      </HRPortalLayout>
    )
  }

  if (!user) {
    return (
      <HRPortalLayout currentPage="dashboard">
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">Please sign in to access the HR portal</p>
          </div>
        </div>
      </HRPortalLayout>
    )
  }

  return (
    <HRPortalLayout>
      {/* Profile Sync Status */}
      <ProfileSyncStatus />
      
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4 sm:p-6">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                {greeting}, {profile?.firstName || user?.firstName || 'User'}! 👋
              </h1>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900 min-h-[32px]">
                {currentTime ? formatTime(currentTime, 'hh:mm a') : ''}
              </div>
              <div className="text-gray-600 min-h-[24px]">
                {currentTime ? formatTime(currentTime, 'EEEE, MMMM d, yyyy') : ''}
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Summary Cards */}
        <DashboardSummaryCards userId={user?.id || ''} />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Quick Actions */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-8 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500 to-indigo-600 opacity-5 rounded-full -translate-y-16 translate-x-16"></div>
            
            <div className="relative z-10">
              <div className="flex items-center space-x-3 mb-6">
                <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <BoltIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Quick Actions</h2>
                  <p className="text-gray-600">Common tasks at your fingertips</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {quickActions.map((action, index) => (
                  <Link
                    key={index}
                    href={action.href}
                    className="group p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300 hover:scale-105"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`h-10 w-10 bg-gradient-to-br ${action.gradient} rounded-lg flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-300`}>
                        <action.icon className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 group-hover:text-gray-700 transition-colors">
                          {action.title}
                        </h3>
                        <p className="text-sm text-gray-600 group-hover:text-gray-500 transition-colors">
                          {action.description}
                        </p>
                      </div>
                      <ArrowRightIcon className="h-4 w-4 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all duration-300" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <RecentActivityWidget userId={user?.id || ''} />
        </div>

        {/* Team Stats View */}
        <TeamStatsView userId={user?.id || ''} />

        {/* Bottom Navigation Hints */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-200/50 relative overflow-hidden mt-8">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500 to-indigo-600 opacity-5 rounded-full -translate-y-16 translate-x-16"></div>
          
          <div className="relative z-10">
            <div className="flex items-center space-x-3 mb-6">
              <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <TrendingUpIcon className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-blue-900">Need Help?</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              <div className="flex items-center p-4 bg-white/60 rounded-xl border border-blue-200/30 hover:bg-white/80 transition-all duration-200">
                <Cog6ToothIcon className="h-5 w-5 text-blue-600 mr-3" />
                <span className="text-blue-800">
                  <Link href={getHRPortalPath('settings')} className="hover:underline font-medium">Settings</Link> for account preferences
                </span>
              </div>
              <div className="flex items-center p-4 bg-white/60 rounded-xl border border-blue-200/30 hover:bg-white/80 transition-all duration-200">
                <UsersIcon className="h-5 w-5 text-blue-600 mr-3" />
                <span className="text-blue-600 mr-3" />
                <span className="text-blue-800">
                  <Link href={getHRPortalPath('team')} className="hover:underline font-medium">Team</Link> to manage your team
                </span>
              </div>
              <div className="flex items-center p-4 bg-white/60 rounded-xl border border-blue-200/30 hover:bg-white/80 transition-all duration-200">
                <DocumentTextIcon className="h-5 w-5 text-blue-600 mr-3" />
                <span className="text-blue-800">
                  <Link href={getHRPortalPath('documents')} className="hover:underline font-medium">Documents</Link> for HR resources
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </HRPortalLayout>
  )
}
