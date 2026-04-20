import mongoose, { Document, Schema } from 'mongoose';

export interface IAnnouncement extends Document {
  title: string;
  message: string;
  type: 'general' | 'academic' | 'event' | 'emergency';
  // Targeting hierarchy: organization → branch → class → division → student
  targetScope: 'organization' | 'branch' | 'class' | 'division' | 'student';
  targetRoles: string[]; // ['all'] or ['students','teachers','staff'] etc.
  targetBranchIds: mongoose.Types.ObjectId[];
  targetBranchNames: string[];
  targetClassId?: mongoose.Types.ObjectId;
  targetClassName?: string;
  targetDivisionId?: mongoose.Types.ObjectId;
  targetDivisionName?: string;
  targetStudentIds: mongoose.Types.ObjectId[];
  targetStudentNames: string[];
  priority: 'low' | 'normal' | 'high' | 'urgent';
  attachmentUrl?: string;
  isActive: boolean;
  expiresAt?: Date;
  readBy: mongoose.Types.ObjectId[];
  createdBy: mongoose.Types.ObjectId;
  createdByName: string;
  createdByRole: string;
  organizationId: mongoose.Types.ObjectId;
  branchId?: mongoose.Types.ObjectId;
}

const AnnouncementSchema = new Schema<IAnnouncement>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    message: { type: String, required: true, trim: true, maxlength: 5000 },
    type: { type: String, enum: ['general', 'academic', 'event', 'emergency'], default: 'general' },
    targetScope: { type: String, enum: ['organization', 'branch', 'class', 'division', 'student'], default: 'branch' },
    targetRoles: [{ type: String }],
    targetBranchIds: [{ type: Schema.Types.ObjectId, ref: 'Branch' }],
    targetBranchNames: [{ type: String }],
    targetClassId: { type: Schema.Types.ObjectId, ref: 'Class' },
    targetClassName: { type: String },
    targetDivisionId: { type: Schema.Types.ObjectId, ref: 'Division' },
    targetDivisionName: { type: String },
    targetStudentIds: [{ type: Schema.Types.ObjectId, ref: 'Student' }],
    targetStudentNames: [{ type: String }],
    priority: { type: String, enum: ['low', 'normal', 'high', 'urgent'], default: 'normal' },
    attachmentUrl: { type: String },
    isActive: { type: Boolean, default: true },
    expiresAt: { type: Date },
    readBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    createdByName: { type: String, required: true },
    createdByRole: { type: String, required: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch' },
  },
  { timestamps: true }
);

AnnouncementSchema.index({ organizationId: 1, isActive: 1, createdAt: -1 });
AnnouncementSchema.index({ branchId: 1, isActive: 1 });
AnnouncementSchema.index({ targetScope: 1 });
AnnouncementSchema.index({ targetClassId: 1 });
AnnouncementSchema.index({ targetStudentIds: 1 });
AnnouncementSchema.index({ readBy: 1 });

export const Announcement = mongoose.model<IAnnouncement>('Announcement', AnnouncementSchema);
