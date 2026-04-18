import mongoose, { Schema } from 'mongoose';
import { IActivityLog, UserRole } from '../types';

const ActivityLogSchema = new Schema<IActivityLog>({
  userId: {
    type: Schema.Types.ObjectId as any,
    ref: 'User',
    required: true
  } as any,
  userName: {
    type: String,
    required: true,
    trim: true
  },
  userRole: {
    type: String,
    enum: ['platform_admin', 'org_admin', 'branch_admin', 'accountant', 'teacher', 'staff'],
    required: true
  },
  action: {
    type: String,
    required: true,
    trim: true
  },
  module: {
    type: String,
    required: true,
    trim: true
  },
  details: {
    type: String,
    required: true,
    trim: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  ipAddress: {
    type: String,
    trim: true
  },
  branchId: {
    type: Schema.Types.ObjectId as any,
    ref: 'Branch'
  },
  organizationId: {
    type: Schema.Types.ObjectId as any,
    ref: 'Organization'
  }
}, {
  timestamps: true
});

// Indexes
ActivityLogSchema.index({ userId: 1 });
ActivityLogSchema.index({ branchId: 1 });
ActivityLogSchema.index({ organizationId: 1 });
ActivityLogSchema.index({ timestamp: -1 });
ActivityLogSchema.index({ module: 1 });
ActivityLogSchema.index({ action: 1 });

// TTL index: auto-delete activity logs older than 20 days
ActivityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 20 * 24 * 60 * 60 });

export const ActivityLog = mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema);