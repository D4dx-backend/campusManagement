import express from 'express';
import { Types } from 'mongoose';
import { MarkSheet } from '../models/MarkSheet';
import { Exam } from '../models/Exam';
import { Subject } from '../models/Subject';
import { Student } from '../models/Student';
import { Class } from '../models/Class';
import { Division } from '../models/Division';
import { ActivityLog } from '../models/ActivityLog';
import { authenticate, checkPermission } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { AuthenticatedRequest, ApiResponse } from '../types';
import Joi from 'joi';
import { getOrgBranchFilter, getOrgBranchForCreate } from '../utils/orgFilter';

const router = express.Router();
router.use(authenticate);

const markEntrySchema = Joi.object({
  studentId: Joi.string().required(),
  studentName: Joi.string().required(),
  admissionNo: Joi.string().required(),
  mark: Joi.number().allow(null).default(null),
  grade: Joi.string().allow('').default(''),
  remarks: Joi.string().allow('').optional()
});

const saveMarkSheetSchema = Joi.object({
  examId: Joi.string().required(),
  subjectId: Joi.string().required(),
  classId: Joi.string().required(),
  divisionId: Joi.string().optional().allow('', null),
  examDate: Joi.date().optional().allow(null),
  entries: Joi.array().items(markEntrySchema).required(),
  isFinalized: Joi.boolean().default(false),
  branchId: Joi.string().optional()
});

const bulkMarkEntrySchema = Joi.object({
  examId: Joi.string().required(),
  classId: Joi.string().required(),
  divisionId: Joi.string().optional().allow('', null),
  subjects: Joi.array().items(Joi.object({
    subjectId: Joi.string().required(),
    entries: Joi.array().items(Joi.object({
      studentId: Joi.string().required(),
      mark: Joi.number().allow(null).default(null),
      grade: Joi.string().allow('').default('')
    })).required()
  })).required(),
  isFinalized: Joi.boolean().default(false),
  branchId: Joi.string().optional()
});

// GET /api/marks/sheet — Get mark sheet for a specific exam+subject+class+division
router.get('/sheet', checkPermission('classes', 'read'), async (req: AuthenticatedRequest, res) => {
  const { examId, subjectId, classId, divisionId } = req.query;
  if (!examId || !classId) return res.status(400).json({ success: false, message: 'examId and classId are required' });

  const filter: any = {
    examId: new Types.ObjectId(examId as string),
    classId: new Types.ObjectId(classId as string)
  };
  Object.assign(filter, getOrgBranchFilter(req));
  if (subjectId && Types.ObjectId.isValid(subjectId as string)) filter.subjectId = new Types.ObjectId(subjectId as string);
  if (divisionId && Types.ObjectId.isValid(divisionId as string)) filter.divisionId = new Types.ObjectId(divisionId as string);

  const sheets = await MarkSheet.find(filter).sort({ subjectName: 1 });
  res.json({ success: true, data: sheets });
});

// GET /api/marks/students — Get students for mark entry prefill
router.get('/students', checkPermission('classes', 'read'), async (req: AuthenticatedRequest, res) => {
  const { classId, divisionId } = req.query;
  if (!classId) return res.status(400).json({ success: false, message: 'classId is required' });

  const studentFilter: any = { status: 'active' };
  Object.assign(studentFilter, getOrgBranchFilter(req));

  // Look up class and find matching students
  const cls = await Class.findById(classId);
  if (!cls) return res.status(404).json({ success: false, message: 'Class not found' });

  studentFilter.classId = new Types.ObjectId(classId as string);
  if (divisionId && Types.ObjectId.isValid(divisionId as string)) {
    const div = await Division.findById(divisionId);
    if (div) studentFilter.section = div.name;
  }

  const students = await Student.find(studentFilter)
    .select('name admissionNo classId class section')
    .sort({ name: 1 });

  res.json({ success: true, data: students });
});

