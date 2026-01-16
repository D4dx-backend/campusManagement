import mongoose, { Schema, Document } from 'mongoose';

export interface IIncome extends Document {
  receiptNo: string;
  date: Date;
  category: string;
  description: string;
  amount: number;
  paymentMethod: 'cash' | 'bank' | 'cheque' | 'online';
  receivedFrom: string;
  contactInfo?: string;
  accountId?: mongoose.Types.ObjectId;
  remarks?: string;
  branchId?: mongoose.Types.ObjectId;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const IncomeSchema = new Schema<IIncome>(
  {
    receiptNo: {
      type: String,
      required: [true, 'Receipt number is required'],
      unique: true,
      trim: true
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      default: Date.now
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount must be positive']
    },
    paymentMethod: {
      type: String,
      required: [true, 'Payment method is required'],
      enum: ['cash', 'bank', 'cheque', 'online'],
      lowercase: true
    },
    receivedFrom: {
      type: String,
      required: [true, 'Source is required'],
      trim: true
    },
    contactInfo: {
      type: String,
      trim: true
    },
    accountId: {
      type: Schema.Types.ObjectId,
      ref: 'Account'
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
IncomeSchema.index({ branchId: 1, date: -1 });
IncomeSchema.index({ category: 1 });
IncomeSchema.index({ receiptNo: 1 });
IncomeSchema.index({ date: -1 });

export const Income = mongoose.model<IIncome>('Income', IncomeSchema);
