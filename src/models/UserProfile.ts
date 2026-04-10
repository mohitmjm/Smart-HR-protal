import mongoose, { Schema, Document } from 'mongoose';
import { LeaveConfigService } from '@/lib/leaveConfigService';

export interface IUserProfile extends Document {
  clerkUserId: string; // Clerk user ID
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  position: string;
  joinDate: Date;
  managerId?: string; // For approval hierarchy
  organization?: string; // Organization name from Clerk
  // Timezone and location information
  timezone: string; // IANA timezone ID (e.g., 'America/New_York')
  workLocation?: string; // Work location/site identifier
  // Leave balance
  leaveBalance: {
    sick: number;
    casual: number;
    annual: number;
    maternity?: number;
    paternity?: number;
    // Allotted leave days
    sick_alloted: number;
    casual_alloted: number;
    annual_alloted: number;
    maternity_alloted: number;
    paternity_alloted: number;
  };
  contactNumber?: string;
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  isActive: boolean;
  // Profile image
  profileImage?: string; // S3 URL for profile image
  // Admin access control fields
  isHRManager?: boolean; // Quick check for HR manager access
  permissions?: string[]; // Granular permissions array
  lastAdminAccess?: Date; // Audit trail for admin access
  roleId?: string; // Reference to Role document
  education?: Array<{
    _id: mongoose.Types.ObjectId;
    schoolOrUniversity: string;
    degree: 'Bachelors' | 'Masters' | 'Other';
    fieldOfStudy?: string;
    overallResult?: string;
    startDate?: Date;
    endDate?: Date;
    isActive: boolean;
    createdAt?: Date;
    updatedAt?: Date;
  }>
}

export interface IUserProfileModel extends mongoose.Model<IUserProfile> {
  getDefaultLeaveBalance(): Promise<{
    sick: number;
    casual: number;
    annual: number;
    maternity: number;
    paternity: number;
    sick_alloted: number;
    casual_alloted: number;
    annual_alloted: number;
    maternity_alloted: number;
    paternity_alloted: number;
  }>;
}

const UserProfileSchema: Schema = new Schema({
  clerkUserId: {
    type: String,
    required: true,
    trim: true
  },
  employeeId: {
    type: String,
    required: true,
    trim: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  department: {
    type: String,
    required: true,
    trim: true
  },
  position: {
    type: String,
    required: true,
    trim: true
  },
  joinDate: {
    type: Date,
    required: true
  },
  managerId: {
    type: String,
    trim: true
  },
  organization: {
    type: String,
    trim: true,
    maxlength: 100
  },
  // Timezone and location fields
  timezone: {
    type: String,
    required: true,
    default: 'UTC',
    trim: true,
    validate: {
      validator: function(v: string) {
        // Basic IANA timezone validation
        return /^[A-Za-z_]+\/[A-Za-z_]+$/.test(v) || v === 'UTC'
      },
      message: 'Timezone must be a valid IANA timezone identifier'
    }
  },
  workLocation: {
    type: String,
    trim: true,
    maxlength: 100
  },
  leaveBalance: {
    sick: {
      type: Number,
      min: 0
    },
    casual: {
      type: Number,
      min: 0
    },
    annual: {
      type: Number,
      min: 0
    },
    maternity: {
      type: Number,
      min: 0
    },
    paternity: {
      type: Number,
      min: 0
    },
    // Allotted leave days
    sick_alloted: {
      type: Number,
      min: 0
    },
    casual_alloted: {
      type: Number,
      min: 0
    },
    annual_alloted: {
      type: Number,
      min: 0
    },
    maternity_alloted: {
      type: Number,
      min: 0
    },
    paternity_alloted: {
      type: Number,
      min: 0
    }
  },
  contactNumber: {
    type: String,
    trim: true
  },
  emergencyContact: {
    name: {
      type: String,
      trim: true,
      maxlength: 100
    },
    relationship: {
      type: String,
      trim: true,
      maxlength: 50
    },
    phone: {
      type: String,
      trim: true
    }
  },
  address: {
    street: {
      type: String,
      trim: true,
      maxlength: 200
    },
    city: {
      type: String,
      trim: true,
      maxlength: 100
    },
    state: {
      type: String,
      trim: true,
      maxlength: 100
    },
    zipCode: {
      type: String,
      trim: true,
      maxlength: 20
    },
    country: {
      type: String,
      trim: true,
      maxlength: 100
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Profile image
  profileImage: {
    type: String,
    trim: true,
    validate: {
      validator: function(v: string) {
        if (!v) return true; // Allow empty
        // Basic URL validation
        return /^https?:\/\/.+/.test(v)
      },
      message: 'Profile image must be a valid URL'
    }
  },
  // Admin access control fields
  isHRManager: {
    type: Boolean,
    default: false
  },
  permissions: [{
    type: String,
    trim: true
  }],
  lastAdminAccess: {
    type: Date,
    default: null
  },
  roleId: {
    type: String,
    trim: true
  },
  education: [
    new Schema({
      schoolOrUniversity: {
        type: String,
        required: true,
        trim: true
      },
      degree: {
        type: String,
        required: true,
        enum: ['Bachelors', 'Masters', 'Other']
      },
      fieldOfStudy: {
        type: String,
        trim: true
      },
      overallResult: {
        type: String,
        trim: true
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
    }, { timestamps: true })
  ],
  experience: [
    new Schema({
      company: { type: String, required: true, trim: true },
      title: { type: String, required: true, trim: true },
      employmentType: { type: String, trim: true }, // Full-time, Part-time, Contract, Internship, Other
      location: { type: String, trim: true },
      startDate: { type: Date },
      endDate: { type: Date },
      description: { type: String, trim: true },
      isActive: { type: Boolean, default: true }
    }, { timestamps: true })
  ]
}, {
  timestamps: true
});

// Create indexes for better query performance
UserProfileSchema.index({ clerkUserId: 1 }, { unique: true });
UserProfileSchema.index({ employeeId: 1 }, { unique: true });
UserProfileSchema.index({ department: 1 });
UserProfileSchema.index({ managerId: 1 });
UserProfileSchema.index({ isActive: 1 });
UserProfileSchema.index({ email: 1 }, { unique: true });
UserProfileSchema.index({ timezone: 1 }); // For timezone-based queries
UserProfileSchema.index({ workLocation: 1 }); // For location-based queries
// Admin access control indexes
UserProfileSchema.index({ isHRManager: 1 });
UserProfileSchema.index({ permissions: 1 });
UserProfileSchema.index({ roleId: 1 });

// Static method to get default leave balance from configuration
UserProfileSchema.statics.getDefaultLeaveBalance = async function() {
  try {
    const defaults = await LeaveConfigService.getDefaultAllocations();
    return {
      sick: 0,
      casual: 0,
      annual: 0,
      maternity: 0,
      paternity: 0,
      sick_alloted: defaults.sick,
      casual_alloted: defaults.casual,
      annual_alloted: defaults.annual,
      maternity_alloted: defaults.maternity,
      paternity_alloted: defaults.paternity
    };
  } catch (error) {
    console.error('Error getting default leave balance:', error);
    // Return empty values when configuration is not available
    return {
      sick: 0,
      casual: 0,
      annual: 0,
      maternity: 0,
      paternity: 0,
      sick_alloted: 0,
      casual_alloted: 0,
      annual_alloted: 0,
      maternity_alloted: 0,
      paternity_alloted: 0
    };
  }
};

export default mongoose.models.UserProfile || mongoose.model<IUserProfile, IUserProfileModel>('UserProfile', UserProfileSchema);
