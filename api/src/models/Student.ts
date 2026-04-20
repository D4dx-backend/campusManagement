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
    required: false,
    default: '',
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
  fatherName: {
    type: String,
    required: false,
    trim: true
  },
  fatherPhone: {
    type: String,
    required: false,
    trim: true
  },
  fatherEmail: {
    type: String,
    lowercase: true,
    trim: true
  },
  fatherJobCompany: {
    type: String,
    trim: true
  },
  motherName: {
    type: String,
    required: false,
    trim: true
  },
  motherPhone: {
    type: String,
    required: false,
    trim: true
  },
  motherEmail: {
    type: String,
    lowercase: true,
    trim: true
  },
  motherJobCompany: {
    type: String,
    trim: true
  },
  // legacy guardian fields
  guardianName: {
    type: String,
    required: false,
    trim: true
  },
  guardianPhone: {
    type: String,
    required: false,
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
    enum: ['active', 'inactive', 'suspended', 'tc_issued'],
    default: 'active'
  },
  // TC (Transfer Certificate) fields
  tcIssued: {
    type: Boolean,
    default: false
  },
  tcNumber: {
    type: String,
    trim: true
  },
  tcDate: {
    type: Date
  },
  tcReason: {
    type: String,
    trim: true
  },
  // Suspension fields
  suspensionDate: {
    type: Date
  },
  suspensionReason: {
    type: String,
    trim: true
  },
  suspensionEndDate: {
    type: Date
  },
  isStaffChild: {
    type: Boolean,
    default: false
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

// Indexes (admissionNo already has unique index)
StudentSchema.index({ branchId: 1 });
StudentSchema.index({ organizationId: 1 });
StudentSchema.index({ class: 1, section: 1 });
StudentSchema.index({ status: 1 });
StudentSchema.index({ name: 'text', fatherName: 'text', motherName: 'text' });

export const Student = mongoose.model<IStudent>('Student', StudentSchema);