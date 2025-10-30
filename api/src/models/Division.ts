import mongoose, { Schema } from 'mongoose';
import { IDivision } from '../types';

const DivisionSchema = new Schema<IDivision>({
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
  name: {
    type: String,
    required: true,
    trim: true
  },
  capacity: {
    type: Number,
    required: true,
    min: 1
  },
  classTeacherId: {
    type: Schema.Types.ObjectId as any,
    ref: 'Staff'
  },
  classTeacherName: {
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

// Compound index to ensure unique division name per class per branch
DivisionSchema.index({ name: 1, classId: 1, branchId: 1 }, { unique: true });
DivisionSchema.index({ classId: 1 });
DivisionSchema.index({ branchId: 1 });
DivisionSchema.index({ status: 1 });

export const Division = mongoose.model<IDivision>('Division', DivisionSchema);