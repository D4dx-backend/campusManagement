import express from 'express';
import { Types } from 'mongoose';
import { LeaveRequest } from '../models/LeaveRequest';
import { Student } from '../models/Student';
import { ActivityLog } from '../models/ActivityLog';
import { authenticate, checkPermission } from '../middleware/auth';
import { validate, validateQuery } from '../middleware/validation';
import { createLeaveRequestSchema, reviewLeaveRequestSchema, queryLeaveRequestSchema } from '../validations/attendance';
import { AuthenticatedRequest, ApiResponse } from '../types';
import { getOrgBranchFilter, getOrgBranchForCreate } from '../utils/orgFilter';

const router = express.Router();

router.use(authenticate);

// @desc    Create a leave request
// @route   POST /api/leave-requests
// @access  Any authenticated user (teacher on behalf, or student)
router.post('/', validate(createLeaveRequestSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const { studentId, fromDate, toDate, reason } = req.body;
    const orgBranch = getOrgBranchForCreate(req);

    // Look up the student to get class info
    const student = await Student.findById(studentId).lean();
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    const leaveRequest = await LeaveRequest.create({
      studentId: new Types.ObjectId(studentId),
      studentName: student.name,
      classId: student.classId,
      className: student.class,
      section: student.section || '',
      fromDate: new Date(fromDate),
      toDate: new Date(toDate),
      reason,
      status: 'pending',
      requestedBy: new Types.ObjectId(req.user!._id),
      ...orgBranch,
    });

    await ActivityLog.create({
      action: 'create',
      module: 'leave_requests',
      description: `Leave request created for ${student.name} (${new Date(fromDate).toISOString().split('T')[0]} to ${new Date(toDate).toISOString().split('T')[0]})`,
      userId: req.user!._id,
      userName: req.user!.name,
      ...orgBranch,
    });

    const response: ApiResponse = {
      success: true,
      message: 'Leave request created successfully',
      data: leaveRequest,
    };
    res.status(201).json(response);
  } catch (error: any) {
    console.error('Create leave request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create leave request',
      error: error.message,
    });
  }
});

// @desc    Get all leave requests (filtered)
// @route   GET /api/leave-requests
// @access  Private
router.get('/', checkPermission('attendance', 'read'), validateQuery(queryLeaveRequestSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const { page = 1, limit = 20, classId, studentId, status, sortBy = 'createdAt', sortOrder = 'desc' } = req.query as any;

    const filter: any = {};
    Object.assign(filter, getOrgBranchFilter(req));

    if (classId) filter.classId = new Types.ObjectId(classId);
    if (studentId) filter.studentId = new Types.ObjectId(studentId);
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const sortOptions: any = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [requests, total] = await Promise.all([
      LeaveRequest.find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      LeaveRequest.countDocuments(filter),
    ]);

    const response: ApiResponse = {
      success: true,
      message: 'Leave requests retrieved successfully',
      data: requests,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    };
    res.json(response);
  } catch (error: any) {
    console.error('Get leave requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve leave requests',
      error: error.message,
    });
  }
});

// @desc    Get pending leave request count
// @route   GET /api/leave-requests/pending-count
// @access  Private
router.get('/pending-count', checkPermission('attendance', 'read'), async (req: AuthenticatedRequest, res) => {
  try {
    const filter: any = { status: 'pending' };
    Object.assign(filter, getOrgBranchFilter(req));

    const count = await LeaveRequest.countDocuments(filter);

    res.json({
      success: true,
      message: 'Pending count retrieved',
      data: { count },
    });
  } catch (error: any) {
    console.error('Pending count error:', error);
    res.status(500).json({ success: false, message: 'Failed to get pending count', error: error.message });
  }
});

// @desc    Review (approve/reject) a leave request
// @route   PUT /api/leave-requests/:id/review
// @access  Teacher, Branch Admin+
router.put('/:id/review', checkPermission('attendance', 'update'), validate(reviewLeaveRequestSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { status, reviewNote } = req.body;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid leave request ID' });
    }

    const leaveRequest = await LeaveRequest.findById(id);
    if (!leaveRequest) {
      return res.status(404).json({ success: false, message: 'Leave request not found' });
    }

    if (leaveRequest.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Leave request has already been reviewed' });
    }

    leaveRequest.status = status;
    leaveRequest.reviewedBy = new Types.ObjectId(req.user!._id) as any;
    leaveRequest.reviewedAt = new Date();
    if (reviewNote) leaveRequest.reviewNote = reviewNote;

    await leaveRequest.save();

    const orgBranch = getOrgBranchForCreate(req);
    await ActivityLog.create({
      action: 'update',
      module: 'leave_requests',
      description: `Leave request ${status} for ${leaveRequest.studentName}`,
      userId: req.user!._id,
      userName: req.user!.name,
      ...orgBranch,
    });

    const response: ApiResponse = {
      success: true,
      message: `Leave request ${status} successfully`,
      data: leaveRequest,
    };
    res.json(response);
  } catch (error: any) {
    console.error('Review leave request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to review leave request',
      error: error.message,
    });
  }
});

// @desc    Delete a leave request
// @route   DELETE /api/leave-requests/:id
// @access  Private
router.delete('/:id', checkPermission('attendance', 'delete'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid leave request ID' });
    }

    const leaveRequest = await LeaveRequest.findByIdAndDelete(id);
    if (!leaveRequest) {
      return res.status(404).json({ success: false, message: 'Leave request not found' });
    }

    res.json({ success: true, message: 'Leave request deleted successfully' });
  } catch (error: any) {
    console.error('Delete leave request error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete leave request', error: error.message });
  }
});

export default router;
