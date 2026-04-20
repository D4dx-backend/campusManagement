import mongoose, { Schema } from 'mongoose';

export interface IChapter {
  _id: string;
  subjectId: string;
  classId: string;
  name: string;
  chapterNumber: number;
  description?: string;
  status: 'active' | 'inactive';
  organizationId: string;
  branchId: string;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ChapterSchema = new Schema<IChapter>({
  subjectId: {
    type: Schema.Types.ObjectId as any,
    ref: 'Subject',
    required: true
  },
  classId: {
    type: Schema.Types.ObjectId as any,
    ref: 'Class',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  chapterNumber: {
    type: Number,
    required: true
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
  organizationId: {
    type: Schema.Types.ObjectId as any,
    ref: 'Organization',
    required: true
  },
  branchId: {
    type: Schema.Types.ObjectId as any,
    ref: 'Branch',
    default: null
  },
  createdBy: {
    type: Schema.Types.ObjectId as any,
    ref: 'User'
  }
}, {
  timestamps: true
});

ChapterSchema.index({ subjectId: 1, classId: 1, chapterNumber: 1, branchId: 1, organizationId: 1 }, { unique: true });
ChapterSchema.index({ subjectId: 1, classId: 1 });
ChapterSchema.index({ branchId: 1 });
ChapterSchema.index({ organizationId: 1 });
ChapterSchema.index({ status: 1 });

export const Chapter = mongoose.model<IChapter>('Chapter', ChapterSchema);
