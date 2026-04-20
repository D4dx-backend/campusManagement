import mongoose, { Schema } from 'mongoose';

export interface IAttendanceRecord {
  studentId: mongoose.Types.ObjectId;
  status: 'present' | 'absent' | 'late' | 'half_day';
}

export interface IAttendance {
  _id: string;
  date: Date;
  classId: mongoose.Types.ObjectId;
  section: string;
  records: IAttendanceRecord[];
  markedBy: mongoose.Types.ObjectId;
  academicYear: string;
  organizationId: mongoose.Types.ObjectId;
  branchId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceRecordSchema = new Schema<IAttendanceRecord>({
  studentId: {
    type: Schema.Types.ObjectId as any,
    ref: 'Student',
    required: true,
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'half_day'],
    required: true,
  },
}, { _id: false });

const AttendanceSchema = new Schema<IAttendance>({
  date: {
    type: Date,
    required: true,
  },
  classId: {
    type: Schema.Types.ObjectId as any,
    ref: 'Class',
    required: true,
  },
  section: {
    type: String,
    required: false,
    default: '',
    trim: true,
  },
  records: {
    type: [AttendanceRecordSchema],
    required: true,
    default: [],
  },
  markedBy: {
    type: Schema.Types.ObjectId as any,
    ref: 'User',
    required: true,
  },
  academicYear: {
    type: String,
    required: true,
    trim: true,
  },
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
}, {
  timestamps: true,
});

// One attendance record per class+section+date
AttendanceSchema.index({ classId: 1, section: 1, date: 1, branchId: 1 }, { unique: true });
AttendanceSchema.index({ branchId: 1, date: 1 });
AttendanceSchema.index({ organizationId: 1 });

export const Attendance = mongoose.model<IAttendance>('Attendance', AttendanceSchema);
