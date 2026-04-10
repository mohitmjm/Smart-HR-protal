import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const department = searchParams.get('department');
    
    // Get the database connection
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not available');
    }
    
    // Get attendance data
    const attendanceCollection = db.collection('attendances');
    const userProfilesCollection = db.collection('userprofiles');
    
    // Get all attendance records
    const allAttendanceRecords = await attendanceCollection.find({}).toArray();
    
    // Get user profiles to map clerkUserId to department
    const userProfiles = await userProfilesCollection.find({}).toArray();
    const userProfileMap = new Map();
    userProfiles.forEach(profile => {
      userProfileMap.set(profile.clerkUserId, {
        department: profile.department,
        employeeId: profile.employeeId,
        firstName: profile.firstName,
        lastName: profile.lastName
      });
    });
    
    // Get all departments from user profiles
    const allDepartments = userProfiles
      .map(profile => profile.department)
      .filter(Boolean)
      .filter((dept, index, arr) => arr.indexOf(dept) === index); // Remove duplicates
    
    // Generate all 12 months of 2025 - Jan to Dec
    const targetYear = 2025;
    const months: string[] = [];
    
    for (let month = 0; month < 12; month++) {
      months.push(`${targetYear}-${String(month + 1).padStart(2, '0')}`);
    }
    
    // Process attendance data by month and department
    const monthlyAttendance: { [key: string]: { [department: string]: { present: number; total: number } } } = {};
    
    allAttendanceRecords.forEach((record: any) => {
      if (record.date) {
        const recordDate = record.date instanceof Date ? record.date : new Date(record.date);
        const monthKey = `${recordDate.getFullYear()}-${String(recordDate.getMonth() + 1).padStart(2, '0')}`;
        
        // Get department from user profile using multiple possible fields
        let dept = 'Unknown';
        
        // Try all possible mapping methods in order of likelihood
        const possibleUserFields = [
          'clerkUserId', 'userId', 'user', 'employeeId', 'email', 
          'userEmail', 'employeeEmail', 'user_id', 'employee_id'
        ];
        
        for (const field of possibleUserFields) {
          if (record[field]) {
            // Try clerkUserId mapping first
            if (field === 'clerkUserId' && userProfileMap.has(record[field])) {
              const userProfile = userProfileMap.get(record[field]);
              dept = userProfile.department || 'Unknown';
              break;
            }
            // Try employeeId mapping
            else if (field === 'employeeId') {
              const userProfile = userProfiles.find(profile => profile.employeeId === record[field]);
              if (userProfile) {
                dept = userProfile.department || 'Unknown';
                break;
              }
            }
            // Try email mapping
            else if (field.includes('email') || field.includes('Email')) {
              const userProfile = userProfiles.find(profile => profile.email === record[field]);
              if (userProfile) {
                dept = userProfile.department || 'Unknown';
                break;
              }
            }
            // Try other user ID fields
            else if (field.includes('user') || field.includes('User')) {
              const userProfile = userProfiles.find(profile => profile.clerkUserId === record[field]);
              if (userProfile) {
                dept = userProfile.department || 'Unknown';
                break;
              }
            }
          }
        }
        
        // Fallback to record fields
        if (dept === 'Unknown') {
          dept = record.department || record.departmentName || record.employee?.department || 'Unknown';
        }
        
        // Apply department filter if specified
        if (department && department !== 'all' && dept !== department) {
          return; // Skip this record if it doesn't match the filter
        }
        
        if (!monthlyAttendance[monthKey]) {
          monthlyAttendance[monthKey] = {};
        }
        
        if (!monthlyAttendance[monthKey][dept]) {
          monthlyAttendance[monthKey][dept] = { present: 0, total: 0 };
        }
        
        // Count attendance based on status
        // Consider present, full day, preset, and regularized as "present"
        const isPresent = ['present', 'full day', 'preset', 'regularized'].includes(
          (record.status || '').toLowerCase()
        );
        
        monthlyAttendance[monthKey][dept].total++;
        if (isPresent) {
          monthlyAttendance[monthKey][dept].present++;
        }
      }
    });
    
    // Get all departments that have attendance data
    const departmentsWithData = new Set<string>();
    Object.values(monthlyAttendance).forEach(monthData => {
      Object.keys(monthData).forEach(dept => departmentsWithData.add(dept));
    });
    
    // Use real departments from user profiles, show 0% for months without data
    if (departmentsWithData.size === 0 || (departmentsWithData.size === 1 && departmentsWithData.has('Unknown'))) {
      // If filtering by specific department, only show that department
      if (department && department !== 'all') {
        departmentsWithData.add(department);
      } else {
        // Use actual departments from user profiles
        allDepartments.forEach(dept => {
          departmentsWithData.add(dept);
        });
      }
    }
    
    // Convert to chart data format - only show months with actual data
    const chartData = months.map(month => {
      const monthData: any = { month };
      
      // Only include departments that have data for this specific month
      const monthDepartments = monthlyAttendance[month] ? Object.keys(monthlyAttendance[month]) : [];
      
      // If no departments have data for this month, show 0% for all departments
      if (monthDepartments.length === 0) {
        departmentsWithData.forEach(dept => {
          monthData[dept] = 0;
        });
      } else {
        // Show actual data for departments that have it, 0% for others
        departmentsWithData.forEach(dept => {
          const deptData = monthlyAttendance[month]?.[dept] || { present: 0, total: 0 };
          const percentage = deptData.total > 0 ? (deptData.present / deptData.total) * 100 : 0;
          monthData[dept] = Math.round(percentage * 100) / 100;
        });
      }
      
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
      '#EC4899', // pink
      '#6366F1', // indigo
    ];
    
    const legend = Array.from(departmentsWithData).map((dept, index) => ({
      key: dept,
      label: dept,
      color: departmentColors[index % departmentColors.length]
    }));
    
    // Calculate overall attendance percentage
    const totalPresent = Object.values(monthlyAttendance).reduce((sum, monthData) => 
      Object.values(monthData).reduce((monthSum, deptData) => monthSum + deptData.present, 0), 0
    );
    
    const totalRecords = Object.values(monthlyAttendance).reduce((sum, monthData) => 
      Object.values(monthData).reduce((monthSum, deptData) => monthSum + deptData.total, 0), 0
    );
    
    const overallAttendance = totalRecords > 0 ? (totalPresent / totalRecords) * 100 : 0;
    
    return NextResponse.json({
      success: true,
      data: {
        chartData,
        legend,
        overallAttendance: Math.round(overallAttendance * 100) / 100,
        departments: allDepartments,
        selectedDepartment: department || 'all'
      }
    });

  } catch (error) {
    console.error('Error fetching attendance data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch attendance data' },
      { status: 500 }
    );
  }
}
