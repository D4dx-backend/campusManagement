import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IQuestionPoolItem {
  questionText: string;
  questionType: 'mcq' | 'true_false' | 'short_answer' | 'long_answer' | 'fill_blank';
  options: { optionId: string; text: string; isCorrect: boolean }[];
  correctAnswer?: string;
  marks: number;
  explanation?: string;
  imageUrl?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
}

export interface IQuestionPool extends Document {
  subjectId: Types.ObjectId;
  classId: Types.ObjectId;
  chapterId?: Types.ObjectId;
  name: string;
  description?: string;
  questions: IQuestionPoolItem[];
  organizationId: Types.ObjectId;
  branchId?: Types.ObjectId;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionPoolItemSchema = new Schema({
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
  marks: { type: Number, default: 1 },
  explanation: { type: String },
  imageUrl: { type: String },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  tags: [{ type: String, trim: true }]
}, { _id: true });

const QuestionPoolSchema = new Schema<IQuestionPool>({
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
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String
  },
  questions: [QuestionPoolItemSchema],
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

QuestionPoolSchema.index({ subjectId: 1, classId: 1 });
QuestionPoolSchema.index({ organizationId: 1 });
QuestionPoolSchema.index({ branchId: 1 });

export const QuestionPool = mongoose.model<IQuestionPool>('QuestionPool', QuestionPoolSchema);
