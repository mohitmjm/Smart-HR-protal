# Admin Portal Navigation Guidelines

## Problem Statement
The sidebar navigation in the admin portal was not working on the users page until the user switched to the browser's Network tab. This was caused by focus management issues between the AdminSubNav component and the main sidebar navigation.

## Root Cause
The AdminSubNav component was creating a **focus trap** that prevented the main sidebar from receiving focus properly. When the user switched to the Network tab, it triggered a focus change that released the focus trap, which is why the sidebar worked after that.

## Solution Implemented

### 1. AdminSubNav Component Fix
**File**: `src/components/admin/AdminSubNav.tsx`

**Change**: Added `tabIndex={-1}` to buttons rendered for `href: '#'` items.

```tsx
<button
  key={item.id}
  onClick={(e) => {
    e.preventDefault();
    handleClick();
  }}
  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap cursor-pointer ${
    isItemActive
      ? 'border-blue-500 text-blue-600'
      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
  }`}
  tabIndex={-1}  // This prevents focus trap issues
>
```

**Why**: This prevents the AdminSubNav buttons from being part of the tab order and creating a focus trap that interferes with the main sidebar navigation.

### 2. Modal Components Focus Management
**Files**: 
- `src/components/admin/UserEditModal.tsx`
- `src/components/admin/ClerkUsersModal.tsx`
- `src/components/admin/ConfirmationModal.tsx`

**Change**: Added focus management to ensure modals return focus to the document when closed.

```tsx
// Handle focus management when modal closes
useEffect(() => {
  if (!isOpen) {
    // Return focus to document when modal closes
    document.body.focus();
  }
}, [isOpen]);
```

**Why**: This ensures that when modals are closed, focus is properly returned to the document, allowing the sidebar navigation to work correctly.

## Guidelines for Future Development

### 1. AdminSubNav Component Usage
- **Always use `tabIndex={-1}`** for buttons rendered for `href: '#'` items
- **Never use `e.stopPropagation()`** in AdminSubNav event handlers unless absolutely necessary
- **Avoid creating focus traps** in sub-navigation components

### 2. Modal Components
- **Always implement focus management** in modal components
- **Return focus to document** when modals close
- **Use proper focus trap libraries** like `focus-trap-react` for complex modals

### 3. Event Handling Best Practices
- **Avoid `e.preventDefault()`** unless necessary for functionality
- **Use `e.stopPropagation()`** judiciously to prevent unintended interference
- **Test navigation after adding new interactive components**

### 4. Focus Management
- **Ensure proper focus order** in all interactive components
- **Test keyboard navigation** after adding new components
- **Avoid creating focus traps** that prevent main navigation from working

### 5. Testing Checklist
When adding new components to admin pages:
- [ ] Test sidebar navigation works after component interaction
- [ ] Test keyboard navigation (Tab key) works properly
- [ ] Test modal focus management
- [ ] Test sub-navigation doesn't interfere with main navigation
- [ ] Test in different browser tabs to ensure focus management works

## Component Architecture

### AdminSubNav Component
- **Purpose**: Provides sub-navigation within admin pages
- **Usage**: Use for tab-like navigation within pages
- **Focus Management**: Always use `tabIndex={-1}` for `href: '#'` items
- **Event Handling**: Minimal event handling to prevent interference

### Modal Components
- **Purpose**: Display overlays for user interactions
- **Focus Management**: Must return focus to document when closed
- **Accessibility**: Should trap focus within modal when open
- **Event Handling**: Should not interfere with main navigation

### Main Sidebar Navigation
- **Purpose**: Primary navigation for admin portal
- **Focus Management**: Should always be accessible
- **Event Handling**: Should not be blocked by other components
- **Testing**: Must work consistently across all pages

## Common Pitfalls to Avoid

1. **Don't create focus traps** in sub-navigation components
2. **Don't use `e.stopPropagation()`** unless absolutely necessary
3. **Don't forget focus management** in modal components
4. **Don't test only in one browser tab** - test focus management across tabs
5. **Don't ignore keyboard navigation** - ensure all components are keyboard accessible

## Debugging Tips

If sidebar navigation stops working:
1. Check if new components are creating focus traps
2. Verify modal components have proper focus management
3. Test by switching browser tabs (this releases focus traps)
4. Check browser console for focus-related errors
5. Verify `tabIndex` values on interactive elements

## Form Input Guidelines

### Dropdown/Select Elements
**Problem**: Dropdown chevrons were not properly padded, causing visual issues with the dropdown arrow.

**Solution**: Use the standardized select utility class from `src/lib/utils.ts`.

```tsx
import { formInputs } from '@/lib/utils'

// Use the pre-configured select class
<select className={formInputs.select}>
  <option value="all">All Categories</option>
  <option value="contracts">Contracts</option>
</select>
```

**Key Features**:
- `pr-10` ensures proper padding for dropdown chevron
- Responsive padding: `px-3 sm:px-4`
- Consistent styling with other form inputs
- Proper focus states and transitions

### Form Input Standards
All form inputs should use the utility classes from `src/lib/utils.ts`:

```tsx
import { formInputs, buttons } from '@/lib/utils'

// Standard input
<input className={formInputs.input} />

// Select dropdown (with proper chevron padding)
<select className={formInputs.select} />

// Textarea
<textarea className={formInputs.textarea} />

// Search input with icon
<input className={formInputs.search} />

