/**
 * Consolidated breakpoint system for consistent responsive design
 * Based on Tailwind CSS breakpoints with additional utility functions
 */

export const breakpoints = {
  // Standard breakpoints
  xs: '0px',      // Extra small devices (phones)
  sm: '640px',    // Small devices (large phones)
  md: '768px',    // Medium devices (tablets)
  lg: '1024px',   // Large devices (desktops)
  xl: '1280px',   // Extra large devices (large desktops)
  '2xl': '1536px', // 2X large devices (larger desktops)
} as const

export const breakpointValues = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const

export const responsiveClasses = {
  // Container classes
  container: {
    mobile: 'w-full px-4',
    tablet: 'w-full px-6 sm:px-8',
    desktop: 'w-full px-6 sm:px-8 lg:px-12',
    full: 'w-full px-4 sm:px-6 lg:px-8 xl:px-12',
  },
  
  // Grid classes
  grid: {
    mobile: 'grid grid-cols-1 gap-4',
    tablet: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6',
    desktop: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8',
    auto: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6',
  },
  
  // Flex classes
  flex: {
    mobile: 'flex flex-col',
    tablet: 'flex flex-col sm:flex-row',
    desktop: 'flex flex-col sm:flex-row lg:flex-row',
    wrap: 'flex flex-wrap',
    nowrap: 'flex flex-nowrap',
  },
  
  // Text classes
  text: {
    mobile: 'text-sm',
    tablet: 'text-sm sm:text-base',
    desktop: 'text-sm sm:text-base lg:text-lg',
    heading: 'text-lg sm:text-xl lg:text-2xl',
    subheading: 'text-base sm:text-lg lg:text-xl',
  },
  
  // Spacing classes
  spacing: {
    mobile: 'p-4',
    tablet: 'p-4 sm:p-6',
    desktop: 'p-4 sm:p-6 lg:p-8',
    section: 'py-6 sm:py-8 lg:py-12',
    card: 'p-4 sm:p-6',
  },
  
  // Visibility classes
  visibility: {
    mobile: 'block sm:hidden',
    tablet: 'hidden sm:block lg:hidden',
    desktop: 'hidden lg:block',
    mobileTablet: 'block lg:hidden',
    tabletDesktop: 'hidden sm:block',
    all: 'block',
  },
} as const

export const layoutPatterns = {
  // Card layouts
  card: {
    single: 'w-full',
    double: 'w-full sm:w-1/2',
    triple: 'w-full sm:w-1/2 lg:w-1/3',
    quadruple: 'w-full sm:w-1/2 lg:w-1/3 xl:w-1/4',
    auto: 'w-full sm:w-auto',
  },
  
  // Button layouts
  button: {
    full: 'w-full',
    auto: 'w-auto',
    fit: 'w-fit',
    responsive: 'w-full sm:w-auto',
  },
  
  // Form layouts
  form: {
    single: 'w-full',
    double: 'w-full sm:w-1/2',
    triple: 'w-full sm:w-1/2 lg:w-1/3',
    auto: 'w-full sm:w-auto',
  },
  
  // Navigation layouts
  nav: {
    mobile: 'flex flex-col space-y-2',
    tablet: 'flex flex-col sm:flex-row sm:space-y-0 sm:space-x-4',
    desktop: 'flex flex-col sm:flex-row lg:flex-row sm:space-y-0 sm:space-x-4',
  },
} as const

/**
 * Get responsive class for a specific component
 */
export const getResponsiveClass = (component: keyof typeof responsiveClasses, variant: keyof typeof responsiveClasses.container = 'mobile') => {
  const componentClasses = responsiveClasses[component] as Record<string, string>
  return componentClasses[variant] || componentClasses.mobile
}

/**
 * Get responsive pattern for a specific layout
 */
export const getLayoutPattern = (pattern: keyof typeof layoutPatterns, variant: keyof typeof layoutPatterns.card = 'single') => {
  const patternClasses = layoutPatterns[pattern] as Record<string, string>
  return patternClasses[variant] || patternClasses.single
}

/**
 * Responsive utility functions
 */
export const responsiveUtils = {
  // Get breakpoint from window width
  getBreakpoint: (width: number): keyof typeof breakpointValues => {
    if (width >= breakpointValues['2xl']) return '2xl'
    if (width >= breakpointValues.xl) return 'xl'
    if (width >= breakpointValues.lg) return 'lg'
    if (width >= breakpointValues.md) return 'md'
    if (width >= breakpointValues.sm) return 'sm'
    return 'xs'
  },
  
  // Check if current breakpoint is mobile
  isMobile: (width: number): boolean => width < breakpointValues.sm,
  
  // Check if current breakpoint is tablet
  isTablet: (width: number): boolean => width >= breakpointValues.sm && width < breakpointValues.lg,
  
  // Check if current breakpoint is desktop
  isDesktop: (width: number): boolean => width >= breakpointValues.lg,
  
  // Get responsive spacing
  getSpacing: (breakpoint: keyof typeof breakpointValues) => {
    switch (breakpoint) {
      case 'xs':
      case 'sm':
        return 'p-4'
      case 'md':
        return 'p-6'
      case 'lg':
        return 'p-8'
      case 'xl':
      case '2xl':
        return 'p-10'
      default:
        return 'p-4'
    }
  },
  
  // Get responsive text size
  getTextSize: (breakpoint: keyof typeof breakpointValues) => {
    switch (breakpoint) {
      case 'xs':
      case 'sm':
        return 'text-sm'
      case 'md':
        return 'text-base'
      case 'lg':
        return 'text-lg'
      case 'xl':
      case '2xl':
        return 'text-xl'
      default:
        return 'text-sm'
    }
  },
} as const

/**
 * Responsive hook utilities
 */
export const responsiveHooks = {
  // Get current breakpoint
  useBreakpoint: () => {
    if (typeof window === 'undefined') return 'xs'
    return responsiveUtils.getBreakpoint(window.innerWidth)
  },
  
  // Get responsive classes based on breakpoint
  useResponsiveClasses: (breakpoint: keyof typeof breakpointValues) => {
    return {
      container: responsiveClasses.container[breakpoint === 'xs' ? 'mobile' : breakpoint === 'sm' ? 'tablet' : 'desktop'],
      grid: responsiveClasses.grid[breakpoint === 'xs' ? 'mobile' : breakpoint === 'sm' ? 'tablet' : 'desktop'],
      text: responsiveClasses.text[breakpoint === 'xs' ? 'mobile' : breakpoint === 'sm' ? 'tablet' : 'desktop'],
      spacing: responsiveClasses.spacing[breakpoint === 'xs' ? 'mobile' : breakpoint === 'sm' ? 'tablet' : 'desktop'],
    }
  },
} as const

/**
 * Responsive design patterns
 */
export const responsivePatterns = {
  // Mobile-first approach
  mobileFirst: {
    base: 'block',
    sm: 'sm:block',
    md: 'md:block',
    lg: 'lg:block',
    xl: 'xl:block',
  },
  
  // Desktop-first approach
  desktopFirst: {
    base: 'hidden',
    xl: 'xl:block',
    lg: 'lg:block',
    md: 'md:block',
    sm: 'sm:block',
  },
  
  // Progressive enhancement
  progressive: {
    base: 'block',
    sm: 'sm:flex',
    md: 'md:grid',
    lg: 'lg:grid-cols-3',
    xl: 'xl:grid-cols-4',
  },
} as const

/**
 * Get responsive pattern
 */
export const getResponsivePattern = (pattern: keyof typeof responsivePatterns) => {
  return responsivePatterns[pattern]
}
