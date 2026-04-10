import connectDB from '../lib/mongodb';
import Team from '../models/Team';
import UserProfile from '../models/UserProfile';

async function createCoffeeTeam() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await connectDB();
    console.log('✅ Connected to MongoDB');

    // Get existing users from the database
    console.log('👥 Fetching existing users...');
    const users = await UserProfile.find({ isActive: true });
    console.log(`✅ Found ${users.length} active users`);

    if (users.length < 3) {
      console.log('⚠️ Need at least 3 users to create a team. Please run the Clerk sync script first.');
      process.exit(1);
    }

    // Check if Coffee team already exists
    const existingTeam = await Team.findOne({ name: 'Coffee' });
    if (existingTeam) {
      console.log('✅ Coffee team already exists');
      console.log('Team details:', {
        name: existingTeam.name,
        teamLeader: existingTeam.teamLeaderId,
        memberCount: existingTeam.members.length
      });
      process.exit(0);
    }

    // Use the first 3 users for the Coffee team
    const teamMembers = users.slice(0, 3);
    const teamLeader = teamMembers[0]; // First user becomes team leader

    console.log('👑 Team Leader:', `${teamLeader.firstName} ${teamLeader.lastName} (${teamLeader.position})`);
    console.log('👥 Team Members:');
    teamMembers.forEach((member, index) => {
      const role = index === 0 ? ' (Team Leader)' : '';
      console.log(`   • ${member.firstName} ${member.lastName} - ${member.position}${role}`);
    });

    // Create the Coffee team
    console.log('\n☕ Creating Coffee team...');
    const coffeeTeam = new Team({
      name: 'Coffee',
      description: 'A collaborative team focused on coffee and productivity',
      teamLeaderId: teamLeader.clerkUserId,
      members: teamMembers.map(user => user.clerkUserId),
      department: 'Cross-functional',
      isActive: true
    });

    await coffeeTeam.save();
    console.log('✅ Coffee team created successfully!');

    // Get the created team and manually fetch user details
    const createdTeam = await Team.findById(coffeeTeam._id);
    if (!createdTeam) {
      throw new Error('Failed to retrieve created team');
    }

    // Fetch user details manually since we're storing clerkUserId as strings
    const teamLeaderProfile = await UserProfile.findOne({ clerkUserId: createdTeam.teamLeaderId });
    const memberProfiles = await UserProfile.find({ clerkUserId: { $in: createdTeam.members } });

    console.log('\n📋 Coffee Team Details:');
    console.log(`   • Name: ${createdTeam.name}`);
    console.log(`   • Description: ${createdTeam.description}`);
    console.log(`   • Department: ${createdTeam.department}`);
    console.log(`   • Team Leader: ${teamLeaderProfile?.firstName} ${teamLeaderProfile?.lastName} (${teamLeaderProfile?.position})`);
    console.log(`   • Members: ${createdTeam.members.length}`);
    
    console.log('\n👥 Team Members:');
    memberProfiles.forEach((member) => {
      const isLeader = member.clerkUserId === createdTeam.teamLeaderId;
      const leaderBadge = isLeader ? ' 👑' : '';
      console.log(`   • ${member.firstName} ${member.lastName} - ${member.position} (${member.department})${leaderBadge}`);
    });

    console.log('\n🎉 Coffee team setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error creating Coffee team:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run the script
createCoffeeTeam();
