import express from 'express';
import { Types } from 'mongoose';
import Joi from 'joi';
import { Homework } from '../models/Homework';
import { authenticate, authorize } from '../middleware/auth';
import { validate, validateQuery } from '../middleware/validation';
import { AuthenticatedRequest } from '../types';
import { getOrgBranchFilter, getOrgBranchForCreate } from '../utils/orgFilter';

const router = express.Router();
router.use(authenticate);

const createSchema = Joi.object({
  classId: Joi.string().required(),
  className: Joi.string().required(),
  divisionId: Joi.string().allow('', null),
  divisionName: Joi.string().allow('', null),
  subjectName: Joi.string().min(1).max(100).required(),
  subjectId: Joi.string().allow('', null),
  date: Joi.date().iso().required(),
  dueDate: Joi.date().iso().min(Joi.ref('date')).required(),
  title: Joi.string().min(3).max(200).required(),
  description: Joi.string().min(3).max(2000).required(),
  attachmentUrl: Joi.string().uri().allow('', null),
});

const querySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(0).default(20),
  classId: Joi.string().allow(''),
  date: Joi.string().allow(''),
  fromDate: Joi.string().allow(''),
  toDate: Joi.string().allow(''),
});

// @desc    Create homework
// @route   POST /api/homework
// @access  Teacher, Admin
router.post('/', authorize('teacher', 'branch_admin', 'org_admin', 'platform_admin'), validate(createSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const orgBranch = getOrgBranchForCreate(req);

    const homework = await Homework.create({
      ...req.body,
      classId: new Types.ObjectId(req.body.classId),
      divisionId: req.body.divisionId ? new Types.ObjectId(req.body.divisionId) : undefined,
      subjectId: req.body.subjectId ? new Types.ObjectId(req.body.subjectId) : undefined,
      date: new Date(req.body.date),
      dueDate: new Date(req.body.dueDate),
      assignedBy: new Types.ObjectId(req.user!._id),
      assignedByName: req.user!.name,
      ...orgBranch,
    });

    res.status(201).json({ success: true, message: 'Homework assigned', data: homework });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get homework list
// @route   GET /api/homework
// @access  Any auth user
router.get('/', validateQuery(querySchema), async (req: AuthenticatedRequest, res) => {
  try {
    const { page = 1, limit = 20, classId, date, fromDate, toDate } = req.query as any;

    const filter: any = {};
    Object.assign(filter, getOrgBranchFilter(req));

    if (classId) filter.classId = new Types.ObjectId(classId);
    if (date) {
      const d = new Date(date);
      filter.date = { $gte: new Date(d.setHours(0, 0, 0, 0)), $lte: new Date(d.setHours(23, 59, 59, 999)) };
    }
    if (fromDate && toDate) {
      filter.date = { $gte: new Date(fromDate), $lte: new Date(toDate) };
    }

    // Teacher sees only their own homework
    if (req.user!.role === 'teacher') {
      filter.assignedBy = new Types.ObjectId(req.user!._id);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [items, total] = await Promise.all([
      Homework.find(filter).sort({ date: -1, createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      Homework.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: items,
      pagination: { page: Number(page), limit: Number(limit), total, pages: (Number(limit) > 0 ? Math.ceil(total / Number(limit)) : 1) },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get homework for a student (by classId)
// @route   GET /api/homework/student
// @access  Student
router.get('/student', async (req: AuthenticatedRequest, res) => {
  try {
    const { classId, date, fromDate, toDate } = req.query as any;

    const filter: any = {};
    Object.assign(filter, getOrgBranchFilter(req));

    if (classId) filter.classId = new Types.ObjectId(classId);

    if (date) {
      const d = new Date(date);
      filter.date = { $gte: new Date(d.setHours(0, 0, 0, 0)), $lte: new Date(d.setHours(23, 59, 59, 999)) };
    } else if (fromDate && toDate) {
      filter.date = { $gte: new Date(fromDate), $lte: new Date(toDate) };
    } else {
      // Default: last 7 days
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filter.date = { $gte: weekAgo };
    }

    const items = await Homework.find(filter).sort({ date: -1 }).limit(50).lean();
    res.json({ success: true, data: items });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Update homework
// @route   PUT /api/homework/:id
// @access  Creator or Admin
router.put('/:id', validate(createSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: 'The provided ID is not valid.' });

    const hw = await Homework.findById(id);
    if (!hw) return res.status(404).json({ success: false, message: 'Not found' });

    const isAdmin = ['platform_admin', 'org_admin', 'branch_admin'].includes(req.user!.role);
    const isCreator = hw.assignedBy.toString() === req.user!._id.toString();
    if (!isAdmin && !isCreator) return res.status(403).json({ success: false, message: 'You do not have permission to perform this action.' });

    Object.assign(hw, req.body);
    hw.classId = new Types.ObjectId(req.body.classId);
    hw.date = new Date(req.body.date);
    hw.dueDate = new Date(req.body.dueDate);
    if (req.body.divisionId) hw.divisionId = new Types.ObjectId(req.body.divisionId);
    if (req.body.subjectId) hw.subjectId = new Types.ObjectId(req.body.subjectId);
    await hw.save();

    res.json({ success: true, message: 'Updated', data: hw });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Delete homework
// @route   DELETE /api/homework/:id
// @access  Creator or Admin
router.delete('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: 'The provided ID is not valid.' });

    const hw = await Homework.findById(id);
    if (!hw) return res.status(404).json({ success: false, message: 'Not found' });

    const isAdmin = ['platform_admin', 'org_admin', 'branch_admin'].includes(req.user!.role);
    const isCreator = hw.assignedBy.toString() === req.user!._id.toString();
    if (!isAdmin && !isCreator) return res.status(403).json({ success: false, message: 'You do not have permission to perform this action.' });

    await Homework.findByIdAndDelete(id);
    res.json({ success: true, message: 'Deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
