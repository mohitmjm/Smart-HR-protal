'use client';

import React from 'react';

export interface HorizontalBarChartData {
  [key: string]: string | number;
}

export interface HorizontalBarChartLegend {
  key: string;
  label: string;
  color: string;
}

export interface HorizontalBarChartProps {
  title: string;
  subtitle?: string;
  data: HorizontalBarChartData[];
  legend?: HorizontalBarChartLegend[];
  dataKey: string; // The key that contains the category identifier
  valueKey: string; // The key that contains the value to display
  height?: number;
  showTotals?: boolean;
  showLegend?: boolean;
  className?: string;
  showEmptyBars?: boolean;
  maxBars?: number;
  barHeight?: number; // Height of each bar
  barSpacing?: number; // Space between bars
  formatDataKey?: (value: string | number) => string;
  formatValue?: (value: number) => string;
}

export default function HorizontalBarChart({
  title,
  subtitle,
  data,
  legend = [],
  dataKey,
  valueKey,
  height = 300,
  showTotals = true,
  showLegend = true,
  className = '',
  showEmptyBars = true,
  maxBars = 10,
  barHeight = 32,
  barSpacing = 8,
  formatDataKey,
  formatValue
}: HorizontalBarChartProps) {
  // Calculate max value for scaling
  const maxValue = Math.max(...data.map(item => item[valueKey] as number || 0));

  // Handle empty data
  if (!data || data.length === 0) {
    return (
      <div className={`bg-white rounded-lg p-6 shadow-lg ${className}`}>
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center justify-center h-32 text-gray-500">
          No data available
        </div>
      </div>
    );
  }

  // Format the data key (category) for display
  const formatDataKeyValue = (value: string | number) => {
    if (formatDataKey) {
      return formatDataKey(value);
    }
    return String(value);
  };

  // Format the value for display
  const formatValueDisplay = (value: number) => {
    if (formatValue) {
      return formatValue(value);
    }
    return value.toString();
  };

  // Limit data to maxBars if specified
  const displayData = maxBars ? data.slice(0, maxBars) : data;

  // Calculate total for display
  const totalValue = displayData.reduce((sum, item) => sum + (item[valueKey] as number || 0), 0);

  return (
    <div className={`bg-white rounded-lg p-6 shadow-lg ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {subtitle && (
          <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
        )}
      </div>
      
      {/* Chart */}
      <div 
        className="space-y-2 overflow-y-auto"
        style={{ maxHeight: `${height}px` }}
      >
        {displayData.map((item, index) => {
          const value = item[valueKey] as number || 0;
          const dataKeyValue = item[dataKey];
          const barWidth = maxValue > 0 ? (value / maxValue) * 100 : 0;
          
          return (
            <div key={`${dataKeyValue}-${index}`} className="flex items-center space-x-3 group" style={{ minHeight: `${barHeight}px` }}>
              {/* Category label */}
              <div className="w-20 text-sm font-medium text-gray-700 text-right flex-shrink-0">
                {formatDataKeyValue(dataKeyValue)}
              </div>
              
              {/* Bar container */}
              <div className="flex-1 relative">
                {/* Bar */}
                <div 
                  className="bg-blue-500 rounded-md transition-all duration-200 hover:bg-blue-600 relative"
                  style={{ 
                    width: `${barWidth}%`,
                    height: `${barHeight}px`,
                    minWidth: (value > 0 || showEmptyBars) ? '4px' : '0px'
                  }}
                >
                  {/* Value on bar */}
                  {showTotals && (value > 0 || showEmptyBars) && (
                    <div className="absolute inset-0 flex items-center justify-center text-white text-xs font-semibold">
                      {formatValueDisplay(value)}
                    </div>
                  )}
                </div>
              </div>
              
            </div>
          );
        })}
      </div>
      
      {/* Legend */}
      {showLegend && legend.length > 0 && (
        <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t border-gray-100">
          {legend.map(({ key, label, color }) => (
            <div key={key} className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full flex-shrink-0" 
                style={{ backgroundColor: color }}
              />
              <span className="text-sm text-gray-600 capitalize">{label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
