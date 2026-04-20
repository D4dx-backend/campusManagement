import mongoose, { Schema } from 'mongoose';

export interface IAssessmentQuestion {
  questionNumber: number;
  questionText: string;
  questionType: 'mcq' | 'true_false' | 'short_answer' | 'long_answer' | 'fill_blank';
  options: {
    optionId: string;
    text: string;
    isCorrect: boolean;
  }[];
  correctAnswer?: string;
  marks: number;
  explanation?: string;
  imageUrl?: string;
}

export interface IAssessmentSettings {
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showResults: 'immediately' | 'after_due_date' | 'manual';
  allowRetake: boolean;
  maxRetakes: number;
  showCorrectAnswers: boolean;
}

export interface ILmsAssessment {
  _id: string;
  subjectId: string;
  classId: string;
  chapterId?: string;
  title: string;
  assessmentType: 'quiz' | 'assignment' | 'online_exam';
  instructions?: string;
  totalMarks: number;
  passingMarks: number;
  duration?: number;
  questions: IAssessmentQuestion[];
  settings: IAssessmentSettings;
  status: 'draft' | 'published' | 'archived';
  organizationId: string;
  branchId: string;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AssessmentQuestionSchema = new Schema({
  questionNumber: { type: Number, required: true },
  questionText: { type: String, required: true },
  questionType: {
    type: String,
    enum: ['mcq', 'true_false', 'short_answer', 'long_answer', 'fill_blank'],
    required: true
  },
  options: [{
    optionId: { type: String, required: true },
    text: { type: String, required: true },
    isCorrect: { type: Boolean, default: false }
  }],
  correctAnswer: { type: String },
  marks: { type: Number, required: true, default: 1 },
  explanation: { type: String },
  imageUrl: { type: String }
}, { _id: false });

const AssessmentSettingsSchema = new Schema({
  shuffleQuestions: { type: Boolean, default: false },
  shuffleOptions: { type: Boolean, default: false },
  showResults: {
    type: String,
    enum: ['immediately', 'after_due_date', 'manual'],
    default: 'immediately'
  },
  allowRetake: { type: Boolean, default: false },
  maxRetakes: { type: Number, default: 1 },
  showCorrectAnswers: { type: Boolean, default: true }
}, { _id: false });

const LmsAssessmentSchema = new Schema<ILmsAssessment>({
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
  chapterId: {
    type: Schema.Types.ObjectId as any,
    ref: 'Chapter'
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  assessmentType: {
    type: String,
    enum: ['quiz', 'assignment', 'online_exam'],
    required: true
  },
  instructions: {
    type: String
  },
  totalMarks: {
    type: Number,
    required: true,
    default: 0
  },
  passingMarks: {
    type: Number,
    required: true,
    default: 0
  },
  duration: {
    type: Number // in minutes
  },
  questions: [AssessmentQuestionSchema],
  settings: {
    type: AssessmentSettingsSchema,
    default: () => ({})
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
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

LmsAssessmentSchema.index({ subjectId: 1, classId: 1 });
LmsAssessmentSchema.index({ chapterId: 1 });
LmsAssessmentSchema.index({ branchId: 1 });
LmsAssessmentSchema.index({ organizationId: 1 });
LmsAssessmentSchema.index({ status: 1 });
LmsAssessmentSchema.index({ assessmentType: 1 });

export const LmsAssessment = mongoose.model<ILmsAssessment>('LmsAssessment', LmsAssessmentSchema);
