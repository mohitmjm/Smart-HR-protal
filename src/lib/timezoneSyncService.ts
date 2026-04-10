/**
 * Timezone Sync Service
 * Manages timezone synchronization between UserProfile and UserSettings
 * UserProfile.timezone is the primary source of truth
 */

import connectDB from './mongodb';
import UserProfile from '@/models/UserProfile';
import UserSettings from '@/models/UserSettings';
import { TimezoneService } from './timezoneService';

export class TimezoneSyncService {
  /**
   * Get user timezone from UserProfile (primary source)
   */
  static async getUserTimezone(userId: string): Promise<string> {
    try {
      await connectDB();
      const userProfile = await UserProfile.findOne({ clerkUserId: userId });
      
      if (!userProfile) {
        throw new Error('User profile not found');
      }
      
      return userProfile.timezone;
    } catch (error) {
      console.error('Error fetching user timezone:', error);
      // Fallback to UTC if profile not found
      return 'UTC';
    }
  }

  /**
   * Set user timezone in UserProfile and sync to UserSettings
   */
  static async setUserTimezone(userId: string, timezone: string): Promise<void> {
    try {
      // Validate timezone
      if (!TimezoneService.isValidTimezone(timezone)) {
        throw new Error('Invalid timezone');
      }

      await connectDB();

      // Update UserProfile (primary source)
      const userProfile = await UserProfile.findOneAndUpdate(
        { clerkUserId: userId },
        { timezone },
        { new: true, upsert: false }
      );

      if (!userProfile) {
        throw new Error('User profile not found');
      }

      // Sync to UserSettings
      await this.syncTimezoneToUserSettings(userId, timezone);

    } catch (error) {
      console.error('Error setting user timezone:', error);
      throw error;
    }
  }

  /**
   * Sync timezone from UserProfile to UserSettings
   */
  static async syncTimezoneToUserSettings(userId: string, timezone?: string): Promise<void> {
    try {
      await connectDB();

      // Get timezone from UserProfile if not provided
      if (!timezone) {
        timezone = await this.getUserTimezone(userId);
      }

      // Update UserSettings appearance.timezone
      await UserSettings.findOneAndUpdate(
        { userId },
        { 
          'appearance.timezone': timezone,
          updatedAt: new Date()
        },
        { 
          new: true, 
          upsert: true, // Create if doesn't exist
          runValidators: true
        }
      );

    } catch (error) {
      console.error('Error syncing timezone to UserSettings:', error);
      // Don't throw error as this is a sync operation
      console.warn('Timezone sync to UserSettings failed, but UserProfile is updated');
    }
  }

  /**
   * Sync timezone from UserSettings to UserProfile (migration helper)
   */
  static async syncTimezoneFromUserSettings(userId: string): Promise<void> {
    try {
      await connectDB();

      // Get timezone from UserSettings
      const userSettings = await UserSettings.findOne({ userId });
      
      if (!userSettings || !userSettings.appearance?.timezone) {
        console.log('No timezone found in UserSettings for user:', userId);
        return;
      }

      const timezone = userSettings.appearance.timezone;

      // Validate timezone
      if (!TimezoneService.isValidTimezone(timezone)) {
        console.warn('Invalid timezone in UserSettings:', timezone);
        return;
      }

      // Update UserProfile
      await UserProfile.findOneAndUpdate(
        { clerkUserId: userId },
        { timezone },
        { new: true, upsert: false }
      );

      console.log('Successfully synced timezone from UserSettings to UserProfile:', timezone);

    } catch (error) {
      console.error('Error syncing timezone from UserSettings:', error);
      throw error;
    }
  }

