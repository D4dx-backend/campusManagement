import express from 'express';
import { Types } from 'mongoose';
import Joi from 'joi';
import { TeacherAllocation } from '../models/TeacherAllocation';
import { authenticate, authorize } from '../middleware/auth';
import { validate, validateQuery } from '../middleware/validation';
import { AuthenticatedRequest } from '../types';
import { getOrgBranchFilter, getOrgBranchForCreate } from '../utils/orgFilter';

const router = express.Router();
router.use(authenticate);

const createSchema = Joi.object({
  teacherId: Joi.string().required(),
  teacherName: Joi.string().required(),
  classId: Joi.string().required(),
  className: Joi.string().required(),
  divisionId: Joi.string().allow('', null),
  divisionName: Joi.string().allow('', null),
  subjectId: Joi.string().allow('', null),
  subjectName: Joi.string().allow('', null),
  isClassTeacher: Joi.boolean().default(false),
  academicYear: Joi.string().required(),
});

const bulkSchema = Joi.object({
  allocations: Joi.array().items(createSchema).min(1).required(),
});

const querySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(200).default(100),
  teacherId: Joi.string().allow(''),
  classId: Joi.string().allow(''),
  academicYear: Joi.string().allow(''),
});

// @desc    Get allocations
// @route   GET /api/teacher-allocations
// @access  Admin, Teacher (own)
router.get('/', validateQuery(querySchema), async (req: AuthenticatedRequest, res) => {
  try {
    const { page = 1, limit = 100, teacherId, classId, academicYear } = req.query as any;
    const filter: any = {};
    Object.assign(filter, getOrgBranchFilter(req));

    // Teacher can only see their own allocations
    if (req.user!.role === 'teacher') {
      filter.teacherId = new Types.ObjectId(req.user!._id);
    } else if (teacherId) {
      filter.teacherId = new Types.ObjectId(teacherId);
    }

    if (classId) filter.classId = new Types.ObjectId(classId);
    if (academicYear) filter.academicYear = academicYear;

    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      TeacherAllocation.find(filter).sort({ className: 1, subjectName: 1 }).skip(skip).limit(Number(limit)).lean(),
      TeacherAllocation.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: items,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get my allocations (teacher shortcut)
// @route   GET /api/teacher-allocations/my
// @access  Teacher
router.get('/my', async (req: AuthenticatedRequest, res) => {
  try {
    const filter: any = { teacherId: new Types.ObjectId(req.user!._id) };
    Object.assign(filter, getOrgBranchFilter(req));

    const items = await TeacherAllocation.find(filter).sort({ className: 1, subjectName: 1 }).lean();
    res.json({ success: true, data: items });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Create allocation
// @route   POST /api/teacher-allocations
// @access  Admin only
router.post('/', authorize('platform_admin', 'org_admin', 'branch_admin'), validate(createSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const orgBranch = getOrgBranchForCreate(req);

    const allocation = await TeacherAllocation.create({
      ...req.body,
      teacherId: new Types.ObjectId(req.body.teacherId),
      classId: new Types.ObjectId(req.body.classId),
      divisionId: req.body.divisionId ? new Types.ObjectId(req.body.divisionId) : undefined,
      subjectId: req.body.subjectId ? new Types.ObjectId(req.body.subjectId) : undefined,
      ...orgBranch,
    });

    res.status(201).json({ success: true, message: 'Allocation created', data: allocation });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'This teacher is already allocated to this class and subject.' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Bulk create allocations
// @route   POST /api/teacher-allocations/bulk
// @access  Admin only
router.post('/bulk', authorize('platform_admin', 'org_admin', 'branch_admin'), validate(bulkSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const orgBranch = getOrgBranchForCreate(req);
    const { allocations } = req.body;

    const docs = allocations.map((a: any) => ({
      ...a,
      teacherId: new Types.ObjectId(a.teacherId),
      classId: new Types.ObjectId(a.classId),
      divisionId: a.divisionId ? new Types.ObjectId(a.divisionId) : undefined,
      subjectId: a.subjectId ? new Types.ObjectId(a.subjectId) : undefined,
      ...orgBranch,
    }));

    const result = await TeacherAllocation.insertMany(docs, { ordered: false }).catch((err) => {
      // Some might be duplicates — return what succeeded
      if (err.insertedDocs) return err.insertedDocs;
      throw err;
    });

    res.status(201).json({ success: true, message: `${Array.isArray(result) ? result.length : 0} allocations created`, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Delete allocation
// @route   DELETE /api/teacher-allocations/:id
// @access  Admin only
router.delete('/:id', authorize('platform_admin', 'org_admin', 'branch_admin'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: 'The provided ID is not valid.' });

    const result = await TeacherAllocation.findByIdAndDelete(id);
    if (!result) return res.status(404).json({ success: false, message: 'Not found' });

    res.json({ success: true, message: 'Allocation removed' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Delete all allocations for a class+academicYear
// @route   DELETE /api/teacher-allocations/class/:classId
// @access  Admin only
router.delete('/class/:classId', authorize('platform_admin', 'org_admin', 'branch_admin'), async (req: AuthenticatedRequest, res) => {
  try {
    const { classId } = req.params;
    const { academicYear } = req.query as any;
    if (!Types.ObjectId.isValid(classId)) return res.status(400).json({ success: false, message: 'The provided ID is not valid.' });

    const filter: any = { classId: new Types.ObjectId(classId) };
    if (academicYear) filter.academicYear = academicYear;
    Object.assign(filter, getOrgBranchFilter(req));

    const result = await TeacherAllocation.deleteMany(filter);
    res.json({ success: true, message: `${result.deletedCount} allocations removed` });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
