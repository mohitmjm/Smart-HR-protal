import connectDB from '../lib/mongodb';
import UserProfile from '../models/UserProfile';
import Attendance from '../models/Attendance';
import Leave from '../models/Leave';
import Team from '../models/Team';



async function seedDatabase() {
  try {
    console.log('🔄 Connecting to MongoDB HR database...');
    await connectDB();
    console.log('✅ Connected to MongoDB HR database successfully!');

    // Clear existing HR data only
    console.log('🧹 Clearing existing HR data...');
    await Attendance.deleteMany({});
    await Leave.deleteMany({});
    await UserProfile.deleteMany({});
    await Team.deleteMany({});
    console.log('✅ Existing HR data cleared');

    // Note: User profiles need to be created manually or via other means
    console.log('👤 Skipping user profile creation - create users manually or via other scripts');

    // Note: Attendance and Leave records require existing users
    console.log('🕒 Skipping attendance and leave creation - requires existing users');

    // Display summary
    console.log('\n📊 Database Seeding Summary:');
    console.log(`   • UserProfiles: Create manually or via other scripts`);
    console.log(`   • Teams: Created via createCoffeeTeam.ts`);
    console.log(`   • Attendance: Requires users from Clerk first`);
    console.log(`   • Leaves: Requires users from Clerk first`);
    
    console.log('\n💡 Next steps:');
    console.log('   1. Create user profiles manually or via other scripts');
    console.log('   2. Run: npm run create:coffee-team (to create the Coffee team)');

    console.log('\n🎉 Database seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}
// In order to allow dynamic imports without executing globally:
if (require.main === module) {
  seedDatabase().then(() => {
    console.log('Seeder finished running manually.');
    process.exit(0);
  }).catch((err) => {
    console.error('Seeder failed:', err);
    process.exit(1);
  });
}
