import mongoose, { Schema, Document } from 'mongoose';

export interface IFeeStructure extends Document {
  title: string;
  feeTypeId: mongoose.Types.ObjectId;
  feeTypeName: string;
  isCommon: boolean;
  classId?: mongoose.Types.ObjectId;
  className?: string;
  amount: number;
  staffDiscountPercent?: number;
  transportDistanceGroup?: 'group1' | 'group2' | 'group3' | 'group4';
  distanceRange?: string;
  isActive: boolean;
  organizationId: mongoose.Types.ObjectId;
  branchId: mongoose.Types.ObjectId;
  academicYear: string;
  createdAt: Date;
  updatedAt: Date;
}

const FeeStructureSchema = new Schema<IFeeStructure>({
  title: {
    type: String,
    required: true,
    trim: true
  },
  feeTypeId: {
    type: Schema.Types.ObjectId as any,
    ref: 'FeeTypeConfig',
    required: true
  },
  feeTypeName: {
    type: String,
    required: true,
    trim: true
  },
  isCommon: {
    type: Boolean,
    default: false
  },
  classId: {
    type: Schema.Types.ObjectId as any,
    ref: 'Class'
  },
  className: {
    type: String,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  staffDiscountPercent: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  transportDistanceGroup: {
    type: String,
    enum: ['group1', 'group2', 'group3', 'group4']
  },
  distanceRange: {
    type: String,
    trim: true
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
  },
  academicYear: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: true
});

FeeStructureSchema.index({ branchId: 1, academicYear: 1 });
FeeStructureSchema.index({ organizationId: 1 });
FeeStructureSchema.index({ classId: 1, feeTypeId: 1 });
FeeStructureSchema.index({ isActive: 1 });
FeeStructureSchema.index({ isCommon: 1 });

export const FeeStructure = mongoose.model<IFeeStructure>('FeeStructure', FeeStructureSchema);