// POST /api/marks/save — Save or update a mark sheet
router.post('/save', checkPermission('classes', 'create'), validate(saveMarkSheetSchema), async (req: AuthenticatedRequest, res) => {
  const orgBranch = getOrgBranchForCreate(req);
  const { examId, subjectId, classId, divisionId, examDate, entries, isFinalized } = req.body;

  // Look up names
  const [exam, subject, cls, div] = await Promise.all([
    Exam.findById(examId),
    Subject.findById(subjectId),
    Class.findById(classId),
    divisionId ? Division.findById(divisionId) : null
  ]);

  if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });
  if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });
  if (!cls) return res.status(404).json({ success: false, message: 'Class not found' });

  const filter: any = {
    examId: new Types.ObjectId(examId),
    subjectId: new Types.ObjectId(subjectId),
    classId: new Types.ObjectId(classId),
    branchId: orgBranch.branchId
  };
  if (divisionId && Types.ObjectId.isValid(divisionId)) {
    filter.divisionId = new Types.ObjectId(divisionId);
  }

  const sheetData = {
    examId: new Types.ObjectId(examId),
    examName: exam.name,
    subjectId: new Types.ObjectId(subjectId),
    subjectName: subject.name,
    classId: new Types.ObjectId(classId),
    className: cls.name,
    divisionId: div ? new Types.ObjectId(divisionId) : undefined,
    divisionName: div?.name || undefined,
    academicYear: exam.academicYear,
    maxMark: subject.maxMark,
    passMark: subject.passMark,
    examDate,
    entries,
    isFinalized,
    ...orgBranch,
    updatedBy: req.user!._id
  };

  const sheet = await MarkSheet.findOneAndUpdate(
    filter,
    { $set: sheetData, $setOnInsert: { createdBy: req.user!._id } },
    { new: true, upsert: true, runValidators: true }
  );

  await ActivityLog.create({
    userId: req.user!._id,
    userName: req.user!.name,
    userRole: req.user!.role,
    action: isFinalized ? 'finalize' : 'update',
    module: 'marks',
    details: `${isFinalized ? 'Finalized' : 'Saved'} marks for ${exam.name} - ${subject.name} - ${cls.name}${div ? ' ' + div.name : ''}`,
    ...orgBranch
  });

  res.json({ success: true, message: isFinalized ? 'Marks finalized' : 'Marks saved', data: sheet });
});

// POST /api/marks/bulk-save — Save marks for multiple subjects at once
router.post('/bulk-save', checkPermission('classes', 'create'), validate(bulkMarkEntrySchema), async (req: AuthenticatedRequest, res) => {
  const orgBranch = getOrgBranchForCreate(req);
  const { examId, classId, divisionId, subjects, isFinalized } = req.body;

  const [exam, cls, div] = await Promise.all([
    Exam.findById(examId),
    Class.findById(classId),
    divisionId ? Division.findById(divisionId) : null
  ]);

  if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });
  if (!cls) return res.status(404).json({ success: false, message: 'Class not found' });

  // Get all students for this class/division to lookup names
  const studentFilter: any = { classId: new Types.ObjectId(classId), status: 'active' };
  Object.assign(studentFilter, getOrgBranchFilter(req));
  if (div) studentFilter.section = div.name;
  const students = await Student.find(studentFilter).select('name admissionNo');
  const studentMap = new Map(students.map(s => [s._id.toString(), s]));

  const savedSheets = [];
  for (const subjectData of subjects) {
    const subject = await Subject.findById(subjectData.subjectId);
    if (!subject) continue;

    const entries = subjectData.entries.map((e: any) => {
      const student = studentMap.get(e.studentId);
      return {
        studentId: e.studentId,
        studentName: student?.name || '',
        admissionNo: student?.admissionNo || '',
        mark: e.mark,
        grade: e.grade || ''
      };
    });

    const filter: any = {
      examId: new Types.ObjectId(examId),
      subjectId: new Types.ObjectId(subjectData.subjectId),
      classId: new Types.ObjectId(classId),
      branchId: orgBranch.branchId
    };
    if (divisionId && Types.ObjectId.isValid(divisionId)) {
      filter.divisionId = new Types.ObjectId(divisionId);
    }

    const sheet = await MarkSheet.findOneAndUpdate(
      filter,
      {
        $set: {
          examName: exam.name,
          subjectName: subject.name,
          className: cls.name,
          divisionName: div?.name || undefined,
          academicYear: exam.academicYear,
          maxMark: subject.maxMark,
          passMark: subject.passMark,
          entries,
          isFinalized,
          ...orgBranch,
          updatedBy: req.user!._id
        },
        $setOnInsert: {
          examId: new Types.ObjectId(examId),
          subjectId: new Types.ObjectId(subjectData.subjectId),
          classId: new Types.ObjectId(classId),
          divisionId: div ? new Types.ObjectId(divisionId) : undefined,
          createdBy: req.user!._id
        }
      },
      { new: true, upsert: true, runValidators: true }
    );
    savedSheets.push(sheet);
  }

  await ActivityLog.create({
    userId: req.user!._id,
    userName: req.user!.name,
    userRole: req.user!.role,
    action: 'bulk_save',
    module: 'marks',
    details: `Bulk saved marks for ${exam.name} - ${cls.name}${div ? ' ' + div.name : ''} (${subjects.length} subjects)`,
    ...orgBranch
  });

  res.json({ success: true, message: `Marks saved for ${subjects.length} subjects`, data: savedSheets });
});

