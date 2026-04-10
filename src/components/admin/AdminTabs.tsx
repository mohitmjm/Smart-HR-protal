'use client';

import { ReactNode } from 'react';
import { ComponentType } from 'react';

export interface TabItem {
  id: string;
  name: string;
  icon: ComponentType<{ className?: string }>;
  badge?: number | string;
  disabled?: boolean;
}

interface AdminTabsProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  children: ReactNode;
  className?: string;
}

export default function AdminTabs({ 
  tabs, 
  activeTab, 
  onTabChange, 
  children, 
  className = '' 
}: AdminTabsProps) {
  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-100 ${className}`}>
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const isDisabled = tab.disabled;
            
            return (
              <button
                key={tab.id}
                onClick={() => !isDisabled && onTabChange(tab.id)}
                disabled={isDisabled}
                className={`group relative py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
                  isActive
                    ? 'border-blue-500 text-blue-600'
                    : isDisabled
                    ? 'border-transparent text-gray-400 cursor-not-allowed'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Icon className={`w-5 h-5 transition-colors ${
                    isActive 
                      ? 'text-blue-600' 
                      : isDisabled 
                      ? 'text-gray-400' 
                      : 'text-gray-400 group-hover:text-gray-600'
                  }`} />
                  <span>{tab.name}</span>
                  {tab.badge && (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      isActive
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                </div>
                
                {/* Active indicator */}
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-t-full" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
}
