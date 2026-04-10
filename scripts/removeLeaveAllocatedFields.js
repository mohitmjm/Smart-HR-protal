// MongoDB script to remove _allocated fields from all user profiles
// Run with: mongosh your_database_name < removeLeaveAllocatedFields.js

print('🚀 Starting removal of _allocated fields from user profiles...');

// Get all user profiles
const userProfiles = db.userprofiles.find({}).toArray();
print(`📊 Found ${userProfiles.length} user profiles to process`);

let updatedCount = 0;
let skippedCount = 0;

// Process each user profile
userProfiles.forEach(userProfile => {
  const { _id, leaveBalance, firstName, lastName, employeeId } = userProfile;
  
  // Check if _allocated fields exist
  const hasAllocatedFields = leaveBalance && (
    'sick_allocated' in leaveBalance || 
    'casual_allocated' in leaveBalance || 
    'annual_allocated' in leaveBalance || 
    'maternity_allocated' in leaveBalance || 
    'paternity_allocated' in leaveBalance
  );

  if (!hasAllocatedFields) {
    print(`⏭️  Skipping ${firstName} ${lastName} - no _allocated fields found`);
    skippedCount++;
    return;
  }

  // Update the document to remove _allocated fields
  const result = db.userprofiles.updateOne(
    { _id: _id },
    {
      $unset: {
        'leaveBalance.sick_allocated': '',
        'leaveBalance.casual_allocated': '',
        'leaveBalance.annual_allocated': '',
        'leaveBalance.maternity_allocated': '',
        'leaveBalance.paternity_allocated': ''
      }
    }
  );

  if (result.modifiedCount === 1) {
    print(`✅ Removed _allocated fields from ${firstName} ${lastName} (${employeeId})`);
    updatedCount++;
  } else {
    print(`❌ Failed to update ${firstName} ${lastName} (${employeeId})`);
  }
});

print('\n📈 Removal Summary:');
print(`✅ Successfully updated: ${updatedCount} profiles`);
print(`⏭️  Skipped (no _allocated fields): ${skippedCount} profiles`);
print(`📊 Total processed: ${userProfiles.length} profiles`);

// Verify the removal by checking a few documents
print('\n🔍 Verification - Sample updated documents:');
const sampleDocs = db.userprofiles.find({}).limit(3).toArray();

sampleDocs.forEach(doc => {
  const { firstName, lastName, leaveBalance } = doc;
  print(`\n👤 ${firstName} ${lastName}:`);
  print(`   sick_allocated: ${leaveBalance?.sick_allocated !== undefined ? leaveBalance.sick_allocated : 'REMOVED'}`);
  print(`   casual_allocated: ${leaveBalance?.casual_allocated !== undefined ? leaveBalance.casual_allocated : 'REMOVED'}`);
  print(`   casual_allocated: ${leaveBalance?.casual_allocated !== undefined ? leaveBalance.casual_allocated : 'REMOVED'}`);
  print(`   annual_allocated: ${leaveBalance?.annual_allocated !== undefined ? leaveBalance.annual_allocated : 'REMOVED'}`);
  print(`   maternity_allocated: ${leaveBalance?.maternity_allocated !== undefined ? leaveBalance.maternity_allocated : 'REMOVED'}`);
  print(`   paternity_allocated: ${leaveBalance?.paternity_allocated !== undefined ? leaveBalance.paternity_allocated : 'REMOVED'}`);
});

print('🎉 _allocated fields removal completed successfully!');
