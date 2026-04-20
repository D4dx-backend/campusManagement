import mongoose, { Schema } from 'mongoose';

export interface IAcademicYear {
  _id: string;
  name: string; // e.g. "2025-26"
  startDate: Date;
  endDate: Date;
  isCurrent: boolean;
  status: 'active' | 'inactive';
  organizationId: string;
  branchId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const AcademicYearSchema = new Schema<IAcademicYear>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  isCurrent: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  organizationId: {
    type: Schema.Types.ObjectId as any,
    ref: 'Organization',
    required: true
  },
  branchId: {
    type: Schema.Types.ObjectId as any,
    ref: 'Branch',
    default: null
  }
}, {
  timestamps: true
});

AcademicYearSchema.index({ name: 1, branchId: 1 }, { unique: true, sparse: true });
AcademicYearSchema.index({ branchId: 1 });
AcademicYearSchema.index({ organizationId: 1 });
AcademicYearSchema.index({ isCurrent: 1, branchId: 1 });

export const AcademicYear = mongoose.model<IAcademicYear>('AcademicYear', AcademicYearSchema);
