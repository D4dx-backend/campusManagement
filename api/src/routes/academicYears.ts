import express from 'express';
import { Types } from 'mongoose';
import { AcademicYear } from '../models/AcademicYear';
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
  startDate: Joi.date().required(),
  endDate: Joi.date().required(),
  isCurrent: Joi.boolean().default(false),
  status: Joi.string().valid('active', 'inactive').default('active'),
  branchId: Joi.string().optional()
});

const updateSchema = Joi.object({
  name: Joi.string().optional().trim(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
  isCurrent: Joi.boolean().optional(),
  status: Joi.string().valid('active', 'inactive').optional(),
  branchId: Joi.string().optional().allow('')
});

const querySchema = Joi.object({
  page: Joi.alternatives().try(Joi.number().integer().min(1), Joi.string().pattern(/^\d+$/).custom(v => parseInt(v, 10))).default(1),
  limit: Joi.alternatives().try(Joi.number().integer().min(1).max(100), Joi.string().pattern(/^\d+$/).custom(v => Math.min(parseInt(v, 10), 100))).default(10),
  search: Joi.string().optional().allow(''),
  status: Joi.string().valid('active', 'inactive').optional(),
  sortBy: Joi.string().valid('name', 'startDate', 'createdAt').default('name'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  branchId: Joi.string().optional().allow('')
});

// GET /api/academic-years
router.get('/', checkPermission('classes', 'read'), validateQuery(querySchema), async (req: AuthenticatedRequest, res) => {
  const { page = 1, limit = 10, search = '', status = '', sortBy = 'name', sortOrder = 'desc' } = req.query as QueryParams;
  const filter: any = {};
  Object.assign(filter, getOrgBranchFilter(req));
  if (search) filter.name = { $regex: search, $options: 'i' };
  if (status) filter.status = status;

  const skip = (Number(page) - 1) * Number(limit);
  const sortOptions: any = { [sortBy as string]: sortOrder === 'asc' ? 1 : -1 };

  const [data, total] = await Promise.all([
    AcademicYear.find(filter).sort(sortOptions).skip(skip).limit(Number(limit)),
    AcademicYear.countDocuments(filter)
  ]);

  const response: ApiResponse = {
    success: true,
    message: 'Academic years fetched',
    data,
    pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) }
  };
  res.json(response);
});

// GET /api/academic-years/current
router.get('/current', checkPermission('classes', 'read'), async (req: AuthenticatedRequest, res) => {
  const filter: any = { isCurrent: true };
  Object.assign(filter, getOrgBranchFilter(req));
  const year = await AcademicYear.findOne(filter);
  res.json({ success: true, data: year });
});

// GET /api/academic-years/:id
router.get('/:id', checkPermission('classes', 'read'), async (req: AuthenticatedRequest, res) => {
  if (!Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid ID' });
  const filter: any = { _id: req.params.id };
  Object.assign(filter, getOrgBranchFilter(req));
  const year = await AcademicYear.findOne(filter);
  if (!year) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true, data: year });
});

// POST /api/academic-years
router.post('/', checkPermission('classes', 'create'), validate(createSchema), async (req: AuthenticatedRequest, res) => {
  const orgBranch = getOrgBranchForCreate(req);
  const { name, startDate, endDate, isCurrent, status } = req.body;

  // If setting as current, unset other current years in this branch
  if (isCurrent) {
    await AcademicYear.updateMany(
      { branchId: orgBranch.branchId, isCurrent: true },
      { $set: { isCurrent: false } }
    );
  }

  const year = await AcademicYear.create({ name, startDate, endDate, isCurrent, status, ...orgBranch });

  await ActivityLog.create({
    userId: req.user!._id,
    userName: req.user!.name,
    userRole: req.user!.role,
    action: 'create',
    module: 'academic_years',
    details: `Created academic year: ${name}`,
    ...orgBranch
  });

  res.status(201).json({ success: true, message: 'Academic year created', data: year });
});

// PUT /api/academic-years/:id
router.put('/:id', checkPermission('classes', 'update'), validate(updateSchema), async (req: AuthenticatedRequest, res) => {
  if (!Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid ID' });
  const filter: any = { _id: req.params.id };
  Object.assign(filter, getOrgBranchFilter(req));

  if (req.body.isCurrent) {
    const existing = await AcademicYear.findOne(filter);
    if (existing) {
      await AcademicYear.updateMany(
        { branchId: existing.branchId, isCurrent: true, _id: { $ne: existing._id } },
        { $set: { isCurrent: false } }
      );
    }
  }

  const year = await AcademicYear.findOneAndUpdate(filter, req.body, { new: true, runValidators: true });
  if (!year) return res.status(404).json({ success: false, message: 'Not found' });

  res.json({ success: true, message: 'Academic year updated', data: year });
});

// DELETE /api/academic-years/:id
router.delete('/:id', checkPermission('classes', 'delete'), async (req: AuthenticatedRequest, res) => {
  if (!Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid ID' });
  const filter: any = { _id: req.params.id };
  Object.assign(filter, getOrgBranchFilter(req));
  const year = await AcademicYear.findOneAndDelete(filter);
  if (!year) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true, message: 'Academic year deleted' });
});

export default router;
