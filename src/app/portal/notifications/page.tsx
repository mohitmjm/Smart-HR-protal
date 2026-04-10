'use client'

import { useState, useEffect, useCallback } from 'react'
import { useDevSafeUser as useUser } from '@/lib/hooks/useDevSafeClerk';
import { BellIcon, CheckIcon, XMarkIcon, ClockIcon, ExclamationTriangleIcon, InformationCircleIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import HRPortalLayout from '../../../components/hr/HRPortalLayout'
import { useTimezone } from '../../../lib/hooks/useTimezone'

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

const NotificationsPage = () => {
  const { user, isLoaded } = useUser()
  const { formatDateString } = useTimezone()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'unread' | 'read'>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const itemsPerPage = 20

  const safeFormatDate = (dateString: string, format: string) => {
    if (!dateString || dateString === 'Invalid Date') {
      return 'Invalid Date'
    }
    try {
      return formatDateString(dateString, format)
    } catch (error) {
      console.error('Error formatting date:', dateString, error)
      return 'Invalid Date'
    }
  }


  const fetchNotifications = useCallback(async () => {
    if (!user?.id || !isLoaded) return
    
    setIsLoading(true)
    try {
      const offset = (currentPage - 1) * itemsPerPage
      const response = await fetch(`/api/notifications?userId=${user.id}&limit=${itemsPerPage}&offset=${offset}`)
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.data.notifications)
        setTotalCount(data.data.total)
        setTotalPages(Math.ceil(data.data.total / itemsPerPage))
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }, [user?.id, isLoaded, currentPage, itemsPerPage])

  const filterNotifications = useCallback(() => {
    let filtered = [...notifications]

    // Status filter
    if (statusFilter === 'unread') {
      filtered = filtered.filter(n => !n.isRead)
    } else if (statusFilter === 'read') {
      filtered = filtered.filter(n => n.isRead)
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(n => n.type === typeFilter)
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(n => n.priority === priorityFilter)
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(n => 
        n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.message.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredNotifications(filtered)
  }, [notifications, statusFilter, typeFilter, priorityFilter, searchTerm])

  useEffect(() => {
    if (user?.id && isLoaded) {
      fetchNotifications()
    }
  }, [user?.id, isLoaded, currentPage, fetchNotifications])

  useEffect(() => {
    filterNotifications()
  }, [notifications, searchTerm, statusFilter, typeFilter, priorityFilter, filterNotifications])

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
        setNotifications(prev => 
          prev.map(notif => 
            notif._id === notificationId 
              ? { ...notif, isRead: true }
              : notif
          )
        )
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    if (!user?.id || !isLoaded) return
    
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
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }


  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'leave_request':
        return <ClockIcon className="h-5 w-5 text-blue-500" />
      case 'leave_approved':
        return <CheckIcon className="h-5 w-5 text-green-500" />
      case 'leave_rejected':
        return <XMarkIcon className="h-5 w-5 text-red-500" />
      case 'urgent_leave':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
      default:
        return <InformationCircleIcon className="h-5 w-5 text-gray-500" />
    }
  }

  const getPriorityBadge = (priority: string) => {
    const colors = {
      urgent: 'bg-red-100 text-red-800',
      high: 'bg-orange-100 text-orange-800',
      medium: 'bg-blue-100 text-blue-800',
      low: 'bg-gray-100 text-gray-800'
    }
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[priority as keyof typeof colors] || colors.low}`}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </span>
    )
  }

  const getTypeBadge = (type: string) => {
    const colors = {
      leave_request: 'bg-blue-100 text-blue-800',
      leave_approved: 'bg-green-100 text-green-800',
      leave_rejected: 'bg-red-100 text-red-800',
      urgent_leave: 'bg-red-100 text-red-800',
      system: 'bg-purple-100 text-purple-800',
      attendance: 'bg-yellow-100 text-yellow-800',
      general: 'bg-gray-100 text-gray-800'
    }
    
    const labels = {
      leave_request: 'Leave Request',
      leave_approved: 'Leave Approved',
      leave_rejected: 'Leave Rejected',
      urgent_leave: 'Urgent Leave',
      system: 'System',
      attendance: 'Attendance',
      general: 'General'
    }
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[type as keyof typeof colors] || colors.general}`}>
        {labels[type as keyof typeof labels] || type}
      </span>
    )
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  const unreadCount = notifications.filter(n => !n.isRead).length

  return (
    <HRPortalLayout currentPage="notifications">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
              <p className="mt-2 text-gray-600">
                Manage your notifications and stay updated with important updates
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <CheckIcon className="h-4 w-4 mr-2" />
                  Mark all as read
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search notifications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'unread' | 'read')}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All</option>
                <option value="unread">Unread</option>
                <option value="read">Read</option>
              </select>
            </div>

            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Types</option>
                <option value="leave_request">Leave Request</option>
                <option value="leave_approved">Leave Approved</option>
                <option value="leave_rejected">Leave Rejected</option>
                <option value="urgent_leave">Urgent Leave</option>
                <option value="system">System</option>
                <option value="attendance">Attendance</option>
                <option value="general">General</option>
              </select>
            </div>

            {/* Priority Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="bg-white rounded-lg shadow">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading notifications...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-8 text-center">
              <BellIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 text-lg">No notifications found</p>
              <p className="text-gray-400">Try adjusting your filters or check back later</p>
            </div>
          ) : (
            <>
              <div className="px-6 py-4 border-b border-gray-200">
                <p className="text-sm text-gray-600">
                  Showing {filteredNotifications.length} of {totalCount} notifications
                </p>
              </div>
              
              <div className="divide-y divide-gray-200">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification._id}
                    className={`p-6 hover:bg-gray-50 transition-colors ${
                      !notification.isRead ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 mt-1">
                        {getTypeIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            <p className={`text-lg font-medium ${
                              !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                            }`}>
                              {notification.title}
                            </p>
                            {getPriorityBadge(notification.priority)}
                            {getTypeBadge(notification.type)}
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-400">
                              {formatTime(notification.createdAt)}
                            </span>
                            {!notification.isRead && (
                              <button
                                onClick={() => markAsRead(notification._id)}
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                              >
                                Mark as read
                              </button>
                            )}
                          </div>
                        </div>
                        
                        <p className="text-gray-600 mt-2 leading-relaxed">
                          {notification.message}
                        </p>
                        
                        {notification.metadata && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-md">
                            <div className="text-sm text-gray-600">
                              {notification.metadata.leaveType && (
                                <p><strong>Leave Type:</strong> {notification.metadata.leaveType}</p>
                              )}
                              {notification.metadata.totalDays && (
                                <p><strong>Duration:</strong> {notification.metadata.totalDays} days</p>
                              )}
                              {notification.metadata.startDate && (
                                <p><strong>Start Date:</strong> {safeFormatDate(notification.metadata.startDate, 'MMM d, yyyy')}</p>
                              )}
                              {notification.metadata.teamName && (
                                <p><strong>Team:</strong> {notification.metadata.teamName}</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Page {currentPage} of {totalPages}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </HRPortalLayout>
  )
}

export default NotificationsPage
