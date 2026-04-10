import mongoose, { Schema, Document } from 'mongoose';

export interface IRole extends Document {
  name: string;
  description?: string;
  permissions: string[];
  isSystem: boolean; // System roles cannot be deleted
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // User ID who created the role
}

const RoleSchema = new Schema<IRole>({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  permissions: [{
    type: String,
    trim: true,
    required: true
  }],
  isSystem: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: true
});

// Create indexes for better query performance
// Note: name field already has unique: true in schema definition
RoleSchema.index({ isActive: 1 });
RoleSchema.index({ isSystem: 1 });
RoleSchema.index({ createdBy: 1 });

export default mongoose.models.Role || mongoose.model<IRole>('Role', RoleSchema);
