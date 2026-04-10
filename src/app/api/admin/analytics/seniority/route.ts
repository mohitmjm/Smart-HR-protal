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
    
    // Build query for active employees
    const query: any = { 
      isActive: true
    };
    
    // Add department filter if provided
    if (department && department !== 'all') {
      query.department = department;
    }
    
    // Get active employees
    const employees = await userProfilesCollection.find(query).toArray();
    
    // Get seniority levels from the org structure collection
    const orgStructureCollection = db.collection('orgstructures');
    const orgStructure = await orgStructureCollection.findOne({});
    
    if (!orgStructure || !orgStructure.seniorityLevels) {
      throw new Error('Seniority levels not found in database');
    }
    
    // Extract seniority levels and sort by order
    const seniorityLevels = orgStructure.seniorityLevels
      .filter((level: any) => level.isActive)
      .sort((a: any, b: any) => a.order - b.order)
      .map((level: any) => level.name);
    
    // Create a mapping of position names to seniority levels from departments
    const positionToSeniorityMap: { [position: string]: string } = {};
    
    if (orgStructure.departments) {
      orgStructure.departments.forEach((dept: any) => {
        if (dept.positions) {
          dept.positions.forEach((pos: any) => {
            if (pos.isActive && pos.seniorityLevel) {
              positionToSeniorityMap[pos.name.toLowerCase()] = pos.seniorityLevel;
            }
          });
        }
      });
    }
    
    // Function to determine seniority level from position
    const getSeniorityLevel = (position: string): string => {
      const pos = position.toLowerCase();
      
      // First try exact match from position mapping
      if (positionToSeniorityMap[pos]) {
        return positionToSeniorityMap[pos];
      }
      
      // Then try partial matches
      for (const [positionName, seniorityLevel] of Object.entries(positionToSeniorityMap)) {
        if (pos.includes(positionName) || positionName.includes(pos)) {
          return seniorityLevel;
        }
      }
      
      // If no match found, return the first seniority level as default
      return seniorityLevels[0] || 'Entry';
    };
    
    // Count employees by seniority level
    const seniorityCounts: { [level: string]: number } = {};
    
    employees.forEach((employee: any) => {
      const position = employee.position || 'Unknown';
      const seniorityLevel = getSeniorityLevel(position);
      
      if (!seniorityCounts[seniorityLevel]) {
        seniorityCounts[seniorityLevel] = 0;
      }
      seniorityCounts[seniorityLevel]++;
    });
    
    // Convert to chart data format, ensuring all levels are included
    const chartData = seniorityLevels.map((level: string) => ({
      level,
      count: seniorityCounts[level] || 0
    }));
    
    // Get all departments for filter from org structure
    const allDepartments = orgStructure.departments
      ?.filter((dept: any) => dept.isActive)
      .map((dept: any) => dept.name) || [];
    
    // Calculate total employees
    const totalEmployees = employees.length;
    
    return NextResponse.json({
      success: true,
      data: {
        chartData,
        totalEmployees,
        departments: allDepartments,
        selectedDepartment: department || 'all'
      }
    });

  } catch (error) {
    console.error('Error fetching seniority data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch seniority data' },
      { status: 500 }
    );
  }
}
