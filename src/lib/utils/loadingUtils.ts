/**
 * Standardized loading states and patterns
 * Consistent loading indicators across the application
 */

export const loadingStates = {
  // Loading sizes
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
  '2xl': 'w-16 h-16',
} as const

export const loadingAnimations = {
  // Spinner animations
  spin: 'animate-spin',
  pulse: 'animate-pulse',
  bounce: 'animate-bounce',
  ping: 'animate-ping',
  
  // Custom animations
  fade: 'animate-fade-in',
  slide: 'animate-slide-in',
  scale: 'animate-scale-in',
} as const

export const loadingColors = {
  primary: 'text-blue-500',
  secondary: 'text-gray-500',
  success: 'text-green-500',
  warning: 'text-yellow-500',
  error: 'text-red-500',
  white: 'text-white',
  black: 'text-black',
} as const

export const loadingPatterns = {
  // Spinner patterns
  spinner: {
    base: 'animate-spin rounded-full border-2 border-gray-200',
    primary: 'animate-spin rounded-full border-2 border-blue-500 border-t-transparent',
    secondary: 'animate-spin rounded-full border-2 border-gray-500 border-t-transparent',
    success: 'animate-spin rounded-full border-2 border-green-500 border-t-transparent',
    warning: 'animate-spin rounded-full border-2 border-yellow-500 border-t-transparent',
    error: 'animate-spin rounded-full border-2 border-red-500 border-t-transparent',
  },
  
  // Dot patterns
  dots: {
    base: 'flex space-x-1',
    dot: 'w-2 h-2 bg-gray-400 rounded-full animate-pulse',
    primary: 'w-2 h-2 bg-blue-500 rounded-full animate-pulse',
    secondary: 'w-2 h-2 bg-gray-500 rounded-full animate-pulse',
  },
  
  // Skeleton patterns
  skeleton: {
    base: 'animate-pulse bg-gray-200 rounded',
    text: 'animate-pulse bg-gray-200 rounded h-4',
    button: 'animate-pulse bg-gray-200 rounded h-10',
    card: 'animate-pulse bg-gray-200 rounded-lg h-32',
    avatar: 'animate-pulse bg-gray-200 rounded-full',
  },
  
  // Progress patterns
  progress: {
    base: 'w-full bg-gray-200 rounded-full h-2',
    bar: 'bg-blue-500 h-2 rounded-full transition-all duration-300',
    indeterminate: 'bg-blue-500 h-2 rounded-full animate-pulse',
  },
} as const

export const loadingComponents = {
  // Button loading
  button: {
    base: 'inline-flex items-center justify-center',
    spinner: 'animate-spin rounded-full border-2 border-white border-t-transparent',
    text: 'ml-2',
  },
  
  // Card loading
  card: {
    base: 'animate-pulse bg-white rounded-lg border border-gray-200',
    header: 'animate-pulse bg-gray-200 rounded h-6 mb-4',
    content: 'animate-pulse bg-gray-200 rounded h-4 mb-2',
    footer: 'animate-pulse bg-gray-200 rounded h-4',
  },
  
  // Table loading
  table: {
    base: 'animate-pulse bg-white rounded-lg border border-gray-200',
    header: 'animate-pulse bg-gray-200 rounded h-8 mb-4',
    row: 'animate-pulse bg-gray-200 rounded h-6 mb-2',
    cell: 'animate-pulse bg-gray-200 rounded h-4',
  },
  
  // Form loading
  form: {
    base: 'animate-pulse bg-white rounded-lg border border-gray-200',
    label: 'animate-pulse bg-gray-200 rounded h-4 mb-2',
    input: 'animate-pulse bg-gray-200 rounded h-10 mb-4',
    button: 'animate-pulse bg-gray-200 rounded h-10',
  },
  
  // List loading
  list: {
    base: 'animate-pulse bg-white rounded-lg border border-gray-200',
    item: 'animate-pulse bg-gray-200 rounded h-6 mb-2',
    avatar: 'animate-pulse bg-gray-200 rounded-full h-8 w-8',
    text: 'animate-pulse bg-gray-200 rounded h-4',
  },
} as const

