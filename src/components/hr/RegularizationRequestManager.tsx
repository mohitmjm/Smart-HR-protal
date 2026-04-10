'use client'

import { useState, useEffect, useCallback, createContext, useContext, ReactNode, useRef } from 'react'
import { useDevSafeUser as useUser } from '@/lib/hooks/useDevSafeClerk';

export interface RegularizationRequest {
  _id: string
  userId: string
  attendanceDate: string
  requestDate: string
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  reviewedBy?: string
  reviewedAt?: string
  reviewNotes?: string
  user?: {
    firstName: string
    lastName: string
    email: string
  }
}

export type RegularizationViewMode = 'my' | 'team' | 'admin'

interface RegularizationRequestManagerContextType {
  // State
  requests: RegularizationRequest[]
  loading: boolean
  error: string | null
  
  // Actions
  fetchRequests: (mode: RegularizationViewMode, status?: string) => Promise<void>
  submitRequest: (attendanceDate: string, reason: string) => Promise<{ success: boolean; error?: string }>
  reviewRequest: (requestId: string, status: 'approved' | 'rejected', reviewNotes?: string, mode?: RegularizationViewMode) => Promise<{ success: boolean; error?: string; data?: any }>
  
  // Utilities
  getRequestForDate: (userId: string, date: string) => RegularizationRequest | undefined
  hasRequestForDate: (userId: string, date: string) => boolean
  refreshRequests: () => Promise<void>
}

const RegularizationRequestManagerContext = createContext<RegularizationRequestManagerContextType | null>(null)

interface RegularizationRequestManagerProviderProps {
  children: ReactNode
}

export function RegularizationRequestManagerProvider({ children }: RegularizationRequestManagerProviderProps) {
  const { user, isLoaded } = useUser()
  const [requests, setRequests] = useState<RegularizationRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const lastFetchParamsRef = useRef<{ mode: RegularizationViewMode; status: string } | null>(null)

  const getApiEndpoint = (mode: RegularizationViewMode) => {
    switch (mode) {
      case 'my':
        return '/api/regularization/my'
      case 'team':
        return '/api/regularization/manager'
      case 'admin':
        return '/api/regularization/admin'
      default:
        return '/api/regularization/my'
    }
  }

  const fetchRequests = useCallback(async (mode: RegularizationViewMode, status: string = 'pending') => {
    if (!user || !isLoaded) return

    try {
      setLoading(true)
      setError(null)

      // Remember last fetch params so we can refresh consistently later
      lastFetchParamsRef.current = { mode, status }

      const endpoint = getApiEndpoint(mode)
      const response = await fetch(`${endpoint}?status=${status}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch regularization requests')
      }

      const data = await response.json()
      if (data.success) {
        setRequests(data.data.requests || [])
      } else {
        throw new Error(data.error || 'Failed to fetch regularization requests')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch regularization requests'
      setError(errorMessage)
      console.error('Error fetching regularization requests:', err)
    } finally {
      setLoading(false)
    }
  }, [user])


  const getRequestForDate = useCallback((userId: string, date: string) => {
    return requests.find(req => req.userId === userId && req.attendanceDate === date)
  }, [requests])

  const hasRequestForDate = useCallback((userId: string, date: string) => {
    return requests.some(req => req.userId === userId && req.attendanceDate === date)
  }, [requests])

  const refreshRequests = useCallback(async () => {
    const params = lastFetchParamsRef.current
    if (params) {
      await fetchRequests(params.mode, params.status)
    }
  }, [fetchRequests])

  const submitRequest = useCallback(async (attendanceDate: string, reason: string) => {
    if (!user) {
      return { success: false, error: 'User not authenticated' }
    }

    try {
      const response = await fetch('/api/regularization', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          attendanceDate,
          reason
        })
      })

      const data = await response.json()
      
      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to submit regularization request' }
      }

      // Refresh requests after successful submission
      await refreshRequests()
      
      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit regularization request'
      return { success: false, error: errorMessage }
    }
  }, [user, refreshRequests])

  const reviewRequest = useCallback(async (requestId: string, status: 'approved' | 'rejected', reviewNotes?: string, mode: RegularizationViewMode = 'my') => {
    try {
      // Use different endpoints based on the mode
      let endpoint = `/api/regularization/${requestId}`;
      if (mode === 'team') {
        endpoint = '/api/regularization/manager';
      }

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId: mode === 'team' ? requestId : undefined,
          status,
          reviewNotes: reviewNotes?.trim() || undefined
        })
      })

      const data = await response.json()
      
      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to review request' }
      }

      // Refresh requests after successful review
      await refreshRequests()
      
      return { success: true, data: data.data }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to review request'
      return { success: false, error: errorMessage }
    }
  }, [refreshRequests])

  const value: RegularizationRequestManagerContextType = {
    requests,
    loading,
    error,
    fetchRequests,
    submitRequest,
    reviewRequest,
    getRequestForDate,
    hasRequestForDate,
    refreshRequests
  }

  return (
    <RegularizationRequestManagerContext.Provider value={value}>
      {children}
    </RegularizationRequestManagerContext.Provider>
  )
}

export function useRegularizationRequests() {
  const context = useContext(RegularizationRequestManagerContext)
  if (!context) {
    throw new Error('useRegularizationRequests must be used within a RegularizationRequestManagerProvider')
  }
  return context
}

// Hook for specific view modes
export function useRegularizationRequestsForView(mode: RegularizationViewMode, status: string = 'pending') {
  const { fetchRequests, ...rest } = useRegularizationRequests()

  useEffect(() => {
    fetchRequests(mode, status)
  }, [fetchRequests, mode, status])

  return rest
}
