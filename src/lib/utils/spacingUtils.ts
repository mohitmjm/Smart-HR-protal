/**
 * Consistent spacing system for the HR portal
 * Based on 4px base unit for consistent spacing
 */

export const spacing = {
  // Base spacing units (4px increments)
  xs: '0.5rem',    // 8px
  sm: '0.75rem',   // 12px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  '2xl': '2.5rem', // 40px
  '3xl': '3rem',   // 48px
  '4xl': '4rem',   // 64px
  '5xl': '6rem',   // 96px
} as const

export const responsiveSpacing = {
  // Mobile-first responsive spacing
  container: 'p-4 sm:p-6 lg:p-8',
  section: 'py-4 sm:py-6 lg:py-8',
  card: 'p-4 sm:p-6',
  button: 'px-4 py-2 sm:px-6 sm:py-3',
  input: 'px-3 py-2 sm:px-4 sm:py-3',
  form: 'space-y-4 sm:space-y-6',
  grid: 'gap-4 sm:gap-6 lg:gap-8',
  list: 'space-y-2 sm:space-y-3',
} as const

export const spacingClasses = {
  // Padding classes
  padding: {
    xs: 'p-2',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8',
  },
  // Margin classes
  margin: {
    xs: 'm-2',
    sm: 'm-3',
    md: 'm-4',
    lg: 'm-6',
    xl: 'm-8',
  },
  // Gap classes
  gap: {
    xs: 'gap-2',
    sm: 'gap-3',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8',
  },
  // Space between classes
  space: {
    xs: 'space-y-2',
    sm: 'space-y-3',
    md: 'space-y-4',
    lg: 'space-y-6',
    xl: 'space-y-8',
  },
} as const

/**
 * Get responsive spacing class based on screen size
 */
export const getResponsiveSpacing = (base: keyof typeof spacing, mobile?: keyof typeof spacing) => {
  // Map spacing keys to available padding classes
  const spacingToPaddingMap: Record<keyof typeof spacing, keyof typeof spacingClasses.padding> = {
    xs: 'xs',
    sm: 'sm', 
    md: 'md',
    lg: 'lg',
    xl: 'xl',
    '2xl': 'xl',
    '3xl': 'xl',
    '4xl': 'xl',
    '5xl': 'xl'
  }
  
  const mobileKey = mobile ? spacingToPaddingMap[mobile] : spacingToPaddingMap[base]
  const desktopKey = spacingToPaddingMap[base]
  
  const mobileClass = spacingClasses.padding[mobileKey]
  const desktopClass = spacingClasses.padding[desktopKey]
  return `${mobileClass} sm:${desktopClass}`
}

/**
 * Consistent spacing for common layouts
 */
export const layoutSpacing = {
  page: 'px-4 sm:px-6 lg:px-8',
  section: 'py-6 sm:py-8 lg:py-12',
  card: 'p-4 sm:p-6',
  form: 'space-y-4 sm:space-y-6',
  grid: 'gap-4 sm:gap-6 lg:gap-8',
  list: 'space-y-3 sm:space-y-4',
  button: 'px-4 py-2 sm:px-6 sm:py-3',
  input: 'px-3 py-2 sm:px-4 sm:py-3',
} as const
