import mongoose, { Schema, Document } from 'mongoose';

export interface IFeeStructure extends Document {
  title: string;
  feeType: 'tuition' | 'transport' | 'cocurricular' | 'maintenance' | 'exam' | 'textbook' | 'other';
  classId: mongoose.Types.ObjectId;
  className: string;
  amount: number;
  staffDiscountPercent?: number;
  transportDistanceGroup?: 'group1' | 'group2' | 'group3' | 'group4'; // For transport fees
  distanceRange?: string; // e.g., "0-5 KM", "5-10 KM"
  isActive: boolean;
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
  feeType: {
    type: String,
    enum: ['tuition', 'transport', 'cocurricular', 'maintenance', 'exam', 'textbook', 'other'],
    required: true
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
    enum: ['group1', 'group2', 'group3', 'group4'],
    required: function(this: IFeeStructure) {
      return this.feeType === 'transport';
    }
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
  academicYear: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: true
});

// Indexes
FeeStructureSchema.index({ branchId: 1, academicYear: 1 });
FeeStructureSchema.index({ classId: 1, feeType: 1 });
FeeStructureSchema.index({ isActive: 1 });

export const FeeStructure = mongoose.model<IFeeStructure>('FeeStructure', FeeStructureSchema);
