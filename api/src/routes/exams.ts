import express from 'express';
import { Types } from 'mongoose';
import { Exam } from '../models/Exam';
import { ActivityLog } from '../models/ActivityLog';
import { authenticate, checkPermission } from '../middleware/auth';
import { validate, validateQuery } from '../middleware/validation';
import { AuthenticatedRequest, ApiResponse, QueryParams } from '../types';
import Joi from 'joi';
import { getOrgBranchFilter, getOrgBranchForCreate } from '../utils/orgFilter';

const router = express.Router();
router.use(authenticate);

const createSchema = Joi.object({
  name: Joi.string().required().trim(),
  academicYear: Joi.string().required().trim(),
  examType: Joi.string().valid('term', 'quarterly', 'half_yearly', 'annual', 'class_test', 'other').required(),
  startDate: Joi.date().optional().allow(null),
  endDate: Joi.date().optional().allow(null),
  status: Joi.string().valid('upcoming', 'ongoing', 'completed', 'cancelled').default('upcoming'),
  branchId: Joi.string().optional()
});

const updateSchema = Joi.object({
  name: Joi.string().optional().trim(),
  academicYear: Joi.string().optional().trim(),
  examType: Joi.string().valid('term', 'quarterly', 'half_yearly', 'annual', 'class_test', 'other').optional(),
  startDate: Joi.date().optional().allow(null),
  endDate: Joi.date().optional().allow(null),
  status: Joi.string().valid('upcoming', 'ongoing', 'completed', 'cancelled').optional(),
  branchId: Joi.string().optional().allow('')
});

const querySchema = Joi.object({
  page: Joi.alternatives().try(Joi.number().integer().min(1), Joi.string().pattern(/^\d+$/).custom(v => parseInt(v, 10))).default(1),
  limit: Joi.number().integer().min(0).default(20),
  search: Joi.string().optional().allow(''),
  academicYear: Joi.string().optional().allow(''),
  examType: Joi.string().valid('term', 'quarterly', 'half_yearly', 'annual', 'class_test', 'other').optional(),
  status: Joi.string().valid('upcoming', 'ongoing', 'completed', 'cancelled').optional(),
  sortBy: Joi.string().valid('name', 'startDate', 'createdAt').default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  branchId: Joi.string().optional().allow('')
});

// GET /api/exams
router.get('/', checkPermission('classes', 'read'), validateQuery(querySchema), async (req: AuthenticatedRequest, res) => {
  const { page = 1, limit = 20, search = '', academicYear = '', examType = '', status = '', sortBy = 'createdAt', sortOrder = 'desc' } = req.query as QueryParams;
  const filter: any = {};
  Object.assign(filter, getOrgBranchFilter(req));
  if (search) filter.name = { $regex: search, $options: 'i' };
  if (academicYear) filter.academicYear = academicYear;
  if (examType) filter.examType = examType;
  if (status) filter.status = status;

  const skip = (Number(page) - 1) * Number(limit);
  const sortOptions: any = { [sortBy as string]: sortOrder === 'asc' ? 1 : -1 };

  const [data, total] = await Promise.all([
    Exam.find(filter).sort(sortOptions).skip(skip).limit(Number(limit)),
    Exam.countDocuments(filter)
  ]);

  const response: ApiResponse = {
    success: true,
    message: 'Exams fetched',
    data,
    pagination: { page: Number(page), limit: Number(limit), total, pages: (Number(limit) > 0 ? Math.ceil(total / Number(limit)) : 1) }
  };
  res.json(response);
});

// GET /api/exams/:id
router.get('/:id', checkPermission('classes', 'read'), async (req: AuthenticatedRequest, res) => {
  if (!Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ success: false, message: 'The provided ID is not valid.' });
  const filter: any = { _id: req.params.id };
  Object.assign(filter, getOrgBranchFilter(req));
  const exam = await Exam.findOne(filter);
  if (!exam) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true, data: exam });
});

// POST /api/exams
router.post('/', checkPermission('classes', 'create'), validate(createSchema), async (req: AuthenticatedRequest, res) => {
  const orgBranch = getOrgBranchForCreate(req);
  const exam = await Exam.create({ ...req.body, ...orgBranch });

  await ActivityLog.create({
    userId: req.user!._id,
    userName: req.user!.name,
    userRole: req.user!.role,
    action: 'create',
    module: 'exams',
    details: `Created exam: ${exam.name}`,
    ...orgBranch
  });

  res.status(201).json({ success: true, message: 'Exam created', data: exam });
});

// PUT /api/exams/:id
router.put('/:id', checkPermission('classes', 'update'), validate(updateSchema), async (req: AuthenticatedRequest, res) => {
  if (!Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ success: false, message: 'The provided ID is not valid.' });
  const filter: any = { _id: req.params.id };
  Object.assign(filter, getOrgBranchFilter(req));
  const exam = await Exam.findOneAndUpdate(filter, req.body, { new: true, runValidators: true });
  if (!exam) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true, message: 'Exam updated', data: exam });
});

// DELETE /api/exams/:id
router.delete('/:id', checkPermission('classes', 'delete'), async (req: AuthenticatedRequest, res) => {
  if (!Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ success: false, message: 'The provided ID is not valid.' });
  const filter: any = { _id: req.params.id };
  Object.assign(filter, getOrgBranchFilter(req));
  const exam = await Exam.findOneAndDelete(filter);
  if (!exam) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true, message: 'Exam deleted' });
});

export default router;
