import mongoose, { Schema } from 'mongoose';

export interface IDesignation {
  _id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive';
  branchId: string;
  createdAt: Date;
  updatedAt: Date;
}

const DesignationSchema = new Schema<IDesignation>({
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

// Compound index to ensure unique designation name per branch
DesignationSchema.index({ name: 1, branchId: 1 }, { unique: true });
DesignationSchema.index({ branchId: 1 });
DesignationSchema.index({ status: 1 });

export const Designation = mongoose.model<IDesignation>('Designation', DesignationSchema);