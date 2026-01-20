import mongoose, { Schema } from 'mongoose';
import { IStudent } from '../types';

const StudentSchema = new Schema<IStudent>({
  admissionNo: {
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
  classId: {
    type: Schema.Types.ObjectId as any,
    ref: 'Class',
    required: true
  },
  class: {
    type: String,
    required: true,
    trim: true
  },
  section: {
    type: String,
    required: true,
    trim: true
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  dateOfAdmission: {
    type: Date,
    required: true
  },
  guardianName: {
    type: String,
    required: true,
    trim: true
  },
  guardianPhone: {
    type: String,
    required: true,
    trim: true
  },
  guardianEmail: {
    type: String,
    lowercase: true,
    trim: true
  },
  gender: {
    type: String,
    enum: ['male', 'female'],
    required: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  transport: {
    type: String,
    enum: ['school', 'own', 'none'],
    default: 'none'
  },
  transportRoute: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  isStaffChild: {
    type: Boolean,
    default: false
  },
  branchId: {
    type: Schema.Types.ObjectId as any,
    ref: 'Branch',
    required: true
  }
}, {
  timestamps: true
});

// Indexes (admissionNo already has unique index)
StudentSchema.index({ branchId: 1 });
StudentSchema.index({ class: 1, section: 1 });
StudentSchema.index({ status: 1 });
StudentSchema.index({ name: 'text', guardianName: 'text' });

export const Student = mongoose.model<IStudent>('Student', StudentSchema);