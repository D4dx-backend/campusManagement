import mongoose, { Schema } from 'mongoose';

export interface IMarkEntry {
  studentId: string;
  studentName: string;
  admissionNo: string;
  mark: number | null;
  grade: string;
  remarks?: string;
}

export interface IMarkSheet {
  _id: string;
  examId: string;
  examName: string;
  subjectId: string;
  subjectName: string;
  classId: string;
  className: string;
  divisionId?: string;
  divisionName?: string;
  academicYear: string;
  maxMark: number;
  passMark: number;
  examDate?: Date;
  entries: IMarkEntry[];
  isFinalized: boolean;
  organizationId: string;
  branchId: string;
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MarkEntrySchema = new Schema<IMarkEntry>({
  studentId: {
    type: Schema.Types.ObjectId as any,
    ref: 'Student',
    required: true
  },
  studentName: {
    type: String,
    required: true
  },
  admissionNo: {
    type: String,
    required: true
  },
  mark: {
    type: Number,
    default: null
  },
  grade: {
    type: String,
    default: ''
  },
  remarks: {
    type: String,
    trim: true
  }
}, { _id: false });

const MarkSheetSchema = new Schema<IMarkSheet>({
  examId: {
    type: Schema.Types.ObjectId as any,
    ref: 'Exam',
    required: true
  },
  examName: {
    type: String,
    required: true
  },
  subjectId: {
    type: Schema.Types.ObjectId as any,
    ref: 'Subject',
    required: true
  },
  subjectName: {
    type: String,
    required: true
  },
  classId: {
    type: Schema.Types.ObjectId as any,
    ref: 'Class',
    required: true
  },
  className: {
    type: String,
    required: true
  },
  divisionId: {
    type: Schema.Types.ObjectId as any,
    ref: 'Division'
  },
  divisionName: {
    type: String
  },
  academicYear: {
    type: String,
    required: true
  },
  maxMark: {
    type: Number,
    required: true
  },
  passMark: {
    type: Number,
    required: true
  },
  examDate: {
    type: Date
  },
  entries: [MarkEntrySchema],
  isFinalized: {
    type: Boolean,
    default: false
  },
  organizationId: {
    type: Schema.Types.ObjectId as any,
    ref: 'Organization',
    required: true
  },
  branchId: {
    type: Schema.Types.ObjectId as any,
    ref: 'Branch',
    required: true
  },
  createdBy: {
    type: Schema.Types.ObjectId as any,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: Schema.Types.ObjectId as any,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Unique: one mark sheet per exam+subject+class+division
MarkSheetSchema.index({ examId: 1, subjectId: 1, classId: 1, divisionId: 1, branchId: 1 }, { unique: true });
MarkSheetSchema.index({ examId: 1 });
MarkSheetSchema.index({ classId: 1 });
MarkSheetSchema.index({ branchId: 1 });
MarkSheetSchema.index({ organizationId: 1 });
MarkSheetSchema.index({ academicYear: 1 });
MarkSheetSchema.index({ 'entries.studentId': 1 });

export const MarkSheet = mongoose.model<IMarkSheet>('MarkSheet', MarkSheetSchema);