export const loadingMessages = {
  // Generic messages
  generic: 'Loading...',
  processing: 'Processing...',
  saving: 'Saving...',
  updating: 'Updating...',
  deleting: 'Deleting...',
  submitting: 'Submitting...',
  
  // Specific messages
  data: 'Loading data...',
  content: 'Loading content...',
  results: 'Loading results...',
  profile: 'Loading profile...',
  settings: 'Loading settings...',
  reports: 'Loading reports...',
  
  // Error messages
  error: 'Something went wrong...',
  retry: 'Retrying...',
  failed: 'Failed to load...',
} as const

export const loadingStateTypes = {
  // Loading state types
  idle: 'idle',
  loading: 'loading',
  success: 'success',
  error: 'error',
  retry: 'retry',
} as const

/**
 * Get loading component for a specific type
 */
export const getLoadingComponent = (type: keyof typeof loadingComponents, variant: keyof typeof loadingComponents.button = 'base') => {
  const componentClasses = loadingComponents[type] as Record<string, string>
  return componentClasses[variant] || componentClasses.base
}

/**
 * Get loading pattern for a specific type
 */
export const getLoadingPattern = (type: keyof typeof loadingPatterns, variant: string = 'base') => {
  const patternType = loadingPatterns[type] as Record<string, string>
  return patternType[variant] || patternType.base
}

/**
 * Get loading message for a specific context
 */
export const getLoadingMessage = (context: keyof typeof loadingMessages) => {
  return loadingMessages[context]
}

/**
 * Loading state utilities
 */
export const loadingUtils = {
  // Get loading class based on state
  getLoadingClass: (state: keyof typeof loadingStateTypes) => {
    switch (state) {
      case 'loading':
        return 'opacity-50 pointer-events-none'
      case 'success':
        return 'opacity-100 pointer-events-auto'
      case 'error':
        return 'opacity-100 pointer-events-auto'
      default:
        return 'opacity-100 pointer-events-auto'
    }
  },
  
  // Get loading spinner class
  getSpinnerClass: (size: keyof typeof loadingStates, color: keyof typeof loadingColors) => {
    return `${loadingStates[size]} ${loadingColors[color]} ${loadingAnimations.spin}`
  },
  
  // Get skeleton class
  getSkeletonClass: (type: keyof typeof loadingPatterns.skeleton) => {
    return loadingPatterns.skeleton[type]
  },
  
  // Get loading overlay class
  getOverlayClass: (visible: boolean) => {
    return visible ? 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50' : 'hidden'
  },
} as const

/**
 * Responsive loading states
 */
export const responsiveLoadingStates = {
  // Mobile loading
  mobile: {
    spinner: 'w-4 h-4',
    text: 'text-sm',
    button: 'px-4 py-2',
  },
  
  // Tablet loading
  tablet: {
    spinner: 'w-6 h-6',
    text: 'text-base',
    button: 'px-6 py-3',
  },
  
  // Desktop loading
  desktop: {
    spinner: 'w-8 h-8',
    text: 'text-lg',
    button: 'px-8 py-4',
  },
} as const

/**
 * Get responsive loading state
 */
export const getResponsiveLoadingState = (breakpoint: 'mobile' | 'tablet' | 'desktop' = 'mobile') => {
  return responsiveLoadingStates[breakpoint]
}

/**
 * Loading state hooks
 */
export const loadingHooks = {
  // Use loading state
  useLoadingState: (initialState: keyof typeof loadingStateTypes = 'idle') => {
    // This would be implemented with React hooks in a real component
    return {
      state: initialState,
      setState: (newState: keyof typeof loadingStateTypes) => {},
      isLoading: initialState === 'loading',
      isSuccess: initialState === 'success',
      isError: initialState === 'error',
    }
  },
  
  // Use loading message
  useLoadingMessage: (context: keyof typeof loadingMessages) => {
    return getLoadingMessage(context)
  },
} as const
