import mongoose, { Schema, Document } from 'mongoose';

export interface IAccount extends Document {
  accountName: string;
  accountType: 'cash' | 'bank';
  accountNumber?: string;
  bankName?: string;
  branchName?: string;
  ifscCode?: string;
  openingBalance: number;
  currentBalance: number;
  description?: string;
  isActive: boolean;
  branchId?: mongoose.Types.ObjectId;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AccountSchema = new Schema<IAccount>(
  {
    accountName: {
      type: String,
      required: [true, 'Account name is required'],
      trim: true
    },
    accountType: {
      type: String,
      required: [true, 'Account type is required'],
      enum: ['cash', 'bank'],
      lowercase: true
    },
    accountNumber: {
      type: String,
      trim: true,
      sparse: true
    },
    bankName: {
      type: String,
      trim: true
    },
    branchName: {
      type: String,
      trim: true
    },
    ifscCode: {
      type: String,
      trim: true,
      uppercase: true
    },
    openingBalance: {
      type: Number,
      required: [true, 'Opening balance is required'],
      default: 0
    },
    currentBalance: {
      type: Number,
      required: true,
      default: 0
    },
    description: {
      type: String,
      trim: true
    },
    isActive: {
      type: Boolean,
      default: true
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
AccountSchema.index({ branchId: 1, accountType: 1 });
AccountSchema.index({ accountNumber: 1 }, { sparse: true });
AccountSchema.index({ isActive: 1 });

export const Account = mongoose.model<IAccount>('Account', AccountSchema);
