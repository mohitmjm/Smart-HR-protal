import connectDB from '../lib/mongodb';
import UserProfile from '../models/UserProfile';
import Team from '../models/Team';
import Attendance from '../models/Attendance';
import Leave from '../models/Leave';

async function checkHRDatabase() {
  try {
    console.log('🔄 Connecting to MongoDB HR database...');
    await connectDB();
    console.log('✅ Connected to MongoDB HR database');

    // Check UserProfiles
    console.log('\n👥 UserProfiles in HR database:');
    const userProfiles = await UserProfile.find({}).select('clerkUserId firstName lastName email employeeId department position isActive createdAt');
    
    if (userProfiles.length === 0) {
      console.log('   • No user profiles found');
    } else {
      userProfiles.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.firstName} ${user.lastName}`);
        console.log(`      • Clerk ID: ${user.clerkUserId}`);
        console.log(`      • Email: ${user.email}`);
        console.log(`      • Employee ID: ${user.employeeId}`);
        console.log(`      • Department: ${user.department}`);
        console.log(`      • Position: ${user.position}`);
        console.log(`      • Active: ${user.isActive}`);
        console.log(`      • Created: ${user.createdAt.toLocaleDateString()}`);
        console.log('');
      });
    }

    // Check Teams
    console.log('🏢 Teams in HR database:');
    const teams = await Team.find({});
    
    if (teams.length === 0) {
      console.log('   • No teams found');
    } else {
      for (const team of teams) {
        console.log(`   ${teams.indexOf(team) + 1}. ${team.name}`);
        console.log(`      • Description: ${team.description || 'N/A'}`);
        console.log(`      • Department: ${team.department || 'N/A'}`);
        
        // Fetch team leader details manually
        const teamLeader = await UserProfile.findOne({ clerkUserId: team.teamLeaderId });
        console.log(`      • Team Leader: ${teamLeader?.firstName || 'Unknown'} ${teamLeader?.lastName || 'Unknown'}`);
        console.log(`      • Members: ${team.members.length}`);
        
        // Fetch member details manually
        for (const memberId of team.members) {
          const member = await UserProfile.findOne({ clerkUserId: memberId });
          if (member) {
            console.log(`        - ${member.firstName} ${member.lastName} (${member.email})`);
          } else {
            console.log(`        - Unknown member (${memberId})`);
          }
        }
        console.log('');
      }
    }

    // Check Attendance
    console.log('🕒 Attendance records in HR database:');
    const attendanceCount = await Attendance.countDocuments();
    console.log(`   • Total attendance records: ${attendanceCount}`);

    // Check Leaves
    console.log('🏖️ Leave records in HR database:');
    const leaveCount = await Leave.countDocuments();
    console.log(`   • Total leave records: ${leaveCount}`);

    console.log('\n📊 HR Database Summary:');
    console.log(`   • UserProfiles: ${userProfiles.length}`);
    console.log(`   • Teams: ${teams.length}`);
    console.log(`   • Attendance: ${attendanceCount}`);
    console.log(`   • Leaves: ${leaveCount}`);

  } catch (error) {
    console.error('❌ Error checking HR database:', error);
  } finally {
    process.exit(0);
  }
}

// Run the check
checkHRDatabase();
