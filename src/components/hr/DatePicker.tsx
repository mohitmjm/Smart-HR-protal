'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { TimezoneService } from '@/lib/timezoneService'

interface DatePickerProps {
  value: string
  onChange: (value: string) => void
  min?: string
  label?: string
  isDisabledDate?: (date: Date) => boolean
  className?: string
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
  showBackdateInfo?: boolean
  backdateDays?: number
  timezone?: string
}

const formatYMD = (d: Date) => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export default function DatePicker({ value, onChange, min, label, isDisabledDate, className, isOpen, onOpenChange, showBackdateInfo, backdateDays, timezone = 'UTC' }: DatePickerProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const open = isOpen !== undefined ? isOpen : uncontrolledOpen
  const setOpen = (next: boolean) => {
    if (onOpenChange) onOpenChange(next)
    else setUncontrolledOpen(next)
  }
  const [monthDate, setMonthDate] = useState(() => {
    const base = value ? new Date(value) : new Date()
    return new Date(base.getFullYear(), base.getMonth(), 1)
  })

  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (value) {
      const d = new Date(value)
      setMonthDate(new Date(d.getFullYear(), d.getMonth(), 1))
    }
  }, [value])

  // Close on outside click and Escape
  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node
      if (containerRef.current && !containerRef.current.contains(target)) {
        setOpen(false)
      }
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open, setOpen])

  const minDate = useMemo(() => (min ? new Date(min) : undefined), [min])

  const daysInMonth = useMemo(() => {
    const year = monthDate.getFullYear()
    const month = monthDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const total = lastDay.getDate()
    const startOffset = (firstDay.getDay() + 6) % 7 // Monday as first
    return { total, startOffset }
  }, [monthDate])

  const handleSelect = (day: number) => {
    const date = new Date(monthDate.getFullYear(), monthDate.getMonth(), day)
    const ymd = formatYMD(date)
    onChange(ymd)
    setOpen(false)
  }

  const isDisabled = (date: Date) => {
    if (minDate) {
      // minDate is already a Date object, compare directly
      if (date < minDate) return true
    }
    if (isDisabledDate && isDisabledDate(date)) return true
    return false
  }

  const isInBackdateRange = (date: Date) => {
    if (!showBackdateInfo || !backdateDays || backdateDays === 0) return false
    const today = TimezoneService.getTodayInTimezone(timezone)
    const daysDiff = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    return daysDiff >= 0 && daysDiff <= backdateDays
  }

  const navigate = (dir: 'prev' | 'next') => {
    setMonthDate(prev => new Date(prev.getFullYear(), prev.getMonth() + (dir === 'prev' ? -1 : 1), 1))
  }

  const selectedLabel = value || ''

  return (
    <div className={className} ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      )}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full px-3 py-2 border rounded-lg text-left focus:ring-2 focus:ring-blue-500 focus:border-blue-500 border-gray-300 bg-white`}
      >
        {selectedLabel || 'Select date'}
      </button>
      {open && (
        <div className="relative mt-2">
          <div className="absolute z-20 bg-white border border-gray-200  shadow-lg p-3 w-72">
            <div className="flex items-center justify-between mb-2">
              <button onClick={() => navigate('prev')} className="p-1 rounded hover:bg-gray-100">
                <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
              </button>
              <div className="text-sm font-medium text-gray-900">
                {monthDate.toLocaleString('default', { month: 'long' })} {monthDate.getFullYear()}
              </div>
              <button onClick={() => navigate('next')} className="p-1 rounded hover:bg-gray-100">
                <ChevronRightIcon className="h-5 w-5 text-gray-600" />
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500 mb-1">
              {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
                <div key={d} className="py-1">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: daysInMonth.startOffset }).map((_, idx) => (
                <div key={`empty-${idx}`} className="py-2" />
              ))}
              {Array.from({ length: daysInMonth.total }).map((_, idx) => {
                const day = idx + 1
                const date = new Date(monthDate.getFullYear(), monthDate.getMonth(), day)
                const disabled = isDisabled(date)
                const selected = value && value === formatYMD(date)
                const isToday = formatYMD(date) === formatYMD(new Date())
                const inBackdateRange = isInBackdateRange(date)
                return (
                  <button
                    key={day}
                    type="button"
                    disabled={disabled}
                    onClick={() => !disabled && handleSelect(day)}
                    aria-current={isToday ? 'date' : undefined}
                    className={`py-2 text-sm border transition-colors ${
                      selected
                        ? 'bg-blue-600 text-white border-blue-600'
                        : disabled
                        ? 'text-gray-400 bg-gray-100 cursor-not-allowed border-gray-200'
                        : isToday
                        ? 'border-blue-400 text-blue-700 bg-blue-50'
                        : inBackdateRange
                        ? 'hover:bg-orange-100 border-orange-200 text-orange-700'
                        : 'hover:bg-gray-100 border-gray-200'
                    }`}
                    title={inBackdateRange ? `Backdated leave allowed (${backdateDays} days)` : undefined}
                  >
                    {day}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