// GET /api/marks/consolidated — Get all marks for a class/division in an exam (for report/print)
router.get('/consolidated', checkPermission('classes', 'read'), async (req: AuthenticatedRequest, res) => {
  const { examId, classId, divisionId, academicYear } = req.query;
  if (!examId || !classId) return res.status(400).json({ success: false, message: 'examId and classId required' });

  const filter: any = {
    examId: new Types.ObjectId(examId as string),
    classId: new Types.ObjectId(classId as string)
  };
  Object.assign(filter, getOrgBranchFilter(req));
  if (divisionId && Types.ObjectId.isValid(divisionId as string)) {
    filter.divisionId = new Types.ObjectId(divisionId as string);
  }
  if (academicYear) filter.academicYear = academicYear;

  const sheets = await MarkSheet.find(filter).sort({ subjectName: 1 });

  // Build consolidated data: studentId -> { name, admissionNo, marks: { subjectName: { mark, grade } } }
  const studentMap: Record<string, any> = {};
  const subjects: string[] = [];

  for (const sheet of sheets) {
    if (!subjects.includes(sheet.subjectName)) subjects.push(sheet.subjectName);
    for (const entry of sheet.entries) {
      const sid = entry.studentId.toString();
      if (!studentMap[sid]) {
        studentMap[sid] = {
          studentId: sid,
          studentName: entry.studentName,
          admissionNo: entry.admissionNo,
          marks: {},
          total: 0,
          percentage: 0
        };
      }
      studentMap[sid].marks[sheet.subjectName] = {
        mark: entry.mark,
        grade: entry.grade,
        maxMark: sheet.maxMark,
        passMark: sheet.passMark
      };
      if (entry.mark != null) {
        studentMap[sid].total += entry.mark;
      }
    }
  }

  // Calculate percentage
  const totalMaxMarks = sheets.reduce((sum, s) => sum + s.maxMark, 0);
  for (const sid of Object.keys(studentMap)) {
    studentMap[sid].percentage = totalMaxMarks > 0
      ? Math.round((studentMap[sid].total / totalMaxMarks) * 100 * 100) / 100
      : 0;
  }

  const consolidated = Object.values(studentMap).sort((a, b) => a.studentName.localeCompare(b.studentName));

  res.json({
    success: true,
    data: {
      subjects,
      students: consolidated,
      totalMaxMarks,
      examName: sheets[0]?.examName || '',
      className: sheets[0]?.className || '',
      divisionName: sheets[0]?.divisionName || '',
      academicYear: sheets[0]?.academicYear || ''
    }
  });
});

