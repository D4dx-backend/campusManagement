import mongoose, { Schema } from 'mongoose';
import { IReceiptConfig } from '../types';

const ReceiptConfigSchema = new Schema<IReceiptConfig>({
  branchId: {
    type: Schema.Types.ObjectId as any,
    ref: 'Branch',
    required: true
  },
  branchName: {
    type: String,
    required: true,
    trim: true
  },
  schoolName: {
    type: String,
    required: true,
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
  website: {
    type: String,
    trim: true
  },
  logo: {
    type: String,
    trim: true
  },
  principalName: {
    type: String,
    trim: true
  },
  taxNumber: {
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
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
ReceiptConfigSchema.index({ branchId: 1 });
ReceiptConfigSchema.index({ isActive: 1 });

// Ensure only one active config per branch
ReceiptConfigSchema.index({ branchId: 1, isActive: 1 }, { unique: true, partialFilterExpression: { isActive: true } });

export const ReceiptConfig = mongoose.model<IReceiptConfig>('ReceiptConfig', ReceiptConfigSchema);