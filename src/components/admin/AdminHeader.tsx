'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Bars3Icon } from '@heroicons/react/24/outline';

interface AdminHeaderProps {
  onToggleSidebar?: () => void;
  isSidebarCollapsed?: boolean;
}

export default function AdminHeader({ onToggleSidebar, isSidebarCollapsed }: AdminHeaderProps) {
  const [companyName, setCompanyName] = useState<string>('HR Admin Dashboard');
  const [companyLogo, setCompanyLogo] = useState<string>('/api/image/logo.png');

  // Fetch company name and logo from settings
  useEffect(() => {
    const fetchCompanySettings = async () => {
      try {
        const response = await fetch('/api/admin/settings');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data?.general) {
            if (data.data.general.companyName) {
              setCompanyName(data.data.general.companyName);
            }
            if (data.data.general.companyLogo) {
              setCompanyLogo(data.data.general.companyLogo);
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch company settings:', error);
        // Keep the default fallbacks
      }
    };

    fetchCompanySettings();
  }, []);


  return (
    <header className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16 sm:h-16 md:h-16 lg:h-16 xl:h-16">
          {/* Sidebar Toggle Button - Responsive positioning */}
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="lg:hidden mr-3 p-2 text-gray-600 hover:text-gray-900 transition-colors"
              aria-label="Toggle sidebar"
            >
              <Bars3Icon className="w-5 h-5" />
            </button>
          )}
          
          {/* Logo and Title - Left aligned with responsive spacing */}
          <Link href="/admin" className="flex items-center">
            <div className="flex items-center mr-3">
              {companyLogo.startsWith('/api/image/') ? (
                <Image
                  src={companyLogo}
                  alt="Company Logo"
                  width={40}
                  height={40}
                  className="h-10 w-auto object-contain"
                  style={{ 
                    height: '40px',
                    width: 'auto',
                    objectFit: 'contain'
                  }}
                  priority
                />
              ) : (
                <Image
                  src={companyLogo}
                  alt="Company Logo"
                  width={40}
                  height={40}
                  className="h-10 w-auto object-contain"
                  style={{ 
                    height: '40px',
                    width: 'auto',
                    objectFit: 'contain'
                  }}
                  priority
                />
              )}
            </div>
            <h1 className="text-xl font-semibold text-gray-900">{companyName}</h1>
          </Link>
        </div>
      </div>
    </header>
  );
}
