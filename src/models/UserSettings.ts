import mongoose, { Schema, Document } from 'mongoose';

export interface IUserSettings extends Document {
  userId: string; // Clerk user ID
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
    attendanceReminders: boolean;
    leaveUpdates: boolean;
    systemAlerts: boolean;
    weeklyReports: boolean;
  };
  security: {
    twoFactorAuth: boolean;
    sessionTimeout: number;
    passwordExpiry: number;
    loginNotifications: boolean;
    deviceManagement: boolean;
  };
  appearance: {
    theme: 'light' | 'dark' | 'auto';
    language: string;
    timezone: string;
    dateFormat: string;
    timeFormat: '12h' | '24h';
  };
  preferences: {
    dashboardLayout: string;
    defaultView: string;
    autoRefresh: boolean;
    compactMode: boolean;
  };
  updatedAt: Date;
  createdAt: Date;
}

const UserSettingsSchema = new Schema<IUserSettings>({
  userId: { 
    type: String, 
    required: true, 
    unique: true
  },
  notifications: {
    email: { type: Boolean, default: true },
    push: { type: Boolean, default: true },
    sms: { type: Boolean, default: false },
    attendanceReminders: { type: Boolean, default: true },
    leaveUpdates: { type: Boolean, default: true },
    systemAlerts: { type: Boolean, default: true },
    weeklyReports: { type: Boolean, default: false }
  },
  security: {
    twoFactorAuth: { type: Boolean, default: false },
    sessionTimeout: { type: Number, default: 30 },
    passwordExpiry: { type: Number, default: 90 },
    loginNotifications: { type: Boolean, default: true },
    deviceManagement: { type: Boolean, default: true }
  },
  appearance: {
    theme: { 
      type: String, 
      enum: ['light', 'dark', 'auto'], 
      default: 'light' 
    },
    language: { type: String, default: 'en' },
    timezone: { type: String, default: 'UTC' },
    dateFormat: { type: String, default: 'MM/DD/YYYY' },
    timeFormat: { 
      type: String, 
      enum: ['12h', '24h'], 
      default: '12h' 
    }
  },
  preferences: {
    dashboardLayout: { type: String, default: 'default' },
    defaultView: { type: String, default: 'dashboard' },
    autoRefresh: { type: Boolean, default: true },
    compactMode: { type: Boolean, default: false }
  },
  updatedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

// Ensure one settings document per user
// Note: unique: true on the userId field already creates an index

// Update the updatedAt field before saving
UserSettingsSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.models.UserSettings || mongoose.model<IUserSettings>('UserSettings', UserSettingsSchema);
