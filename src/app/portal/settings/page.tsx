import React from 'react';
import SettingsConfiguration from '@/components/hr/SettingsConfiguration';
import HRPortalLayout from '../../../components/hr/HRPortalLayout';

export default function SettingsPage() {
  return (
    <HRPortalLayout currentPage="settings">
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <SettingsConfiguration />
        </div>
      </div>
    </HRPortalLayout>
  );
}
