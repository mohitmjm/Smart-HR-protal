'use client'

import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { layoutSpacing } from '@/lib/utils/spacingUtils'
import { iconContextSizes } from '@/lib/utils/iconUtils'

const inputVariants = cva(
  'w-full rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        default: 'border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500',
        error: 'border-red-300 bg-red-50 text-red-900 placeholder-red-400 focus:border-red-500 focus:ring-red-500',
        success: 'border-green-300 bg-green-50 text-green-900 placeholder-green-400 focus:border-green-500 focus:ring-green-500',
        warning: 'border-yellow-300 bg-yellow-50 text-yellow-900 placeholder-yellow-400 focus:border-yellow-500 focus:ring-yellow-500',
      },
      size: {
        sm: 'px-3 py-2 text-sm',
        md: 'px-4 py-3 text-base',
        lg: 'px-5 py-4 text-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
)

const labelVariants = cva(
  'block font-medium transition-colors duration-200',
  {
    variants: {
      size: {
        sm: 'text-sm mb-1',
        md: 'text-base mb-2',
        lg: 'text-lg mb-3',
      },
      required: {
        true: 'after:content-["*"] after:text-red-500 after:ml-1',
        false: '',
      },
    },
    defaultVariants: {
      size: 'md',
      required: false,
    },
  }
)

const errorVariants = cva(
  'text-sm font-medium transition-colors duration-200',
  {
    variants: {
      variant: {
        error: 'text-red-600',
        warning: 'text-yellow-600',
        info: 'text-blue-600',
      },
    },
    defaultVariants: {
      variant: 'error',
    },
  }
)

export interface FormInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  label?: string
  error?: string
  warning?: string
  info?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  containerClassName?: string
  labelClassName?: string
  errorClassName?: string
}

export const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  ({
    className,
    variant,
    size,
    label,
    error,
    warning,
    info,
    leftIcon,
    rightIcon,
    containerClassName,
    labelClassName,
    errorClassName,
    required,
    ...props
  }, ref) => {
    const hasError = !!error
    const hasWarning = !!warning
    const hasInfo = !!info
    
    const inputVariant = hasError ? 'error' : hasWarning ? 'warning' : hasInfo ? 'success' : variant
    const errorVariant = hasError ? 'error' : hasWarning ? 'warning' : 'info'
    const errorMessage = error || warning || info

    return (
      <div className={cn('w-full', containerClassName)}>
        {label && (
          <label
            className={cn(
              labelVariants({ size, required }),
              labelClassName
            )}
          >
            {label}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <span className={iconContextSizes.form.input}>
                {leftIcon}
              </span>
            </div>
          )}
          
          <input
            className={cn(
              inputVariants({ variant: inputVariant, size }),
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              className
            )}
            ref={ref}
            {...props}
          />
          
          {rightIcon && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <span className={iconContextSizes.form.input}>
                {rightIcon}
              </span>
            </div>
          )}
        </div>
        
        {errorMessage && (
          <p className={cn(
            errorVariants({ variant: errorVariant }),
            'mt-1',
            errorClassName
          )}>
            {errorMessage}
          </p>
        )}
      </div>
    )
  }
)

FormInput.displayName = 'FormInput'

// Textarea component
export interface FormTextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  label?: string
  error?: string
  warning?: string
  info?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  containerClassName?: string
  labelClassName?: string
  errorClassName?: string
}

export const FormTextarea = React.forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({
    className,
    variant,
    size,
    label,
    error,
    warning,
    info,
    leftIcon,
    rightIcon,
    containerClassName,
    labelClassName,
    errorClassName,
    required,
    ...props
  }, ref) => {
    const hasError = !!error
    const hasWarning = !!warning
    const hasInfo = !!info
    
    const inputVariant = hasError ? 'error' : hasWarning ? 'warning' : hasInfo ? 'success' : variant
    const errorVariant = hasError ? 'error' : hasWarning ? 'warning' : 'info'
    const errorMessage = error || warning || info

    return (
      <div className={cn('w-full', containerClassName)}>
        {label && (
          <label
            className={cn(
              labelVariants({ size, required }),
              labelClassName
            )}
          >
            {label}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-3 text-gray-400">
              <span className={iconContextSizes.form.input}>
                {leftIcon}
              </span>
            </div>
          )}
          
          <textarea
            className={cn(
              inputVariants({ variant: inputVariant, size }),
              'resize-none',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              className
            )}
            ref={ref}
            {...props}
          />
          
          {rightIcon && (
            <div className="absolute right-3 top-3 text-gray-400">
              <span className={iconContextSizes.form.input}>
                {rightIcon}
              </span>
            </div>
          )}
        </div>
        
        {errorMessage && (
          <p className={cn(
            errorVariants({ variant: errorVariant }),
            'mt-1',
            errorClassName
          )}>
            {errorMessage}
          </p>
        )}
      </div>
    )
  }
)

FormTextarea.displayName = 'FormTextarea'

// Select component
export interface FormSelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  label?: string
  error?: string
  warning?: string
  info?: string
  options: { value: string; label: string; disabled?: boolean }[]
  containerClassName?: string
  labelClassName?: string
  errorClassName?: string
}

export const FormSelect = React.forwardRef<HTMLSelectElement, FormSelectProps>(
  ({
    className,
    variant,
    size,
    label,
    error,
    warning,
    info,
    options,
    containerClassName,
    labelClassName,
    errorClassName,
    required,
    ...props
  }, ref) => {
    const hasError = !!error
    const hasWarning = !!warning
    const hasInfo = !!info
    
    const inputVariant = hasError ? 'error' : hasWarning ? 'warning' : hasInfo ? 'success' : variant
    const errorVariant = hasError ? 'error' : hasWarning ? 'warning' : 'info'
    const errorMessage = error || warning || info

    return (
      <div className={cn('w-full', containerClassName)}>
        {label && (
          <label
            className={cn(
              labelVariants({ size, required }),
              labelClassName
            )}
          >
            {label}
          </label>
        )}
        
        <select
          className={cn(
            inputVariants({ variant: inputVariant, size }),
            'appearance-none bg-white',
            className
          )}
          ref={ref}
          {...props}
        >
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
        
        {errorMessage && (
          <p className={cn(
            errorVariants({ variant: errorVariant }),
            'mt-1',
            errorClassName
          )}>
            {errorMessage}
          </p>
        )}
      </div>
    )
  }
)

FormSelect.displayName = 'FormSelect'
