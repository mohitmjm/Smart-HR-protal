'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { 
  Bars3Icon, 
  XMarkIcon, 
  HomeIcon, 
  ClockIcon, 
  CalendarIcon, 
  UserIcon, 
  ArrowRightOnRectangleIcon,
  BellIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline'
import { useDevSafeUser as useUser, SignOutButton } from '@/lib/hooks/useDevSafeClerk';
import NotificationBell from './NotificationBell'
import { getHRPortalPath } from '../../lib/urlUtils'

interface HRNavbarProps {
  currentPage?: string
}

const HRNavbar = ({ currentPage = 'home' }: HRNavbarProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const { user } = useUser()

  const navigation = [
    { name: 'Home', href: getHRPortalPath('dashboard'), icon: HomeIcon, current: currentPage === 'home' },
    { name: 'Attendance', href: getHRPortalPath('attendance'), icon: ClockIcon, current: currentPage === 'attendance' },
    { name: 'Leaves', href: getHRPortalPath('leaves'), icon: CalendarIcon, current: currentPage === 'leaves' },
    { name: 'Notifications', href: getHRPortalPath('notifications'), icon: BellIcon, current: currentPage === 'notifications' },
    { name: 'Profile', href: getHRPortalPath('profile'), icon: UserIcon, current: currentPage === 'profile' },
  ]

  const isCurrentPage = (href: string) => {
    if (href === getHRPortalPath('dashboard') && currentPage === 'home') return true
    return href.includes(currentPage)
  }

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link href={getHRPortalPath('dashboard')} className="flex-shrink-0">
              <Image
                src="/logo.png"
                alt="tielo logo"
                width={316}
                height={295}
                className="h-12 w-auto"
                priority
              />
            </Link>
            <span className="ml-3 text-xl font-semibold text-gray-900 hidden sm:block">
              HR Portal
            </span>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isCurrentPage(item.href)
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {item.name}
                </Link>
              )
            })}
          </div>

          {/* Right side - User info and actions */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <NotificationBell />

            {/* Settings */}
            <Link 
              href={getHRPortalPath('settings')}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Cog6ToothIcon className="h-5 w-5" />
            </Link>

            {/* User Menu */}
            <div className="flex items-center space-x-3">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-900">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500">
                  {user?.emailAddresses[0]?.emailAddress}
                </p>
              </div>
              
              {/* User Avatar */}
              <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                </span>
              </div>

              {/* Logout Button */}
              <SignOutButton>
                <button className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </SignOutButton>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 text-gray-700 hover:text-blue-600 transition-colors"
              >
                {isOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 transition-all duration-300 ease-in-out">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-3 py-2 text-base font-medium rounded-md transition-colors ${
                    isCurrentPage(item.href)
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  <Icon className="h-4 w-4 mr-3" />
                  {item.name}
                </Link>
              )
            })}
            
            {/* Mobile User Info */}
            <div className="pt-4 border-t border-gray-200">
              <div className="px-3 py-2">
                <p className="text-sm font-medium text-gray-900">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500">
                  {user?.emailAddresses[0]?.emailAddress}
                </p>
              </div>
              
              <SignOutButton>
                <button className="w-full flex items-center px-3 py-2 text-base font-medium text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors">
                  <ArrowRightOnRectangleIcon className="h-4 w-4 mr-3" />
                  Logout
                </button>
              </SignOutButton>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}

export default HRNavbar
