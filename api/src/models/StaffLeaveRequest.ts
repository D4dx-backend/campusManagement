import mongoose, { Schema } from 'mongoose';

export interface IStaffLeaveRequest {
  _id: string;
  userId: mongoose.Types.ObjectId;
  userName: string;
  role: string;
  leaveType: 'casual' | 'sick' | 'earned' | 'other';
  fromDate: Date;
  toDate: Date;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  reviewNote?: string;
  organizationId: mongoose.Types.ObjectId;
  branchId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const StaffLeaveRequestSchema = new Schema<IStaffLeaveRequest>(
  {
    userId: {
      type: Schema.Types.ObjectId as any,
      ref: 'User',
      required: true,
    },
    userName: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      required: true,
    },
    leaveType: {
      type: String,
      enum: ['casual', 'sick', 'earned', 'other'],
      default: 'casual',
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
  },
  { timestamps: true }
);

StaffLeaveRequestSchema.index({ userId: 1, status: 1 });
StaffLeaveRequestSchema.index({ branchId: 1, status: 1 });
StaffLeaveRequestSchema.index({ organizationId: 1 });

export const StaffLeaveRequest = mongoose.model<IStaffLeaveRequest>(
  'StaffLeaveRequest',
  StaffLeaveRequestSchema
);
