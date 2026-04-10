import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  recipientId: string; // Clerk user ID of the recipient
  senderId?: string; // Clerk user ID of the sender (optional for system notifications)
  type: 'leave_request' | 'leave_approved' | 'leave_rejected' | 'leave_cancelled' | 'urgent_leave' | 'system' | 'attendance' | 'general';
  title: string;
  message: string;
  relatedEntityId?: string; // ID of related entity (e.g., leave ID)
  relatedEntityType?: 'leave' | 'attendance' | 'user' | 'team';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  isRead: boolean;
  readAt?: Date;
  expiresAt?: Date; // Optional expiration date
  metadata?: Record<string, any>; // Additional data like leave details, user info, etc.
}

const NotificationSchema: Schema = new Schema({
  recipientId: {
    type: String,
    required: true,
    trim: true
  },
  senderId: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ['leave_request', 'leave_approved', 'leave_rejected', 'leave_cancelled', 'urgent_leave', 'system', 'attendance', 'general'],
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  relatedEntityId: {
    type: String,
    trim: true
  },
  relatedEntityType: {
    type: String,
    enum: ['leave', 'attendance', 'user', 'team']
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  expiresAt: {
    type: Date
  },
  metadata: {
    type: Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Create indexes for better query performance
NotificationSchema.index({ recipientId: 1, isRead: 1 }); // For user's unread notifications
NotificationSchema.index({ recipientId: 1, createdAt: -1 }); // For user's notification history
NotificationSchema.index({ type: 1 }); // For notification type queries
NotificationSchema.index({ priority: 1 }); // For priority-based queries
NotificationSchema.index({ relatedEntityId: 1, relatedEntityType: 1 }); // For entity-related queries
NotificationSchema.index({ expiresAt: 1 }); // For expired notification cleanup
NotificationSchema.index({ createdAt: 1 }); // For time-based queries

// Auto-expire notifications after 2 days if no expiration is set
NotificationSchema.pre('save', function(next) {
  if (!this.expiresAt) {
    const twoDaysFromNow = new Date();
    twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);
    this.expiresAt = twoDaysFromNow;
  }
  next();
});

export default mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);
