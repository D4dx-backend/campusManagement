import { Schema, model, Document, Types } from 'mongoose';

export interface IContentProgress extends Document {
  studentId: Types.ObjectId;
  contentId: Types.ObjectId;
  chapterId: Types.ObjectId;
  subjectId: Types.ObjectId;
  classId: Types.ObjectId;
  isCompleted: boolean;
  completedAt?: Date;
  timeSpent: number;
  lastAccessedAt: Date;
  accessCount: number;
  videoProgress?: number;
  lastPosition?: number;
  organizationId: Types.ObjectId;
  branchId: Types.ObjectId;
}

const ContentProgressSchema = new Schema<IContentProgress>({
  studentId: {
    type: Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  contentId: {
    type: Schema.Types.ObjectId,
    ref: 'LessonContent',
    required: true
  },
  chapterId: {
    type: Schema.Types.ObjectId,
    ref: 'Chapter',
    required: true
  },
  subjectId: {
    type: Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  classId: {
    type: Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date
  },
  timeSpent: {
    type: Number,
    default: 0
  },
  lastAccessedAt: {
    type: Date,
    default: Date.now
  },
  accessCount: {
    type: Number,
    default: 1
  },
  videoProgress: {
    type: Number,
    min: 0,
    max: 100
  },
  lastPosition: {
    type: Number,
    min: 0
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
  }
}, { timestamps: true });

ContentProgressSchema.index({ studentId: 1, contentId: 1, branchId: 1 }, { unique: true });
ContentProgressSchema.index({ studentId: 1, classId: 1, subjectId: 1 });
ContentProgressSchema.index({ classId: 1, subjectId: 1, chapterId: 1 });
ContentProgressSchema.index({ branchId: 1, classId: 1 });

export const ContentProgress = model<IContentProgress>('ContentProgress', ContentProgressSchema);
