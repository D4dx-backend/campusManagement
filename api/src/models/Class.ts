import mongoose, { Schema } from 'mongoose';
import { IClass } from '../types';

const ClassSchema = new Schema<IClass>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  academicYear: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  branchId: {
    type: Schema.Types.ObjectId as any,
    ref: 'Branch',
    default: null
  },
  organizationId: {
    type: Schema.Types.ObjectId as any,
    ref: 'Organization',
    required: true
  }
}, {
  timestamps: true
});

// Compound index to ensure unique class name per branch per academic year
// sparse: true allows multiple null branchId entries (org-level templates)
ClassSchema.index({ name: 1, branchId: 1, academicYear: 1 }, { unique: true, sparse: true });
ClassSchema.index({ branchId: 1 });
ClassSchema.index({ organizationId: 1 });
ClassSchema.index({ status: 1 });
ClassSchema.index({ organizationId: 1, branchId: 1 });

export const Class = mongoose.model<IClass>('Class', ClassSchema);