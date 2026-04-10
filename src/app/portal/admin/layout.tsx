"use client";

import { useState, useEffect } from 'react';
import { Suspense } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import AdminAuthGuard from '@/components/admin/AdminAuthGuard';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);

  // Load sidebar state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem('admin-sidebar-collapsed');
    if (savedState !== null) {
      setIsSidebarCollapsed(JSON.parse(savedState));
    } else {
      // Default to closed (collapsed) if no saved state
      setIsSidebarCollapsed(true);
    }
  }, []);

  // Save sidebar state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('admin-sidebar-collapsed', JSON.stringify(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const handleSidebarHover = (isHovered: boolean) => {
    setIsSidebarHovered(isHovered);
  };

  return (
    <AdminAuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        {/* Navbar - Full width on top */}
        <AdminHeader 
          onToggleSidebar={toggleSidebar}
          isSidebarCollapsed={isSidebarCollapsed}
        />
        
        <div className="flex h-[calc(100vh-4rem)]">
          {/* Left Sidebar */}
          <AdminSidebar 
            isCollapsed={isSidebarCollapsed} 
            onToggle={toggleSidebar}
            onHoverChange={handleSidebarHover}
          />
          
          {/* Main Content Area */}
          <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
            isSidebarCollapsed && !isSidebarHovered ? 'lg:ml-16' : 'lg:ml-64'
          }`}>
            <main className="flex-1 overflow-y-auto p-6">
              <div className="max-w-7xl mx-auto">
                <Suspense fallback={<div>Loading...</div>}>
                  {children}
                </Suspense>
              </div>
            </main>
          </div>
        </div>
      </div>
    </AdminAuthGuard>
  );
}
