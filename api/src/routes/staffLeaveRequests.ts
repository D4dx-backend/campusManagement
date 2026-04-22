import express from 'express';
import { Types } from 'mongoose';
import Joi from 'joi';
import { StaffLeaveRequest } from '../models/StaffLeaveRequest';
import { Staff } from '../models/Staff';
import { authenticate, authorize } from '../middleware/auth';
import { validate, validateQuery } from '../middleware/validation';
import { AuthenticatedRequest, ApiResponse } from '../types';
import { getOrgBranchFilter, getOrgBranchForCreate } from '../utils/orgFilter';

const router = express.Router();
router.use(authenticate);

const createSchema = Joi.object({
  staffId: Joi.string().optional().allow('', null),
  branchId: Joi.string().optional().allow('', null),
  leaveType: Joi.string().valid('casual', 'sick', 'earned', 'other').default('casual'),
  fromDate: Joi.date().iso().required(),
  toDate: Joi.date().iso().min(Joi.ref('fromDate')).required(),
  reason: Joi.string().min(3).max(500).required(),
});

const reviewSchema = Joi.object({
  status: Joi.string().valid('approved', 'rejected').required(),
  reviewNote: Joi.string().max(500).allow('', null),
});

const querySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(0).default(20),
  status: Joi.string().valid('pending', 'approved', 'rejected').allow(''),
  userId: Joi.string().allow(''),
  sortBy: Joi.string().default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
});

// @desc    Create a staff leave request (self)
// @route   POST /api/staff-leave-requests
// @access  Any auth user except student
router.post('/', validate(createSchema), async (req: AuthenticatedRequest, res) => {
  try {
    if (req.user!.role === 'student') {
      return res.status(403).json({ success: false, message: 'Students cannot request staff leave' });
    }

    const { staffId, leaveType, fromDate, toDate, reason } = req.body;
    const orgBranch = getOrgBranchForCreate(req);
    const isAdmin = ['platform_admin', 'org_admin', 'branch_admin'].includes(req.user!.role);

    let userId: Types.ObjectId;
    let userName: string;
    let role: string;

    if (staffId && isAdmin) {
      // Admin creating on behalf of a staff member
      const staff = await Staff.findById(staffId);
      if (!staff) {
        return res.status(404).json({ success: false, message: 'Staff member not found' });
      }
      userId = staff._id as any;
      userName = staff.name;
      role = staff.designation || 'staff';
    } else {
      // Self-apply
      userId = new Types.ObjectId(req.user!._id);
      userName = req.user!.name;
      role = req.user!.role;
    }

    const leaveRequest = await StaffLeaveRequest.create({
      userId,
      userName,
      role,
      leaveType,
      fromDate: new Date(fromDate),
      toDate: new Date(toDate),
      reason,
      status: 'pending',
      ...orgBranch,
    });

    const response: ApiResponse = {
      success: true,
      message: 'Leave request submitted successfully',
      data: leaveRequest,
    };
    res.status(201).json(response);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get staff leave requests
// @route   GET /api/staff-leave-requests
// @access  Own requests (teacher/staff) or all (admin)
router.get('/', validateQuery(querySchema), async (req: AuthenticatedRequest, res) => {
  try {
    const { page = 1, limit = 20, status, userId, sortBy = 'createdAt', sortOrder = 'desc' } = req.query as any;

    const filter: any = {};
    Object.assign(filter, getOrgBranchFilter(req));

    // Non-admin users can only see their own requests
    if (!['platform_admin', 'org_admin', 'branch_admin'].includes(req.user!.role)) {
      filter.userId = new Types.ObjectId(req.user!._id);
    } else if (userId) {
      filter.userId = new Types.ObjectId(userId);
    }

    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const sortOptions: any = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [requests, total] = await Promise.all([
      StaffLeaveRequest.find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      StaffLeaveRequest.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: requests,
      pagination: { page: Number(page), limit: Number(limit), total, pages: (Number(limit) > 0 ? Math.ceil(total / Number(limit)) : 1) },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get pending staff leave count (for admin dashboard)
// @route   GET /api/staff-leave-requests/pending-count
// @access  Admin only
router.get('/pending-count', authorize('platform_admin', 'org_admin', 'branch_admin'), async (req: AuthenticatedRequest, res) => {
  try {
    const filter: any = { status: 'pending' };
    Object.assign(filter, getOrgBranchFilter(req));
    const count = await StaffLeaveRequest.countDocuments(filter);
    res.json({ success: true, data: { count } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Review (approve/reject) a staff leave request
// @route   PUT /api/staff-leave-requests/:id/review
// @access  Branch Admin+
router.put('/:id/review', authorize('platform_admin', 'org_admin', 'branch_admin'), validate(reviewSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'The provided ID is not valid.' });
    }

    const leave = await StaffLeaveRequest.findById(id);
    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave request was not found.' });
    }
    if (leave.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Already reviewed' });
    }

    const { status, reviewNote } = req.body;
    leave.status = status;
    leave.reviewedBy = new Types.ObjectId(req.user!._id);
    leave.reviewedAt = new Date();
    if (reviewNote) leave.reviewNote = reviewNote;
    await leave.save();

    res.json({ success: true, message: `Leave request ${status}`, data: leave });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Delete own pending leave request
// @route   DELETE /api/staff-leave-requests/:id
// @access  Owner (if pending) or Admin
router.delete('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'The provided ID is not valid.' });
    }

    const leave = await StaffLeaveRequest.findById(id);
    if (!leave) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }

    const isAdmin = ['platform_admin', 'org_admin', 'branch_admin'].includes(req.user!.role);
    const isOwner = leave.userId.toString() === req.user!._id.toString();

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ success: false, message: 'You do not have permission to perform this action.' });
    }
    if (!isAdmin && leave.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Can only delete pending requests' });
    }

    await StaffLeaveRequest.findByIdAndDelete(id);
    res.json({ success: true, message: 'Leave request deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
