import mongoose, { Schema } from 'mongoose';
import { IPayrollEntry } from '../types';

const PayrollEntrySchema = new Schema<IPayrollEntry>({
  staffId: {
    type: Schema.Types.ObjectId as any,
    ref: 'Staff',
    required: true
  },
  staffName: {
    type: String,
    required: true,
    trim: true
  },
  month: {
    type: String,
    required: true,
    trim: true
  },
  year: {
    type: Number,
    required: true
  },
  basicSalary: {
    type: Number,
    required: true,
    min: 0
  },
  allowances: {
    type: Number,
    default: 0,
    min: 0
  },
  deductions: {
    type: Number,
    default: 0,
    min: 0
  },
  netSalary: {
    type: Number,
    required: true,
    min: 0
  },
  paymentDate: {
    type: Date,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'bank'],
    required: true
  },
  status: {
    type: String,
    enum: ['paid', 'pending'],
    default: 'paid'
  },
  branchId: {
    type: Schema.Types.ObjectId as any,
    ref: 'Branch',
    required: true
  }
}, {
  timestamps: true
});

// Compound index to ensure unique payroll entry per staff per month per year
PayrollEntrySchema.index({ staffId: 1, month: 1, year: 1 }, { unique: true });
PayrollEntrySchema.index({ branchId: 1 });
PayrollEntrySchema.index({ paymentDate: 1 });
PayrollEntrySchema.index({ status: 1 });

export const PayrollEntry = mongoose.model<IPayrollEntry>('PayrollEntry', PayrollEntrySchema);