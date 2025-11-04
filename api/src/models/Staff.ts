import mongoose, { Schema } from 'mongoose';
import { IStaff } from '../types';

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

// Indexes
StaffSchema.index({ branchId: 1 });
StaffSchema.index({ department: 1 });
StaffSchema.index({ status: 1 });
StaffSchema.index({ name: 'text', designation: 'text' });

export const Staff = mongoose.model<IStaff>('Staff', StaffSchema);