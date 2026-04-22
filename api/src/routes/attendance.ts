import express from 'express';
import { Types } from 'mongoose';
import { Attendance } from '../models/Attendance';
import { Student } from '../models/Student';
import { ActivityLog } from '../models/ActivityLog';
import { authenticate, checkPermission } from '../middleware/auth';
import { validate, validateQuery } from '../middleware/validation';
import { markAttendanceSchema, queryAttendanceSchema } from '../validations/attendance';
import { AuthenticatedRequest, ApiResponse, QueryParams } from '../types';
import { getOrgBranchFilter, getOrgBranchForCreate } from '../utils/orgFilter';

const router = express.Router();

router.use(authenticate);

// @desc    Mark / update attendance for a class on a date
// @route   POST /api/attendance
// @access  Teacher, Branch Admin+
router.post('/', checkPermission('attendance', 'create'), validate(markAttendanceSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const { date, classId, section, academicYear, records } = req.body;
    const orgBranch = getOrgBranchForCreate(req);

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    // Upsert: update if already exists for the same class+section+date
    const existing = await Attendance.findOne({
      classId: new Types.ObjectId(classId),
      section: section || '',
      date: attendanceDate,
      branchId: orgBranch.branchId,
    });

    let attendance;
    if (existing) {
      existing.records = records.map((r: any) => ({
        studentId: new Types.ObjectId(r.studentId),
        status: r.status,
      }));
      existing.markedBy = new Types.ObjectId(req.user!._id);
      attendance = await existing.save();
    } else {
      attendance = await Attendance.create({
        date: attendanceDate,
        classId: new Types.ObjectId(classId),
        section: section || '',
        academicYear,
        records: records.map((r: any) => ({
          studentId: new Types.ObjectId(r.studentId),
          status: r.status,
        })),
        markedBy: new Types.ObjectId(req.user!._id),
        ...orgBranch,
      });
    }

    // Log activity (non-blocking — don't fail the main operation)
    try {
      await ActivityLog.create({
        action: existing ? 'update' : 'create',
        module: 'attendance',
        details: `Attendance ${existing ? 'updated' : 'marked'} for ${attendanceDate.toISOString().split('T')[0]}`,
        userId: req.user!._id,
        userName: req.user!.name,
        userRole: req.user!.role,
        ...orgBranch,
      });
    } catch (logError) {
      console.error('Activity log error (non-critical):', logError);
    }

    const response: ApiResponse = {
      success: true,
      message: `Attendance ${existing ? 'updated' : 'marked'} successfully`,
      data: attendance,
    };
    res.status(existing ? 200 : 201).json(response);
  } catch (error: any) {
    console.error('Mark attendance error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Failed to mark attendance',
      error: error.message,
    };
    res.status(500).json(response);
  }
});

// @desc    Get attendance for a specific class/date
// @route   GET /api/attendance
// @access  Private
router.get('/', checkPermission('attendance', 'read'), validateQuery(queryAttendanceSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const { classId, section, date, month, year, studentId, sortBy = 'date', sortOrder = 'desc' } = req.query as any;

    const filter: any = {};
    Object.assign(filter, getOrgBranchFilter(req));

    if (classId) filter.classId = new Types.ObjectId(classId);
    if (section !== undefined && section !== '') filter.section = section;

    if (date) {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      filter.date = d;
    } else if (month && year) {
      const startDate = new Date(Number(year), Number(month) - 1, 1);
      const endDate = new Date(Number(year), Number(month), 0, 23, 59, 59);
      filter.date = { $gte: startDate, $lte: endDate };
    }

    if (studentId) {
      filter['records.studentId'] = new Types.ObjectId(studentId);
    }

    const sortOptions: any = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const records = await Attendance.find(filter)
      .sort(sortOptions)
      .lean();

    const response: ApiResponse = {
      success: true,
      message: 'Attendance retrieved successfully',
      data: records,
    };
    res.json(response);
  } catch (error: any) {
    console.error('Get attendance error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Failed to retrieve attendance',
      error: error.message,
    };
    res.status(500).json(response);
  }
});

