import mongoose, { Schema, Document } from 'mongoose';

export interface IAccountTransaction extends Document {
  transactionDate: Date;
  accountId: mongoose.Types.ObjectId;
  transactionType: 'credit' | 'debit';
  amount: number;
  referenceType: 'fee_payment' | 'expense' | 'payroll' | 'transfer' | 'adjustment' | 'opening_balance';
  referenceId?: mongoose.Types.ObjectId;
  referenceNo?: string;
  description: string;
  balanceBefore: number;
  balanceAfter: number;
  reconciledDate?: Date;
  isReconciled: boolean;
  remarks?: string;
  branchId?: mongoose.Types.ObjectId;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AccountTransactionSchema = new Schema<IAccountTransaction>(
  {
    transactionDate: {
      type: Date,
      required: [true, 'Transaction date is required'],
      default: Date.now
    },
    accountId: {
      type: Schema.Types.ObjectId,
      ref: 'Account',
      required: [true, 'Account is required']
    },
    transactionType: {
      type: String,
      required: [true, 'Transaction type is required'],
      enum: ['credit', 'debit'],
      lowercase: true
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount must be positive']
    },
    referenceType: {
      type: String,
      required: [true, 'Reference type is required'],
      enum: ['fee_payment', 'expense', 'payroll', 'transfer', 'adjustment', 'opening_balance']
    },
    referenceId: {
      type: Schema.Types.ObjectId,
      refPath: 'referenceType'
    },
    referenceNo: {
      type: String,
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true
    },
    balanceBefore: {
      type: Number,
      required: true
    },
    balanceAfter: {
      type: Number,
      required: true
    },
    reconciledDate: {
      type: Date
    },
    isReconciled: {
      type: Boolean,
      default: false
    },
    remarks: {
      type: String,
      trim: true
    },
    branchId: {
      type: Schema.Types.ObjectId,
      ref: 'Branch'
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

// Indexes
AccountTransactionSchema.index({ accountId: 1, transactionDate: -1 });
AccountTransactionSchema.index({ branchId: 1, transactionDate: -1 });
AccountTransactionSchema.index({ referenceType: 1, referenceId: 1 });
AccountTransactionSchema.index({ isReconciled: 1 });
AccountTransactionSchema.index({ transactionDate: -1 });

export const AccountTransaction = mongoose.model<IAccountTransaction>('AccountTransaction', AccountTransactionSchema);
