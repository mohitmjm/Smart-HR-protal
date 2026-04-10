#!/usr/bin/env tsx

/**
 * Migration script to fix attendance records with incorrect totalHours
 * This script recalculates totalHours and status for all attendance records
 * that may have been affected by the bug where active sessions (no clock-out)
 * were not properly calculated.
 */

import mongoose from 'mongoose';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

import connectDB from '../src/lib/mongodb';
import Attendance from '../src/models/Attendance';
import { calculateAttendanceStatus } from '../src/lib/attendanceUtils';
import UserProfile from '../src/models/UserProfile';

interface SessionData {
  clockIn: Date;
  clockOut?: Date;
  duration?: number;
}

async function fixAttendanceTotalHours() {
  try {
    console.log('🔧 Starting attendance totalHours fix migration...');
    
    // Connect to database
    await connectDB();
    console.log('✅ Connected to database');

    // Find all attendance records
    const attendanceRecords = await Attendance.find({}).lean();
    console.log(`📊 Found ${attendanceRecords.length} attendance records to process`);

    let fixedCount = 0;
    let errorCount = 0;

    for (const record of attendanceRecords) {
      try {
        // Get user profile for timezone
        const userProfile = await UserProfile.findOne({ clerkUserId: record.userId });
        const userTimezone = userProfile?.timezone || 'UTC';

        // Prepare session data for calculation
        const sessionData: SessionData[] = record.sessions.map((session: any) => ({
          clockIn: session.clockIn,
          clockOut: session.clockOut,
          duration: session.duration
        }));

        // Only recalculate status if it's not already regularized
        if (record.status !== 'regularized') {
          // Calculate correct attendance status
          const attendanceResult = await calculateAttendanceStatus(
            sessionData,
            new Date(record.date),
            userTimezone
          );

          // Check if the record needs updating
          const needsUpdate = 
            record.totalHours !== attendanceResult.totalHours ||
            record.status !== attendanceResult.status;

          if (needsUpdate) {
            console.log(`🔄 Updating record for user ${record.userId} on ${record.date}:`);
            console.log(`   Old: ${record.totalHours} hours, ${record.status}`);
            console.log(`   New: ${attendanceResult.totalHours} hours, ${attendanceResult.status}`);

            // Update the record
            await Attendance.updateOne(
              { _id: record._id },
              {
                $set: {
                  totalHours: attendanceResult.totalHours,
                  status: attendanceResult.status,
                  updatedAt: new Date()
                }
              }
            );
          }
        } else {
          console.log(`⏭️ Skipping regularized record for user ${record.userId} on ${record.date} (status: ${record.status})`);
          
          // Still update total hours even if status is regularized
          const { calculateTotalHours } = await import('../src/lib/attendanceUtils');
          const correctTotalHours = calculateTotalHours(sessionData);
          
          if (record.totalHours !== correctTotalHours) {
            console.log(`🔄 Updating total hours for regularized record: ${record.totalHours} → ${correctTotalHours}`);
            await Attendance.updateOne(
              { _id: record._id },
              {
                $set: {
                  totalHours: correctTotalHours,
                  updatedAt: new Date()
                }
              }
            );
          }
        }

        fixedCount++;
      } catch (error) {
        console.error(`❌ Error processing record for user ${record.userId} on ${record.date}:`, error);
        errorCount++;
      }
    }

    console.log('\n📈 Migration Summary:');
    console.log(`   Total records processed: ${attendanceRecords.length}`);
    console.log(`   Records fixed: ${fixedCount}`);
    console.log(`   Errors: ${errorCount}`);
    console.log(`   Records already correct: ${attendanceRecords.length - fixedCount - errorCount}`);

    if (errorCount > 0) {
      console.log('\n⚠️  Some records had errors. Please review the logs above.');
    } else {
      console.log('\n🎉 Migration completed successfully!');
    }

  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the migration
if (require.main === module) {
  fixAttendanceTotalHours()
    .then(() => {
      console.log('✅ Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration script failed:', error);
      process.exit(1);
    });
}

export default fixAttendanceTotalHours;
