import mongoose, { Schema } from 'mongoose';
import { ITextbookIndent, ITextbookIndentItem } from '../types';

const TextbookIndentItemSchema = new Schema<ITextbookIndentItem>({
  textbookId: {
    type: String,
    required: true
  },
  bookCode: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  publisher: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  returnedQuantity: {
    type: Number,
    default: 0,
    min: 0
  },
  status: {
    type: String,
    enum: ['issued', 'partially_returned', 'returned', 'lost', 'damaged'],
    default: 'issued'
  },
  issueDate: {
    type: Date,
    default: Date.now
  },
  returnDate: {
    type: Date
  },
  condition: {
    type: String,
    enum: ['good', 'fair', 'poor', 'damaged', 'lost']
  },
  remarks: {
    type: String,
    trim: true
  }
});

const TextbookIndentSchema = new Schema<ITextbookIndent>({
  indentNo: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  studentId: {
    type: String,
    required: true
  },
  studentName: {
    type: String,
    required: true,
    trim: true
  },
  admissionNo: {
    type: String,
    required: true,
    trim: true
  },
  class: {
    type: String,
    required: true,
    trim: true
  },
  division: {
    type: String,
    trim: true
  },
  academicYear: {
    type: String,
    required: true,
    trim: true
  },
  items: [TextbookIndentItemSchema],
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'bank', 'online', 'adjustment'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'partial', 'paid'],
    default: 'pending'
  },
  paidAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  balanceAmount: {
    type: Number,
    required: true,
    min: 0
  },
  issueDate: {
    type: Date,
    default: Date.now
  },
  expectedReturnDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['pending', 'issued', 'partially_returned', 'returned', 'cancelled'],
    default: 'pending'
  },
  issuedBy: {
    type: String,
    required: true
  },
  issuedByName: {
    type: String,
    required: true
  },
  remarks: {
    type: String,
    trim: true
  },
  receiptGenerated: {
    type: Boolean,
    default: false
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
TextbookIndentSchema.index({ indentNo: 1 });
TextbookIndentSchema.index({ studentId: 1 });
TextbookIndentSchema.index({ branchId: 1 });
TextbookIndentSchema.index({ status: 1 });
TextbookIndentSchema.index({ paymentStatus: 1 });
TextbookIndentSchema.index({ issueDate: 1 });
TextbookIndentSchema.index({ expectedReturnDate: 1 });
TextbookIndentSchema.index({ studentName: 'text', admissionNo: 'text', indentNo: 'text' });

export const TextbookIndent = mongoose.model<ITextbookIndent>('TextbookIndent', TextbookIndentSchema);