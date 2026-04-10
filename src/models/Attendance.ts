import mongoose, { Schema, Document } from 'mongoose';

export interface IAttendanceSession {
  _id: string
  clockIn: Date;
  clockOut?: Date;
  duration?: number; // Duration in hours for this session
  notes?: string;
  clockInLocation?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    address?: string;
  };
  clockOutLocation?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    address?: string;
  };
}

export interface IAttendance extends Document {
  userId: string; // Clerk user ID
  date: string; // Date stored as YYYY-MM-DD string
  // Main branch fields - first clock-in and last clock-out of the day
  clockIn: Date; // First clock-in of the day
  clockOut?: Date; // Last clock-out of the day
  totalHours: number; // Effective clocked-in hours so far
  status: 'half-day' | 'full-day' | 'absent' | 'late' | 'early-leave' | 'holiday' | 'weekly-off' | 'clock-out-missing'; // Status based on hours and timing
  notes?: string; // Last notes from the most recent session
  // Detailed session tracking
  sessions: IAttendanceSession[];
}

const AttendanceSessionSchema: Schema = new Schema({
  _id: {
    type: String,
    required: true
  },
  clockIn: {
    type: Date,
    required: true
  },
  clockOut: {
    type: Date
  },
  duration: {
    type: Number,
    min: 0,
    max: 24
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 200
  },
  clockInLocation: {
    latitude: {
      type: Number,
      min: -90,
      max: 90
    },
    longitude: {
      type: Number,
      min: -180,
      max: 180
    },
    accuracy: {
      type: Number,
      min: 0
    },
    address: {
      type: String,
      trim: true,
      maxlength: 500
    }
  },
  clockOutLocation: {
    latitude: {
      type: Number,
      min: -90,
      max: 90
    },
    longitude: {
      type: Number,
      min: -180,
      max: 180
    },
    accuracy: {
      type: Number,
      min: 0
    },
    address: {
      type: String,
      trim: true,
      maxlength: 500
    }
  }
}, {
  timestamps: false
});

const AttendanceSchema: Schema = new Schema({
  userId: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: String,
    required: true,
    default: () => new Date().toISOString().split('T')[0]
  },
  // Main branch fields
  clockIn: {
    type: Date,
    required: true
  },
  clockOut: {
    type: Date
  },
  totalHours: {
    type: Number,
    min: 0,
    max: 24,
    default: 0
  },
  status: {
    type: String,
    enum: ['half-day', 'full-day', 'absent', 'late', 'early-leave', 'holiday', 'weekly-off', 'clock-out-missing', 'present', 'regularized'],
    default: 'half-day'
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 500
  },
  // Detailed sessions
  sessions: {
    type: [AttendanceSessionSchema],
    default: []
  }
}, {
  timestamps: true
});

// Create indexes for better query performance
AttendanceSchema.index({ userId: 1, date: 1 }, { unique: true }); // One attendance record per user per day
AttendanceSchema.index({ userId: 1, date: -1 }); // For user's attendance history
AttendanceSchema.index({ date: 1 }); // For date-based queries
AttendanceSchema.index({ status: 1 }); // For status-based queries

export default mongoose.models.Attendance || mongoose.model<IAttendance>('Attendance', AttendanceSchema);
