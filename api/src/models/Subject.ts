import mongoose, { Schema } from 'mongoose';

export interface ISubject {
  _id: string;
  name: string;
  code: string;
  classIds: string[]; // which classes this subject applies to
  maxMark: number;
  passMark: number;
  isOptional: boolean;
  status: 'active' | 'inactive';
  organizationId: string;
  branchId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const SubjectSchema = new Schema<ISubject>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    trim: true,
    uppercase: true
  },
  classIds: [{
    type: Schema.Types.ObjectId,
    ref: 'Class'
  }],
  maxMark: {
    type: Number,
    required: true,
    default: 100
  },
  passMark: {
    type: Number,
    required: true,
    default: 33
  },
  isOptional: {
    type: Boolean,
    default: false
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
  }
}, {
  timestamps: true
});

SubjectSchema.index({ code: 1, branchId: 1 }, { unique: true, sparse: true });
SubjectSchema.index({ branchId: 1 });
SubjectSchema.index({ organizationId: 1 });
SubjectSchema.index({ classIds: 1 });
SubjectSchema.index({ status: 1 });
SubjectSchema.index({ organizationId: 1, branchId: 1 });

export const Subject = mongoose.model<ISubject>('Subject', SubjectSchema);
