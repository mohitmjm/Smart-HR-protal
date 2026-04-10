# AdminTabs Component Usage

The `AdminTabs` component provides a consistent tab interface across all admin pages.

## Basic Usage

```tsx
import AdminTabs, { TabItem } from '@/components/admin/AdminTabs';
import { CogIcon, UserIcon, ChartBarIcon } from '@heroicons/react/24/outline';

const tabs: TabItem[] = [
  { id: 'general', name: 'General', icon: CogIcon },
  { id: 'users', name: 'Users', icon: UserIcon },
  { id: 'analytics', name: 'Analytics', icon: ChartBarIcon },
];

export default function MyPage() {
  const [activeTab, setActiveTab] = useState('general');

  return (
    <div className="space-y-8">
      <AdminTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      >
        {activeTab === 'general' && (
          <div>
            {/* General tab content */}
          </div>
        )}
        
        {activeTab === 'users' && (
          <div>
            {/* Users tab content */}
          </div>
        )}
        
        {activeTab === 'analytics' && (
          <div>
            {/* Analytics tab content */}
          </div>
        )}
      </AdminTabs>
    </div>
  );
}
```

## Features

- **Consistent Styling**: All tabs use the same design system
- **Icons**: Each tab can have an icon from Heroicons
- **Badges**: Optional badge support for notifications or counts
- **Disabled State**: Tabs can be disabled
- **Active Indicator**: Visual indicator for the active tab
- **Hover Effects**: Smooth transitions and hover states

## TabItem Interface

```tsx
interface TabItem {
  id: string;                    // Unique identifier
  name: string;                  // Display name
  icon: ComponentType<{ className?: string }>; // Heroicon component
  badge?: number | string;       // Optional badge
  disabled?: boolean;            // Optional disabled state
}
```

## Props

- `tabs`: Array of TabItem objects
- `activeTab`: Currently active tab ID
- `onTabChange`: Callback when tab changes
- `children`: Tab content
- `className`: Optional additional CSS classes
