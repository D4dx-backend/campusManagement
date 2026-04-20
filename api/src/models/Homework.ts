import mongoose, { Document, Schema } from 'mongoose';

export interface IHomework extends Document {
  classId: mongoose.Types.ObjectId;
  className: string;
  divisionId?: mongoose.Types.ObjectId;
  divisionName?: string;
  subjectId?: mongoose.Types.ObjectId;
  subjectName: string;
  date: Date;
  dueDate: Date;
  title: string;
  description: string;
  attachmentUrl?: string;
  assignedBy: mongoose.Types.ObjectId;
  assignedByName: string;
  organizationId: mongoose.Types.ObjectId;
  branchId?: mongoose.Types.ObjectId;
}

const HomeworkSchema = new Schema<IHomework>(
  {
    classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
    className: { type: String, required: true },
    divisionId: { type: Schema.Types.ObjectId, ref: 'Division' },
    divisionName: { type: String },
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject' },
    subjectName: { type: String, required: true },
    date: { type: Date, required: true },
    dueDate: { type: Date, required: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, required: true, trim: true, maxlength: 2000 },
    attachmentUrl: { type: String },
    assignedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    assignedByName: { type: String, required: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch' },
  },
  { timestamps: true }
);

HomeworkSchema.index({ classId: 1, date: -1 });
HomeworkSchema.index({ organizationId: 1, branchId: 1 });
HomeworkSchema.index({ assignedBy: 1 });
HomeworkSchema.index({ dueDate: 1 });

export const Homework = mongoose.model<IHomework>('Homework', HomeworkSchema);