// GET /api/marks/student-report — Get all marks for a student across exams
router.get('/student-report', checkPermission('classes', 'read'), async (req: AuthenticatedRequest, res) => {
  const { studentId, academicYear } = req.query;
  if (!studentId) return res.status(400).json({ success: false, message: 'studentId required' });

  const filter: any = { 'entries.studentId': new Types.ObjectId(studentId as string) };
  Object.assign(filter, getOrgBranchFilter(req));
  if (academicYear) filter.academicYear = academicYear;

  const sheets = await MarkSheet.find(filter).sort({ examName: 1, subjectName: 1 });

  // Group by exam
  const examMap: Record<string, any> = {};
  for (const sheet of sheets) {
    if (!examMap[sheet.examName]) {
      examMap[sheet.examName] = { examName: sheet.examName, subjects: [], total: 0, totalMax: 0 };
    }
    const entry = sheet.entries.find(e => e.studentId.toString() === studentId);
    if (entry) {
      examMap[sheet.examName].subjects.push({
        subjectName: sheet.subjectName,
        mark: entry.mark,
        grade: entry.grade,
        maxMark: sheet.maxMark,
        passMark: sheet.passMark
      });
      if (entry.mark != null) {
        examMap[sheet.examName].total += entry.mark;
        examMap[sheet.examName].totalMax += sheet.maxMark;
      }
    }
  }

  res.json({ success: true, data: Object.values(examMap) });
});

// GET /api/marks/progress-report — Multi-exam aggregated data for progress card
router.get('/progress-report', checkPermission('classes', 'read'), async (req: AuthenticatedRequest, res) => {
  const { classId, divisionId, examIds, academicYear } = req.query;
  if (!classId || !examIds) return res.status(400).json({ success: false, message: 'classId and examIds required' });

  const examIdArr = (examIds as string).split(',').filter(id => Types.ObjectId.isValid(id));
  if (examIdArr.length === 0) return res.status(400).json({ success: false, message: 'No valid examIds' });

  const filter: any = {
    examId: { $in: examIdArr.map(id => new Types.ObjectId(id)) },
    classId: new Types.ObjectId(classId as string)
  };
  Object.assign(filter, getOrgBranchFilter(req));
  if (divisionId && Types.ObjectId.isValid(divisionId as string)) {
    filter.divisionId = new Types.ObjectId(divisionId as string);
  }
  if (academicYear) filter.academicYear = academicYear;

  const sheets = await MarkSheet.find(filter).sort({ examName: 1, subjectName: 1 });

  const examNames: string[] = [];
  const subjectNames: string[] = [];
  const studentMap: Record<string, any> = {};

  for (const sheet of sheets) {
    if (!examNames.includes(sheet.examName)) examNames.push(sheet.examName);
    if (!subjectNames.includes(sheet.subjectName)) subjectNames.push(sheet.subjectName);

    for (const entry of sheet.entries) {
      const sid = entry.studentId.toString();
      if (!studentMap[sid]) {
        studentMap[sid] = {
          studentId: sid,
          studentName: entry.studentName,
          admissionNo: entry.admissionNo,
          grades: {}
        };
      }
      if (!studentMap[sid].grades[sheet.examName]) {
        studentMap[sid].grades[sheet.examName] = {};
      }
      studentMap[sid].grades[sheet.examName][sheet.subjectName] = {
        mark: entry.mark,
        grade: entry.grade
      };
    }
  }

  const students = Object.values(studentMap).sort((a, b) => a.studentName.localeCompare(b.studentName));

  res.json({
    success: true,
    data: {
      exams: examNames,
      subjects: subjectNames,
      students,
      className: sheets[0]?.className || '',
      divisionName: sheets[0]?.divisionName || '',
      academicYear: sheets[0]?.academicYear || academicYear || ''
    }
  });
});

export default router;
