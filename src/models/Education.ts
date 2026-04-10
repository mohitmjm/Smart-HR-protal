import mongoose, { Schema, Document } from 'mongoose';

export interface IEducation extends Document {
  clerkUserId: string; // Clerk user ID to link with user profile
  schoolOrUniversity: string; // School or University name
  degree: 'Bachelors' | 'Masters' | 'Other'; // Degree type
  fieldOfStudy?: string; // Field of study (optional)
  overallResult?: string; // CGPA or overall result (optional)
  startDate?: Date; // Start date (optional)
  endDate?: Date; // End date (optional)
  isActive: boolean; // For soft delete
}

export interface IEducationModel extends mongoose.Model<IEducation> {
  // Static methods can be added here in the future
  // Example: findByUser(userId: string): Promise<IEducation[]>
  findByUser?(userId: string): Promise<IEducation[]>
}

const EducationSchema: Schema = new Schema({
  clerkUserId: {
    type: String,
    required: true,
    trim: true
  },
  schoolOrUniversity: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  degree: {
    type: String,
    required: true,
    enum: ['Bachelors', 'Masters', 'Other'],
    trim: true
  },
  fieldOfStudy: {
    type: String,
    trim: true,
    maxlength: 200
  },
  overallResult: {
    type: String,
    trim: true,
    maxlength: 50
  },
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Create indexes for better query performance
EducationSchema.index({ clerkUserId: 1 });
EducationSchema.index({ isActive: 1 });
EducationSchema.index({ degree: 1 });

// Compound index for user's education history
EducationSchema.index({ clerkUserId: 1, isActive: 1 });

export default mongoose.models.Education || mongoose.model<IEducation, IEducationModel>('Education', EducationSchema);
