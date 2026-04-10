import mongoose from 'mongoose';
import { config } from 'dotenv';
import connectDB from '../src/lib/mongodb';
import Attendance from '../src/models/Attendance';

// Load environment variables
config({ path: '.env.local' });

/**
 * Migration script to convert attendance date field from UTC timestamps to local date strings
 * This script will:
 * 1. Find all attendance records with date field as Date objects
 * 2. Convert them to local date strings (YYYY-MM-DD format)
 * 3. Update the records in MongoDB
 */

async function migrateAttendanceDates() {
  try {
    console.log('🔄 Starting attendance date migration...');
    console.log('📝 This will convert date fields from UTC timestamps to local date strings (YYYY-MM-DD)');
    
    // Connect to MongoDB
    await connectDB();
    console.log('✅ Connected to MongoDB');

    // Find all attendance records
    const attendanceRecords = await Attendance.find({});
    console.log(`📊 Found ${attendanceRecords.length} attendance records to process`);

    if (attendanceRecords.length === 0) {
      console.log('ℹ️  No attendance records found. Migration complete.');
      return;
    }

    let processedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // Process records in batches to avoid memory issues
    const batchSize = 100;
    const totalBatches = Math.ceil(attendanceRecords.length / batchSize);

    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const startIndex = batchIndex * batchSize;
      const endIndex = Math.min(startIndex + batchSize, attendanceRecords.length);
      const batch = attendanceRecords.slice(startIndex, endIndex);

      console.log(`\n📦 Processing batch ${batchIndex + 1}/${totalBatches} (records ${startIndex + 1}-${endIndex})`);

      for (const record of batch) {
        try {
          // Check if date is already a string (already migrated)
          if (typeof record.date === 'string') {
            // Validate the string format
            if (/^\d{4}-\d{2}-\d{2}$/.test(record.date)) {
              skippedCount++;
              continue;
            } else {
              // Try to parse the date string and convert to YYYY-MM-DD format
              try {
                const parsedDate = new Date(record.date);
                if (!isNaN(parsedDate.getTime())) {
                  const localDateString = parsedDate.toISOString().split('T')[0];
                  
                  // Update the record
                  await Attendance.updateOne(
                    { _id: record._id },
                    { $set: { date: localDateString } }
                  );
                  
                  console.log(`✅ Migrated record ${record._id}: "${record.date}" → ${localDateString}`);
                  processedCount++;
                } else {
                  console.log(`⚠️  Record ${record._id} has invalid date string that cannot be parsed: "${record.date}"`);
                  errorCount++;
                }
              } catch (parseError) {
                console.log(`⚠️  Record ${record._id} has invalid date string format: "${record.date}"`);
                errorCount++;
              }
            }
          }

          // Check if date is a Date object
          if (record.date instanceof Date) {
            // Convert UTC date to local date string
            const localDateString = record.date.toISOString().split('T')[0];
            
            // Update the record
            await Attendance.updateOne(
              { _id: record._id },
              { $set: { date: localDateString } }
            );
            
            console.log(`✅ Migrated record ${record._id}: ${record.date.toISOString()} → ${localDateString}`);
            processedCount++;
          } else {
            console.log(`⚠️  Record ${record._id} has unexpected date type: ${typeof record.date}, value: ${record.date}`);
            errorCount++;
          }
        } catch (error) {
          console.error(`❌ Error processing record ${record._id}:`, error);
          errorCount++;
        }
      }
    }

    console.log('\n📈 Migration Summary:');
    console.log(`✅ Successfully processed: ${processedCount} records`);
    console.log(`❌ Errors: ${errorCount} records`);
    console.log(`⏭️  Already migrated: ${attendanceRecords.length - processedCount - errorCount} records`);
    console.log(`📊 Total records: ${attendanceRecords.length}`);

    // Verify migration by checking a few records
    console.log('\n🔍 Verification - Sample of migrated records:');
    const sampleRecords = await Attendance.find({}).limit(5);
    sampleRecords.forEach(record => {
      console.log(`Record ${record._id}: date = "${record.date}" (type: ${typeof record.date})`);
    });

  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
    process.exit(0);
  }
}

// Run the migration
if (require.main === module) {
  migrateAttendanceDates();
}

export default migrateAttendanceDates;
