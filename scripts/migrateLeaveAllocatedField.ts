import mongoose from 'mongoose';
import connectDB from '../src/lib/mongodb';

interface LeaveBalance {
  sick: number;
  casual: number;
  annual: number;
  maternity?: number;
  paternity?: number;
  sick_alloted?: number;
  casual_alloted?: number;
  annual_alloted?: number;
  maternity_alloted?: number;
  paternity_alloted?: number;
  // New _allocated fields (using _alloted to match existing system)
  sick_allocated?: number;
  casual_allocated?: number;
  annual_allocated?: number;
  maternity_allocated?: number;
  paternity_allocated?: number;
}

interface UserProfile {
  _id: string;
  clerkUserId: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  leaveBalance: LeaveBalance;
  [key: string]: any;
}

async function migrateLeaveAllocatedField() {
  try {
    console.log('🚀 Starting leave balance _alloted field migration...');
    
    // Connect to MongoDB
    await connectDB();
    console.log('✅ Connected to MongoDB');

    // Default allocated values as specified by user (using _alloted to match existing system)
    const defaultAllocatedValues = {
      annual_alloted: 20,
      casual_alloted: 10,
      maternity_alloted: 0,
      paternity_alloted: 0,
      sick_alloted: 10
    };

    console.log('📋 Using default allocated values:', defaultAllocatedValues);

    // Get the UserProfile collection
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not available');
    }
    
    const userProfilesCollection = db.collection('userprofiles');
    
    // Find all user profiles
    const userProfiles = await userProfilesCollection.find({}).toArray();
    console.log(`📊 Found ${userProfiles.length} user profiles to migrate`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const userProfile of userProfiles) {
      const { _id, leaveBalance } = userProfile as any;
      
      // Check if _alloted fields already exist
      const hasAllotedFields = leaveBalance && 
        'sick_alloted' in leaveBalance && 
        'casual_alloted' in leaveBalance && 
        'annual_alloted' in leaveBalance && 
        'maternity_alloted' in leaveBalance && 
        'paternity_alloted' in leaveBalance;

      if (hasAllotedFields) {
        console.log(`⏭️  Skipping ${userProfile.firstName} ${userProfile.lastName} - _alloted fields already exist`);
        skippedCount++;
        continue;
      }

      // Prepare the update with _alloted fields using specified defaults
      const updateData = {
        $set: {
          'leaveBalance.sick_alloted': defaultAllocatedValues.sick_alloted,
          'leaveBalance.casual_alloted': defaultAllocatedValues.casual_alloted,
          'leaveBalance.annual_alloted': defaultAllocatedValues.annual_alloted,
          'leaveBalance.maternity_alloted': defaultAllocatedValues.maternity_alloted,
          'leaveBalance.paternity_alloted': defaultAllocatedValues.paternity_alloted
        }
      };

      // Update the document
      const result = await userProfilesCollection.updateOne(
        { _id: new mongoose.Types.ObjectId(_id) },
        updateData
      );

      if (result.modifiedCount === 1) {
        console.log(`✅ Updated ${userProfile.firstName} ${userProfile.lastName} (${userProfile.employeeId})`);
        updatedCount++;
      } else {
        console.log(`❌ Failed to update ${userProfile.firstName} ${userProfile.lastName} (${userProfile.employeeId})`);
      }
    }

    console.log('\n📈 Migration Summary:');
    console.log(`✅ Successfully updated: ${updatedCount} profiles`);
    console.log(`⏭️  Skipped (already migrated): ${skippedCount} profiles`);
    console.log(`📊 Total processed: ${userProfiles.length} profiles`);

    // Verify the migration by checking a few documents
    console.log('\n🔍 Verification - Sample updated documents:');
    const sampleDocs = await userProfilesCollection.find({}).limit(3).toArray();
    
    for (const doc of sampleDocs) {
      const { firstName, lastName, leaveBalance } = doc as any;
      console.log(`\n👤 ${firstName} ${lastName}:`);
      console.log(`   sick_alloted: ${leaveBalance?.sick_alloted !== undefined ? leaveBalance.sick_alloted : 'NOT SET'}`);
      console.log(`   casual_alloted: ${leaveBalance?.casual_alloted !== undefined ? leaveBalance.casual_alloted : 'NOT SET'}`);
      console.log(`   annual_alloted: ${leaveBalance?.annual_alloted !== undefined ? leaveBalance.annual_alloted : 'NOT SET'}`);
      console.log(`   maternity_alloted: ${leaveBalance?.maternity_alloted !== undefined ? leaveBalance.maternity_alloted : 'NOT SET'}`);
      console.log(`   paternity_alloted: ${leaveBalance?.paternity_alloted !== undefined ? leaveBalance.paternity_alloted : 'NOT SET'}`);
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    // Close the database connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the migration if this script is executed directly
if (require.main === module) {
  migrateLeaveAllocatedField()
    .then(() => {
      console.log('🎉 Migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

export { migrateLeaveAllocatedField };
