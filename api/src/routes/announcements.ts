import express from 'express';
import { Types } from 'mongoose';
import Joi from 'joi';
import { Announcement } from '../models/Announcement';
import { authenticate } from '../middleware/auth';
import { validate, validateQuery } from '../middleware/validation';
import { AuthenticatedRequest } from '../types';
import { getOrgBranchForCreate } from '../utils/orgFilter';
import { Student } from '../models/Student';

const router = express.Router();
router.use(authenticate);

const createSchema = Joi.object({
  title: Joi.string().min(3).max(200).required(),
  message: Joi.string().min(3).max(5000).required(),
  type: Joi.string().valid('general', 'academic', 'event', 'emergency').default('general'),
  targetScope: Joi.string().valid('organization', 'branch', 'class', 'division', 'student').required(),
  targetRoles: Joi.array().items(Joi.string().valid('all', 'students', 'teachers', 'staff')).default(['all']),
  targetBranchIds: Joi.array().items(Joi.string()).default([]),
  targetBranchNames: Joi.array().items(Joi.string()).default([]),
  targetClassId: Joi.string().allow('', null),
  targetClassName: Joi.string().allow('', null),
  targetDivisionId: Joi.string().allow('', null),
  targetDivisionName: Joi.string().allow('', null),
  targetStudentIds: Joi.array().items(Joi.string()).default([]),
  targetStudentNames: Joi.array().items(Joi.string()).default([]),
  priority: Joi.string().valid('low', 'normal', 'high', 'urgent').default('normal'),
  attachmentUrl: Joi.string().uri().allow('', null),
  expiresAt: Joi.date().iso().allow(null),
});

const querySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(0).default(20),
  type: Joi.string().valid('general', 'academic', 'event', 'emergency').allow(''),
  sortBy: Joi.string().default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
});

function toOidArray(arr?: string[]): Types.ObjectId[] {
  return (arr || []).filter(Boolean).map((id) => new Types.ObjectId(id));
}

