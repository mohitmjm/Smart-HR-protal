// MongoDB script to add _alloted field with default leave values for all users
// Run with: mongosh your_database_name < migrateLeaveAllocatedField.js

// Default allocated values (using _alloted to match existing system)
const defaultAllocatedValues = {
  annual_alloted: 20,
  casual_alloted: 10,
  maternity_alloted: 0,
  paternity_alloted: 0,
  sick_alloted: 10
};

print('🚀 Starting leave balance _alloted field migration...');

// Get all user profiles
const userProfiles = db.userprofiles.find({}).toArray();
print(`📊 Found ${userProfiles.length} user profiles to migrate`);

let updatedCount = 0;
let skippedCount = 0;

// Process each user profile
userProfiles.forEach(userProfile => {
  const { _id, leaveBalance, firstName, lastName, employeeId } = userProfile;
  
  // Check if _alloted fields already exist
  const hasAllotedFields = leaveBalance && 
    'sick_alloted' in leaveBalance && 
    'casual_alloted' in leaveBalance && 
    'annual_alloted' in leaveBalance && 
    'maternity_alloted' in leaveBalance && 
    'paternity_alloted' in leaveBalance;

  if (hasAllotedFields) {
    print(`⏭️  Skipping ${firstName} ${lastName} - _alloted fields already exist`);
    skippedCount++;
    return;
  }

  // Update the document with _alloted fields
  const result = db.userprofiles.updateOne(
    { _id: _id },
    {
      $set: {
        'leaveBalance.sick_alloted': defaultAllocatedValues.sick_alloted,
        'leaveBalance.casual_alloted': defaultAllocatedValues.casual_alloted,
        'leaveBalance.annual_alloted': defaultAllocatedValues.annual_alloted,
        'leaveBalance.maternity_alloted': defaultAllocatedValues.maternity_alloted,
        'leaveBalance.paternity_alloted': defaultAllocatedValues.paternity_alloted
      }
    }
  );

  if (result.modifiedCount === 1) {
    print(`✅ Updated ${firstName} ${lastName} (${employeeId})`);
    updatedCount++;
  } else {
    print(`❌ Failed to update ${firstName} ${lastName} (${employeeId})`);
  }
});

print('\n📈 Migration Summary:');
print(`✅ Successfully updated: ${updatedCount} profiles`);
print(`⏭️  Skipped (already migrated): ${skippedCount} profiles`);
print(`📊 Total processed: ${userProfiles.length} profiles`);

// Verify the migration by checking a few documents
print('\n🔍 Verification - Sample updated documents:');
const sampleDocs = db.userprofiles.find({}).limit(3).toArray();

sampleDocs.forEach(doc => {
  const { firstName, lastName, leaveBalance } = doc;
  print(`\n👤 ${firstName} ${lastName}:`);
  print(`   sick_alloted: ${leaveBalance?.sick_alloted !== undefined ? leaveBalance.sick_alloted : 'NOT SET'}`);
  print(`   casual_alloted: ${leaveBalance?.casual_alloted !== undefined ? leaveBalance.casual_alloted : 'NOT SET'}`);
  print(`   annual_alloted: ${leaveBalance?.annual_alloted !== undefined ? leaveBalance.annual_alloted : 'NOT SET'}`);
  print(`   maternity_alloted: ${leaveBalance?.maternity_alloted !== undefined ? leaveBalance.maternity_alloted : 'NOT SET'}`);
  print(`   paternity_alloted: ${leaveBalance?.paternity_alloted !== undefined ? leaveBalance.paternity_alloted : 'NOT SET'}`);
});

print('🎉 Migration completed successfully!');
