import mongoose, { Schema, Document } from 'mongoose';

export interface IFeeTypeConfig extends Document {
  name: string;
  isCommon: boolean;
  isActive: boolean;
  organizationId: mongoose.Types.ObjectId;
  branchId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const FeeTypeConfigSchema = new Schema<IFeeTypeConfig>(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    isCommon: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
      default: true
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
  },
  { timestamps: true }
);

FeeTypeConfigSchema.index({ branchId: 1, isActive: 1 });
FeeTypeConfigSchema.index({ organizationId: 1 });
FeeTypeConfigSchema.index({ branchId: 1, name: 1 }, { unique: true });

export const FeeTypeConfig = mongoose.model<IFeeTypeConfig>('FeeTypeConfig', FeeTypeConfigSchema);
