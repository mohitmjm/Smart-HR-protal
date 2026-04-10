'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  CalendarIcon, 
  ClockIcon, 
  PlusIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'
import { useTimezone } from '@/lib/hooks/useTimezone'
import { useSystemSettings } from '@/lib/hooks/useSystemSettings'
import { TimezoneService } from '@/lib/timezoneService'
import { calculateWorkingDays, createWorkingDaysConfig } from '@/lib/leaveCalculationUtils'
import { FormInput, FormTextarea, FormSelect } from '../global/FormInput'
import { layoutSpacing } from '@/lib/utils/spacingUtils'
import { iconContextSizes } from '@/lib/utils/iconUtils'
import DatePicker from './DatePicker'

interface LeaveBalance {
  sick: number
  casual: number
  annual: number
  maternity?: number
  paternity?: number
}

interface LeaveRequestFormProps {
  userId: string
  onSubmit: (data: any) => void
  onCancel: () => void
}

const LeaveRequestForm = ({ userId, onSubmit, onCancel }: LeaveRequestFormProps) => {
  const { timezone, getTodayDateString, getToday } = useTimezone()
  const [formData, setFormData] = useState({
    leaveType: 'annual',
    startDate: '',
    endDate: '',
    reason: '',
    totalDays: 0
  })
  
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalance>({
    sick: 0,
    casual: 0,
    annual: 0,
    maternity: 0,
    paternity: 0
  })
  
  const [errors, setErrors] = useState<{[key: string]: string}>({})
  const [loading, setLoading] = useState(false)
  const [calculating, setCalculating] = useState(false)
  const { settings } = useSystemSettings()
  const [holidays, setHolidays] = useState<Set<string>>(new Set())
  const [workingDaysSet, setWorkingDaysSet] = useState<Set<string>>(new Set(['Monday','Tuesday','Wednesday','Thursday','Friday']))
  const [openPicker, setOpenPicker] = useState<'start' | 'end' | null>(null)


  // Load working days from settings
  useEffect(() => {
    if (settings?.general?.workingDays) {
      setWorkingDaysSet(new Set(settings.general.workingDays))
    }
  }, [settings])

  // Fetch holidays for current and next year
  useEffect(() => {
    const loadHolidays = async () => {
      try {
        const year = new Date().getFullYear()
        const res = await fetch(`/api/holidays?years=${year},${year + 1}`)
        if (res.ok) {
          const data = await res.json()
          if (data.success && data.data) {
            const set = new Set<string>()
            Object.values<Record<string, any>>(data.data as any).forEach((list: any) => {
              ;(list as Array<{ date: string }>).forEach(h => set.add(h.date))
            })
            setHolidays(set)
          }
        }
      } catch (e) {
        console.warn('Failed to load holidays', e)
      }
    }
    loadHolidays()
  }, [])

  const weekdayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
  const formatYMD = (d: Date) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  const isWorkingDate = (d: Date) => {
    const weekday = weekdayNames[d.getDay()]
    const ymd = formatYMD(d)
    return workingDaysSet.has(weekday) && !holidays.has(ymd)
  }

  // Check if a date should be disabled in the date picker
  const isDateDisabled = (d: Date, isEndDate: boolean = false) => {
    // First check if it's a working day
    if (!isWorkingDate(d)) return true
    
    // Normalize dates to midnight for accurate comparison
    const dateToCheck = new Date(d.getFullYear(), d.getMonth(), d.getDate())
    const today = getToday()
    const allowedBackdateDays = settings?.leave?.allowBackdateLeaves ?? 1
    const todayNormalized = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    
    // Check backdate policy for both start and end dates
    if (allowedBackdateDays === 0) {
      // No backdated leaves allowed - disable if before today
      if (dateToCheck < todayNormalized) return true
    } else {
      // Allow backdated leaves up to the specified number of days
      const minDate = new Date(todayNormalized)
      minDate.setDate(todayNormalized.getDate() - allowedBackdateDays)
      if (dateToCheck < minDate) return true
    }
    
    // For end date, also check if it's before start date
    if (isEndDate && formData.startDate) {
      const startDate = new Date(formData.startDate)
      const startDateNormalized = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
      if (dateToCheck < startDateNormalized) return true
    }
    
    return false
  }

  const fetchLeaveBalance = useCallback(async () => {
    try {
      const response = await fetch(`/api/leaves/balance?userId=${userId}`)
      const data = await response.json()
      if (data.success && data.data.leaveTypes) {
        // Convert the leave balance data to the expected format
        const balanceData: LeaveBalance = {
          sick: 0,
          casual: 0,
          annual: 0,
          maternity: 0,
          paternity: 0
        }
        
        // Map the leave types to our balance object using remaining days
        data.data.leaveTypes.forEach((leaveType: any) => {
          const type = leaveType.type.toLowerCase().replace(' leave', '')
          if (type === 'personal') {
            balanceData.casual = leaveType.remaining
          } else if (type === 'annual' || type === 'sick' || type === 'maternity' || type === 'paternity') {
            balanceData[type as keyof LeaveBalance] = leaveType.remaining
          }
        })
        
        setLeaveBalance(balanceData)
      }
    } catch (error) {
      console.error('Error fetching leave balance:', error)
    }
  }, [userId])

  useEffect(() => {
    fetchLeaveBalance()
  }, [userId, fetchLeaveBalance])

  const calculateWorkingDaysLocal = (start: string, end: string) => {
    if (!start || !end) return 0
    
    // Create config for shared calculation utility
    const config = createWorkingDaysConfig(settings, timezone)
    
    // Use shared calculation utility for consistency with server
    const result = calculateWorkingDays(start, end, config)
    
    return result.totalDays
  }

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {}
    
    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required'
    }
    
    if (!formData.endDate) {
      newErrors.endDate = 'End date is required'
    }
    
    if (formData.startDate && formData.endDate) {
      const startDate = TimezoneService.parseDateStringInTimezone(formData.startDate, timezone)
      const endDate = TimezoneService.parseDateStringInTimezone(formData.endDate, timezone)
      const today = getToday()
      today.setHours(0, 0, 0, 0)
      
      // Check if start date is in the past and validate against backdate policy
      if (startDate < today) {
        const allowedBackdateDays = settings?.leave?.allowBackdateLeaves || 0
        if (allowedBackdateDays === 0) {
          newErrors.startDate = 'Start date cannot be in the past'
        } else {
          const daysDifference = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
          if (daysDifference > allowedBackdateDays) {
            newErrors.startDate = `Start date cannot be more than ${allowedBackdateDays} days in the past`
          }
        }
      }
      
      if (endDate < startDate) {
        newErrors.endDate = 'End date must be on or after start date'
      }
      
      if (formData.totalDays === 0) {
        newErrors.dateRange = 'No working days in the selected date range'
      }
    }
    
    if (!formData.reason.trim()) {
      newErrors.reason = 'Reason is required'
    } else if (formData.reason.trim().length < 10) {
      newErrors.reason = 'Reason must be at least 10 characters'
    }
    
    // Check leave balance
    const availableBalance = leaveBalance[formData.leaveType as keyof LeaveBalance] || 0
    if (formData.totalDays > availableBalance) {
      newErrors.leaveBalance = `Insufficient ${formData.leaveType} leave balance. Available: ${availableBalance} days, Requested: ${formData.totalDays} days`
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
    // Clear any lingering field error if the new date is valid
    setErrors(prev => {
      const next = { ...prev }
      delete (next as any)[field]
      return next
    })

    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Calculate working days when both dates are selected
    if (field === 'startDate' && formData.endDate) {
      setCalculating(true)
      const days = calculateWorkingDaysLocal(value, formData.endDate)
      setFormData(prev => ({ ...prev, startDate: value, totalDays: days }))
      // Clear date range related errors if calculation yields > 0
      if (days > 0) {
        setErrors(prev => {
          const next = { ...prev }
          delete (next as any).dateRange
          delete (next as any).startDate
          delete (next as any).endDate
          return next
        })
      }
      setCalculating(false)
    } else if (field === 'endDate' && formData.startDate) {
      setCalculating(true)
      const days = calculateWorkingDaysLocal(formData.startDate, value)
      setFormData(prev => ({ ...prev, endDate: value, totalDays: days }))
      if (days > 0) {
        setErrors(prev => {
          const next = { ...prev }
          delete (next as any).dateRange
          delete (next as any).startDate
          delete (next as any).endDate
          return next
        })
      }
      setCalculating(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    setLoading(true)
    
    try {
      const response = await fetch('/api/leaves', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          ...formData,
          clientCalculatedDays: formData.totalDays // Send client calculation for validation
        }),
      })

      const data = await response.json()
      
      if (data.success) {
        onSubmit(data.data)
        // Reset form
        setFormData({
          leaveType: 'annual',
          startDate: '',
          endDate: '',
          reason: '',
          totalDays: 0
        })
        setErrors({})
      } else {
        setErrors({ submit: data.message || 'Failed to submit leave request' })
      }
          } catch {
        setErrors({ submit: 'Failed to submit leave request' })
      } finally {
      setLoading(false)
    }
  }

  const getLeaveTypeColor = (type: string) => {
    switch (type) {
      case 'sick':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'casual':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'annual':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'maternity':
        return 'bg-pink-100 text-pink-800 border-pink-200'
      case 'paternity':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Request Leave</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Leave Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Leave Type *
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(leaveBalance).map(([type, balance]) => (
              <button
                key={type}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, leaveType: type }))}
                className={`p-3 rounded-lg border-2 text-left transition-colors ${
                  formData.leaveType === type
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium capitalize text-gray-900">
                    {type}
                  </span>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getLeaveTypeColor(type)}`}>
                    {balance} days
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  Remaining days
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <DatePicker
              label="Start Date *"
              value={formData.startDate}
              onChange={(v) => handleDateChange('startDate', v)}
              isDisabledDate={(d) => isDateDisabled(d, false)}
              className="w-full"
              isOpen={openPicker === 'start'}
              onOpenChange={(o) => setOpenPicker(o ? 'start' : null)}
              showBackdateInfo={true}
              backdateDays={settings?.leave?.allowBackdateLeaves}
              timezone={timezone}
            />
            {errors.startDate && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                {errors.startDate}
              </p>
            )}
          </div>

          <div>
            <DatePicker
              label="End Date *"
              value={formData.endDate}
              onChange={(v) => handleDateChange('endDate', v)}
              isDisabledDate={(d) => isDateDisabled(d, true)}
              className="w-full"
              isOpen={openPicker === 'end'}
              onOpenChange={(o) => setOpenPicker(o ? 'end' : null)}
              showBackdateInfo={true}
              backdateDays={settings?.leave?.allowBackdateLeaves}
              timezone={timezone}
            />
            {errors.endDate && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                {errors.endDate}
              </p>
            )}
          </div>
        </div>

        {/* Date Range Info */}
        {settings?.leave?.allowBackdateLeaves !== undefined && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  {settings.leave.allowBackdateLeaves === 0 ? (
                    'Leave requests can only be submitted for future dates.'
                  ) : (
                    `Leave requests can be submitted for dates up to ${settings.leave.allowBackdateLeaves} day${settings.leave.allowBackdateLeaves === 1 ? '' : 's'} in the past.`
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Working Days Calculation */}
        {formData.startDate && formData.endDate && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CalendarIcon className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Working Days</span>
              </div>
              {calculating ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              ) : (
                <span className="text-lg font-semibold text-blue-900">
                  {formData.totalDays} days
                </span>
              )}
            </div>
            <p className="text-xs text-blue-700 mt-1">
              Excludes weekends (Saturday and Sunday)
            </p>
          </div>
        )}

        {/* Date Range Error */}
        {errors.dateRange && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <XCircleIcon className="h-5 w-5 text-red-600 mr-2" />
              <p className="text-sm text-red-800">{errors.dateRange}</p>
            </div>
          </div>
        )}

        {/* Leave Balance Error */}
        {errors.leaveBalance && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-2" />
              <p className="text-sm text-red-800">{errors.leaveBalance}</p>
            </div>
          </div>
        )}

        {/* Reason */}
        <FormTextarea
          label="Reason for Leave"
          value={formData.reason}
          onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
          placeholder="Please provide a detailed reason for your leave request..."
          rows={4}
          error={errors.reason}
          required
          info="Minimum 10 characters required"
        />

        {/* Submit Error */}
        {errors.submit && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <XCircleIcon className="h-5 w-5 text-red-600 mr-2" />
              <p className="text-sm text-red-800">{errors.submit}</p>
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || formData.totalDays === 0}
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                Submitting...
              </>
            ) : (
              'Submit Request'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default LeaveRequestForm
