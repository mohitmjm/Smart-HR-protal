'use client';

import React from 'react';

export interface BarChartData {
  [key: string]: string | number;
}

export interface BarChartLegend {
  key: string;
  label: string;
  color: string;
}

export interface BarChartProps {
  title: string;
  subtitle?: string;
  data: BarChartData[];
  legend: BarChartLegend[];
  dataKey: string;
  valueKeys: string[];
  height?: number;
  showTotals?: boolean;
  showLegend?: boolean;
  className?: string;
  showEmptyBars?: boolean;
  maxBars?: number;
  rotateLabels?: boolean;
  barSpacing?: number;
  formatDataKey?: (value: string | number) => string;
}

export default function BarChart({
  title,
  subtitle,
  data,
  legend,
  dataKey,
  valueKeys,
  height = 280,
  showTotals = true,
  showLegend = true,
  className = '',
  showEmptyBars = true,
  maxBars = 12,
  rotateLabels = true,
  barSpacing = 12,
  formatDataKey
}: BarChartProps) {
  // Calculate max value for scaling
  const maxValue = Math.max(...data.map(item => 
    valueKeys.reduce((sum, key) => sum + (item[key] as number || 0), 0)
  ));

  // Handle empty data
  if (!data || data.length === 0) {
    return (
      <div className={`bg-white rounded-lg p-6 ${className}`}>
        <div className="mb-4">
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

  // Get color for a specific key
  const getColor = (key: string) => {
    const legendItem = legend.find(item => item.key === key);
    return legendItem?.color || '#6B7280';
  };

  // Get label for a specific key
  const getLabel = (key: string) => {
    const legendItem = legend.find(item => item.key === key);
    return legendItem?.label || key;
  };

  // Format the data key (month) for display
  const formatDataKeyValue = (value: string | number) => {
    if (formatDataKey) {
      return formatDataKey(value);
    }
    
    if (typeof value === 'string' && value.includes('-')) {
      // Parse YYYY-MM format correctly
      const [year, month] = value.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1, 1);
      return date.toLocaleDateString('en-US', { month: 'short' });
    }
    return String(value);
  };

  // Limit data to maxBars if specified
  const displayData = maxBars ? data.slice(0, maxBars) : data;

  // Calculate total for display
  const totalValue = displayData.reduce((sum, item) => 
    valueKeys.reduce((itemSum, key) => itemSum + (item[key] as number || 0), 0), 0
  );

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
      <div>
        {/* Chart bars */}
        <div 
          className="flex items-end"
          style={{ 
            height: `${height}px`,
            gap: `${barSpacing}px`
          }}
        >
          {displayData.map((item, index) => {
            const totalValue = valueKeys.reduce((sum, key) => sum + (item[key] as number || 0), 0);
            const dataKeyValue = item[dataKey];
            // Make bars responsive - use 80% of available height for bars, leave 20% for labels
            const availableHeight = height - 40; // Reserve space for labels
            const barHeight = maxValue > 0 ? (totalValue / maxValue) * availableHeight : 0;
            
            return (
              <div key={`${dataKeyValue}-${index}`} className="flex-1 flex flex-col items-center group">
                {/* Bar container */}
                <div 
                  className="w-full flex flex-col justify-end relative"
                  style={{ height: `${availableHeight}px` }}
                >
                  {/* Stacked bars */}
                  <div className="relative w-full h-full flex flex-col justify-end">
                    {/* Total count on top of bar - positioned at the top of the actual bar */}
                    {showTotals && (totalValue > 0 || showEmptyBars) && (
                      <div 
                        className="absolute text-xs font-medium text-gray-700 text-center w-full z-10"
                        style={{ bottom: `${barHeight}px` }}
                      >
                        {totalValue}
                      </div>
                    )}
                    {valueKeys.map((key, keyIndex) => {
                      const value = item[key] as number || 0;
                      const valueHeight = maxValue > 0 ? (value / maxValue) * availableHeight : 0;
                      
                      return (
                        <div
                          key={key}
                          className="w-full transition-all duration-200 hover:opacity-90"
                          style={{ 
                            height: `${valueHeight}px`,
                            backgroundColor: getColor(key),
                            minHeight: (value > 0 || showEmptyBars) ? '1px' : '0px'
                          }}
                          title={`${getLabel(key)}: ${value}`}
                        />
                      );
                    })}
                  </div>
                </div>
                
                {/* X-axis label */}
                <div className={`text-xs text-gray-500 mt-2 text-center ${rotateLabels ? 'transform -rotate-45 origin-center' : ''}`}>
                  {formatDataKeyValue(dataKeyValue)}
                </div>
              </div>
            );
          })}
        </div>
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