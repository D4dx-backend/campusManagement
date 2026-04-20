import mongoose, { Schema } from 'mongoose';

export interface ILessonContent {
  _id: string;
  chapterId: string;
  subjectId: string;
  classId: string;
  title: string;
  contentType: 'lesson' | 'video' | 'document' | 'image' | 'link' | 'interactive' | 'audio' | 'meeting';
  body?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  externalUrl?: string;
  meetingUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
  isDownloadable?: boolean;
  sortOrder: number;
  status: 'draft' | 'published' | 'archived';
  tags: string[];
  organizationId: string;
  branchId: string;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LessonContentSchema = new Schema<ILessonContent>({
  chapterId: {
    type: Schema.Types.ObjectId as any,
    ref: 'Chapter',
    required: true
  },
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
  title: {
    type: String,
    required: true,
    trim: true
  },
  contentType: {
    type: String,
    enum: ['lesson', 'video', 'document', 'image', 'link', 'interactive', 'audio', 'meeting'],
    required: true
  },
  body: {
    type: String
  },
  fileUrl: {
    type: String
  },
  fileName: {
    type: String,
    trim: true
  },
  fileSize: {
    type: Number
  },
  mimeType: {
    type: String,
    trim: true
  },
  externalUrl: {
    type: String,
    trim: true
  },
  meetingUrl: {
    type: String,
    trim: true
  },
  thumbnailUrl: {
    type: String
  },
  duration: {
    type: Number
  },
  isDownloadable: {
    type: Boolean,
    default: false
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  tags: [{
    type: String,
    trim: true
  }],
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

LessonContentSchema.index({ chapterId: 1, sortOrder: 1 });
LessonContentSchema.index({ subjectId: 1, classId: 1 });
LessonContentSchema.index({ branchId: 1 });
LessonContentSchema.index({ organizationId: 1 });
LessonContentSchema.index({ status: 1 });
LessonContentSchema.index({ contentType: 1 });
LessonContentSchema.index({ tags: 1 });

export const LessonContent = mongoose.model<ILessonContent>('LessonContent', LessonContentSchema);
