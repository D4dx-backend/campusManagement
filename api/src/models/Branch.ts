import mongoose, { Schema } from 'mongoose';
import { IBranch } from '../types';

const BranchSchema = new Schema<IBranch>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  principalName: {
    type: String,
    trim: true
  },
  establishedDate: {
    type: Date,
    required: true
  },
  organizationId: {
    type: Schema.Types.ObjectId as any,
    ref: 'Organization',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  // Override fields — when set, take priority over organization defaults
  logo: {
    type: String,
    trim: true
  },
  website: {
    type: String,
    trim: true
  },
  taxId: {
    type: String,
    trim: true
  },
  taxLabel: {
    type: String,
    trim: true
  },
  currency: {
    type: String,
    trim: true
  },
  currencySymbol: {
    type: String,
    trim: true
  },
  country: {
    type: String,
    trim: true
  },
  state: {
    type: String,
    trim: true
  },
  city: {
    type: String,
    trim: true
  },
  pincode: {
    type: String,
    trim: true
  },
  registrationNumber: {
    type: String,
    trim: true
  },
  footerText: {
    type: String,
    trim: true
  },
  createdBy: {
    type: Schema.Types.ObjectId as any,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes - code unique within organization
BranchSchema.index({ code: 1, organizationId: 1 }, { unique: true });
BranchSchema.index({ organizationId: 1 });
BranchSchema.index({ status: 1 });

export const Branch = mongoose.model<IBranch>('Branch', BranchSchema);