// ─── CREATE ──────────────────────────────────────────────────────────
router.post('/', validate(createSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const role = req.user!.role;
    if (!['platform_admin', 'org_admin', 'branch_admin', 'teacher'].includes(role)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const { targetScope } = req.body;
    if (role === 'teacher' && targetScope === 'organization') {
      return res.status(403).json({ success: false, message: 'Teachers cannot send organization-wide announcements' });
    }
    if (role === 'branch_admin' && targetScope === 'organization') {
      return res.status(403).json({ success: false, message: 'Branch admins cannot send organization-wide announcements' });
    }

    const orgBranch = getOrgBranchForCreate(req);
    const announcement = await Announcement.create({
      title: req.body.title,
      message: req.body.message,
      type: req.body.type,
      targetScope,
      targetRoles: req.body.targetRoles || ['all'],
      targetBranchIds: toOidArray(req.body.targetBranchIds),
      targetBranchNames: req.body.targetBranchNames || [],
      targetClassId: req.body.targetClassId ? new Types.ObjectId(req.body.targetClassId) : undefined,
      targetClassName: req.body.targetClassName || undefined,
      targetDivisionId: req.body.targetDivisionId ? new Types.ObjectId(req.body.targetDivisionId) : undefined,
      targetDivisionName: req.body.targetDivisionName || undefined,
      targetStudentIds: toOidArray(req.body.targetStudentIds),
      targetStudentNames: req.body.targetStudentNames || [],
      priority: req.body.priority,
      attachmentUrl: req.body.attachmentUrl || undefined,
      expiresAt: req.body.expiresAt ? new Date(req.body.expiresAt) : undefined,
      readBy: [],
      createdBy: new Types.ObjectId(req.user!._id),
      createdByName: req.user!.name,
      createdByRole: req.user!.role,
      ...orgBranch,
    });
    res.status(201).json({ success: true, message: 'Announcement published', data: announcement });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Helper: build visibility filter for a user
async function buildVisibilityFilter(req: AuthenticatedRequest): Promise<any[]> {
  const role = req.user!.role;
  const branchId = req.user!.branchId ? new Types.ObjectId(req.user!.branchId) : undefined;
  const vis: any[] = [];

  if (role === 'platform_admin' || role === 'org_admin') return vis; // see all in org

  const roleKey = role === 'student' ? 'students' : role === 'teacher' ? 'teachers' : 'staff';

  // Org-wide matching role
  vis.push({ targetScope: 'organization', targetRoles: { $in: ['all', roleKey] } });

  // Branch-level matching role — own branch or targeted branch
  vis.push({
    targetScope: 'branch',
    targetRoles: { $in: ['all', roleKey] },
    $or: [{ branchId: branchId }, { targetBranchIds: branchId }],
  });

  if (role === 'student' && req.user!.studentId) {
    const student = await Student.findById(req.user!.studentId).select('classId section').lean();
    if (student) {
      vis.push({ targetScope: 'class', targetClassId: student.classId });
      vis.push({ targetScope: 'division', targetClassId: student.classId });
      vis.push({ targetScope: 'student', targetStudentIds: new Types.ObjectId(req.user!.studentId) });
    }
  }

  if (role === 'teacher') {
    vis.push({
      targetScope: { $in: ['class', 'division'] },
      targetRoles: { $in: ['all', 'teachers'] },
      branchId: branchId,
    });
  }

  if (role === 'branch_admin') {
    vis.push({ targetScope: 'organization', targetRoles: { $in: ['all', 'staff'] } });
    vis.push({ branchId: branchId });
  }

  return vis;
}

// ─── GET (role-filtered) ─────────────────────────────────────────────
router.get('/', validateQuery(querySchema), async (req: AuthenticatedRequest, res) => {
  try {
    const { page = 1, limit = 20, type, sortBy = 'createdAt', sortOrder = 'desc' } = req.query as any;
    const orgId = req.user!.organizationId ? new Types.ObjectId(req.user!.organizationId) : undefined;

    const baseFilter: any = {
      isActive: true,
      $or: [{ expiresAt: null }, { expiresAt: { $exists: false } }, { expiresAt: { $gte: new Date() } }],
    };
    if (type) baseFilter.type = type;
    if (orgId && req.user!.role !== 'platform_admin') baseFilter.organizationId = orgId;

    const vis = await buildVisibilityFilter(req);
    const filter = vis.length > 0 ? { $and: [baseFilter, { $or: vis }] } : baseFilter;

    const skip = (Number(page) - 1) * Number(limit);
    const sortOptions: any = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [announcements, total] = await Promise.all([
      Announcement.find(filter).sort(sortOptions).skip(skip).limit(Number(limit)).lean(),
      Announcement.countDocuments(filter),
    ]);

    const data = announcements.map((a: any) => ({
      ...a,
      isRead: (a.readBy || []).some((id: any) => id.toString() === req.user!._id.toString()),
      readBy: undefined,
    }));

    res.json({ success: true, data, pagination: { page: Number(page), limit: Number(limit), total, pages: (Number(limit) > 0 ? Math.ceil(total / Number(limit)) : 1) } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── UNREAD COUNT ────────────────────────────────────────────────────
router.get('/unread-count', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = new Types.ObjectId(req.user!._id);
    const orgId = req.user!.organizationId ? new Types.ObjectId(req.user!.organizationId) : undefined;

    const baseFilter: any = {
      isActive: true,
      readBy: { $ne: userId },
      $or: [{ expiresAt: null }, { expiresAt: { $exists: false } }, { expiresAt: { $gte: new Date() } }],
    };
    if (orgId && req.user!.role !== 'platform_admin') baseFilter.organizationId = orgId;

    const vis = await buildVisibilityFilter(req);
    const filter = vis.length > 0 ? { $and: [baseFilter, { $or: vis }] } : baseFilter;
    const count = await Announcement.countDocuments(filter);

    res.json({ success: true, data: { count } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── MARK AS READ ────────────────────────────────────────────────────
router.put('/:id/read', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: 'The provided ID is not valid.' });
    await Announcement.findByIdAndUpdate(id, { $addToSet: { readBy: new Types.ObjectId(req.user!._id) } });
    res.json({ success: true, message: 'Marked as read' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── MARK ALL AS READ ───────────────────────────────────────────────
router.put('/read-all', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = new Types.ObjectId(req.user!._id);
    const orgId = req.user!.organizationId ? new Types.ObjectId(req.user!.organizationId) : undefined;
    const filter: any = { isActive: true, readBy: { $ne: userId } };
    if (orgId) filter.organizationId = orgId;
    await Announcement.updateMany(filter, { $addToSet: { readBy: userId } });
    res.json({ success: true, message: 'All marked as read' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── UPDATE ──────────────────────────────────────────────────────────
router.put('/:id', validate(createSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: 'The provided ID is not valid.' });
    const ann = await Announcement.findById(id);
    if (!ann) return res.status(404).json({ success: false, message: 'Not found' });

    const isAdmin = ['platform_admin', 'org_admin', 'branch_admin'].includes(req.user!.role);
    const isCreator = ann.createdBy.toString() === req.user!._id.toString();
    if (!isAdmin && !isCreator) return res.status(403).json({ success: false, message: 'You do not have permission to perform this action.' });

    ann.title = req.body.title;
    ann.message = req.body.message;
    ann.type = req.body.type;
    ann.targetScope = req.body.targetScope;
    ann.targetRoles = req.body.targetRoles || ['all'];
    ann.targetBranchIds = toOidArray(req.body.targetBranchIds);
    ann.targetBranchNames = req.body.targetBranchNames || [];
    ann.targetClassId = req.body.targetClassId ? new Types.ObjectId(req.body.targetClassId) : undefined;
    ann.targetClassName = req.body.targetClassName || undefined;
    ann.targetDivisionId = req.body.targetDivisionId ? new Types.ObjectId(req.body.targetDivisionId) : undefined;
    ann.targetDivisionName = req.body.targetDivisionName || undefined;
    ann.targetStudentIds = toOidArray(req.body.targetStudentIds);
    ann.targetStudentNames = req.body.targetStudentNames || [];
    ann.priority = req.body.priority;
    if (req.body.expiresAt) ann.expiresAt = new Date(req.body.expiresAt);
    await ann.save();
    res.json({ success: true, message: 'Updated', data: ann });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── DELETE ──────────────────────────────────────────────────────────
router.delete('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: 'The provided ID is not valid.' });
    const ann = await Announcement.findById(id);
    if (!ann) return res.status(404).json({ success: false, message: 'Not found' });

    const isAdmin = ['platform_admin', 'org_admin', 'branch_admin'].includes(req.user!.role);
    const isCreator = ann.createdBy.toString() === req.user!._id.toString();
    if (!isAdmin && !isCreator) return res.status(403).json({ success: false, message: 'You do not have permission to perform this action.' });

    await Announcement.findByIdAndDelete(id);
    res.json({ success: true, message: 'Deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
