import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const department = searchParams.get('department');
    
    // Get the userprofiles collection directly
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not available');
    }
    const userProfilesCollection = db.collection('userprofiles');
    
    // Build query for active employees with join dates
    const query: any = { 
      isActive: true,
      joinDate: { $exists: true }
    };
    
    // Add department filter if provided
    if (department && department !== 'all') {
      query.department = department;
    }
    
    // Get active employees with join dates
    const activeEmployees = await userProfilesCollection.find(query).toArray();
    
    // Process data to group by month and department
    const monthlyHires: { [key: string]: { [department: string]: number } } = {};
    
    activeEmployees.forEach((employee: any) => {
      if (employee.joinDate) {
        const joinDate = employee.joinDate instanceof Date ? employee.joinDate : new Date(employee.joinDate);
        const monthKey = `${joinDate.getFullYear()}-${String(joinDate.getMonth() + 1).padStart(2, '0')}`;
        const department = employee.department || 'unknown';
        
        
        if (!monthlyHires[monthKey]) {
          monthlyHires[monthKey] = {};
        }
        
        if (!monthlyHires[monthKey][department]) {
          monthlyHires[monthKey][department] = 0;
        }
        
        monthlyHires[monthKey][department]++;
      }
    });

    // Generate all 12 months of 2025 - Jan to Dec (force 2025)
    const targetYear = 2025;
    const months: string[] = [];
    
    for (let month = 0; month < 12; month++) {
      months.push(`${targetYear}-${String(month + 1).padStart(2, '0')}`);
    }
    
    const allDepartments = new Set<string>();
    
    // Collect all unique departments
    Object.values(monthlyHires).forEach(monthData => {
      Object.keys(monthData).forEach(department => allDepartments.add(department));
    });

    const chartData = months.map(month => {
      const monthData: any = { month };
      allDepartments.forEach(department => {
        monthData[department] = monthlyHires[month] ? (monthlyHires[month][department] || 0) : 0;
      });
      return monthData;
    });

    // Get department colors for legend
    const departmentColors = [
      '#3B82F6', // blue
      '#EF4444', // red
      '#10B981', // green
      '#F59E0B', // yellow
      '#8B5CF6', // purple
      '#F97316', // orange
      '#06B6D4', // cyan
      '#84CC16', // lime
    ];

    const legend = Array.from(allDepartments).map((department, index) => ({
      key: department,
      label: department,
      color: departmentColors[index % departmentColors.length]
    }));

    // Calculate total hires from chart data
    const totalHiresFromData = chartData.reduce((sum, month) => {
      const monthTotal = Object.entries(month)
        .filter(([, val]) => typeof val === 'number')
        .reduce((monthSum, [, val]) => monthSum + (val as number), 0);
      return sum + monthTotal;
    }, 0);

    return NextResponse.json({
      success: true,
      data: {
        chartData,
        legend,
        totalHires: totalHiresFromData
      }
    });

  } catch (error) {
    console.error('Error fetching hires data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch hires data' },
      { status: 500 }
    );
  }
}
