'use client';

import { useState } from 'react';
import AdminTabs, { TabItem } from '@/components/admin/AdminTabs';
import { BriefcaseIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';

interface JobsTabsWrapperProps {
  jobsContent: React.ReactNode;
  applicationsContent: React.ReactNode;
  applicationsCount?: number;
  newJobButton?: React.ReactNode;
}

export default function JobsTabsWrapper({ 
  jobsContent, 
  applicationsContent,
  applicationsCount,
  newJobButton
}: JobsTabsWrapperProps) {
  const [activeTab, setActiveTab] = useState('jobs');

  const tabs: TabItem[] = [
    {
      id: 'jobs',
      name: 'Jobs',
      icon: BriefcaseIcon,
    },
    {
      id: 'applications',
      name: 'Applications',
      icon: ClipboardDocumentListIcon,
      badge: applicationsCount && applicationsCount > 0 ? applicationsCount : undefined,
    },
  ];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Recruitment</h1>
        {newJobButton}
      </div>

      <AdminTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        className="mt-6"
      >
        {activeTab === 'jobs' ? (
          <div key="jobs-content">{jobsContent}</div>
        ) : (
          <div key="applications-content">{applicationsContent}</div>
        )}
      </AdminTabs>
    </div>
  );
}

