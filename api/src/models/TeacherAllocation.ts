import mongoose, { Document, Schema } from 'mongoose';

export interface ITeacherAllocation extends Document {
  teacherId: mongoose.Types.ObjectId;
  teacherName: string;
  classId: mongoose.Types.ObjectId;
  className: string;
  divisionId?: mongoose.Types.ObjectId;
  divisionName?: string;
  subjectId?: mongoose.Types.ObjectId;
  subjectName?: string;
  isClassTeacher: boolean;
  academicYear: string;
  organizationId: mongoose.Types.ObjectId;
  branchId?: mongoose.Types.ObjectId;
}

const TeacherAllocationSchema = new Schema<ITeacherAllocation>(
  {
    teacherId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    teacherName: { type: String, required: true },
    classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
    className: { type: String, required: true },
    divisionId: { type: Schema.Types.ObjectId, ref: 'Division' },
    divisionName: { type: String },
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject' },
    subjectName: { type: String },
    isClassTeacher: { type: Boolean, default: false },
    academicYear: { type: String, required: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch' },
  },
  { timestamps: true }
);

// Unique: one teacher-class-subject-division combo per academic year
TeacherAllocationSchema.index(
  { teacherId: 1, classId: 1, subjectId: 1, divisionId: 1, academicYear: 1 },
  { unique: true }
);
TeacherAllocationSchema.index({ organizationId: 1, branchId: 1, academicYear: 1 });
TeacherAllocationSchema.index({ teacherId: 1, academicYear: 1 });
TeacherAllocationSchema.index({ classId: 1, academicYear: 1 });

export const TeacherAllocation = mongoose.model<ITeacherAllocation>('TeacherAllocation', TeacherAllocationSchema);
