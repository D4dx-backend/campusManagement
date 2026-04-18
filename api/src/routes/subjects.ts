import express from 'express';
import { Types } from 'mongoose';
import { Subject } from '../models/Subject';
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
  code: Joi.string().required().trim().uppercase(),
  classIds: Joi.array().items(Joi.string()).default([]),
  maxMark: Joi.number().min(0).default(100),
  passMark: Joi.number().min(0).default(33),
  isOptional: Joi.boolean().default(false),
  status: Joi.string().valid('active', 'inactive').default('active'),
  branchId: Joi.string().optional()
});

const updateSchema = Joi.object({
  name: Joi.string().optional().trim(),
  code: Joi.string().optional().trim().uppercase(),
  classIds: Joi.array().items(Joi.string()).optional(),
  maxMark: Joi.number().min(0).optional(),
  passMark: Joi.number().min(0).optional(),
  isOptional: Joi.boolean().optional(),
  status: Joi.string().valid('active', 'inactive').optional(),
  branchId: Joi.string().optional().allow('')
});

const querySchema = Joi.object({
  page: Joi.alternatives().try(Joi.number().integer().min(1), Joi.string().pattern(/^\d+$/).custom(v => parseInt(v, 10))).default(1),
  limit: Joi.alternatives().try(Joi.number().integer().min(1).max(100), Joi.string().pattern(/^\d+$/).custom(v => Math.min(parseInt(v, 10), 100))).default(50),
  search: Joi.string().optional().allow(''),
  classId: Joi.string().optional().allow(''),
  status: Joi.string().valid('active', 'inactive').optional(),
  sortBy: Joi.string().valid('name', 'code', 'createdAt').default('name'),
  sortOrder: Joi.string().valid('asc', 'desc').default('asc'),
  branchId: Joi.string().optional().allow('')
});

// GET /api/subjects
router.get('/', checkPermission('classes', 'read'), validateQuery(querySchema), async (req: AuthenticatedRequest, res) => {
  const { page = 1, limit = 50, search = '', classId = '', status = '', sortBy = 'name', sortOrder = 'asc' } = req.query as QueryParams;
  const filter: any = {};
  Object.assign(filter, getOrgBranchFilter(req));
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { code: { $regex: search, $options: 'i' } }
    ];
  }
  if (classId && Types.ObjectId.isValid(classId)) filter.classIds = new Types.ObjectId(classId);
  if (status) filter.status = status;

  const skip = (Number(page) - 1) * Number(limit);
  const sortOptions: any = { [sortBy as string]: sortOrder === 'asc' ? 1 : -1 };

  const [data, total] = await Promise.all([
    Subject.find(filter).sort(sortOptions).skip(skip).limit(Number(limit)),
    Subject.countDocuments(filter)
  ]);

  const response: ApiResponse = {
    success: true,
    message: 'Subjects fetched',
    data,
    pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) }
  };
  res.json(response);
});

// GET /api/subjects/:id
router.get('/:id', checkPermission('classes', 'read'), async (req: AuthenticatedRequest, res) => {
  if (!Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid ID' });
  const filter: any = { _id: req.params.id };
  Object.assign(filter, getOrgBranchFilter(req));
  const subject = await Subject.findOne(filter);
  if (!subject) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true, data: subject });
});

// POST /api/subjects
router.post('/', checkPermission('classes', 'create'), validate(createSchema), async (req: AuthenticatedRequest, res) => {
  const orgBranch = getOrgBranchForCreate(req);
  const subject = await Subject.create({ ...req.body, ...orgBranch });

  await ActivityLog.create({
    userId: req.user!._id,
    userName: req.user!.name,
    userRole: req.user!.role,
    action: 'create',
    module: 'subjects',
    details: `Created subject: ${subject.name} (${subject.code})`,
    ...orgBranch
  });

  res.status(201).json({ success: true, message: 'Subject created', data: subject });
});

// PUT /api/subjects/:id
router.put('/:id', checkPermission('classes', 'update'), validate(updateSchema), async (req: AuthenticatedRequest, res) => {
  if (!Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid ID' });
  const filter: any = { _id: req.params.id };
  Object.assign(filter, getOrgBranchFilter(req));
  const subject = await Subject.findOneAndUpdate(filter, req.body, { new: true, runValidators: true });
  if (!subject) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true, message: 'Subject updated', data: subject });
});

// DELETE /api/subjects/:id
router.delete('/:id', checkPermission('classes', 'delete'), async (req: AuthenticatedRequest, res) => {
  if (!Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid ID' });
  const filter: any = { _id: req.params.id };
  Object.assign(filter, getOrgBranchFilter(req));
  const subject = await Subject.findOneAndDelete(filter);
  if (!subject) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true, message: 'Subject deleted' });
});

export default router;
