'use client';

import React from 'react';

export interface ClusteredBarChartData {
  [key: string]: string | number;
}

export interface ClusteredBarChartLegend {
  key: string;
  label: string;
  color: string;
}

export interface ClusteredBarChartProps {
  title: string;
  subtitle?: string;
  data: ClusteredBarChartData[];
  legend: ClusteredBarChartLegend[];
  dataKey: string; // The key that contains the month/date identifier
  valueKeys: string[]; // The keys that contain the values to display (departments)
  height?: number;
  showTotals?: boolean;
  showLegend?: boolean;
  className?: string;
  showEmptyBars?: boolean;
  maxBars?: number;
  rotateLabels?: boolean;
  barSpacing?: number;
  formatDataKey?: (value: string | number) => string;
  showYAxis?: boolean;
  showGridLines?: boolean;
  barBorderRadius?: number;
  animationDuration?: number;
  clusterSpacing?: number; // Space between clusters (groups of bars)
}

export default function ClusteredBarChart({
  title,
  subtitle,
  data,
  legend,
  dataKey,
  valueKeys,
  height = 300,
  showTotals = true,
  showLegend = true,
  className = '',
  showEmptyBars = true,
  maxBars = 12,
  rotateLabels = true,
  barSpacing = 2,
  formatDataKey,
  showYAxis = true,
  showGridLines = true,
  barBorderRadius = 4,
  animationDuration = 300,
  clusterSpacing = 4
}: ClusteredBarChartProps) {
  // Calculate max value for scaling - find the highest individual department value
  const maxValue = Math.max(...data.flatMap(item => 
    valueKeys.map(key => item[key] as number || 0)
  ));

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

  // Generate Y-axis scale - use 0-100% for attendance
  const yAxisSteps = 5;
  const stepValue = Math.ceil(100 / yAxisSteps); // Always use 100 as max for attendance
  const yAxisValues = Array.from({ length: yAxisSteps + 1 }, (_, i) => i * stepValue);

  return (
    <div className={`bg-white rounded-lg p-6 shadow-lg group ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {subtitle && (
          <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
        )}
      </div>
      
      {/* Chart Container */}
      <div className="relative">
        {/* Y-axis */}
        {showYAxis && (
          <div className="absolute left-0 top-0 bottom-8 w-12 flex flex-col justify-between text-xs text-gray-500">
            {yAxisValues.reverse().map((value, index) => (
              <div key={index} className="text-right pr-2">
                {value}%
              </div>
            ))}
          </div>
        )}

        {/* Chart */}
        <div 
          className="w-full overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 relative"
          style={{ 
            height: `${height}px`,
            marginLeft: showYAxis ? '48px' : '0',
            width: '100%'
          }}
        >
          <div 
            className="flex items-end h-full w-full"
            style={{ 
              gap: '2px',
              paddingRight: '20px' // Add padding to prevent label overflow
            }}
          >
          {displayData.map((item, index) => {
            const dataKeyValue = item[dataKey];
            const availableHeight = height - 60; // Reserve space for labels and month names
            
            return (
              <div 
                key={`${dataKeyValue}-${index}`} 
                className="flex flex-col items-center group flex-1"
              >
                {/* Cluster of bars for this month */}
                <div 
                  className="w-full flex justify-center items-end"
                  style={{ height: `${availableHeight}px` }}
                >
                  {valueKeys.map((key, keyIndex) => {
                    const value = item[key] as number || 0; // Default to 0 if no value
                    const barHeight = (value / 100) * availableHeight; // Use 100 as max for attendance percentages
                    
                    // Responsive bar width calculation - use percentage for full width utilization
                    const barWidthPercent = Math.max(15, 90 / valueKeys.length); // 15% minimum, 90% max divided by departments
                    
                    return (
                      <div
                        key={key}
                        className="flex flex-col items-center"
                        style={{ 
                          width: `${barWidthPercent}%`,
                          marginRight: keyIndex < valueKeys.length - 1 ? '0.5px' : '0'
                        }}
                      >
                        {/* Total count on top of bar */}
                        {showTotals && (
                          <div 
                            className="text-xs font-semibold text-gray-700 mb-1"
                            style={{ 
                              whiteSpace: 'nowrap',
                              fontSize: 'clamp(8px, 2vw, 12px)'
                            }}
                          >
                            {Math.round(value)}%
                          </div>
                        )}
                        
                        {/* Bar container */}
                        <div 
                          className="w-full transition-all duration-200 hover:opacity-80"
                          style={{ 
                            height: `${Math.max(barHeight, 2)}px`, // Always show at least 2px height
                            backgroundColor: value > 0 ? getColor(key) : '#E5E7EB', // Gray for 0% values
                            borderRadius: `${barBorderRadius}px ${barBorderRadius}px 0 0`,
                            minHeight: '2px', // Always show minimum height
                            boxShadow: value > 0 ? '0 1px 3px rgba(0, 0, 0, 0.1)' : 'none'
                          }}
                          title={`${getLabel(key)}: ${value}%`}
                        />
                      </div>
                    );
                  })}
                </div>
                
                {/* X-axis label */}
                <div className={`text-gray-500 mt-1 text-center w-full ${rotateLabels ? 'transform -rotate-45 origin-center' : ''}`}>
                  <span className="block truncate text-xs" style={{ fontSize: '9px', maxWidth: '100%' }}>
                    {formatDataKeyValue(dataKeyValue)}
                  </span>
                </div>
              </div>
            );
          })}
          </div>
          
          {/* Scroll shadow indicators */}
          <div className="absolute top-0 right-0 w-4 h-full bg-gradient-to-l from-white to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200" 
               style={{ 
                 background: 'linear-gradient(to left, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 100%)',
                 display: 'none'
               }}
          />
        </div>
      </div>
      
      {/* Legend */}
      {showLegend && legend.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-100">
          <div className="text-sm font-medium text-gray-700 mb-3">Departments:</div>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {legend.map(({ key, label, color }) => (
              <div key={key} className="flex items-center space-x-1 sm:space-x-2 bg-gray-50 px-2 sm:px-3 py-1 rounded-md text-xs sm:text-sm">
                <div 
                  className="w-2 h-2 sm:w-3 sm:h-3 rounded-full flex-shrink-0" 
                  style={{ backgroundColor: color }}
                />
                <span className="text-gray-600 font-medium truncate">{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
