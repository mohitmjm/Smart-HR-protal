/**
 * Settings Service
 * Centralized service for managing system and user settings
 */

import connectDB from './mongodb';
import SystemSettings from '@/models/SystemSettings';
import UserSettings from '@/models/UserSettings';

export class SettingsService {
  private static systemSettingsCache: any = null;
  private static userSettingsCache: Map<string, any> = new Map();
  private static cacheExpiry = 5 * 60 * 1000; // 5 minutes
  private static lastSystemCacheUpdate = 0;

  /**
   * Get system settings (cached for performance)
   */
  static async getSystemSettings() {
    const now = Date.now();
    
    // Return cached settings if still valid
    if (this.systemSettingsCache && (now - this.lastSystemCacheUpdate) < this.cacheExpiry) {
      return this.systemSettingsCache;
    }

    try {
      await connectDB();
      const settings = await SystemSettings.findOne();
      
      if (!settings) {
        throw new Error('System settings not found. Please run the migration script.');
      }

      // Cache the settings
      this.systemSettingsCache = settings;
      this.lastSystemCacheUpdate = now;
      
      return settings;
    } catch (error) {
      console.error('Error fetching system settings:', error);
      throw error;
    }
  }

  /**
   * Update system settings
   */
  static async updateSystemSettings(updates: any, updatedBy: string) {
    try {
      await connectDB();
      
      const settings = await SystemSettings.findOneAndUpdate(
        {},
        {
          ...updates,
          updatedBy,
          updatedAt: new Date()
        },
        {
          new: true,
          upsert: true,
          runValidators: true
        }
      );

      // Clear cache to force refresh
      this.systemSettingsCache = null;
      this.lastSystemCacheUpdate = 0;

      return settings;
    } catch (error) {
      console.error('Error updating system settings:', error);
      throw error;
    }
  }

  /**
   * Get user settings (cached per user)
   */
  static async getUserSettings(userId: string) {
    const now = Date.now();
    const cacheKey = userId;
    const cached = this.userSettingsCache.get(cacheKey);
    
    // Return cached settings if still valid
    if (cached && (now - cached.timestamp) < this.cacheExpiry) {
      return cached.settings;
    }

    try {
      await connectDB();
      let settings = await UserSettings.findOne({ userId });
      
      if (!settings) {
        // Create default settings if none exist
        settings = new UserSettings({ userId });
        await settings.save();
      }

      // Cache the settings
      this.userSettingsCache.set(cacheKey, {
        settings,
        timestamp: now
      });
      
      return settings;
    } catch (error) {
      console.error('Error fetching user settings:', error);
      throw error;
    }
  }

  /**
   * Update user settings
   */
  static async updateUserSettings(userId: string, updates: any) {
    try {
      await connectDB();
      
      const settings = await UserSettings.findOneAndUpdate(
        { userId },
        {
          ...updates,
          updatedAt: new Date()
        },
        {
          new: true,
          upsert: true,
          runValidators: true
        }
      );

      // Clear user cache
      this.userSettingsCache.delete(userId);

      return settings;
    } catch (error) {
      console.error('Error updating user settings:', error);
      throw error;
    }
  }

  /**
   * Get a specific system setting by path (e.g., 'general.companyName')
   */
  static async getSystemSetting(path: string) {
    const settings = await this.getSystemSettings();
    return this.getNestedValue(settings, path);
  }

  /**
   * Get a specific user setting by path (e.g., 'appearance.theme')
   */
  static async getUserSetting(userId: string, path: string) {
    const settings = await this.getUserSettings(userId);
    return this.getNestedValue(settings, path);
  }

  /**
   * Clear all caches (useful for testing or when settings change frequently)
   */
  static clearCache() {
    this.systemSettingsCache = null;
    this.userSettingsCache.clear();
    this.lastSystemCacheUpdate = 0;
  }

  /**
   * Helper function to get nested object values by path
   */
  private static getNestedValue(obj: any, path: string) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Get working hours configuration
   */
  static async getWorkingHours() {
    const settings = await this.getSystemSettings();
    return {
      start: settings.general.workingHours.start,
      end: settings.general.workingHours.end,
      days: settings.general.workingDays
    };
  }

  /**
   * Get company information
   */
  static async getCompanyInfo() {
    const settings = await this.getSystemSettings();
    return {
      name: settings.general.companyName,
      logo: settings.general.companyLogo,
      address: settings.general.companyAddress,
      phone: settings.general.companyPhone,
      email: settings.general.companyEmail,
      timezone: settings.general.timezone,
      currency: settings.general.currency
    };
  }

  /**
   * Get attendance configuration
   */
  static async getAttendanceConfig() {
    const settings = await this.getSystemSettings();
    return settings.attendance;
  }

  /**
   * Get leave configuration
   */
  static async getLeaveConfig() {
    const settings = await this.getSystemSettings();
    return settings.leave;
  }

  /**
   * Get security configuration
   */
  static async getSecurityConfig() {
    const settings = await this.getSystemSettings();
    return settings.security;
  }

  /**
   * Get notification configuration
   */
  static async getNotificationConfig() {
    const settings = await this.getSystemSettings();
    return settings.notifications;
  }

  /**
   * Get feature flags
   */
  static async getFeatureFlags() {
    const settings = await this.getSystemSettings();
    return settings.features;
  }

  /**
   * Check if a feature is enabled
   */
  static async isFeatureEnabled(feature: string) {
    const features = await this.getFeatureFlags();
    return features[feature] === true;
  }
}

export default SettingsService;
