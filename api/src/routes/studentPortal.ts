import express from 'express';
import { Types } from 'mongoose';
import { authenticate } from '../middleware/auth';
import { AuthenticatedRequest, ApiResponse } from '../types';
import { Student } from '../models/Student';
import { Attendance } from '../models/Attendance';
import { MarkSheet } from '../models/MarkSheet';
import { FeePayment } from '../models/FeePayment';
import { FeeStructure } from '../models/FeeStructure';
import { AcademicYear } from '../models/AcademicYear';

const router = express.Router();
router.use(authenticate);

/**
 * Middleware: ensure the caller is a student and resolve their student record.
 */
async function requireStudent(req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) {
  if (req.user?.role !== 'student') {
    return res.status(403).json({ success: false, message: 'Access denied. Student role required.' });
  }
  if (!req.user.studentId) {
    return res.status(400).json({ success: false, message: 'No student profile linked to this account.' });
  }
  next();
}

router.use(requireStudent);

// ─── GET /my-profile — Student's own profile ─────────────────────────
router.get('/my-profile', async (req: AuthenticatedRequest, res) => {
  try {
    const student = await Student.findById(req.user!.studentId)
      .select('-__v')
      .lean();

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }

    res.json({ success: true, data: student });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── GET /my-attendance — Student's own attendance ───────────────────
router.get('/my-attendance', async (req: AuthenticatedRequest, res) => {
  try {
    const student = await Student.findById(req.user!.studentId).lean();
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const { month, year } = req.query;
    const m = Number(month) || new Date().getMonth() + 1;
    const y = Number(year) || new Date().getFullYear();

    const startDate = new Date(y, m - 1, 1);
    const endDate = new Date(y, m, 0, 23, 59, 59);

    const records = await Attendance.find({
      'records.studentId': new Types.ObjectId(req.user!.studentId as string),
      classId: student.classId,
      date: { $gte: startDate, $lte: endDate },
      organizationId: req.user!.organizationId,
      branchId: req.user!.branchId,
    })
      .sort({ date: 1 })
      .lean();

    // Extract only this student's record from each day
    const dailyAttendance = records.map((rec: any) => {
      const myRecord = rec.records?.find(
        (r: any) => r.studentId?.toString() === req.user!.studentId?.toString()
      );
      return {
        date: rec.date,
        status: myRecord?.status || 'absent',
      };
    });

    // Summary
    const summary = {
      total: dailyAttendance.length,
      present: dailyAttendance.filter((d: any) => d.status === 'present').length,
      absent: dailyAttendance.filter((d: any) => d.status === 'absent').length,
      late: dailyAttendance.filter((d: any) => d.status === 'late').length,
      halfDay: dailyAttendance.filter((d: any) => d.status === 'half_day').length,
    };

    res.json({
      success: true,
      data: {
        month: m,
        year: y,
        className: student.class,
        section: student.section,
        daily: dailyAttendance,
        summary,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── GET /my-marks — Student's exam marks/grades ─────────────────────
router.get('/my-marks', async (req: AuthenticatedRequest, res) => {
  try {
    const studentId = req.user!.studentId as string;
    const { academicYear } = req.query;

    const filter: any = {
      'entries.studentId': new Types.ObjectId(studentId),
      organizationId: req.user!.organizationId,
      branchId: req.user!.branchId,
    };
    if (academicYear) filter.academicYear = academicYear;

    const sheets = await MarkSheet.find(filter).sort({ examName: 1, subjectName: 1 }).lean();

    // Group by exam
    const examMap: Record<string, any> = {};
    for (const sheet of sheets) {
      if (!examMap[sheet.examName]) {
        examMap[sheet.examName] = {
          examName: sheet.examName,
          academicYear: sheet.academicYear,
          subjects: [],
          total: 0,
          totalMax: 0,
        };
      }
      const entry = (sheet.entries as any[]).find(
        (e: any) => e.studentId?.toString() === studentId
      );
      if (entry) {
        examMap[sheet.examName].subjects.push({
          subjectName: sheet.subjectName,
          mark: entry.mark,
          grade: entry.grade,
          maxMark: sheet.maxMark,
          passMark: sheet.passMark,
        });
        if (entry.mark != null) {
          examMap[sheet.examName].total += entry.mark;
          examMap[sheet.examName].totalMax += sheet.maxMark;
        }
      }
    }

    res.json({ success: true, data: Object.values(examMap) });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── GET /my-fees — Student's fee payments & dues ────────────────────
router.get('/my-fees', async (req: AuthenticatedRequest, res) => {
  try {
    const studentId = req.user!.studentId as string;
    const student = await Student.findById(studentId).lean();
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Get all payments for this student
    const payments = await FeePayment.find({
      studentId: new Types.ObjectId(studentId),
      organizationId: req.user!.organizationId,
      branchId: req.user!.branchId,
      status: { $ne: 'cancelled' },
    })
      .sort({ paymentDate: -1 })
      .lean();

    // Get current academic year
    const currentAY = await AcademicYear.findOne({
      organizationId: req.user!.organizationId,
      branchId: req.user!.branchId,
      isCurrent: true,
    }).lean();

    // Get fee structures applicable to this student's class
    let feeStructures: any[] = [];
    if (currentAY) {
      feeStructures = await FeeStructure.find({
        organizationId: req.user!.organizationId,
        branchId: req.user!.branchId,
        academicYear: currentAY.name,
        isActive: true,
        $or: [
          { isCommon: true },
          { classId: student.classId },
        ],
      }).lean();
    }

    // Calculate total due vs paid
    const totalStructureAmount = feeStructures.reduce((sum: number, fs: any) => sum + (fs.amount || 0), 0);
    const totalPaid = payments.reduce((sum: number, p: any) => sum + (p.totalAmount || 0), 0);

    res.json({
      success: true,
      data: {
        studentName: student.name,
        className: student.class,
        admissionNo: student.admissionNo,
        academicYear: currentAY?.name || '',
        payments,
        feeStructures,
        summary: {
          totalDue: totalStructureAmount,
          totalPaid,
          balance: totalStructureAmount - totalPaid,
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
