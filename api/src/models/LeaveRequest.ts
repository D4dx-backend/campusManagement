import mongoose, { Schema } from 'mongoose';

export interface ILeaveRequest {
  _id: string;
  studentId: mongoose.Types.ObjectId;
  studentName: string;
  classId: mongoose.Types.ObjectId;
  className: string;
  section: string;
  fromDate: Date;
  toDate: Date;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  reviewNote?: string;
  requestedBy: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  branchId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const LeaveRequestSchema = new Schema<ILeaveRequest>({
  studentId: {
    type: Schema.Types.ObjectId as any,
    ref: 'Student',
    required: true,
  },
  studentName: {
    type: String,
    required: true,
    trim: true,
  },
  classId: {
    type: Schema.Types.ObjectId as any,
    ref: 'Class',
    required: true,
  },
  className: {
    type: String,
    required: true,
    trim: true,
  },
  section: {
    type: String,
    default: '',
    trim: true,
  },
  fromDate: {
    type: Date,
    required: true,
  },
  toDate: {
    type: Date,
    required: true,
  },
  reason: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  reviewedBy: {
    type: Schema.Types.ObjectId as any,
    ref: 'User',
  },
  reviewedAt: {
    type: Date,
  },
  reviewNote: {
    type: String,
    trim: true,
    maxlength: 500,
  },
  requestedBy: {
    type: Schema.Types.ObjectId as any,
    ref: 'User',
    required: true,
  },
  organizationId: {
    type: Schema.Types.ObjectId as any,
    ref: 'Organization',
    required: true,
  },
  branchId: {
    type: Schema.Types.ObjectId as any,
    ref: 'Branch',
    required: true,
  },
}, {
  timestamps: true,
});

LeaveRequestSchema.index({ branchId: 1, status: 1 });
LeaveRequestSchema.index({ studentId: 1, fromDate: 1 });
LeaveRequestSchema.index({ classId: 1, status: 1 });
LeaveRequestSchema.index({ organizationId: 1 });

export const LeaveRequest = mongoose.model<ILeaveRequest>('LeaveRequest', LeaveRequestSchema);
