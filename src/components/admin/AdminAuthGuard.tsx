'use client';

import { useEffect, useState } from 'react';
import { useDevSafeAuth as useAuth } from '@/lib/hooks/useDevSafeClerk';;
import { useRouter } from 'next/navigation';

interface AdminUser {
  clerkUserId: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  position: string;
  isHRManager: boolean;
  permissions: string[];
}

interface AdminAuthGuardProps {
  children: React.ReactNode;
}

export default function AdminAuthGuard({ children }: AdminAuthGuardProps) {
  const { userId, isLoaded } = useAuth();
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded) return;

    if (!userId) {
      // Determine the correct auth URL based on the current host
      const isPortalSubdomain = typeof window !== 'undefined' && 
        (window.location.hostname === 'portal.tielo.io' || window.location.hostname.includes('portal.tielo'))
      const authUrl = isPortalSubdomain ? '/auth' : '/portal/auth'
      router.push(authUrl);
      return;
    }

    // Check if user has admin access
    checkAdminAccess();
  }, [userId, isLoaded, router]);

  const checkAdminAccess = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin');
      
      if (!response.ok) {
        if (response.status === 403) {
          setError('Access denied. HR Manager privileges required.');
        } else {
          setError('Failed to verify admin access.');
        }
        return;
      }

      const data = await response.json();
      if (data.success) {
        setAdminUser(data.data.adminUser);
      } else {
        setError('Failed to verify admin access.');
      }
    } catch (error) {
      console.error('Admin access check error:', error);
      setError('Failed to verify admin access.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isLoaded || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Access Denied
            </h1>
            <p className="text-gray-600 mb-6">
              {error}
            </p>
            <button
              onClick={() => {
                // Determine the correct dashboard URL based on the current host
                const isPortalSubdomain = typeof window !== 'undefined' && 
                  (window.location.hostname === 'portal.tielo.io' || window.location.hostname.includes('portal.tielo'))
                const dashboardUrl = isPortalSubdomain ? '/dashboard' : '/portal/dashboard'
                router.push(dashboardUrl)
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!adminUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
