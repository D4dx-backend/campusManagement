import mongoose, { Schema } from 'mongoose';

export interface IExpenseCategory {
  _id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive';
  branchId: string;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseCategorySchema = new Schema<IExpenseCategory>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
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

// Compound index to ensure unique category name per branch
ExpenseCategorySchema.index({ name: 1, branchId: 1 }, { unique: true });
ExpenseCategorySchema.index({ branchId: 1 });
ExpenseCategorySchema.index({ status: 1 });

export const ExpenseCategory = mongoose.model<IExpenseCategory>('ExpenseCategory', ExpenseCategorySchema);