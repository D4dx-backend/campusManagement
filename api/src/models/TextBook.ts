import mongoose, { Schema } from 'mongoose';
import { ITextBook } from '../types';

const TextBookSchema = new Schema<ITextBook>({
  bookCode: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  classId: {
    type: String,
    required: true,
    trim: true
  },
  class: {
    type: String,
    required: true,
    trim: true
  },
  publisher: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  available: {
    type: Number,
    required: true,
    min: 0
  },
  academicYear: {
    type: String,
    required: true,
    trim: true
  },
  branchId: {
    type: Schema.Types.ObjectId as any,
    ref: 'Branch',
    required: true
  }
}, {
  timestamps: true
});

// Indexes
TextBookSchema.index({ branchId: 1 });
TextBookSchema.index({ classId: 1 });
TextBookSchema.index({ class: 1 });
TextBookSchema.index({ subject: 1 });
TextBookSchema.index({ academicYear: 1 });
TextBookSchema.index({ title: 'text', subject: 'text' });

export const TextBook = mongoose.model<ITextBook>('TextBook', TextBookSchema);