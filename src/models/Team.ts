import mongoose, { Schema, Document } from 'mongoose';

export interface ITeam extends Document {
  name: string;
  description?: string;
  teamLeaderId: string; // Reference to UserProfile
  members: string[]; // Array of UserProfile IDs
  department?: string;
  // Timezone and location information
  timezone: string; // IANA timezone ID for the team
  workLocation?: string; // Work location/site for the team
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TeamSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  teamLeaderId: {
    type: String,
    required: true,
    ref: 'UserProfile'
  },
  members: [{
    type: String,
    ref: 'UserProfile'
  }],
  department: {
    type: String,
    trim: true
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
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Create indexes for better query performance
// TeamSchema.index({ name: 1 }, { unique: true }); // Temporarily commented out to prevent conflicts
TeamSchema.index({ teamLeaderId: 1 });
TeamSchema.index({ members: 1 });
TeamSchema.index({ department: 1 });
TeamSchema.index({ isActive: 1 });
TeamSchema.index({ timezone: 1 }); // For timezone-based queries
TeamSchema.index({ workLocation: 1 }); // For location-based queries

export default mongoose.models.Team || mongoose.model<ITeam>('Team', TeamSchema);
