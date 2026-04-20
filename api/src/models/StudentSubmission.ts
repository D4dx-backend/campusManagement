import mongoose, { Schema } from 'mongoose';

export interface ISubmissionAnswer {
  questionNumber: number;
  selectedOption?: string;
  textAnswer?: string;
  isCorrect?: boolean;
  marksAwarded?: number;
}

export interface ISubmissionFile {
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: Date;
}

export interface IStudentSubmission {
  _id: string;
  assessmentId: string;
  studentId: string;
  submissionType: 'mcq_answers' | 'text' | 'file' | 'mixed';
  answers: ISubmissionAnswer[];
  files: ISubmissionFile[];
  textResponse?: string;
  totalMarksAwarded?: number;
  percentage?: number;
  grade?: string;
  isPassed?: boolean;
  feedback?: string;
  gradedBy?: string;
  gradedAt?: Date;
  startedAt?: Date;
  submittedAt?: Date;
  timeSpent?: number;
  attemptNumber: number;
  status: 'not_started' | 'in_progress' | 'submitted' | 'graded' | 'returned';
  organizationId: string;
  branchId: string;
  createdAt: Date;
  updatedAt: Date;
}

const SubmissionAnswerSchema = new Schema({
  questionNumber: { type: Number, required: true },
  selectedOption: { type: String },
  textAnswer: { type: String },
  isCorrect: { type: Boolean },
  marksAwarded: { type: Number }
}, { _id: false });

const SubmissionFileSchema = new Schema({
  fileUrl: { type: String, required: true },
  fileName: { type: String, required: true },
  fileSize: { type: Number },
  mimeType: { type: String },
  uploadedAt: { type: Date, default: Date.now }
}, { _id: false });

const StudentSubmissionSchema = new Schema<IStudentSubmission>({
  assessmentId: {
    type: Schema.Types.ObjectId as any,
    ref: 'LmsAssessment',
    required: true
  },
  studentId: {
    type: Schema.Types.ObjectId as any,
    ref: 'Student',
    required: true
  },
  submissionType: {
    type: String,
    enum: ['mcq_answers', 'text', 'file', 'mixed'],
    default: 'mcq_answers'
  },
  answers: [SubmissionAnswerSchema],
  files: [SubmissionFileSchema],
  textResponse: { type: String },
  totalMarksAwarded: { type: Number },
  percentage: { type: Number },
  grade: { type: String },
  isPassed: { type: Boolean },
  feedback: { type: String },
  gradedBy: {
    type: Schema.Types.ObjectId as any,
    ref: 'User'
  },
  gradedAt: { type: Date },
  startedAt: { type: Date },
  submittedAt: { type: Date },
  timeSpent: { type: Number },
  attemptNumber: {
    type: Number,
    default: 1
  },
  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'submitted', 'graded', 'returned'],
    default: 'not_started'
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
  }
}, {
  timestamps: true
});

StudentSubmissionSchema.index({ assessmentId: 1, studentId: 1, attemptNumber: 1, branchId: 1 }, { unique: true });
StudentSubmissionSchema.index({ studentId: 1, status: 1 });
StudentSubmissionSchema.index({ assessmentId: 1 });
StudentSubmissionSchema.index({ branchId: 1 });
StudentSubmissionSchema.index({ organizationId: 1 });

export const StudentSubmission = mongoose.model<IStudentSubmission>('StudentSubmission', StudentSubmissionSchema);
