import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Form input utilities for consistent styling
 */
export const formInputs = {
  // Standard input styling
  input: 'px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/60 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-200 text-sm sm:text-base',
  
  // Select dropdown with proper chevron padding
  select: 'px-3 sm:px-4 pr-10 py-2.5 sm:py-3 border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:min-w-[180px] bg-white/60 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-200 text-sm sm:text-base',
  
  // Textarea styling
  textarea: 'px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/60 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-200 text-sm sm:text-base resize-none',
  
  // Search input with icon
  search: 'w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/60 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-200 text-sm sm:text-base',
} as const

/**
 * Button utilities for consistent styling
 */
export const buttons = {
  // Primary button
  primary: 'flex items-center justify-center px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl text-sm sm:text-base font-medium',
  
  // Success/Upload button
  success: 'flex items-center justify-center px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl text-sm sm:text-base font-medium',
  
  // Secondary button
  secondary: 'flex items-center justify-center px-4 sm:px-6 py-2.5 sm:py-3 bg-white/60 backdrop-blur-sm text-gray-700 rounded-xl hover:bg-white/80 border border-gray-200/50 transition-all duration-200 text-sm sm:text-base font-medium',
  
  // Danger button
  danger: 'flex items-center justify-center px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl hover:from-red-600 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl text-sm sm:text-base font-medium',
} as const

/**
 * Toggle button utilities for consistent styling
 */
export const toggles = {
  // Toggle container with proper width and spacing
  container: 'inline-flex rounded-lg sm:rounded-xl overflow-hidden border border-gray-200/50 bg-white/60 backdrop-blur-sm w-full sm:w-auto sm:min-w-[280px]',
  
  // Toggle button with proper padding to prevent text wrapping
  button: 'flex-1 px-4 py-2.5 sm:px-6 sm:py-3 text-sm sm:text-base font-medium transition-all duration-200 whitespace-nowrap',
  
  // Active toggle button state
  active: 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg',
  
  // Inactive toggle button state
  inactive: 'text-gray-700 hover:bg-white/80',
  
  // Toggle button for two options (My Leave / Team Leave)
  twoOption: {
    container: 'inline-flex rounded-lg sm:rounded-xl overflow-hidden border border-gray-200/50 bg-white/60 backdrop-blur-sm w-full sm:w-auto sm:min-w-[280px]',
    button: 'flex-1 px-4 py-2.5 sm:px-6 sm:py-3 text-sm sm:text-base font-medium transition-all duration-200 whitespace-nowrap',
    active: 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg',
    inactive: 'text-gray-700 hover:bg-white/80'
  },
  
  // Toggle button for three options
  threeOption: {
    container: 'inline-flex rounded-lg sm:rounded-xl overflow-hidden border border-gray-200/50 bg-white/60 backdrop-blur-sm w-full sm:w-auto sm:min-w-[360px]',
    button: 'flex-1 px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap',
    active: 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg',
    inactive: 'text-gray-700 hover:bg-white/80'
  }
} as const
