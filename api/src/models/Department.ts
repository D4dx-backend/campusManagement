import mongoose, { Schema } from 'mongoose';
import { IDepartment } from '../types';

const DepartmentSchema = new Schema<IDepartment>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  code: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  headOfDepartment: {
    type: String,
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
    required: true
  }
}, {
  timestamps: true
});

// Compound index to ensure unique department code per branch
DepartmentSchema.index({ code: 1, branchId: 1 }, { unique: true });
DepartmentSchema.index({ branchId: 1 });
DepartmentSchema.index({ status: 1 });

export const Department = mongoose.model<IDepartment>('Department', DepartmentSchema);