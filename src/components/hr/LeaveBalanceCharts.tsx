'use client'

import React, { useEffect, useState } from 'react'
import GaugeChartComponent from './GaugeChart'

// Leave type definitions
const leaveTypeDefinitions = {
  'Total Leave': 'The complete allocation of all leave types available to an employee for the year.',
  'Annual Leave': 'Paid time off for vacation, personal activities, or rest. Usually the most flexible leave type.',
  'Sick Leave': 'Paid time off for illness, medical appointments, or recovery from health issues.',
  'Personal Leave': 'Unpaid or paid time off for personal matters, emergencies, or other non-medical reasons.',
  'Maternity Leave': 'Paid or unpaid time off for new mothers before and after childbirth.',
  'Paternity Leave': 'Paid or unpaid time off for new fathers to care for their newborn child.',
  'Emergency Leave': 'Unpaid time off for urgent personal or family emergencies.',
  'Study Leave': 'Time off for educational purposes, training, or professional development.',
  'Bereavement Leave': 'Time off for mourning the death of a family member or close relative.',
  'Compensatory Leave': 'Time off granted in lieu of overtime work or extra hours.'
}

// Color mapping for different leave types based on website theme
const leaveTypeColors = {
  'Total Leave': '#2563eb', // Primary blue
  'Annual Leave': '#10b981', // Green (vacation/rest)
  'Sick Leave': '#ef4444', // Red (health/medical)
  'Personal Leave': '#8b5cf6', // Purple (personal matters)
  'Maternity Leave': '#ec4899', // Pink (maternal)
  'Paternity Leave': '#06b6d4', // Cyan (paternal)
  'Emergency Leave': '#f59e0b', // Amber (urgent)
  'Study Leave': '#6366f1', // Indigo (education)
  'Bereavement Leave': '#6b7280', // Gray (mourning)
  'Compensatory Leave': '#84cc16' // Lime (compensation)
}

interface LeaveBalanceData {
  type: string
  total: number
  taken: number
  remaining: number
}

interface LeaveBalanceResponse {
  leaveTypes: LeaveBalanceData[]
  summary: {
    totalBalance: number
    totalTaken: number
    totalRemaining: number
    overallPercentage: number
  }
}

interface LeaveBalanceChartsProps {
  userId: string
  className?: string
}

const LeaveBalanceCharts: React.FC<LeaveBalanceChartsProps> = ({
  userId,
  className = ''
}) => {
  const [data, setData] = useState<LeaveBalanceResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tooltip, setTooltip] = useState<{ type: string; definition: string; x: number; y: number } | null>(null)

  const handleInfoClick = (e: React.MouseEvent, leaveType: string) => {
    e.preventDefault()
    e.stopPropagation()
    
    const definition = leaveTypeDefinitions[leaveType as keyof typeof leaveTypeDefinitions] || 'No definition available.'
    const rect = e.currentTarget.getBoundingClientRect()
    
    setTooltip({
      type: leaveType,
      definition,
      x: rect.left + rect.width / 2,
      y: rect.top - 10
    })
  }

  const handleCloseTooltip = () => {
    setTooltip(null)
  }

  const getLeaveTypeColor = (leaveType: string): string => {
    return leaveTypeColors[leaveType as keyof typeof leaveTypeColors] || '#2563eb'
  }

  useEffect(() => {
    const fetchLeaveBalance = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch(`/api/leaves/balance?userId=${userId}`)
        const result = await response.json()
        
        if (result.success) {
          setData(result.data)
        } else {
          setError(result.message || 'Failed to fetch leave balance data')
        }
      } catch (err) {
        console.error('Error fetching leave balance:', err)
        setError('Failed to fetch leave balance data')
      } finally {
        setLoading(false)
      }
    }

    if (userId) {
      fetchLeaveBalance()
    }
  }, [userId])

  if (loading) {
    return (
      <div className={`w-full ${className}`}>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 w-full">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 w-full">
              <div className="animate-pulse">
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <div className="h-3 sm:h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="w-4 h-4 sm:w-5 sm:h-5 bg-gray-200 rounded-full"></div>
                </div>
                <div className="flex items-center justify-center mb-2 sm:mb-3">
                  <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gray-200 rounded-full"></div>
                </div>
                <div className="text-center">
                  <div className="h-3 bg-gray-200 rounded w-1/2 mx-auto"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="text-center text-red-600">
          <p className="text-sm">{error}</p>
        </div>
      </div>
    )
  }

  if (!data || data.leaveTypes.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="text-center text-gray-500">
          <p className="text-sm">No leave balance data available</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`w-full ${className}`}>
      {/* All Gauge Charts in One Row - Fully Responsive */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 w-full">
        {/* Overall Summary Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 w-full">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <h4 className="text-xs sm:text-sm font-semibold text-gray-900">
              Total Leave
            </h4>
            <button
              onClick={(e) => handleInfoClick(e, 'Total Leave')}
              className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors cursor-pointer"
              title="Click for definition"
            >
              <span className="text-xs text-gray-600">i</span>
            </button>
          </div>
          <div className="flex justify-center">
            <GaugeChartComponent
              data={[{
                type: 'Total Leave',
                total: data.summary.totalBalance,
                taken: data.summary.totalTaken,
                remaining: data.summary.totalRemaining
              }]}
              size={120}
              strokeWidth={8}
              showLegend={false}
              className="w-full"
              color={getLeaveTypeColor('Total Leave')}
            />
          </div>
          <div className="mt-2 sm:mt-3 text-center">
            {data.summary.totalRemaining > 0 && (
              <div 
                className="text-xs font-medium"
                style={{ color: getLeaveTypeColor('Total Leave') }}
              >
                {data.summary.totalRemaining} days available
              </div>
            )}
          </div>
        </div>

        {/* Individual Leave Type Charts */}
        {data.leaveTypes.map((leaveType) => (
          <div key={leaveType.type} className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 w-full">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <h4 className="text-xs sm:text-sm font-semibold text-gray-900">
                {leaveType.type}
              </h4>
              <button
                onClick={(e) => handleInfoClick(e, leaveType.type)}
                className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors cursor-pointer"
                title="Click for definition"
              >
                <span className="text-xs text-gray-600">i</span>
              </button>
            </div>
            <div className="flex justify-center">
              <GaugeChartComponent
                data={[leaveType]}
                size={120}
                strokeWidth={8}
                showLegend={false}
                className="w-full"
                color={getLeaveTypeColor(leaveType.type)}
              />
            </div>
            <div className="mt-2 sm:mt-3 text-center">
              {leaveType.remaining > 0 && (
                <div 
                  className="text-xs font-medium"
                  style={{ color: getLeaveTypeColor(leaveType.type) }}
                >
                  {leaveType.remaining} days available
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div className="fixed inset-0 z-50" onClick={handleCloseTooltip}>
          <div 
            className="absolute bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm z-50"
            style={{
              left: Math.min(tooltip.x - 150, window.innerWidth - 320),
              top: Math.max(tooltip.y - 120, 10)
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-900">{tooltip.type}</h3>
              <button
                onClick={handleCloseTooltip}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">{tooltip.definition}</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default LeaveBalanceCharts
