import mongoose, { Schema, Document } from 'mongoose';

export interface IEducation {
  institute: string;
  degree: string;
  startDate: string;
  endDate: string;
}

export interface IExperience {
  company: string;
  startDate: string;
  endDate: string;
  position: string;
  duties: string;
}

export interface IApplication extends Document {
  jobId: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  preferredName?: string;
  email: string;
  phone?: string;
  location?: string;
  education: IEducation[];
  experience: IExperience[];
  resumeUrl: string;
  status: 'pending' | 'reviewing' | 'shortlisted' | 'interviewed' | 'offered' | 'rejected';
  appliedDate: Date;
  notes?: string;
  isActive: boolean;
}

const EducationSchema: Schema = new Schema({
  institute: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  degree: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  startDate: {
    type: String,
    required: true,
    trim: true
  },
  endDate: {
    type: String,
    trim: true
  }
});

const ExperienceSchema: Schema = new Schema({
  company: {
    type: String,
    trim: true,
    maxlength: 200
  },
  startDate: {
    type: String,
    trim: true
  },
  endDate: {
    type: String,
    trim: true
  },
  position: {
    type: String,
    trim: true,
    maxlength: 200
  },
  duties: {
    type: String,
    trim: true,
    maxlength: 2000
  }
});

const ApplicationSchema: Schema = new Schema({
  jobId: {
    type: Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  preferredName: {
    type: String,
    trim: true,
    maxlength: 100
  },
  email: {
    type: String,
    required: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    trim: true,
    maxlength: 200
  },
  education: {
    type: [EducationSchema],
    required: true,
    validate: {
      validator: function(v: IEducation[]) {
        return v.length > 0;
      },
      message: 'At least one education entry is required'
    }
  },
  experience: {
    type: [ExperienceSchema],
    default: []
  },
  resumeUrl: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'reviewing', 'shortlisted', 'interviewed', 'offered', 'rejected'],
    default: 'pending'
  },
  appliedDate: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    maxlength: 1000
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Create indexes for better query performance
ApplicationSchema.index({ jobId: 1, status: 1 });
ApplicationSchema.index({ email: 1 });
ApplicationSchema.index({ appliedDate: -1 });
ApplicationSchema.index({ status: 1, appliedDate: -1 });

export default mongoose.models.Application || mongoose.model<IApplication>('Application', ApplicationSchema);
