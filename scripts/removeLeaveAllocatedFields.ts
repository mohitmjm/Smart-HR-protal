import mongoose from 'mongoose';
import connectDB from '../src/lib/mongodb';

interface UserProfile {
  _id: string;
  clerkUserId: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  leaveBalance: any;
  [key: string]: any;
}

async function removeLeaveAllocatedFields() {
  try {
    console.log('🚀 Starting removal of _allocated fields from user profiles...');
    
    // Connect to MongoDB
    await connectDB();
    console.log('✅ Connected to MongoDB');

    // Get the UserProfile collection
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not available');
    }
    
    const userProfilesCollection = db.collection('userprofiles');
    
    // Find all user profiles
    const userProfiles = await userProfilesCollection.find({}).toArray();
    console.log(`📊 Found ${userProfiles.length} user profiles to process`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const userProfile of userProfiles) {
      const { _id, leaveBalance, firstName, lastName } = userProfile as any;
      
      // Check if _allocated fields exist
      const hasAllocatedFields = leaveBalance && (
        'sick_allocated' in leaveBalance || 
        'casual_allocated' in leaveBalance || 
        'annual_allocated' in leaveBalance || 
        'maternity_allocated' in leaveBalance || 
        'paternity_allocated' in leaveBalance
      );

      if (!hasAllocatedFields) {
        console.log(`⏭️  Skipping ${firstName} ${lastName} - no _allocated fields found`);
        skippedCount++;
        continue;
      }

      // Prepare the update to remove _allocated fields
      const updateData = {
        $unset: {
          'leaveBalance.sick_allocated': '',
          'leaveBalance.casual_allocated': '',
          'leaveBalance.annual_allocated': '',
          'leaveBalance.maternity_allocated': '',
          'leaveBalance.paternity_allocated': ''
        }
      };

      // Update the document
      const result = await userProfilesCollection.updateOne(
        { _id: new mongoose.Types.ObjectId(_id) },
        updateData
      );

      if (result.modifiedCount === 1) {
        console.log(`✅ Removed _allocated fields from ${firstName} ${lastName} (${userProfile.employeeId})`);
        updatedCount++;
      } else {
        console.log(`❌ Failed to update ${firstName} ${lastName} (${userProfile.employeeId})`);
      }
    }

    console.log('\n📈 Removal Summary:');
    console.log(`✅ Successfully updated: ${updatedCount} profiles`);
    console.log(`⏭️  Skipped (no _allocated fields): ${skippedCount} profiles`);
    console.log(`📊 Total processed: ${userProfiles.length} profiles`);

    // Verify the removal by checking a few documents
    console.log('\n🔍 Verification - Sample updated documents:');
    const sampleDocs = await userProfilesCollection.find({}).limit(3).toArray();
    
    for (const doc of sampleDocs) {
      const { firstName, lastName, leaveBalance } = doc as any;
      console.log(`\n👤 ${firstName} ${lastName}:`);
      console.log(`   sick_allocated: ${leaveBalance?.sick_allocated !== undefined ? leaveBalance.sick_allocated : 'REMOVED'}`);
      console.log(`   casual_allocated: ${leaveBalance?.casual_allocated !== undefined ? leaveBalance.casual_allocated : 'REMOVED'}`);
      console.log(`   annual_allocated: ${leaveBalance?.annual_allocated !== undefined ? leaveBalance.annual_allocated : 'REMOVED'}`);
      console.log(`   maternity_allocated: ${leaveBalance?.maternity_allocated !== undefined ? leaveBalance.maternity_allocated : 'REMOVED'}`);
      console.log(`   paternity_allocated: ${leaveBalance?.paternity_allocated !== undefined ? leaveBalance.paternity_allocated : 'REMOVED'}`);
    }

  } catch (error) {
    console.error('❌ Removal failed:', error);
    throw error;
  } finally {
    // Close the database connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the removal if this script is executed directly
if (require.main === module) {
  removeLeaveAllocatedFields()
    .then(() => {
      console.log('🎉 _allocated fields removal completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Removal failed:', error);
      process.exit(1);
    });
}

export { removeLeaveAllocatedFields };