// @desc    Get monthly attendance report for a class
// @route   GET /api/attendance/report/monthly
// @access  Private (Admin view shown in screenshot)
router.get('/report/monthly', checkPermission('attendance', 'read'), async (req: AuthenticatedRequest, res) => {
  try {
    const { classId, section, month, year } = req.query as any;

    if (!classId || !month || !year) {
      return res.status(400).json({
        success: false,
        message: 'classId, month, and year are required',
      });
    }

    const filter: any = {};
    Object.assign(filter, getOrgBranchFilter(req));
    filter.classId = new Types.ObjectId(classId);
    if (section !== undefined && section !== '') filter.section = section;

    const startDate = new Date(Number(year), Number(month) - 1, 1);
    const endDate = new Date(Number(year), Number(month), 0, 23, 59, 59);
    filter.date = { $gte: startDate, $lte: endDate };

    // Get all attendance records for the month
    const attendanceRecords = await Attendance.find(filter).sort({ date: 1 }).lean();

    // Get all active students in this class/section
    const studentFilter: any = {
      classId: new Types.ObjectId(classId),
      status: 'active',
    };
    Object.assign(studentFilter, getOrgBranchFilter(req));
    if (section !== undefined && section !== '') studentFilter.section = section;

    const students = await Student.find(studentFilter)
      .select('_id name admissionNo')
      .sort({ name: 1 })
      .lean();

    // Build per-student daily attendance map
    const daysInMonth = new Date(Number(year), Number(month), 0).getDate();
    const report = students.map((student: any) => {
      const daily: Record<number, string> = {};
      let presentCount = 0;
      let absentCount = 0;

      for (const record of attendanceRecords) {
        const day = new Date(record.date).getDate();
        const studentRecord = record.records.find(
          (r: any) => r.studentId.toString() === student._id.toString()
        );
        if (studentRecord) {
          daily[day] = studentRecord.status;
          if (studentRecord.status === 'present' || studentRecord.status === 'late') {
            presentCount++;
          } else if (studentRecord.status === 'absent') {
            absentCount++;
          } else if (studentRecord.status === 'half_day') {
            presentCount += 0.5;
            absentCount += 0.5;
          }
        }
      }

      return {
        studentId: student._id,
        studentName: student.name,
        admissionNo: student.admissionNo,
        daily,
        presentCount,
        absentCount,
      };
    });

    const response: ApiResponse = {
      success: true,
      message: 'Monthly attendance report retrieved',
      data: {
        month: Number(month),
        year: Number(year),
        daysInMonth,
        students: report,
        attendanceDates: attendanceRecords.map((r: any) => ({
          date: r.date,
          day: new Date(r.date).getDate(),
          dayOfWeek: new Date(r.date).getDay(),
        })),
      },
    };
    res.json(response);
  } catch (error: any) {
    console.error('Monthly report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate monthly report',
      error: error.message,
    });
  }
});

// @desc    Get attendance stats overview
// @route   GET /api/attendance/stats
// @access  Private
router.get('/stats', checkPermission('attendance', 'read'), async (req: AuthenticatedRequest, res) => {
  try {
    const filter: any = {};
    Object.assign(filter, getOrgBranchFilter(req));

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Today's attendance count
    const todayFilter = { ...filter, date: today };
    const todayRecords = await Attendance.find(todayFilter).lean();

    let totalPresent = 0;
    let totalAbsent = 0;
    let totalStudents = 0;

    for (const record of todayRecords) {
      for (const r of record.records) {
        totalStudents++;
        if (r.status === 'present' || r.status === 'late') totalPresent++;
        else if (r.status === 'absent') totalAbsent++;
      }
    }

    const response: ApiResponse = {
      success: true,
      message: 'Attendance stats retrieved',
      data: {
        today: {
          classesMarked: todayRecords.length,
          totalStudents,
          present: totalPresent,
          absent: totalAbsent,
          percentage: totalStudents > 0 ? Math.round((totalPresent / totalStudents) * 100) : 0,
        },
      },
    };
    res.json(response);
  } catch (error: any) {
    console.error('Attendance stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get attendance stats',
      error: error.message,
    });
  }
});

export default router;
