import express from 'express';
import { Types } from 'mongoose';
import { Student } from '../models/Student';
import { Class } from '../models/Class';
import { Division } from '../models/Division';
import { ActivityLog } from '../models/ActivityLog';
import { authenticate, checkPermission } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { AuthenticatedRequest } from '../types';
import Joi from 'joi';
import { getOrgBranchFilter, getOrgBranchForCreate } from '../utils/orgFilter';

const router = express.Router();
router.use(authenticate);

const promotionSchema = Joi.object({
  fromAcademicYear: Joi.string().required(),
  toAcademicYear: Joi.string().required(),
  promotions: Joi.array().items(Joi.object({
    studentId: Joi.string().required(),
    toClassId: Joi.string().required(),
    toDivisionId: Joi.string().optional().allow('', null),
    status: Joi.string().valid('promoted', 'detained', 'tc_issued').default('promoted')
  })).required(),
  branchId: Joi.string().optional()
});

// GET /api/promotions/preview — Get students eligible for promotion
router.get('/preview', checkPermission('students', 'read'), async (req: AuthenticatedRequest, res) => {
  const { academicYear, classId } = req.query;
  if (!academicYear) return res.status(400).json({ success: false, message: 'academicYear required' });

  const filter: any = { status: 'active' };
  Object.assign(filter, getOrgBranchFilter(req));

  // Get classes for this academic year
  const classFilter: any = { academicYear, status: 'active' };
  Object.assign(classFilter, getOrgBranchFilter(req));
  if (classId && Types.ObjectId.isValid(classId as string)) {
    classFilter._id = new Types.ObjectId(classId as string);
  }
  const classes = await Class.find(classFilter).sort({ name: 1 });

  // Get students grouped by class
  const result = [];
  for (const cls of classes) {
    const studentFilter = { ...filter, classId: cls._id };
    const students = await Student.find(studentFilter)
      .select('name admissionNo class section classId')
      .sort({ name: 1 });
    result.push({
      class: cls,
      students
    });
  }

  res.json({ success: true, data: result });
});

// POST /api/promotions/promote — Execute promotion
router.post('/promote', checkPermission('students', 'update'), validate(promotionSchema), async (req: AuthenticatedRequest, res) => {
  const orgBranch = getOrgBranchForCreate(req);
  const { fromAcademicYear, toAcademicYear, promotions } = req.body;

  let promotedCount = 0;
  let detainedCount = 0;

  for (const promo of promotions) {
    if (promo.status === 'promoted') {
      const targetClass = await Class.findById(promo.toClassId);
      let targetDivision = promo.toDivisionId ? await Division.findById(promo.toDivisionId) : null;

      if (!targetClass) continue;

      await Student.findByIdAndUpdate(promo.studentId, {
        classId: new Types.ObjectId(promo.toClassId),
        class: targetClass.name,
        section: targetDivision?.name || ''
      });
      promotedCount++;
    } else if (promo.status === 'detained') {
      detainedCount++;
      // Student stays in same class; nothing to update
    } else if (promo.status === 'tc_issued') {
      await Student.findByIdAndUpdate(promo.studentId, { status: 'inactive' });
    }
  }

  await ActivityLog.create({
    userId: req.user!._id,
    userName: req.user!.name,
    userRole: req.user!.role,
    action: 'promote',
    module: 'promotions',
    details: `Promoted ${promotedCount} students from ${fromAcademicYear} to ${toAcademicYear}. Detained: ${detainedCount}`,
    ...orgBranch
  });

  res.json({
    success: true,
    message: `Promoted ${promotedCount} students. Detained: ${detainedCount}`,
    data: { promoted: promotedCount, detained: detainedCount }
  });
});

export default router;
