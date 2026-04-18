import mongoose, { Schema } from 'mongoose';

export interface IExam {
  _id: string;
  name: string; // e.g. "First Term Exam 2025-26", "Annual Exam 2025-26"
  academicYear: string; // e.g. "2025-26"
  examType: 'term' | 'quarterly' | 'half_yearly' | 'annual' | 'class_test' | 'other';
  startDate?: Date;
  endDate?: Date;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  organizationId: string;
  branchId: string;
  createdAt: Date;
  updatedAt: Date;
}

const ExamSchema = new Schema<IExam>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  academicYear: {
    type: String,
    required: true,
    trim: true
  },
  examType: {
    type: String,
    enum: ['term', 'quarterly', 'half_yearly', 'annual', 'class_test', 'other'],
    required: true
  },
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
    default: 'upcoming'
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

ExamSchema.index({ name: 1, academicYear: 1, branchId: 1 }, { unique: true });
ExamSchema.index({ branchId: 1 });
ExamSchema.index({ organizationId: 1 });
ExamSchema.index({ academicYear: 1 });
ExamSchema.index({ status: 1 });

export const Exam = mongoose.model<IExam>('Exam', ExamSchema);
