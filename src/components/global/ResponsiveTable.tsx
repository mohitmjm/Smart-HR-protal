'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface ResponsiveTableProps {
  children: React.ReactNode
  className?: string
  scrollable?: boolean
}

export const ResponsiveTable: React.FC<ResponsiveTableProps> = ({ 
  children, 
  className,
  scrollable = true 
}) => {
  return (
    <div className={cn(
      'w-full',
      scrollable && 'overflow-x-auto'
    )}>
      <table className={cn(
        'min-w-full divide-y divide-gray-200',
        className
      )}>
        {children}
      </table>
    </div>
  )
}

interface TableHeaderProps {
  children: React.ReactNode
  className?: string
}

export const TableHeader: React.FC<TableHeaderProps> = ({ children, className }) => {
  return (
    <thead className={cn('bg-gray-50', className)}>
      {children}
    </thead>
  )
}

interface TableBodyProps {
  children: React.ReactNode
  className?: string
}

export const TableBody: React.FC<TableBodyProps> = ({ children, className }) => {
  return (
    <tbody className={cn('bg-white divide-y divide-gray-200', className)}>
      {children}
    </tbody>
  )
}

interface TableRowProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
}

export const TableRow: React.FC<TableRowProps> = ({ children, className, hover = true }) => {
  return (
    <tr className={cn(
      hover && 'hover:bg-gray-50',
      className
    )}>
      {children}
    </tr>
  )
}

interface TableCellProps {
  children: React.ReactNode
  className?: string
  header?: boolean
  responsive?: boolean
}

export const TableCell: React.FC<TableCellProps> = ({ 
  children, 
  className, 
  header = false,
  responsive = true 
}) => {
  const baseClasses = header 
    ? 'px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider'
    : 'px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900'

  return (
    <td className={cn(
      baseClasses,
      responsive && 'min-w-0',
      className
    )}>
      {children}
    </td>
  )
}

interface TableHeaderCellProps {
  children: React.ReactNode
  className?: string
  sortable?: boolean
}

export const TableHeaderCell: React.FC<TableHeaderCellProps> = ({ 
  children, 
  className,
  sortable = false 
}) => {
  return (
    <th className={cn(
      'px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider',
      sortable && 'cursor-pointer hover:text-gray-700',
      className
    )}>
      {children}
    </th>
  )
}

/**
 * Mobile-friendly table wrapper that shows cards on small screens
 */
interface MobileTableProps {
  children: React.ReactNode
  className?: string
}

export const MobileTable: React.FC<MobileTableProps> = ({ children, className }) => {
  return (
    <div className={cn(
      'block sm:hidden space-y-4',
      className
    )}>
      {children}
    </div>
  )
}

/**
 * Desktop table wrapper
 */
interface DesktopTableProps {
  children: React.ReactNode
  className?: string
}

export const DesktopTable: React.FC<DesktopTableProps> = ({ children, className }) => {
  return (
    <div className={cn(
      'hidden sm:block',
      className
    )}>
      {children}
    </div>
  )
}