// Buttons
<button className={buttons.primary}>Primary</button>
<button className={buttons.success}>Success</button>
<button className={buttons.secondary}>Secondary</button>
<button className={buttons.danger}>Danger</button>
```

### Dropdown Padding Requirements
- **Always use `pr-10`** for select elements to ensure chevron visibility
- **Never use custom padding** that doesn't account for the dropdown arrow
- **Test on different screen sizes** to ensure chevron is always visible
- **Use responsive padding** for consistent spacing across devices

## Toggle Button Guidelines

### Toggle Button Issues
**Problem**: Toggle buttons with longer text (like "Team Leave") were wrapping to multiple lines, causing buttons to double in height and look unprofessional.

**Solution**: Use the standardized toggle utility classes from `src/lib/utils.ts`.

```tsx
import { toggles } from '@/lib/utils'

// Two-option toggle (My Leave / Team Leave)
<div className={toggles.twoOption.container}>
  <button
    onClick={() => setActiveView('my')}
    className={`${toggles.twoOption.button} ${
      activeView === 'my' ? toggles.twoOption.active : toggles.twoOption.inactive
    }`}
  >
    My Leave
  </button>
  <button
    onClick={() => setActiveView('team')}
    className={`${toggles.twoOption.button} ${
      activeView === 'team' ? toggles.twoOption.active : toggles.twoOption.inactive
    }`}
  >
    Team Leave
  </button>
</div>

// Three-option toggle
<div className={toggles.threeOption.container}>
  <button className={`${toggles.threeOption.button} ${toggles.threeOption.active}`}>
    Option 1
  </button>
  <button className={`${toggles.threeOption.button} ${toggles.threeOption.inactive}`}>
    Option 2
  </button>
  <button className={`${toggles.threeOption.button} ${toggles.threeOption.inactive}`}>
    Option 3
  </button>
</div>
```

**Key Features**:
- `whitespace-nowrap` prevents text wrapping
- `sm:min-w-[280px]` ensures adequate width for two options
- `sm:min-w-[360px]` ensures adequate width for three options
- Responsive padding: `px-4 py-2.5 sm:px-6 sm:py-3`
- Consistent styling with other form elements

### Toggle Button Requirements
- **Always use `whitespace-nowrap`** to prevent text wrapping
- **Set minimum width** based on number of options (280px for 2, 360px for 3)
- **Use responsive padding** for consistent spacing
- **Test with longer text** to ensure no wrapping occurs
- **Use standardized utility classes** instead of custom styling

## Mobile Padding Guidelines

### Global Mobile Padding Standards
**Problem**: Multiple layers of padding were creating excessive spacing on mobile devices, reducing usable screen space.

**Solution**: Implemented a centralized padding system in `HRPortalLayout` to eliminate redundant padding layers.

### 1. HRPortalLayout Padding Structure
**File**: `src/components/hr/HRPortalLayout.tsx`

**Change**: Updated main content container to use responsive padding:
```tsx
{/* Page Content */}
<main className="min-h-screen p-3 sm:p-6">
  {children}
</main>
```

**Why**: This provides consistent mobile-optimized padding across all portal pages while maintaining proper spacing on larger screens.

### 2. Portal Page Container Updates
**Files**: All portal pages (`src/app/portal/*/page.tsx`)

**Change**: Removed redundant padding from page containers:
```tsx
// Before
<div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-3 sm:p-6">

// After  
<div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
```

**Why**: Eliminates double padding that was creating excessive spacing on mobile devices.

### 3. Mobile Padding Standards
- **Mobile padding**: `p-3` (12px) for optimal mobile spacing
- **Desktop padding**: `p-6` (24px) for comfortable desktop spacing
- **Single source**: All padding handled by `HRPortalLayout` main element
- **No redundant padding**: Page containers should not add additional padding

### 4. Implementation Guidelines

#### For New Portal Pages:
```tsx
export default function NewPortalPage() {
  return (
    <HRPortalLayout currentPage="pageName">
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="max-w-7xl mx-auto">
          {/* Page content */}
        </div>
      </div>
    </HRPortalLayout>
  );
}
```

#### For Component Containers:
- **Use responsive padding**: `p-4 sm:p-6` for component containers
- **Avoid page-level padding**: Let `HRPortalLayout` handle outer padding
- **Maintain consistent spacing**: Use `space-y-4 sm:space-y-8` for vertical spacing

### 5. Mobile Optimization Benefits
- **Increased usable space**: Reduced padding provides more content area on mobile
- **Consistent experience**: All pages follow the same padding pattern
- **Better touch targets**: More space for interactive elements
- **Improved readability**: Content is better positioned on small screens

### 6. Testing Checklist
When implementing new portal pages:
- [ ] No redundant padding on page containers
- [ ] Content uses `HRPortalLayout` padding system
- [ ] Mobile spacing is optimized (`p-3`)
- [ ] Desktop spacing is comfortable (`p-6`)
- [ ] Component containers use responsive padding
- [ ] Test on actual mobile devices for optimal spacing

## Related Files
- `src/components/admin/AdminSubNav.tsx` - Sub-navigation component
- `src/components/admin/AdminSidebar.tsx` - Main sidebar navigation
- `src/components/admin/UserEditModal.tsx` - User edit modal
- `src/components/admin/ClerkUsersModal.tsx` - Clerk users modal
- `src/components/admin/ConfirmationModal.tsx` - Confirmation modal
- `src/app/portal/admin/users/page.tsx` - Users page implementation
- `src/lib/utils.ts` - Form input and button utilities
- `src/components/hr/HRPortalLayout.tsx` - Global portal layout with mobile padding
