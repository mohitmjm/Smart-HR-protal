/**
 * Consistent icon sizing system for the HR portal
 * Responsive icon sizes based on screen size and context
 */

export const iconSizes = {
  // Base icon sizes
  xs: 'w-3 h-3',      // 12px - for small indicators
  sm: 'w-4 h-4',      // 16px - for buttons and small elements
  md: 'w-5 h-5',      // 20px - standard size
  lg: 'w-6 h-6',      // 24px - for headers and important elements
  xl: 'w-8 h-8',      // 32px - for large buttons and cards
  '2xl': 'w-10 h-10', // 40px - for hero elements
  '3xl': 'w-12 h-12', // 48px - for large displays
} as const

export const responsiveIconSizes = {
  // Mobile-first responsive icon sizes
  button: 'w-4 h-4 sm:w-5 sm:h-5',
  header: 'w-5 h-5 sm:w-6 sm:h-6',
  card: 'w-5 h-5 sm:w-6 sm:h-6',
  list: 'w-4 h-4 sm:w-5 sm:h-5',
  navigation: 'w-5 h-5 sm:w-6 sm:h-6',
  status: 'w-4 h-4 sm:w-5 sm:h-5',
  action: 'w-4 h-4 sm:w-5 sm:h-5',
  hero: 'w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12',
} as const

export const iconContextSizes = {
  // Context-specific icon sizes
  button: {
    sm: 'w-3 h-3 sm:w-4 sm:h-4',
    md: 'w-4 h-4 sm:w-5 sm:h-5',
    lg: 'w-5 h-5 sm:w-6 sm:h-6',
  },
  card: {
    header: 'w-5 h-5 sm:w-6 sm:h-6',
    content: 'w-4 h-4 sm:w-5 sm:h-5',
    action: 'w-4 h-4 sm:w-5 sm:h-5',
  },
  table: {
    header: 'w-4 h-4 sm:w-5 sm:h-5',
    cell: 'w-3 h-3 sm:w-4 sm:h-4',
    action: 'w-4 h-4 sm:w-5 sm:h-5',
  },
  form: {
    label: 'w-4 h-4 sm:w-5 sm:h-5',
    input: 'w-4 h-4 sm:w-5 sm:h-5',
    button: 'w-4 h-4 sm:w-5 sm:h-5',
  },
  navigation: {
    primary: 'w-5 h-5 sm:w-6 sm:h-6',
    secondary: 'w-4 h-4 sm:w-5 sm:h-5',
    mobile: 'w-6 h-6',
  },
  status: {
    success: 'w-4 h-4 sm:w-5 sm:h-5',
    error: 'w-4 h-4 sm:w-5 sm:h-5',
    warning: 'w-4 h-4 sm:w-5 sm:h-5',
    info: 'w-4 h-4 sm:w-5 sm:h-5',
  },
} as const

/**
 * Get responsive icon size class based on context
 */
export const getIconSize = (context: keyof typeof iconContextSizes, size: 'sm' | 'md' | 'lg' = 'md') => {
  const contextSizes = iconContextSizes[context]
  if (contextSizes && typeof contextSizes === 'object' && 'sm' in contextSizes) {
    return contextSizes[size] || iconSizes.md
  }
  return iconSizes.md
}

/**
 * Get responsive icon size for specific use cases
 */
export const getResponsiveIconSize = (useCase: keyof typeof responsiveIconSizes) => {
  return responsiveIconSizes[useCase]
}

/**
 * Icon size utilities for common patterns
 */
export const iconSizeUtils = {
  // Button icons
  buttonIcon: (size: 'sm' | 'md' | 'lg' = 'md') => iconContextSizes.button[size],
  
  // Card icons
  cardIcon: (type: 'header' | 'content' | 'action' = 'content') => iconContextSizes.card[type],
  
  // Table icons
  tableIcon: (type: 'header' | 'cell' | 'action' = 'cell') => iconContextSizes.table[type],
  
  // Form icons
  formIcon: (type: 'label' | 'input' | 'button' = 'input') => iconContextSizes.form[type],
  
  // Navigation icons
  navIcon: (type: 'primary' | 'secondary' | 'mobile' = 'primary') => iconContextSizes.navigation[type],
  
  // Status icons
  statusIcon: (type: 'success' | 'error' | 'warning' | 'info' = 'info') => iconContextSizes.status[type],
} as const

/**
 * Icon wrapper component props
 */
export interface IconWrapperProps {
  size?: keyof typeof iconSizes
  responsive?: boolean
  context?: keyof typeof iconContextSizes
  className?: string
  children: React.ReactNode
}
