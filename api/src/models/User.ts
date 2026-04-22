import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUser, IPermission } from '../types';

const PermissionSchema = new Schema<IPermission>({
  module: { type: String, required: true },
  actions: [{ type: String, enum: ['create', 'read', 'update', 'delete'], required: true }]
}, { _id: false });

const UserSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  mobile: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  pin: {
    type: String,
    required: true,
    minlength: 4,
    maxlength: 100  // Allow for hashed PIN (bcrypt produces ~60 chars)
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['platform_admin', 'org_admin', 'branch_admin', 'accountant', 'teacher', 'staff', 'student'],
    required: true
  },
  organizationId: {
    type: Schema.Types.ObjectId as any,
    ref: 'Organization',
    required: function(this: IUser) {
      return this.role !== 'platform_admin';
    }
  },
  branchId: {
    type: Schema.Types.ObjectId as any,
    ref: 'Branch',
    required: function(this: IUser) {
      return !['platform_admin', 'org_admin'].includes(this.role);
    }
  },
  permissions: [PermissionSchema],
  studentId: {
    type: Schema.Types.ObjectId as any,
    ref: 'Student',
    required: function(this: IUser) {
      return this.role === 'student';
    }
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'approved'
  },
  staffId: {
    type: Schema.Types.ObjectId as any,
    ref: 'Staff'
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for better performance (email and mobile already have unique indexes)
UserSchema.index({ branchId: 1 });
UserSchema.index({ organizationId: 1 });

// Hash PIN before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('pin')) return next();
  
  const salt = await bcrypt.genSalt(10);
  this.pin = await bcrypt.hash(this.pin, salt);
  next();
});

// Compare PIN method
UserSchema.methods.comparePin = async function(enteredPin: string): Promise<boolean> {
  return await bcrypt.compare(enteredPin, this.pin);
};

// Remove sensitive data when converting to JSON
UserSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.pin;
  return userObject;
};

export const User = mongoose.model<IUser>('User', UserSchema);