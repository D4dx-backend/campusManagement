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
    unique: true,
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
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  createdBy: {
    type: Schema.Types.ObjectId as any,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes (code already has unique index)
BranchSchema.index({ status: 1 });

export const Branch = mongoose.model<IBranch>('Branch', BranchSchema);