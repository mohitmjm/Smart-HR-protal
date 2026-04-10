/**
 * Visual design system for consistent shadows, borders, and effects
 * Based on Material Design 3 and modern design principles
 */

export const shadows = {
  // Elevation levels (0-24)
  none: 'shadow-none',
  xs: 'shadow-xs',
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl',
  '2xl': 'shadow-2xl',
  inner: 'shadow-inner',
  
  // Custom shadows for specific use cases
  card: 'shadow-lg hover:shadow-xl',
  button: 'shadow-md hover:shadow-lg',
  modal: 'shadow-2xl',
  dropdown: 'shadow-lg',
  tooltip: 'shadow-md',
  floating: 'shadow-xl hover:shadow-2xl',
  
  // Glass morphism effects
  glass: 'shadow-lg backdrop-blur-sm',
  glassStrong: 'shadow-xl backdrop-blur-md',
  glassSubtle: 'shadow-md backdrop-blur-sm',
} as const

export const borders = {
  // Border radius
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
  '3xl': 'rounded-3xl',
  full: 'rounded-full',
  
  // Border styles
  solid: 'border-solid',
  dashed: 'border-dashed',
  dotted: 'border-dotted',
  borderNone: 'border-none',
  
  // Border widths
  thin: 'border',
  medium: 'border-2',
  thick: 'border-4',
  
  // Border colors
  default: 'border-gray-200',
  muted: 'border-gray-100',
  accent: 'border-blue-200',
  success: 'border-green-200',
  warning: 'border-yellow-200',
  error: 'border-red-200',
  info: 'border-blue-200',
  
  // Combined border styles
  card: 'border border-gray-200/50 rounded-xl',
  input: 'border border-gray-300 rounded-lg',
  button: 'border border-transparent rounded-lg',
  modal: 'border border-gray-200/50 rounded-2xl',
  badge: 'border border-gray-200 rounded-full',
} as const

export const effects = {
  // Backdrop effects
  backdrop: 'backdrop-blur-sm',
  backdropStrong: 'backdrop-blur-md',
  backdropSubtle: 'backdrop-blur-sm',
  
  // Glass morphism
  glass: 'bg-white/60 backdrop-blur-sm',
  glassStrong: 'bg-white/80 backdrop-blur-md',
  glassSubtle: 'bg-white/40 backdrop-blur-sm',
  glassDark: 'bg-black/20 backdrop-blur-sm',
  
  // Gradient effects
  gradient: 'bg-gradient-to-r',
  gradientBlue: 'bg-gradient-to-r from-blue-500 to-indigo-600',
  gradientGreen: 'bg-gradient-to-r from-green-500 to-emerald-600',
  gradientRed: 'bg-gradient-to-r from-red-500 to-rose-600',
  gradientPurple: 'bg-gradient-to-r from-purple-500 to-pink-600',
  gradientOrange: 'bg-gradient-to-r from-orange-500 to-red-600',
  
  // Animation effects
  hover: 'hover:scale-105 hover:shadow-lg',
  hoverSubtle: 'hover:scale-102 hover:shadow-md',
  hoverLift: 'hover:-translate-y-1 hover:shadow-xl',
  hoverGlow: 'hover:shadow-lg hover:shadow-blue-500/25',
  
  // Focus effects
  focus: 'focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
  focusError: 'focus:ring-2 focus:ring-red-500 focus:ring-offset-2',
  focusSuccess: 'focus:ring-2 focus:ring-green-500 focus:ring-offset-2',
  
  // Transition effects
  transition: 'transition-all duration-200',
  transitionSlow: 'transition-all duration-300',
  transitionFast: 'transition-all duration-150',
  transitionBounce: 'transition-all duration-200 ease-in-out',
} as const

export const visualStyles = {
  // Card styles
  card: {
    base: `${borders.card} ${shadows.card} ${effects.transition}`,
    glass: `${borders.card} ${shadows.glass} ${effects.glass}`,
    elevated: `${borders.card} ${shadows.xl} ${effects.hoverLift}`,
    subtle: `${borders.card} ${shadows.sm} ${effects.transition}`,
  },
  
  // Button styles
  button: {
    base: `${borders.button} ${shadows.button} ${effects.transition}`,
    primary: `${borders.button} ${shadows.button} ${effects.gradientBlue} ${effects.transition}`,
    secondary: `${borders.button} ${shadows.button} ${effects.glass} ${effects.transition}`,
    ghost: `${borders.button} ${shadows.none} ${effects.transition}`,
  },
  
  // Input styles
  input: {
    base: `${borders.input} ${effects.focus} ${effects.transition}`,
    error: `${borders.input} ${effects.focusError} ${effects.transition}`,
    success: `${borders.input} ${effects.focusSuccess} ${effects.transition}`,
  },
  
  // Modal styles
  modal: {
    base: `${borders.modal} ${shadows.modal} ${effects.backdropStrong}`,
    overlay: `${effects.glassDark} ${effects.backdrop}`,
  },
  
  // Badge styles
  badge: {
    base: `${borders.badge} ${shadows.sm} ${effects.transition}`,
    primary: `${borders.badge} ${shadows.sm} ${effects.gradientBlue} ${effects.transition}`,
    success: `${borders.badge} ${shadows.sm} ${effects.gradientGreen} ${effects.transition}`,
    warning: `${borders.badge} ${shadows.sm} ${effects.gradientOrange} ${effects.transition}`,
    error: `${borders.badge} ${shadows.sm} ${effects.gradientRed} ${effects.transition}`,
  },
} as const

/**
 * Get visual style for a specific component type
 */
export const getVisualStyle = (component: keyof typeof visualStyles, variant: string = 'base') => {
  const componentStyles = visualStyles[component] as Record<string, string>
  return componentStyles[variant] || componentStyles.base
}

/**
 * Responsive visual styles
 */
export const responsiveVisualStyles = {
  card: {
    mobile: `${visualStyles.card.base} p-4`,
    tablet: `${visualStyles.card.base} p-6`,
    desktop: `${visualStyles.card.base} p-8`,
  },
  button: {
    mobile: `${visualStyles.button.base} px-4 py-2 text-sm`,
    tablet: `${visualStyles.button.base} px-6 py-3 text-base`,
    desktop: `${visualStyles.button.base} px-8 py-4 text-lg`,
  },
  input: {
    mobile: `${visualStyles.input.base} px-3 py-2 text-sm`,
    tablet: `${visualStyles.input.base} px-4 py-3 text-base`,
    desktop: `${visualStyles.input.base} px-5 py-4 text-lg`,
  },
} as const

/**
 * Animation utilities
 */
export const animations = {
  // Entrance animations
  fadeIn: 'animate-fade-in',
  slideIn: 'animate-slide-in',
  scaleIn: 'animate-scale-in',
  bounceIn: 'animate-bounce-in',
  
  // Exit animations
  fadeOut: 'animate-fade-out',
  slideOut: 'animate-slide-out',
  scaleOut: 'animate-scale-out',
  
  // Loading animations
  spin: 'animate-spin',
  pulse: 'animate-pulse',
  bounce: 'animate-bounce',
  ping: 'animate-ping',
  
  // Hover animations
  hover: 'hover:animate-pulse',
  hoverBounce: 'hover:animate-bounce',
  hoverSpin: 'hover:animate-spin',
} as const

/**
 * Get responsive visual style
 */
export const getResponsiveVisualStyle = (component: keyof typeof responsiveVisualStyles, breakpoint: 'mobile' | 'tablet' | 'desktop' = 'mobile') => {
  return responsiveVisualStyles[component][breakpoint]
}
