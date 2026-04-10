import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const department = searchParams.get('department');
    
    // Get the exits collection directly
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not available');
    }
    const exitsCollection = db.collection('exits');
    
    // Build query for exits
    const query: any = {};
    
    // Add department filter if provided
    if (department && department !== 'all') {
      query.department = department;
    }
    
    // Get exits data from the exits collection
    const exits = await exitsCollection.find(query).toArray();

    console.log('Found exits:', exits.length);
    console.log('Sample exit:', exits[0]);
    
    // Debug: Check what months we're processing
    exits.forEach((exit: any) => {
      if (exit.exitDate) {
        const exitDate = exit.exitDate instanceof Date ? exit.exitDate : new Date(exit.exitDate);
        const monthKey = `${exitDate.getFullYear()}-${String(exitDate.getMonth() + 1).padStart(2, '0')}`;
        console.log(`Exit date: ${exitDate}, Month key: ${monthKey}`);
      }
    });

    // Process data to group by month and reason
    const monthlyExits: { [key: string]: { [reason: string]: number } } = {};
    
    exits.forEach((exit: any) => {
      if (exit.exitDate) {
        // Handle both Date objects and timestamp numbers
        const exitDate = exit.exitDate instanceof Date ? exit.exitDate : new Date(exit.exitDate);
        const monthKey = `${exitDate.getFullYear()}-${String(exitDate.getMonth() + 1).padStart(2, '0')}`;
        const reason = exit.exitReason || 'unknown';
        
        console.log(`Processing exit: ${exit.firstName} ${exit.lastName}, Date: ${exitDate}, Reason: ${reason}`);
        
        if (!monthlyExits[monthKey]) {
          monthlyExits[monthKey] = {};
        }
        
        if (!monthlyExits[monthKey][reason]) {
          monthlyExits[monthKey][reason] = 0;
        }
        
        monthlyExits[monthKey][reason]++;
      }
    });

    // Generate all 12 months of 2025 - Jan to Dec (force 2025)
    const targetYear = 2025;
    const months: string[] = [];
    
    for (let month = 0; month < 12; month++) {
      months.push(`${targetYear}-${String(month + 1).padStart(2, '0')}`);
    }
    
    console.log('Generated months for year:', targetYear, months);

    const allReasons = new Set<string>();
    
    // Collect all unique reasons
    Object.values(monthlyExits).forEach(monthData => {
      Object.keys(monthData).forEach(reason => allReasons.add(reason));
    });

    const chartData = months.map(month => {
      const monthData: any = { month };
      allReasons.forEach(reason => {
        monthData[reason] = monthlyExits[month] ? (monthlyExits[month][reason] || 0) : 0;
      });
      return monthData;
    });

    // Get reason colors for legend
    const reasonColors = [
      '#3B82F6', // blue
      '#EF4444', // red
      '#10B981', // green
      '#F59E0B', // yellow
      '#8B5CF6', // purple
      '#F97316', // orange
      '#06B6D4', // cyan
      '#84CC16', // lime
    ];

    const legend = Array.from(allReasons).map((reason, index) => ({
      reason,
      color: reasonColors[index % reasonColors.length]
    }));

    console.log('Processed monthly exits:', monthlyExits);
    console.log('Chart data:', chartData);
    console.log('Legend:', legend);

    // Calculate total exits from chart data
    const totalExitsFromData = chartData.reduce((sum, month) => {
      const monthTotal = Object.entries(month)
        .filter(([, val]) => typeof val === 'number')
        .reduce((monthSum, [, val]) => monthSum + (val as number), 0);
      return sum + monthTotal;
    }, 0);

    console.log('Total exits from data:', totalExitsFromData);

    return NextResponse.json({
      success: true,
      data: {
        chartData,
        legend,
        totalExits: totalExitsFromData
      }
    });

  } catch (error) {
    console.error('Error fetching exits data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch exits data' },
      { status: 500 }
    );
  }
}
