import { Schema, model, Document, Types } from 'mongoose';

export interface IClassContentAssignment extends Document {
  contentType: 'lesson' | 'assessment';
  contentId: Types.ObjectId;
  classId: Types.ObjectId;
  divisionIds: Types.ObjectId[];
  availableFrom: Date;
  availableUntil?: Date;
  dueDate?: Date;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  isPublished: boolean;
  assignedBy: Types.ObjectId;
  scheduleType: 'immediate' | 'scheduled' | 'recurring';
  recurringConfig?: {
    frequency: 'daily' | 'weekly' | 'bi_weekly' | 'monthly';
    dayOfWeek?: number;
    dayOfMonth?: number;
    endDate?: Date;
  };
  title: string;
  description?: string;
  organizationId: Types.ObjectId;
  branchId: Types.ObjectId;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ClassContentAssignmentSchema = new Schema<IClassContentAssignment>({
  contentType: {
    type: String,
    enum: ['lesson', 'assessment'],
    required: true
  },
  contentId: {
    type: Schema.Types.ObjectId,
    required: true,
    refPath: 'contentType === "lesson" ? "LessonContent" : "LmsAssessment"'
  },
  classId: {
    type: Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  divisionIds: [{
    type: Schema.Types.ObjectId,
    ref: 'Division'
  }],
  availableFrom: {
    type: Date,
    required: true
  },
  availableUntil: {
    type: Date
  },
  dueDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['scheduled', 'active', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  assignedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  scheduleType: {
    type: String,
    enum: ['immediate', 'scheduled', 'recurring'],
    default: 'immediate'
  },
  recurringConfig: {
    frequency: { type: String, enum: ['daily', 'weekly', 'bi_weekly', 'monthly'] },
    dayOfWeek: { type: Number, min: 0, max: 6 },
    dayOfMonth: { type: Number, min: 1, max: 31 },
    endDate: { type: Date }
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  organizationId: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  branchId: {
    type: Schema.Types.ObjectId,
    ref: 'Branch',
    required: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

ClassContentAssignmentSchema.index({ classId: 1, contentType: 1, contentId: 1, branchId: 1 });
ClassContentAssignmentSchema.index({ availableFrom: 1, status: 1 });
ClassContentAssignmentSchema.index({ branchId: 1, status: 1 });

export const ClassContentAssignment = model<IClassContentAssignment>('ClassContentAssignment', ClassContentAssignmentSchema);
