import mongoose, { Schema } from 'mongoose';
import { IFeePayment, FeeType } from '../types';

// Sub-schema for individual fee items
const FeeItemSchema = new Schema({
  feeStructureId: {
    type: Schema.Types.ObjectId as any,
    ref: 'FeeStructure'
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  feeType: {
    type: String,
    enum: ['tuition', 'transport', 'cocurricular', 'maintenance', 'exam', 'textbook', 'other'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  transportDistanceGroup: {
    type: String,
    enum: ['group1', 'group2', 'group3', 'group4']
  }
}, { _id: false });

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
  classId: {
    type: Schema.Types.ObjectId as any,
    ref: 'Class',
    required: true
  },
  className: {
    type: String,
    required: true,
    trim: true
  },
  // Multiple fee items in one payment
  feeItems: {
    type: [FeeItemSchema],
    required: true,
    validate: {
      validator: function(items: any[]) {
        return items && items.length > 0;
      },
      message: 'At least one fee item is required'
    }
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'bank', 'online'],
    required: true
  },
  transactionId: {
    type: String,
    trim: true
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