  /**
   * Get timezone with fallback logic
   * 1. Try UserProfile.timezone (primary)
   * 2. Try UserSettings.appearance.timezone (fallback)
   * 3. Return UTC (default)
   */
  static async getTimezoneWithFallback(userId: string): Promise<string> {
    try {
      // Try UserProfile first
      const profileTimezone = await this.getUserTimezone(userId);
      if (profileTimezone) {
        return profileTimezone;
      }

      // Fallback to UserSettings
      await connectDB();
      const userSettings = await UserSettings.findOne({ userId });
      
      if (userSettings?.appearance?.timezone && 
          TimezoneService.isValidTimezone(userSettings.appearance.timezone)) {
        
        // Sync this timezone to UserProfile for future consistency
        await this.setUserTimezone(userId, userSettings.appearance.timezone);
        return userSettings.appearance.timezone;
      }

      // Default fallback
      return 'UTC';

    } catch (error) {
      console.error('Error getting timezone with fallback:', error);
      return 'UTC';
    }
  }

  /**
   * Migrate all users from UserSettings to UserProfile timezone
   */
  static async migrateAllUserTimezones(): Promise<{ migrated: number; errors: number }> {
    try {
      await connectDB();
      
      let migrated = 0;
      let errors = 0;

      // Get all users with UserSettings
      const userSettings = await UserSettings.find({
        'appearance.timezone': { $exists: true, $ne: 'UTC' }
      });

      console.log(`Found ${userSettings.length} users with timezone in UserSettings`);

      for (const settings of userSettings) {
        try {
          await this.syncTimezoneFromUserSettings(settings.userId);
          migrated++;
        } catch (error) {
          console.error(`Error migrating timezone for user ${settings.userId}:`, error);
          errors++;
        }
      }

      console.log(`Migration complete: ${migrated} migrated, ${errors} errors`);
      return { migrated, errors };

    } catch (error) {
      console.error('Error during timezone migration:', error);
      throw error;
    }
  }

  /**
   * Validate timezone consistency between UserProfile and UserSettings
   */
  static async validateTimezoneConsistency(userId: string): Promise<{
    isConsistent: boolean;
    profileTimezone?: string;
    settingsTimezone?: string;
    needsSync: boolean;
  }> {
    try {
      await connectDB();

      const userProfile = await UserProfile.findOne({ clerkUserId: userId });
      const userSettings = await UserSettings.findOne({ userId });

      const profileTimezone = userProfile?.timezone;
      const settingsTimezone = userSettings?.appearance?.timezone;

      const isConsistent = profileTimezone === settingsTimezone;
      const needsSync = !isConsistent && profileTimezone && settingsTimezone;

      return {
        isConsistent,
        profileTimezone,
        settingsTimezone,
        needsSync
      };

    } catch (error) {
      console.error('Error validating timezone consistency:', error);
      return {
        isConsistent: false,
        needsSync: false
      };
    }
  }

  /**
   * Fix timezone inconsistency by syncing UserSettings to UserProfile
   */
  static async fixTimezoneInconsistency(userId: string): Promise<boolean> {
    try {
      const validation = await this.validateTimezoneConsistency(userId);
      
      if (!validation.needsSync) {
        return true; // Already consistent
      }

      // Sync UserSettings to UserProfile
      await this.syncTimezoneFromUserSettings(userId);
      
      // Verify fix
      const newValidation = await this.validateTimezoneConsistency(userId);
      return newValidation.isConsistent;

    } catch (error) {
      console.error('Error fixing timezone inconsistency:', error);
      return false;
    }
  }

  /**
   * Get all users with timezone inconsistencies
   */
  static async getInconsistentUsers(): Promise<Array<{
    userId: string;
    profileTimezone?: string;
    settingsTimezone?: string;
  }>> {
    try {
      await connectDB();

      const inconsistentUsers = [];

      // Get all users with both UserProfile and UserSettings
      const profiles = await UserProfile.find({ timezone: { $exists: true } });
      
      for (const profile of profiles) {
        const settings = await UserSettings.findOne({ userId: profile.clerkUserId });
        
        if (settings?.appearance?.timezone && 
            profile.timezone !== settings.appearance.timezone) {
          inconsistentUsers.push({
            userId: profile.clerkUserId,
            profileTimezone: profile.timezone,
            settingsTimezone: settings.appearance.timezone
          });
        }
      }

      return inconsistentUsers;

    } catch (error) {
      console.error('Error getting inconsistent users:', error);
      return [];
    }
  }
}

export default TimezoneSyncService;
