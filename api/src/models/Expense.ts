import mongoose, { Schema } from 'mongoose';
import { IExpense } from '../types';

const ExpenseSchema = new Schema<IExpense>({
  voucherNo: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  date: {
    type: Date,
    required: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'bank'],
    required: true
  },
  approvedBy: {
    type: String,
    required: true,
    trim: true
  },
  remarks: {
    type: String,
    trim: true
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
ExpenseSchema.index({ voucherNo: 1 });
ExpenseSchema.index({ branchId: 1 });
ExpenseSchema.index({ date: 1 });
ExpenseSchema.index({ category: 1 });
ExpenseSchema.index({ description: 'text' });

export const Expense = mongoose.model<IExpense>('Expense', ExpenseSchema);