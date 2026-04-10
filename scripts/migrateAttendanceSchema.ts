import connectDB from '../src/lib/mongodb';
import mongoose from 'mongoose';

// Import the old and new models
const OldAttendanceSchema = new mongoose.Schema({
  userId: String,
  date: Date,
  clockIn: Date,
  clockOut: Date,
  totalHours: Number,
  status: String,
  notes: String
}, { timestamps: true });

const OldAttendance = mongoose.models.OldAttendance || mongoose.model('OldAttendance', OldAttendanceSchema);

// New schema (import from the updated model)
import Attendance, { IAttendanceSession } from '../src/models/Attendance';

async function migrateAttendanceSchema() {
  try {
    console.log('Starting attendance schema migration...');
    
    await connectDB();
    
    // Get all old attendance records
    const oldRecords = await OldAttendance.find({});
    console.log(`Found ${oldRecords.length} old attendance records to migrate`);
    
    let migratedCount = 0;
    let skippedCount = 0;
    
    for (const oldRecord of oldRecords) {
      try {
        // Check if new record already exists for this date
        const existingRecord = await Attendance.findOne({
          userId: oldRecord.userId,
          date: oldRecord.date
        });
        
        if (existingRecord) {
          console.log(`Skipping ${oldRecord.userId} on ${oldRecord.date} - already migrated`);
          skippedCount++;
          continue;
        }
        
        // Create new session from old record
        const session: IAttendanceSession = {
          _id: new mongoose.Types.ObjectId().toString(),
          clockIn: oldRecord.clockIn,
          clockOut: oldRecord.clockOut,
          duration: oldRecord.totalHours,
          notes: oldRecord.notes
        };
        
        // Determine new status based on hours
        let newStatus = 'half-day';
        if (oldRecord.totalHours && oldRecord.totalHours >= 8) {
          newStatus = 'full-day';
        } else if (oldRecord.totalHours && oldRecord.totalHours < 6) {
          newStatus = 'half-day';
        }
        
        // Create new attendance record with hybrid schema
        const newAttendance = new Attendance({
          userId: oldRecord.userId,
          date: oldRecord.date,
          // Main branch fields
          clockIn: oldRecord.clockIn, // First clock-in
          clockOut: oldRecord.clockOut, // Last clock-out
          totalHours: oldRecord.totalHours || 0, // Effective hours
          status: newStatus,
          notes: oldRecord.notes || '',
          // Detailed sessions
          sessions: [session]
        });
        
        await newAttendance.save();
        migratedCount++;
        
        console.log(`Migrated record for ${oldRecord.userId} on ${oldRecord.date}`);
        console.log(`  Status: ${oldRecord.status} → ${newStatus}`);
        console.log(`  Hours: ${oldRecord.totalHours || 0}`);
        
      } catch (error) {
        console.error(`Error migrating record for ${oldRecord.userId} on ${oldRecord.date}:`, error);
      }
    }
    
    console.log(`\nMigration completed!`);
    console.log(`Migrated: ${migratedCount} records`);
    console.log(`Skipped: ${skippedCount} records`);
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  migrateAttendanceSchema();
}

export default migrateAttendanceSchema;
