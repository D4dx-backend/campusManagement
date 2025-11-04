import mongoose, { Schema } from 'mongoose';
import { IFeePayment, FeeType } from '../types';

const FeePaymentSchema = new Schema<IFeePayment>({
  receiptNo: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  studentId: {
    type: Schema.Types.ObjectId as any,
    ref: 'Student',
    required: true
  },
  studentName: {
    type: String,
    required: true,
    trim: true
  },
  class: {
    type: String,
    required: true,
    trim: true
  },
  feeType: {
    type: String,
    enum: ['tuition', 'transport', 'cocurricular', 'maintenance', 'exam', 'textbook'],
    required: true
  },
  amount: {
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
    enum: ['cash', 'bank', 'online'],
    required: true
  },
  status: {
    type: String,
    enum: ['paid', 'partial', 'pending'],
    default: 'paid'
  },
  remarks: {
    type: String,
    trim: true
  },
  branchId: {
    type: Schema.Types.ObjectId as any,
    ref: 'Branch',
    required: true
  },
  createdBy: {
    type: Schema.Types.ObjectId as any,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes
FeePaymentSchema.index({ studentId: 1 });
FeePaymentSchema.index({ branchId: 1 });
FeePaymentSchema.index({ paymentDate: 1 });
FeePaymentSchema.index({ feeType: 1 });
FeePaymentSchema.index({ status: 1 });

export const FeePayment = mongoose.model<IFeePayment>('FeePayment', FeePaymentSchema);