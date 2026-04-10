import dotenv from 'dotenv';
import connectDB from '../lib/mongodb';
import UserProfile from '../models/UserProfile';

dotenv.config({ path: '.env.local' });

async function main() {
  try {
    await connectDB();

    // Upsert Great Gaba (manager)
    const manager = await UserProfile.findOneAndUpdate(
      { email: 'great.gaba@example.com' },
      {
        $setOnInsert: {
          clerkUserId: 'user-great-gaba',
          employeeId: 'EMP-GREAT',
          firstName: 'Great',
          lastName: 'Gaba',
          department: 'General',
          position: 'Manager',
          joinDate: new Date('2024-01-01'),
        },
        $set: {
          isActive: true,
        },
      },
      { upsert: true, new: true }
    );

    // Upsert Gaba Tuba (employee)
    const subordinate = await UserProfile.findOneAndUpdate(
      { email: 'gaba.tuba@example.com' },
      {
        $setOnInsert: {
          clerkUserId: 'user-gaba-tuba',
          employeeId: 'EMP-GABA',
          firstName: 'Gaba',
          lastName: 'Tuba',
          department: 'General',
          position: 'Employee',
          joinDate: new Date('2024-02-01'),
        },
        $set: {
          isActive: true,
          managerId: manager.clerkUserId,
        },
      },
      { upsert: true, new: true }
    );

    console.log('👤 Manager:', manager.firstName, manager.lastName, manager.clerkUserId);
    console.log('👥 Subordinate:', subordinate.firstName, subordinate.lastName, 'managerId ->', subordinate.managerId);
    console.log('🎉 Manager-subordinate relation upserted');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error upserting manager relation:', err);
    process.exit(1);
  }
}

main();


