import mongoose, { Schema } from 'mongoose';

export interface ITimetableEntry {
  dayOfWeek: number;
  slotNumber: number;
  subjectId: mongoose.Types.ObjectId;
  subjectName: string;
  staffId: mongoose.Types.ObjectId;
  staffName: string;
}

export interface ITimetable {
  _id: string;
  classId: mongoose.Types.ObjectId;
  divisionId: mongoose.Types.ObjectId;
  academicYearId: mongoose.Types.ObjectId;
  configId: mongoose.Types.ObjectId;
  entries: ITimetableEntry[];
  effectiveFrom?: Date;
  status: 'draft' | 'active' | 'archived';
  clonedFrom?: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  branchId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TimetableEntrySchema = new Schema<ITimetableEntry>(
  {
    dayOfWeek: { type: Number, required: true, min: 0, max: 6 },
    slotNumber: { type: Number, required: true },
    subjectId: { type: Schema.Types.ObjectId as any, ref: 'Subject', required: true },
    subjectName: { type: String, required: true, trim: true },
    staffId: { type: Schema.Types.ObjectId as any, ref: 'Staff', required: true },
    staffName: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const TimetableSchema = new Schema<ITimetable>(
  {
    classId: {
      type: Schema.Types.ObjectId as any,
      ref: 'Class',
      required: true,
    },
    divisionId: {
      type: Schema.Types.ObjectId as any,
      ref: 'Division',
      required: true,
    },
    academicYearId: {
      type: Schema.Types.ObjectId as any,
      ref: 'AcademicYear',
      required: true,
    },
    configId: {
      type: Schema.Types.ObjectId as any,
      ref: 'TimetableConfig',
      required: true,
    },
    entries: { type: [TimetableEntrySchema], default: [] },
    effectiveFrom: { type: Date },
    status: {
      type: String,
      enum: ['draft', 'active', 'archived'],
      default: 'draft',
    },
    clonedFrom: { type: Schema.Types.ObjectId as any, ref: 'Timetable' },
    organizationId: {
      type: Schema.Types.ObjectId as any,
      ref: 'Organization',
      required: true,
    },
    branchId: {
      type: Schema.Types.ObjectId as any,
      ref: 'Branch',
      required: true,
    },
  },
  { timestamps: true }
);

// Only one active timetable per class+division+academicYear
TimetableSchema.index(
  { classId: 1, divisionId: 1, academicYearId: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: 'active' } }
);
TimetableSchema.index({ classId: 1 });
TimetableSchema.index({ divisionId: 1 });
TimetableSchema.index({ configId: 1 });
TimetableSchema.index({ branchId: 1 });
TimetableSchema.index({ organizationId: 1 });
TimetableSchema.index({ status: 1 });

export const Timetable = mongoose.model<ITimetable>('Timetable', TimetableSchema);
