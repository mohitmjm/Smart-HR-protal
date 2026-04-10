'use client'

import { useState, useEffect } from 'react'
import { CheckCircleIcon, CalendarIcon, UsersIcon } from '@heroicons/react/24/outline'
import { useTimezone } from '../../lib/hooks/useTimezone'
import { formatDateStringInUserTimezone } from '../../lib/timezoneUtils'

interface TeamMember {
  clerkUserId: string
  firstName?: string
  lastName?: string
  email?: string
  department?: string
  position?: string
}

interface LeaveRecord {
  _id: string
  userId: string
  leaveType: string
  startDate: string
  endDate: string
  totalDays: number
  reason: string
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  appliedDate: string
  approvedBy?: string
  rejectionReason?: string
  user?: TeamMember | null
}

interface ApprovedLeavesProps {
  onActionCompleted?: () => void
}

const ApprovedLeaves = ({ }: ApprovedLeavesProps) => {
  const { safeFormatDate, timezone } = useTimezone()
  const [approved, setApproved] = useState<LeaveRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchApproved = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/leaves/direct-reports?status=approved&limit=50`)
        const data = await res.json()
        if (data.success) {
          // Filter to show only approved leaves
          const approvedLeaves = data.data.filter((leave: LeaveRecord) => leave.status === 'approved')
          console.log('Approved leaves data:', approvedLeaves)
          
          // Validate date fields
          const validatedLeaves = approvedLeaves.map((leave: LeaveRecord) => {
            console.log('Processing leave:', { 
              id: leave._id, 
              startDate: leave.startDate, 
              endDate: leave.endDate,
              startDateType: typeof leave.startDate,
              endDateType: typeof leave.endDate
            })
            
            if (!leave.startDate || !leave.endDate) {
              console.warn('Leave with missing dates:', leave)
              return {
                ...leave,
                startDate: leave.startDate || new Date().toISOString(),
                endDate: leave.endDate || new Date().toISOString()
              }
            }
            
            // Additional validation for date strings
            if (typeof leave.startDate === 'string') {
              const startDate = new Date(leave.startDate)
              if (isNaN(startDate.getTime())) {
                console.error('Invalid startDate in leave:', { leave, startDate })
                return {
                  ...leave,
                  startDate: new Date().toISOString()
                }
              }
            }
            
            if (typeof leave.endDate === 'string') {
              const endDate = new Date(leave.endDate)
              if (isNaN(endDate.getTime())) {
                console.error('Invalid endDate in leave:', { leave, endDate })
                return {
                  ...leave,
                  endDate: new Date().toISOString()
                }
              }
            }
            
            return leave
          })
          
          setApproved(validatedLeaves)
        }
      } catch (e) {
        console.error('Failed to load approved leaves', e)
      } finally {
        setLoading(false)
      }
    }

    fetchApproved()
  }, [])

  const getLeaveColor = (type: string) => {
    switch (type) {
      case 'sick': return 'bg-red-500'
      case 'casual': return 'bg-blue-500'
      case 'annual': return 'bg-green-500'
      case 'maternity': return 'bg-pink-500'
      case 'paternity': return 'bg-purple-500'
      default: return 'bg-gray-500'
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString || dateString === 'Invalid Date') {
      return 'Invalid Date'
    }
    try {
      return formatDateStringInUserTimezone(dateString, timezone, { month: 'short', day: 'numeric', year: 'numeric' })
    } catch (error) {
      console.error('Error formatting date:', dateString, error)
      return 'Invalid Date'
    }
  }


  const formatDateRange = (start: string, end: string) => {
    console.log('formatDateRange called with:', { start, end, startType: typeof start, endType: typeof end })
    
    if (!start || !end || start === 'Invalid Date' || end === 'Invalid Date') {
      console.warn('Invalid date range parameters:', { start, end })
      return 'Invalid Date Range'
    }
    
    try {
      const startDate = new Date(start)
      const endDate = new Date(end)
      
      // Check if dates are valid
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        console.warn('Invalid date objects created:', { start, end, startDate, endDate })
        return 'Invalid Date Range'
      }
      
      if (startDate.getMonth() === endDate.getMonth() && startDate.getFullYear() === endDate.getFullYear()) {
        return `${startDate.getDate()} - ${endDate.getDate()} ${safeFormatDate(start, 'MMM yyyy')}`
      } else {
        return `${formatDate(start)} - ${formatDate(end)}`
      }
    } catch (error) {
      console.error('Error formatting date range:', start, end, error)
      return 'Invalid Date Range'
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading approved leaves...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <CheckCircleIcon className="h-6 w-6 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-900">Approved Leaves</h3>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-sm text-gray-600">{approved.length}</span>
        </div>
      </div>

      {approved.length === 0 ? (
        <div className="px-6 py-10 text-center text-gray-500">
          <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p>No approved leaves from your direct reports</p>
          <p className="text-sm text-gray-400">Approved leaves will appear here</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Direct Report</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leave Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Range</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {approved.map((leave) => (
                <tr key={leave._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                        <UsersIcon className="h-4 w-4 text-gray-500" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {(leave.user?.firstName || leave.user?.lastName) ? 
                            `${leave.user?.firstName || ''} ${leave.user?.lastName || ''}`.trim() : 
                            (leave.user?.email || leave.userId)}
                        </div>
                        <div className="text-sm text-gray-500">{leave.user?.department || 'N/A'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${getLeaveColor(leave.leaveType)}`}>
                      {leave.leaveType.charAt(0).toUpperCase() + leave.leaveType.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDateRange(leave.startDate, leave.endDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {leave.totalDays} day{leave.totalDays !== 1 ? 's' : ''}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <CheckCircleIcon className="h-3 w-3 mr-1" />
                      Approved
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default ApprovedLeaves
