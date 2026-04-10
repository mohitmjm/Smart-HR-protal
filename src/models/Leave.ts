import mongoose, { Schema, Document } from 'mongoose';

export interface ILeave extends Document {
  userId: string; // Clerk user ID
  leaveType: 'sick' | 'casual' | 'annual' | 'maternity' | 'paternity' | 'bereavement' | 'other';
  startDate: Date; // Stored as UTC timestamp
  endDate: Date; // Stored as UTC timestamp
  totalDays: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  approvedBy?: string; // HR/Manager ID
  appliedDate: Date; // Stored as UTC timestamp
  rejectionReason?: string;
  // Timezone information for the leave request
  userTimezone: string; // IANA timezone ID when leave was requested
  // Metadata
  isFullDay: boolean; // Whether this is a full-day leave (default: true)
  notes?: string; // Additional notes
}

const LeaveSchema: Schema = new Schema({
  userId: {
    type: String,
    required: true,
    trim: true
  },
  leaveType: {
    type: String,
    enum: ['sick', 'casual', 'annual', 'maternity', 'paternity', 'bereavement', 'other'],
    required: true
  },
  startDate: {
    type: Date,
    required: true,
    validate: {
      validator: function(v: Date) {
        // Ensure date is stored as UTC
        return v instanceof Date && !isNaN(v.getTime())
      },
      message: 'Start date must be a valid date'
    }
  },
  endDate: {
    type: Date,
    required: true,
    validate: {
      validator: function(v: Date) {
        // Ensure date is stored as UTC
        return v instanceof Date && !isNaN(v.getTime())
      },
      message: 'End date must be a valid date'
    }
  },
  totalDays: {
    type: Number,
    required: true,
    min: 0.5,
    max: 365
  },
  reason: {
    type: String,
    required: true,
    trim: true,
    minlength: 10,
    maxlength: 1000
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled'],
    default: 'pending'
  },
  approvedBy: {
    type: String,
    trim: true
  },
  appliedDate: {
    type: Date,
    default: Date.now,
    validate: {
      validator: function(v: Date) {
        // Ensure date is stored as UTC
        return v instanceof Date && !isNaN(v.getTime())
      },
      message: 'Applied date must be a valid date'
    }
  },
  rejectionReason: {
    type: String,
    trim: true,
    maxlength: 500
  },
  // Timezone information
  userTimezone: {
    type: String,
    required: true,
    default: 'UTC',
    trim: true,
    validate: {
      validator: function(v: string) {
        // Basic IANA timezone validation
        return /^[A-Za-z_]+\/[A-Za-z_]+$/.test(v) || v === 'UTC'
      },
      message: 'User timezone must be a valid IANA timezone identifier'
    }
  },
  // Metadata
  isFullDay: {
    type: Boolean,
    default: true
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 1000
  }
}, {
  timestamps: true
});

// Pre-save middleware to ensure dates are stored in UTC
LeaveSchema.pre('save', function(next) {
  // Use any type for the document in middleware to avoid type conflicts
  const doc = this as any;
  
  // Ensure all dates are stored as UTC
  if (doc.startDate && doc.startDate instanceof Date) {
    doc.startDate = new Date(doc.startDate.toISOString())
  }
  if (doc.endDate && doc.endDate instanceof Date) {
    doc.endDate = new Date(doc.endDate.toISOString())
  }
  if (doc.appliedDate && doc.appliedDate instanceof Date) {
    doc.appliedDate = new Date(doc.appliedDate.toISOString())
  }
  next()
});

// Create indexes for better query performance
LeaveSchema.index({ userId: 1, status: 1 }); // For user's leave status queries
LeaveSchema.index({ status: 1, startDate: 1 }); // For pending/approved leave queries
LeaveSchema.index({ startDate: 1, endDate: 1 }); // For date range queries
LeaveSchema.index({ leaveType: 1 }); // For leave type queries
LeaveSchema.index({ approvedBy: 1 }); // For manager approval queries
LeaveSchema.index({ userTimezone: 1 }); // For timezone-based queries

export default mongoose.models.Leave || mongoose.model<ILeave>('Leave', LeaveSchema);
