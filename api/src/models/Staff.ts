import mongoose, { Schema } from 'mongoose';
import { IStaff } from '../types';

const SalaryHistorySchema = new Schema({
  previousSalary: { type: Number, required: true },
  newSalary: { type: Number, required: true },
  effectiveDate: { type: Date, required: true },
  reason: { type: String, required: true, trim: true },
  incrementedBy: { type: String, trim: true },
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

const StaffSchema = new Schema<IStaff>({
  employeeId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    trim: true,
    default: ''
  },
  designation: {
    type: String,
    required: true,
    trim: true
  },
  department: {
    type: String,
    required: true,
    trim: true
  },
  dateOfJoining: {
    type: Date,
    required: true
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
  address: {
    type: String,
    required: true,
    trim: true
  },
  salary: {
    type: Number,
    required: true,
    min: 0
  },
  salaryHistory: [SalaryHistorySchema],
  status: {
    type: String,
    enum: ['active', 'inactive', 'terminated', 'resigned'],
    default: 'active'
  },
  separationDate: {
    type: Date
  },
  separationReason: {
    type: String,
    trim: true
  },
  lastWorkingDate: {
    type: Date
  },
  separationType: {
    type: String,
    enum: ['terminated', 'resigned']
  },
  branchId: {
    type: Schema.Types.ObjectId as any,
    ref: 'Branch',
    required: true
  },
  organizationId: {
    type: Schema.Types.ObjectId as any,
    ref: 'Organization',
    required: true
  }
}, {
  timestamps: true
});

// Indexes
StaffSchema.index({ branchId: 1 });
StaffSchema.index({ organizationId: 1 });
StaffSchema.index({ category: 1 });
StaffSchema.index({ department: 1 });
StaffSchema.index({ status: 1 });
StaffSchema.index({ name: 'text', designation: 'text' });

export const Staff = mongoose.model<IStaff>('Staff', StaffSchema);