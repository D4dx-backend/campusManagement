import mongoose, { Schema } from 'mongoose';

export interface ITimetableSlot {
  slotNumber: number;
  type: 'period' | 'break';
  label: string;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
}

export interface IDaySchedule {
  dayOfWeek: number; // 0=Sunday … 6=Saturday
  slots: ITimetableSlot[];
}

export interface ITimetableConfig {
  _id: string;
  name: string;
  academicYearId: mongoose.Types.ObjectId;
  workingDays: number[];
  daySchedules: IDaySchedule[];
  status: 'active' | 'inactive';
  organizationId: mongoose.Types.ObjectId;
  branchId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TimetableSlotSchema = new Schema<ITimetableSlot>(
  {
    slotNumber: { type: Number, required: true },
    type: { type: String, enum: ['period', 'break'], required: true },
    label: { type: String, required: true, trim: true },
    startTime: { type: String, required: true }, // HH:mm
    endTime: { type: String, required: true },
  },
  { _id: false }
);

const DayScheduleSchema = new Schema<IDaySchedule>(
  {
    dayOfWeek: { type: Number, required: true, min: 0, max: 6 },
    slots: { type: [TimetableSlotSchema], required: true },
  },
  { _id: false }
);

const TimetableConfigSchema = new Schema<ITimetableConfig>(
  {
    name: { type: String, required: true, trim: true },
    academicYearId: {
      type: Schema.Types.ObjectId as any,
      ref: 'AcademicYear',
      required: true,
    },
    workingDays: {
      type: [Number],
      required: true,
      validate: {
        validator: (v: number[]) => v.length > 0 && v.every((d) => d >= 0 && d <= 6),
        message: 'workingDays must contain valid day numbers (0-6)',
      },
    },
    daySchedules: { type: [DayScheduleSchema], required: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
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

TimetableConfigSchema.index({ name: 1, branchId: 1, academicYearId: 1 }, { unique: true });
TimetableConfigSchema.index({ branchId: 1 });
TimetableConfigSchema.index({ organizationId: 1 });
TimetableConfigSchema.index({ academicYearId: 1 });
TimetableConfigSchema.index({ status: 1 });

export const TimetableConfig = mongoose.model<ITimetableConfig>(
  'TimetableConfig',
  TimetableConfigSchema
);
