/**
 * Migration script to populate MongoDB with current settings
 * This script will create default system settings and migrate any existing settings
 */

// Load environment variables
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') });

import connectDB from '../src/lib/mongodb';
import SystemSettings from '../src/models/SystemSettings';
import UserSettings from '../src/models/UserSettings';

async function migrateSettingsToDatabase() {
  try {
    console.log('🚀 Starting settings migration to MongoDB...');
    
    // Connect to MongoDB
    await connectDB();
    console.log('✅ Connected to MongoDB');

    // Create or update system settings
    console.log('📋 Creating/updating system settings...');
    
    const systemSettings = await SystemSettings.findOneAndUpdate(
      {}, // Find any document (since we ensure uniqueness)
      {
        general: {
          companyName: 'HR Dashboard',
          companyLogo: '',
          companyAddress: '',
          companyPhone: '',
          companyEmail: '',
          timezone: 'UTC',
          workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          workingHours: {
            start: '09:00',
            end: '17:00'
          },
          currency: 'USD',
          dateFormat: 'MM/DD/YYYY',
          timeFormat: '12h',
          language: 'en'
        },
        leave: {
          defaultLeaveTypes: ['Annual Leave', 'Sick Leave', 'Personal Leave', 'Maternity Leave', 'Paternity Leave'],
          maxLeaveDays: 25,
          requireApproval: true,
          allowNegativeBalance: false,
          carryForwardEnabled: true,
          maxCarryForwardDays: 5,
          probationPeriod: 90
        },
        attendance: {
          requireClockIn: true,
          requireClockOut: true,
          lateThreshold: 15,
          earlyLeaveThreshold: 15,
          overtimeEnabled: true,
          breakTimeEnabled: true,
          defaultBreakDuration: 60,
          geoLocationRequired: false,
          ipRestrictionEnabled: false
        },
        notifications: {
          emailNotifications: true,
          slackNotifications: false,
          leaveApprovalReminders: true,
          attendanceAlerts: true,
          systemMaintenanceAlerts: true,
          weeklyReports: false,
          monthlyReports: true
        },
        security: {
          require2FA: false,
          sessionTimeout: 480,
          ipWhitelist: [],
          auditLogging: true,
          passwordPolicy: {
            minLength: 8,
            requireUppercase: true,
            requireLowercase: true,
            requireNumbers: true,
            requireSpecialChars: false
          },
          loginAttempts: {
            maxAttempts: 5,
            lockoutDuration: 30
          }
        },
        integrations: {
          slack: {
            enabled: false,
            webhookUrl: '',
            channel: ''
          },
          email: {
            enabled: true,
            smtpHost: '',
            smtpPort: 587,
            smtpUser: '',
            smtpPassword: ''
          },
          calendar: {
            enabled: false,
            provider: '',
            apiKey: ''
          }
        },
        features: {
          voiceCommands: true,
          realTimeUpdates: true,
          advancedAnalytics: true,
          customReports: true,
          apiAccess: false,
          mobileApp: false
        },
        updatedBy: 'system-migration',
        updatedAt: new Date()
      },
      {
        new: true,
        upsert: true, // Create if doesn't exist
        runValidators: true
      }
    );

    console.log('✅ System settings created/updated successfully');
    console.log('📊 System settings summary:');
    console.log(`   - Company: ${systemSettings.general.companyName}`);
    console.log(`   - Working hours: ${systemSettings.general.workingHours.start} - ${systemSettings.general.workingHours.end}`);
    console.log(`   - Working days: ${systemSettings.general.workingDays.join(', ')}`);
    console.log(`   - Leave types: ${systemSettings.leave.defaultLeaveTypes.length} configured`);
    console.log(`   - Features enabled: ${Object.values(systemSettings.features).filter(Boolean).length}/${Object.keys(systemSettings.features).length}`);

    // Note: User settings will be created automatically when users first access their settings
    console.log('ℹ️  User settings will be created automatically when users first access their settings page');

    console.log('🎉 Settings migration completed successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Update your frontend components to use the new API endpoints');
    console.log('2. Test the settings functionality');
    console.log('3. Consider migrating any hardcoded settings from config files');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration if this script is executed directly
if (require.main === module) {
  migrateSettingsToDatabase()
    .then(() => {
      console.log('✅ Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration script failed:', error);
      process.exit(1);
    });
}

export default migrateSettingsToDatabase;
