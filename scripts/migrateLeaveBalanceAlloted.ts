import mongoose from 'mongoose';
import connectDB from '../src/lib/mongodb';
import { LeaveConfigService } from '../src/lib/leaveConfigService';

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

async function migrateLeaveBalanceAlloted() {
  try {
    console.log('🚀 Starting leave balance _alloted migration...');
    
    // Connect to MongoDB
    await connectDB();
    console.log('✅ Connected to MongoDB');

    // Get default allocations from configuration
    const defaultAllocations = await LeaveConfigService.getDefaultAllocations();
    console.log('📋 Using default allocations:', defaultAllocations);

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

      // Prepare the update with _alloted fields using configuration defaults
      const updateData = {
        $set: {
          'leaveBalance.sick_alloted': defaultAllocations.sick,
          'leaveBalance.casual_alloted': defaultAllocations.casual,
          'leaveBalance.annual_alloted': defaultAllocations.annual,
          'leaveBalance.maternity_alloted': defaultAllocations.maternity,
          'leaveBalance.paternity_alloted': defaultAllocations.paternity
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
  migrateLeaveBalanceAlloted()
    .then(() => {
      console.log('🎉 Migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

export { migrateLeaveBalanceAlloted };
