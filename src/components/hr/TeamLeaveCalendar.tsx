'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { formatInTimeZone } from 'date-fns-tz'
import { ChevronLeftIcon, ChevronRightIcon, UsersIcon, GiftIcon } from '@heroicons/react/24/outline'
import { isToday, getMonthBoundaries, formatForDisplay, getDayBoundariesInUserTimezone } from '../../lib/timezoneUtils'
import { useTimezone } from '../../lib/hooks/useTimezone'
import { useSystemSettings } from '../../lib/hooks/useSystemSettings'

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

interface Holiday {
  name: string
  date: string
}

interface TeamLeaveCalendarProps {
  onSelectLeave?: (leave: LeaveRecord) => void
  teams?: Array<{ id: string; name: string; memberCount: number }>
}

const TeamLeaveCalendar = ({ onSelectLeave, teams = [] }: TeamLeaveCalendarProps) => {
  const { formatDateString, timezone, getTodayDateString, getToday } = useTimezone()
  const { settings } = useSystemSettings()
  const [currentDate, setCurrentDate] = useState(() => getToday())
  const [leaves, setLeaves] = useState<LeaveRecord[]>([])
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTeamId, setSelectedTeamId] = useState<string>('all')

  const fetchLeaves = useCallback(async () => {
    try {
      setLoading(true)
      const year = currentDate.getFullYear()
      const month = currentDate.getMonth()
      
      // Use timezone utilities for month boundaries
      const { start, end } = getMonthBoundaries(year, month)
      const startDate = start.toISOString().slice(0, 10)
      const endDate = end.toISOString().slice(0, 10)
      
      const teamQuery = selectedTeamId && selectedTeamId !== 'all' ? `&teamId=${encodeURIComponent(selectedTeamId)}` : ''
      // Fetch all statuses (approved and pending) so applied leaves are visible on the calendar
      const res = await fetch(`/api/leaves/team?startDate=${startDate}&endDate=${endDate}${teamQuery}`)
      const data = await res.json()
      
      if (data.success) setLeaves(data.data)
    } catch (e) {
      console.error('Failed to load team leaves', e)
    } finally {
      setLoading(false)
    }
  }, [currentDate, selectedTeamId])

  const fetchHolidays = useCallback(async () => {
    try {
      const year = currentDate.getFullYear()
      const response = await fetch(`/api/holidays?year=${year}`)
      const data = await response.json()
      
      if (data.success && data.data[year]) {
        setHolidays(data.data[year])
      }
    } catch (error) {
      console.error('Error fetching holidays:', error)
    }
  }, [currentDate])

  useEffect(() => {
    fetchLeaves()
    fetchHolidays()
  }, [currentDate, selectedTeamId, fetchLeaves, fetchHolidays])

  const getMonthName = (date: Date) => {
    try {
      return formatForDisplay(date, timezone, 'MMMM yyyy')
    } catch (error) {
      console.error('Error formatting month name:', error)
      return 'Invalid Date'
    }
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    // Convert Sunday (0) to 6, Monday (1) to 0, etc. to make Monday the first day
    const startingDayOfWeek = (firstDay.getDay() + 6) % 7
    
    return { daysInMonth, startingDayOfWeek }
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const d = new Date(prev)
      d.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1))
      return d
    })
  }


  const getLeavesForDate = (date: Date) => {
    // Compute the selected day boundaries in the viewer's timezone, as UTC instants
    const { start: dayStartUTC, end: dayEndUTC } = getDayBoundariesInUserTimezone(date, timezone)

    // Unique users per day
    const byUser = new Map<string, LeaveRecord>()
    for (const leave of leaves) {
      const leaveStartUTC = new Date(leave.startDate)
      const leaveEndUTC = new Date(leave.endDate)

      // Overlap check: (leaveStart <= dayEnd) AND (leaveEnd >= dayStart)
      if (leaveStartUTC <= dayEndUTC && leaveEndUTC >= dayStartUTC) {
        if (!byUser.has(leave.userId)) byUser.set(leave.userId, leave)
      }
    }
    return Array.from(byUser.values())
  }

  const getHolidaysForDate = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const targetDateString = `${year}-${month}-${day}`
    return holidays.filter(holiday => holiday.date === targetDateString)
  }

  const isWeekend = (date: Date) => {
    if (!settings?.general?.workingDays) return false
    
    const dayName = formatInTimeZone(date, timezone, 'EEEE') // Get full day name (e.g., "Monday")
    return !settings.general.workingDays.includes(dayName)
  }

  const getLeaveStyle = (leave: LeaveRecord) => {
    const baseColor = colorForUser(leave.userId) // e.g., bg-blue-600
    const borderColor = baseColor.replace('bg-', 'border-')
    const textColor = baseColor.replace('bg-', 'text-')
    if (leave.status === 'approved') {
      // Solid chip with white text
      return `${baseColor} text-white opacity-100`
    } else if (leave.status === 'pending') {
      // High-contrast hollow chip for applied/pending: white background, colored border and text
      return `bg-white ${borderColor} ${textColor} border-2`
    } else {
      // Other statuses (rejected, cancelled) - faded but still visible
      return `${baseColor} text-white opacity-30`
    }
  }

  const getInitials = (member?: TeamMember | null) => {
    if (!member) return '?'
    const f = (member.firstName || '').trim()
    const l = (member.lastName || '').trim()
    if (f || l) return `${f.charAt(0)}${l.charAt(0)}`.toUpperCase() || f.charAt(0).toUpperCase()
    const email = (member.email || '').trim()
    return email ? email.charAt(0).toUpperCase() : '?'
  }

  const colorPool = ['bg-blue-600', 'bg-green-600', 'bg-purple-600', 'bg-pink-600', 'bg-red-600', 'bg-amber-600', 'bg-teal-600']
  const colorForUser = (userId: string) => {
    let hash = 0
    for (let i = 0; i < userId.length; i++) hash = (hash * 31 + userId.charCodeAt(i)) >>> 0
    return colorPool[hash % colorPool.length]
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading team calendar...</p>
        </div>
      </div>
    )
  }

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate)
  const dayCells = [] as React.ReactElement[]
  for (let i = 0; i < startingDayOfWeek; i++) {
    dayCells.push(<div key={`empty-${i}`} className="p-2 min-h-[92px]" />)
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    const leavesForDate = getLeavesForDate(date)
    const holidaysForDate = getHolidaysForDate(date)
    const isWeekendDate = isWeekend(date)
    dayCells.push(
      <div key={day} className={`p-2 min-h-[92px] border border-gray-200 ${isToday(date) ? 'bg-blue-50 border-blue-300' : ''} ${holidaysForDate.length > 0 ? 'bg-orange-50 border-orange-200' : ''} ${isWeekendDate ? 'bg-gray-100 opacity-60' : ''}`}>
        <div className="flex items-center justify-between mb-2">
          <span className={`text-sm font-medium ${
            isToday(date) ? 'text-blue-600' : 
            holidaysForDate.length > 0 ? 'text-orange-600' : 
            isWeekendDate ? 'text-gray-500' : 'text-gray-900'
          }`}>{day}</span>
          <div className="flex items-center space-x-1">
            {holidaysForDate.length > 0 && (
              <GiftIcon className="h-3 w-3 text-orange-500" />
            )}
            {leavesForDate.length > 0 && (
              <span className="text-xs text-gray-500">{leavesForDate.length}</span>
            )}
          </div>
        </div>
        
        {/* Holiday indicators */}
        {holidaysForDate.length > 0 && (
          <div className="mb-2">
            {holidaysForDate.slice(0, 1).map((holiday, index) => (
              <div
                key={`holiday-${index}`}
                className="text-xs text-orange-800 bg-orange-200 px-2 py-1 rounded truncate mb-1"
                title={holiday.name}
              >
                {holiday.name}
              </div>
            ))}
            {holidaysForDate.length > 1 && (
              <div className="text-xs text-orange-600 text-center">
                +{holidaysForDate.length - 1} more
              </div>
            )}
          </div>
        )}
        
        <div className="flex -space-x-2">
          {leavesForDate.slice(0, holidaysForDate.length > 0 ? 4 : 5).map(leave => (
            <div
              key={leave.userId}
              title={`${leave.user?.firstName || ''} ${leave.user?.lastName || ''} - ${leave.leaveType} (${leave.status})`.trim() || leave.user?.email || leave.userId}
              className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-[10px] font-semibold ring-2 ring-white ${getLeaveStyle(leave)} cursor-default`}
              onClick={() => onSelectLeave?.(leave)}
            >
              {getInitials(leave.user)}
            </div>
          ))}
          {leavesForDate.length > (holidaysForDate.length > 0 ? 4 : 5) && (
            <div className="inline-flex items-center justify-center h-6 w-6 rounded-full text-[10px] font-semibold text-gray-700 bg-gray-100 ring-2 ring-white">+{leavesForDate.length - (holidaysForDate.length > 0 ? 4 : 5)}</div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          <div className="flex items-center space-x-3">
            <UsersIcon className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Team Leave Calendar</h3>
          </div>
          
          {/* Month Navigation - Responsive Layout */}
          <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-3">
            {/* Month Navigation Controls */}
            <div className="flex items-center space-x-2">
              <button onClick={() => navigateMonth('prev')} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <ChevronLeftIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
              <span className="text-sm sm:text-lg font-medium text-gray-900 min-w-[120px] sm:min-w-[200px] text-center">{getMonthName(currentDate)}</span>
              <button onClick={() => navigateMonth('next')} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <ChevronRightIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>
            
            {/* Today Button */}
            <button 
              onClick={() => setCurrentDate(getToday())} 
              className="px-3 py-1.5 text-xs sm:text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
            >
              Today
            </button>
          </div>
        </div>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
            <div key={d} className="p-2 text-center text-sm font-medium text-gray-500">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {dayCells}
        </div>
        <div className="mt-4 space-y-2">
          <div className="text-xs text-gray-500">Each avatar represents a team member on leave that day</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 text-xs">
            <div className="flex items-center space-x-1">
              <GiftIcon className="h-3 w-3 text-orange-500 flex-shrink-0" />
              <span className="text-gray-600">Holiday</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded-full bg-blue-600 opacity-100 flex-shrink-0"></div>
              <span className="text-gray-600">Approved</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded-full border-2 border-blue-600 flex-shrink-0"></div>
              <span className="text-gray-600">Applied</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TeamLeaveCalendar


