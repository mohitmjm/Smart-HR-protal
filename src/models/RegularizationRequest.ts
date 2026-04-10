import mongoose, { Schema, Document } from 'mongoose';

export interface IRegularizationRequest extends Document {
  userId: string;
  attendanceDate: string; // YYYY-MM-DD format
  requestDate: Date;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string; // Manager/HR who reviewed the request
  reviewedAt?: Date;
  reviewNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RegularizationRequestSchema: Schema = new Schema<IRegularizationRequest>({
  userId: {
    type: String,
    required: true,
    trim: true
  },
  attendanceDate: {
    type: String,
    required: true,
    trim: true
  },
  requestDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  reason: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  reviewedBy: {
    type: String,
    trim: true
  },
  reviewedAt: {
    type: Date
  },
  reviewNotes: {
    type: String,
    trim: true,
    maxlength: 500
  }
}, {
  timestamps: true
});

// Create indexes for better query performance
RegularizationRequestSchema.index({ userId: 1, attendanceDate: 1 }, { unique: true }); // One request per user per day
RegularizationRequestSchema.index({ userId: 1, status: 1 });
RegularizationRequestSchema.index({ status: 1, requestDate: -1 });
RegularizationRequestSchema.index({ reviewedBy: 1, status: 1 });

export default mongoose.models.RegularizationRequest || mongoose.model<IRegularizationRequest>('RegularizationRequest', RegularizationRequestSchema);
