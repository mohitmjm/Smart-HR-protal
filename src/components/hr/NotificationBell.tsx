'use client'

import { useState, useEffect, useRef } from 'react'
import { BellIcon, XMarkIcon, CheckIcon, TrashIcon, ClockIcon, ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/outline'
import { useDevSafeUser as useUser } from '@/lib/hooks/useDevSafeClerk';
import { getHRPortalPath } from '../../lib/urlUtils'
import { useTimezone } from '../../lib/hooks/useTimezone'

interface Notification {
  _id: string
  title: string
  message: string
  type: string
  priority: string
  isRead: boolean
  createdAt: string
  metadata?: any
}

interface NotificationBellProps {
  className?: string
}

const NotificationBell = ({ className = '' }: NotificationBellProps) => {
  const { user, isLoaded } = useUser()
  const { formatDateString, timezone, getTodayDateString, getToday } = useTimezone()
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [refreshMessage, setRefreshMessage] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (user?.id && isLoaded) {
      fetchUnreadCount()
      fetchNotifications()
      
      // Set up polling for real-time updates
      const interval = setInterval(() => {
        fetchUnreadCount()
        fetchNotifications()
      }, 30000) // Poll every 30 seconds
      
      return () => clearInterval(interval)
    }
  }, [user?.id, isLoaded])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchUnreadCount = async () => {
    if (!user?.id || !isLoaded) return
    
    try {
      const response = await fetch(`/api/notifications?userId=${user.id}&unreadOnly=true&limit=1`)
      if (response.ok) {
        const data = await response.json()
        setUnreadCount(data.data.total || 0)
      }
    } catch (error) {
      console.error('Error fetching unread count:', error)
    }
  }

  const fetchNotifications = async () => {
    if (!user?.id || !isLoaded) return
    
    setIsLoading(true)
    try {
      const response = await fetch(`/api/notifications?userId=${user.id}&limit=20`)
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.data.notifications)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    if (!user?.id || !isLoaded) return
    
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          notificationId,
          userId: user.id
        })
      })

      if (response.ok) {
        // Update local state
        setNotifications(prev => 
          prev.map(notif => 
            notif._id === notificationId 
              ? { ...notif, isRead: true }
              : notif
          )
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    if (!user?.id) return
    
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: user.id,
          markAllAsRead: true
        })
      })

      if (response.ok) {
        setNotifications(prev => prev.map(notif => ({ ...notif, isRead: true })))
        setUnreadCount(0)
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
      case 'high':
        return <ExclamationTriangleIcon className="h-4 w-4 text-orange-500" />
      case 'medium':
        return <InformationCircleIcon className="h-4 w-4 text-blue-500" />
      default:
        return <InformationCircleIcon className="h-4 w-4 text-gray-500" />
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'leave_request':
        return <ClockIcon className="h-4 w-4 text-blue-500" />
      case 'leave_approved':
        return <CheckIcon className="h-4 w-4 text-green-500" />
      case 'leave_rejected':
        return <XMarkIcon className="h-4 w-4 text-red-500" />
      case 'urgent_leave':
        return <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
      default:
        return <InformationCircleIcon className="h-4 w-4 text-gray-500" />
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = getToday()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    try {
      return formatDateString(getTodayDateString(), 'MMM d, yyyy')
    } catch (error) {
      console.error('Error formatting date in NotificationBell:', error)
      return 'Invalid Date'
    }
  }

  if (!user?.id) return null

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-400 hover:text-gray-600 transition-colors relative"
        aria-label="Notifications"
      >
        <BellIcon className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute left-1/2 mt-2 w-64 sm:w-80 max-w-[calc(100vw-1rem)] bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden transform -translate-x-1/2">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">
                Notifications
              </h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={async () => {
                    setIsRefreshing(true)
                    setRefreshMessage('')
                    await Promise.all([
                      fetchUnreadCount(),
                      fetchNotifications()
                    ])
                    setIsRefreshing(false)
                    setRefreshMessage('Refreshed!')
                    setTimeout(() => setRefreshMessage(''), 2000)
                  }}
                  disabled={isRefreshing}
                  className="text-xs text-gray-600 hover:text-gray-800 font-medium p-1 rounded hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Refresh notifications"
                >
                  {isRefreshing ? (
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600"></div>
                  ) : (
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  )}
                </button>
                {refreshMessage && (
                  <span className="text-xs text-green-600 font-medium">
                    {refreshMessage}
                  </span>
                )}
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Mark all as read
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-gray-500">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <BellIcon className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p>No active notifications</p>
                <p className="text-xs text-gray-400 mt-1">Notifications older than 2 days are automatically hidden</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification._id}
                    className={`p-3 sm:p-4 hover:bg-gray-50 transition-colors ${
                      !notification.isRead ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-2">
                      <div className="flex-shrink-0 mt-1">
                        {getTypeIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-2">
                          <p className={`text-sm font-medium break-words ${
                            !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                          }`}>
                            {notification.title}
                          </p>
                          <div className="flex items-center space-x-1 flex-shrink-0">
                            {getPriorityIcon(notification.priority)}
                            <span className="text-xs text-gray-400 whitespace-nowrap">
                              {formatTime(notification.createdAt)}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2 break-words">
                          {notification.message}
                        </p>
                        {!notification.isRead && (
                          <button
                            onClick={() => markAsRead(notification._id)}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium mt-2"
                          >
                            Mark as read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
              <div className="text-center">
                <button
                  onClick={() => window.location.href = getHRPortalPath('notifications')}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  View all notifications
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default NotificationBell
