import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import OrgStructure from '@/models/OrgStructure';
import { checkHRManagerAccess } from '@/lib/adminAuth';

export async function GET(req: NextRequest) {
  try {
    // Check if user has HR Manager access
    const adminUser = await checkHRManagerAccess(req);
    if (!adminUser) {
      return NextResponse.json(
        { error: 'Access denied. HR Manager privileges required.' },
        { status: 403 }
      );
    }

    // Connect to database
    await connectDB();

    // Get all positions from all departments
    const orgStructure = await OrgStructure.findOne({});
    
    if (!orgStructure) {
      return NextResponse.json({
        success: true,
        data: []
      });
    }

    const allPositions = orgStructure.departments
      .filter((dept: any) => dept.isActive)
      .flatMap((dept: any) => 
        dept.positions
          .filter((pos: any) => pos.isActive)
          .map((pos: any) => ({
            _id: pos._id,
            name: pos.name,
            description: pos.description,
            seniorityLevel: pos.seniorityLevel,
            department: dept.name,
            departmentId: dept._id
          }))
      );

    return NextResponse.json({
      success: true,
      data: allPositions
    });
  } catch (error) {
    console.error('Admin orgstructure positions GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Check if user has HR Manager access
    const adminUser = await checkHRManagerAccess(req);
    if (!adminUser) {
      return NextResponse.json(
        { error: 'Access denied. HR Manager privileges required.' },
        { status: 403 }
      );
    }

    // Connect to database
    await connectDB();

    const { name, description, seniorityLevel, departmentId } = await req.json();

    // Get org structure
    const orgStructure = await OrgStructure.findOne({});
    if (!orgStructure) {
      return NextResponse.json(
        { error: 'Organization structure not found' },
        { status: 404 }
      );
    }

    // Find department
    const department = orgStructure.departments.find((dept: any) => dept._id.toString() === departmentId);
    if (!department) {
      return NextResponse.json(
        { error: 'Department not found' },
        { status: 404 }
      );
    }

    // Check if position already exists in this department
    const existingPos = department.positions.find((pos: any) => pos.name === name);
    if (existingPos) {
      return NextResponse.json(
        { error: 'Position already exists in this department' },
        { status: 400 }
      );
    }

    // Add new position
    department.positions.push({
      name,
      description: description || '',
      seniorityLevel: seniorityLevel || 'Mid',
      isActive: true
    });

    await orgStructure.save();

    const newPosition = department.positions[department.positions.length - 1];

    return NextResponse.json({
      success: true,
      data: {
        _id: newPosition._id,
        name: newPosition.name,
        description: newPosition.description,
        seniorityLevel: newPosition.seniorityLevel,
        department: department.name,
        departmentId: department._id
      }
    });
  } catch (error) {
    console.error('Admin orgstructure positions POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
