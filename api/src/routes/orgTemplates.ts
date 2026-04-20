import express from 'express';
import mongoose from 'mongoose';
import { Class } from '../models/Class';
import { Subject } from '../models/Subject';
import { Division } from '../models/Division';
import { Branch } from '../models/Branch';
import { ActivityLog } from '../models/ActivityLog';
import { AcademicYear } from '../models/AcademicYear';
import { Department } from '../models/Department';
import { Designation } from '../models/Designation';
import { StaffCategory } from '../models/StaffCategory';
import { ExpenseCategory } from '../models/ExpenseCategory';
import { IncomeCategory } from '../models/IncomeCategory';
import { FeeTypeConfig } from '../models/FeeTypeConfig';
import { Organization } from '../models/Organization';
import { authenticate, authorize, checkPermission } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { AuthenticatedRequest, ApiResponse } from '../types';
import Joi from 'joi';

const router = express.Router();
router.use(authenticate);

// Only org_admin and platform_admin can manage org-level templates
const orgAdminOnly = authorize('platform_admin', 'org_admin');

async function getOrgId(req: AuthenticatedRequest): Promise<mongoose.Types.ObjectId | undefined> {
  if (req.user!.role === 'platform_admin') {
    const id = req.body.organizationId || req.query.organizationId;
    if (id) return new mongoose.Types.ObjectId(String(id));
    // Auto-resolve: pick the first organization
    const org = await Organization.findOne().select('_id').lean();
    return org ? new mongoose.Types.ObjectId(String(org._id)) : undefined;
  }
  return req.user!.organizationId ? new mongoose.Types.ObjectId(String(req.user!.organizationId)) : undefined;
}

// ═══════════════════════════════════════════════════════════
// ORG-LEVEL CLASSES  (branchId = null)
// ═══════════════════════════════════════════════════════════

// @desc   List org-level template classes
// @route  GET /api/org-templates/classes
router.get('/classes', orgAdminOnly, async (req: AuthenticatedRequest, res) => {
  try {
    const orgId = await getOrgId(req);
    if (!orgId) return res.status(400).json({ success: false, message: 'Organization ID required' });

    const { status, academicYear, search } = req.query;
    const filter: any = { organizationId: orgId, branchId: null };
    if (status) filter.status = status;
    if (academicYear) filter.academicYear = academicYear;
    if (search) filter.name = { $regex: search, $options: 'i' };

    const classes = await Class.find(filter).sort({ name: 1 }).lean();
    res.json({ success: true, message: 'Org template classes', data: classes });
  } catch (error) {
    console.error('Get org template classes error:', error);
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
});

// @desc   Create org-level template class
// @route  POST /api/org-templates/classes
const createOrgClassSchema = Joi.object({
  name: Joi.string().required().trim(),
  description: Joi.string().optional().allow('').trim(),
  academicYear: Joi.string().required().trim(),
  status: Joi.string().valid('active', 'inactive').default('active'),
  organizationId: Joi.string().optional()
});

router.post('/classes', orgAdminOnly, validate(createOrgClassSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const orgId = await getOrgId(req);
    if (!orgId) return res.status(400).json({ success: false, message: 'Organization ID required' });

    // Check duplicate
    const exists = await Class.findOne({
      name: req.body.name,
      organizationId: orgId,
      branchId: null,
      academicYear: req.body.academicYear
    });
    if (exists) return res.status(400).json({ success: false, message: 'Class with this name already exists at org level for this academic year' });

    const newClass = await Class.create({
      name: req.body.name,
      description: req.body.description,
      academicYear: req.body.academicYear,
      status: req.body.status || 'active',
      organizationId: orgId,
      branchId: null
    });

    await ActivityLog.create({
      userId: req.user!._id,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: 'CREATE',
      module: 'OrgTemplates',
      details: `Created org template class: ${newClass.name}`,
      ipAddress: req.ip
    });

    res.status(201).json({ success: true, message: 'Org template class created', data: newClass });
  } catch (error) {
    console.error('Create org template class error:', error);
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
});

// @desc   Update org-level template class
// @route  PUT /api/org-templates/classes/:id
const updateOrgClassSchema = Joi.object({
  name: Joi.string().optional().trim(),
  description: Joi.string().optional().allow('').trim(),
  academicYear: Joi.string().optional().trim(),
  status: Joi.string().valid('active', 'inactive').optional()
});

router.put('/classes/:id', orgAdminOnly, validate(updateOrgClassSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const orgId = await getOrgId(req);
    if (!orgId) return res.status(400).json({ success: false, message: 'Organization ID required' });

    const cls = await Class.findOneAndUpdate(
      { _id: req.params.id, organizationId: orgId, branchId: null },
      { $set: req.body },
      { new: true }
    );
    if (!cls) return res.status(404).json({ success: false, message: 'Organization template class was not found.' });

    res.json({ success: true, message: 'Updated', data: cls });
  } catch (error) {
    console.error('Update org template class error:', error);
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
});

// @desc   Delete org-level template class
// @route  DELETE /api/org-templates/classes/:id
router.delete('/classes/:id', orgAdminOnly, async (req: AuthenticatedRequest, res) => {
  try {
    const orgId = await getOrgId(req);
    if (!orgId) return res.status(400).json({ success: false, message: 'Organization ID required' });

    const cls = await Class.findOneAndDelete({ _id: req.params.id, organizationId: orgId, branchId: null });
    if (!cls) return res.status(404).json({ success: false, message: 'Organization template class was not found.' });

    // Also remove org-level subjects that reference this class
    await Subject.updateMany(
      { organizationId: orgId, branchId: null },
      { $pull: { classIds: cls._id } }
    );

    res.json({ success: true, message: 'Deleted' });
  } catch (error) {
    console.error('Delete org template class error:', error);
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════════════
// ORG-LEVEL SUBJECTS  (branchId = null)
// ═══════════════════════════════════════════════════════════

// @desc   List org-level template subjects
// @route  GET /api/org-templates/subjects
router.get('/subjects', orgAdminOnly, async (req: AuthenticatedRequest, res) => {
  try {
    const orgId = await getOrgId(req);
    if (!orgId) return res.status(400).json({ success: false, message: 'Organization ID required' });

    const { status, classId, search } = req.query;
    const filter: any = { organizationId: orgId, branchId: null };
    if (status) filter.status = status;
    if (classId) filter.classIds = new mongoose.Types.ObjectId(String(classId));
    if (search) filter.$or = [{ name: { $regex: search, $options: 'i' } }, { code: { $regex: search, $options: 'i' } }];

    const subjects = await Subject.find(filter).populate('classIds', 'name academicYear').sort({ name: 1 }).lean();
    res.json({ success: true, message: 'Org template subjects', data: subjects });
  } catch (error) {
    console.error('Get org template subjects error:', error);
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
});

// @desc   Create org-level template subject
// @route  POST /api/org-templates/subjects
const createOrgSubjectSchema = Joi.object({
  name: Joi.string().required().trim(),
  code: Joi.string().required().trim().uppercase(),
  classIds: Joi.array().items(Joi.string()).default([]),
  maxMark: Joi.number().default(100),
  passMark: Joi.number().default(33),
  isOptional: Joi.boolean().default(false),
  status: Joi.string().valid('active', 'inactive').default('active'),
  organizationId: Joi.string().optional()
});

router.post('/subjects', orgAdminOnly, validate(createOrgSubjectSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const orgId = await getOrgId(req);
    if (!orgId) return res.status(400).json({ success: false, message: 'Organization ID required' });

    // Check duplicate code at org level
    const exists = await Subject.findOne({ code: req.body.code.toUpperCase(), organizationId: orgId, branchId: null });
    if (exists) return res.status(400).json({ success: false, message: 'Subject with this code already exists at org level' });

    const newSubject = await Subject.create({
      name: req.body.name,
      code: req.body.code.toUpperCase(),
      classIds: req.body.classIds || [],
      maxMark: req.body.maxMark,
      passMark: req.body.passMark,
      isOptional: req.body.isOptional,
      status: req.body.status || 'active',
      organizationId: orgId,
      branchId: null
    });

    await ActivityLog.create({
      userId: req.user!._id,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: 'CREATE',
      module: 'OrgTemplates',
      details: `Created org template subject: ${newSubject.name} (${newSubject.code})`,
      ipAddress: req.ip
    });

    res.status(201).json({ success: true, message: 'Org template subject created', data: newSubject });
  } catch (error) {
    console.error('Create org template subject error:', error);
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
});

// @desc   Update org-level template subject
// @route  PUT /api/org-templates/subjects/:id
const updateOrgSubjectSchema = Joi.object({
  name: Joi.string().optional().trim(),
  code: Joi.string().optional().trim().uppercase(),
  classIds: Joi.array().items(Joi.string()).optional(),
  maxMark: Joi.number().optional(),
  passMark: Joi.number().optional(),
  isOptional: Joi.boolean().optional(),
  status: Joi.string().valid('active', 'inactive').optional()
});

router.put('/subjects/:id', orgAdminOnly, validate(updateOrgSubjectSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const orgId = await getOrgId(req);
    if (!orgId) return res.status(400).json({ success: false, message: 'Organization ID required' });

    const subj = await Subject.findOneAndUpdate(
      { _id: req.params.id, organizationId: orgId, branchId: null },
      { $set: req.body },
      { new: true }
    ).populate('classIds', 'name academicYear');
    if (!subj) return res.status(404).json({ success: false, message: 'Organization template subject was not found.' });

    res.json({ success: true, message: 'Updated', data: subj });
  } catch (error) {
    console.error('Update org template subject error:', error);
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
});

// @desc   Delete org-level template subject
// @route  DELETE /api/org-templates/subjects/:id
router.delete('/subjects/:id', orgAdminOnly, async (req: AuthenticatedRequest, res) => {
  try {
    const orgId = await getOrgId(req);
    if (!orgId) return res.status(400).json({ success: false, message: 'Organization ID required' });

    const subj = await Subject.findOneAndDelete({ _id: req.params.id, organizationId: orgId, branchId: null });
    if (!subj) return res.status(404).json({ success: false, message: 'Organization template subject was not found.' });

    res.json({ success: true, message: 'Deleted' });
  } catch (error) {
    console.error('Delete org template subject error:', error);
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════════════
// IMPORT ORG TEMPLATES → BRANCH
// ═══════════════════════════════════════════════════════════

// @desc   Preview what will be imported
// @route  GET /api/org-templates/import/preview
router.get('/import/preview', orgAdminOnly, async (req: AuthenticatedRequest, res) => {
  try {
    const orgId = await getOrgId(req);
    if (!orgId) return res.status(400).json({ success: false, message: 'Organization ID required' });

    const { academicYear } = req.query;
    const classFilter: any = { organizationId: orgId, branchId: null, status: 'active' };
    if (academicYear) classFilter.academicYear = academicYear;

    const classes = await Class.find(classFilter).sort({ name: 1 }).lean();
    const classIds = classes.map(c => c._id);

    const subjects = await Subject.find({
      organizationId: orgId,
      branchId: null,
      status: 'active',
      classIds: { $in: classIds }
    }).populate('classIds', 'name').lean();

    // Also get subjects not linked to any class (general org subjects)
    const unlinkedSubjects = await Subject.find({
      organizationId: orgId,
      branchId: null,
      status: 'active',
      $or: [{ classIds: { $size: 0 } }, { classIds: { $exists: false } }]
    }).lean();

    // Count existing LMS chapters per class+subject at org level
    let chapterCounts: Record<string, number> = {};
    try {
      const Chapter = mongoose.model('Chapter');
      const chapterAgg = await Chapter.aggregate([
        { $match: { organizationId: orgId, branchId: null } },
        { $group: { _id: { classId: '$classId', subjectId: '$subjectId' }, count: { $sum: 1 } } }
      ]);
      for (const c of chapterAgg) {
        chapterCounts[`${c._id.classId}_${c._id.subjectId}`] = c.count;
      }
    } catch { /* Chapter model may not exist yet */ }

    // Load master data at org level
    const orgFilter = { organizationId: orgId, branchId: null, status: 'active' };
    const [academicYears, departments, designations, staffCategories, expenseCategories, incomeCategories, feeTypes] = await Promise.all([
      AcademicYear.find({ organizationId: orgId, branchId: null }).sort({ name: -1 }).lean(),
      Department.find(orgFilter).sort({ name: 1 }).lean(),
      Designation.find(orgFilter).sort({ name: 1 }).lean(),
      StaffCategory.find(orgFilter).sort({ name: 1 }).lean(),
      ExpenseCategory.find(orgFilter).sort({ name: 1 }).lean(),
      IncomeCategory.find(orgFilter).sort({ name: 1 }).lean(),
      FeeTypeConfig.find({ organizationId: orgId, branchId: null }).sort({ name: 1 }).lean(),
    ]);

    res.json({
      success: true,
      message: 'Import preview',
      data: {
        classes: classes.map(c => ({
          _id: c._id,
          name: c.name,
          academicYear: c.academicYear,
          description: c.description
        })),
        subjects: subjects.map(s => ({
          _id: s._id,
          name: s.name,
          code: s.code,
          maxMark: s.maxMark,
          passMark: s.passMark,
          isOptional: s.isOptional,
          classIds: s.classIds
        })),
        unlinkedSubjects: unlinkedSubjects.map(s => ({
          _id: s._id,
          name: s.name,
          code: s.code,
          maxMark: s.maxMark,
          passMark: s.passMark,
          isOptional: s.isOptional
        })),
        chapterCounts,
        academicYears: academicYears.map(ay => ({ _id: ay._id, name: ay.name, startDate: ay.startDate, endDate: ay.endDate, isCurrent: ay.isCurrent })),
        departments: departments.map(d => ({ _id: (d as any)._id, name: d.name, code: d.code, description: d.description })),
        designations: designations.map(d => ({ _id: d._id, name: d.name, description: d.description })),
        staffCategories: staffCategories.map(s => ({ _id: s._id, name: s.name, description: s.description })),
        expenseCategories: expenseCategories.map(e => ({ _id: e._id, name: e.name, description: e.description })),
        incomeCategories: incomeCategories.map(i => ({ _id: i._id, name: i.name, description: i.description })),
        feeTypes: feeTypes.map(f => ({ _id: (f as any)._id, name: f.name, isCommon: f.isCommon })),
      }
    });
  } catch (error) {
    console.error('Import preview error:', error);
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
});

// @desc   Import org templates into a branch
// @route  POST /api/org-templates/import
const importSchema = Joi.object({
  branchId: Joi.string().required(),
  classIds: Joi.array().items(Joi.string()).min(0).default([]),
  includeSubjects: Joi.boolean().default(true),
  includeChapters: Joi.boolean().default(true),
  includeAcademicYears: Joi.boolean().default(false),
  includeDepartments: Joi.boolean().default(false),
  includeDesignations: Joi.boolean().default(false),
  includeStaffCategories: Joi.boolean().default(false),
  includeExpenseCategories: Joi.boolean().default(false),
  includeIncomeCategories: Joi.boolean().default(false),
  includeFeeTypes: Joi.boolean().default(false),
  divisions: Joi.object().pattern(
    Joi.string(), // classId
    Joi.array().items(Joi.object({
      name: Joi.string().required(),
      capacity: Joi.number().min(1).default(40)
    }))
  ).default({}),
  organizationId: Joi.string().optional()
});

router.post('/import', orgAdminOnly, validate(importSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const orgId = await getOrgId(req);
    if (!orgId) return res.status(400).json({ success: false, message: 'Organization ID required' });

    const { branchId, classIds, includeSubjects, includeChapters, includeAcademicYears, includeDepartments, includeDesignations, includeStaffCategories, includeExpenseCategories, includeIncomeCategories, includeFeeTypes, divisions } = req.body;
    const branchObjId = new mongoose.Types.ObjectId(branchId);

    // Verify branch belongs to this org
    const branch = await Branch.findOne({ _id: branchObjId, organizationId: orgId });
    if (!branch) return res.status(404).json({ success: false, message: 'Branch not found in this organization' });

    // Get org-level template classes to import
    const orgClasses = await Class.find({
      _id: { $in: classIds.map((id: string) => new mongoose.Types.ObjectId(id)) },
      organizationId: orgId,
      branchId: null
    }).lean();

    if (orgClasses.length === 0 && classIds.length > 0) {
      return res.status(400).json({ success: false, message: 'No valid org-level classes found' });
    }

    const stats: Record<string, number> = {
      classesCreated: 0,
      classesSkipped: 0,
      divisionsCreated: 0,
      subjectsCreated: 0,
      subjectsSkipped: 0,
      chaptersCreated: 0,
      academicYearsCreated: 0,
      academicYearsSkipped: 0,
      departmentsCreated: 0,
      departmentsSkipped: 0,
      designationsCreated: 0,
      designationsSkipped: 0,
      staffCategoriesCreated: 0,
      staffCategoriesSkipped: 0,
      expenseCategoriesCreated: 0,
      expenseCategoriesSkipped: 0,
      incomeCategoriesCreated: 0,
      incomeCategoriesSkipped: 0,
      feeTypesCreated: 0,
      feeTypesSkipped: 0,
    };

    // Map from org classId → new branch classId
    const classIdMap: Record<string, mongoose.Types.ObjectId> = {};

    // 1. Clone classes into branch
    for (const orgClass of orgClasses) {
      // Check if class already exists in this branch
      const existing = await Class.findOne({
        name: orgClass.name,
        branchId: branchObjId,
        academicYear: orgClass.academicYear
      });

      if (existing) {
        classIdMap[orgClass._id.toString()] = new mongoose.Types.ObjectId(String(existing._id));
        stats.classesSkipped++;
        continue;
      }

      const newClass = await Class.create({
        name: orgClass.name,
        description: orgClass.description,
        academicYear: orgClass.academicYear,
        status: 'active',
        organizationId: orgId,
        branchId: branchObjId
      });

      classIdMap[orgClass._id.toString()] = new mongoose.Types.ObjectId(String(newClass._id));
      stats.classesCreated++;

      // 2. Create divisions for this class if specified
      const classDivisions = divisions[orgClass._id.toString()] || [];
      for (const div of classDivisions) {
        const divExists = await Division.findOne({
          name: div.name,
          classId: newClass._id,
          branchId: branchObjId
        });
        if (!divExists) {
          await Division.create({
            classId: newClass._id,
            className: newClass.name,
            name: div.name,
            capacity: div.capacity || 40,
            status: 'active',
            organizationId: orgId,
            branchId: branchObjId
          });
          stats.divisionsCreated++;
        }
      }
    }

    // 3. Clone subjects into branch
    if (includeSubjects) {
      const orgClassIds = orgClasses.map(c => c._id);
      const orgSubjects = await Subject.find({
        organizationId: orgId,
        branchId: null,
        classIds: { $in: orgClassIds }
      }).lean();

      // Also get unlinked subjects
      const unlinkedSubjects = await Subject.find({
        organizationId: orgId,
        branchId: null,
        $or: [{ classIds: { $size: 0 } }, { classIds: { $exists: false } }]
      }).lean();

      const allSubjects = [...orgSubjects, ...unlinkedSubjects];
      const processedSubjectCodes = new Set<string>();

      for (const orgSubj of allSubjects) {
        if (processedSubjectCodes.has(orgSubj.code)) continue;
        processedSubjectCodes.add(orgSubj.code);

        // Check if subject code already exists in this branch
        const existing = await Subject.findOne({ code: orgSubj.code, branchId: branchObjId });
        if (existing) {
          // Update classIds to include new branch class IDs
          const newClassIds = (orgSubj.classIds || [])
            .map((cid: any) => classIdMap[cid.toString()])
            .filter(Boolean);

          if (newClassIds.length > 0) {
            await Subject.updateOne(
              { _id: existing._id },
              { $addToSet: { classIds: { $each: newClassIds } } }
            );
          }
          stats.subjectsSkipped++;
          continue;
        }

        // Map org classIds to branch classIds
        const branchClassIds = (orgSubj.classIds || [])
          .map((cid: any) => classIdMap[cid.toString()])
          .filter(Boolean);

        const newSubject = await Subject.create({
          name: orgSubj.name,
          code: orgSubj.code,
          classIds: branchClassIds,
          maxMark: orgSubj.maxMark,
          passMark: orgSubj.passMark,
          isOptional: orgSubj.isOptional,
          status: 'active',
          organizationId: orgId,
          branchId: branchObjId
        });

        stats.subjectsCreated++;

        // 4. Clone chapters if requested
        if (includeChapters) {
          try {
            const Chapter = mongoose.model('Chapter');
            for (const orgClassId of orgSubj.classIds || []) {
              const branchClassId = classIdMap[orgClassId.toString()];
              if (!branchClassId) continue;

              const orgChapters = await Chapter.find({
                subjectId: orgSubj._id,
                classId: orgClassId,
                organizationId: orgId,
                branchId: null
              }).lean();

              for (const ch of orgChapters) {
                const chExists = await Chapter.findOne({
                  subjectId: newSubject._id,
                  classId: branchClassId,
                  chapterNumber: (ch as any).chapterNumber,
                  branchId: branchObjId
                });
                if (!chExists) {
                  await Chapter.create({
                    subjectId: newSubject._id,
                    classId: branchClassId,
                    name: (ch as any).name,
                    chapterNumber: (ch as any).chapterNumber,
                    description: (ch as any).description,
                    status: 'active',
                    organizationId: orgId,
                    branchId: branchObjId,
                    createdBy: req.user!._id
                  });
                  stats.chaptersCreated++;
                }
              }
            }
          } catch { /* Chapter model may not be registered */ }
        }
      }
    }

    // ── Import Academic Years ──
    if (includeAcademicYears) {
      const orgAYs = await AcademicYear.find({ organizationId: orgId, branchId: null }).lean();
      for (const ay of orgAYs) {
        const exists = await AcademicYear.findOne({ name: ay.name, branchId: branchObjId });
        if (exists) { stats.academicYearsSkipped++; continue; }
        await AcademicYear.create({
          name: ay.name, startDate: ay.startDate, endDate: ay.endDate,
          isCurrent: false, status: ay.status,
          organizationId: orgId, branchId: branchObjId
        });
        stats.academicYearsCreated++;
      }
    }

    // ── Import Departments ──
    if (includeDepartments) {
      const orgDepts = await Department.find({ organizationId: orgId, branchId: null, status: 'active' }).lean();
      for (const d of orgDepts) {
        const exists = await Department.findOne({ code: d.code, branchId: branchObjId });
        if (exists) { stats.departmentsSkipped++; continue; }
        await Department.create({
          name: d.name, code: d.code, description: d.description,
          status: 'active', organizationId: orgId, branchId: branchObjId
        });
        stats.departmentsCreated++;
      }
    }

    // ── Import Designations ──
    if (includeDesignations) {
      const orgDesigs = await Designation.find({ organizationId: orgId, branchId: null, status: 'active' }).lean();
      for (const d of orgDesigs) {
        const exists = await Designation.findOne({ name: d.name, branchId: branchObjId });
        if (exists) { stats.designationsSkipped++; continue; }
        await Designation.create({
          name: d.name, description: d.description,
          status: 'active', organizationId: orgId, branchId: branchObjId
        });
        stats.designationsCreated++;
      }
    }

    // ── Import Staff Categories ──
    if (includeStaffCategories) {
      const orgSCs = await StaffCategory.find({ organizationId: orgId, branchId: null, status: 'active' }).lean();
      for (const s of orgSCs) {
        const exists = await StaffCategory.findOne({ name: s.name, branchId: branchObjId });
        if (exists) { stats.staffCategoriesSkipped++; continue; }
        await StaffCategory.create({
          name: s.name, description: s.description,
          status: 'active', organizationId: orgId, branchId: branchObjId
        });
        stats.staffCategoriesCreated++;
      }
    }

    // ── Import Expense Categories ──
    if (includeExpenseCategories) {
      const orgECs = await ExpenseCategory.find({ organizationId: orgId, branchId: null, status: 'active' }).lean();
      for (const e of orgECs) {
        const exists = await ExpenseCategory.findOne({ name: e.name, branchId: branchObjId });
        if (exists) { stats.expenseCategoriesSkipped++; continue; }
        await ExpenseCategory.create({
          name: e.name, description: e.description,
          status: 'active', organizationId: orgId, branchId: branchObjId
        });
        stats.expenseCategoriesCreated++;
      }
    }

    // ── Import Income Categories ──
    if (includeIncomeCategories) {
      const orgICs = await IncomeCategory.find({ organizationId: orgId, branchId: null, status: 'active' }).lean();
      for (const i of orgICs) {
        const exists = await IncomeCategory.findOne({ name: i.name, branchId: branchObjId });
        if (exists) { stats.incomeCategoriesSkipped++; continue; }
        await IncomeCategory.create({
          name: i.name, description: i.description,
          status: 'active', organizationId: orgId, branchId: branchObjId
        });
        stats.incomeCategoriesCreated++;
      }
    }

    // ── Import Fee Types ──
    if (includeFeeTypes) {
      const orgFTs = await FeeTypeConfig.find({ organizationId: orgId, branchId: null }).lean();
      for (const f of orgFTs) {
        const exists = await FeeTypeConfig.findOne({ name: f.name, branchId: branchObjId });
        if (exists) { stats.feeTypesSkipped++; continue; }
        await FeeTypeConfig.create({
          name: f.name, isCommon: f.isCommon, isActive: f.isActive,
          organizationId: orgId, branchId: branchObjId
        });
        stats.feeTypesCreated++;
      }
    }

    // Build summary string
    const summaryParts: string[] = [];
    if (stats.classesCreated) summaryParts.push(`${stats.classesCreated} classes`);
    if (stats.divisionsCreated) summaryParts.push(`${stats.divisionsCreated} divisions`);
    if (stats.subjectsCreated) summaryParts.push(`${stats.subjectsCreated} subjects`);
    if (stats.chaptersCreated) summaryParts.push(`${stats.chaptersCreated} chapters`);
    if (stats.academicYearsCreated) summaryParts.push(`${stats.academicYearsCreated} academic years`);
    if (stats.departmentsCreated) summaryParts.push(`${stats.departmentsCreated} departments`);
    if (stats.designationsCreated) summaryParts.push(`${stats.designationsCreated} designations`);
    if (stats.staffCategoriesCreated) summaryParts.push(`${stats.staffCategoriesCreated} staff categories`);
    if (stats.expenseCategoriesCreated) summaryParts.push(`${stats.expenseCategoriesCreated} expense categories`);
    if (stats.incomeCategoriesCreated) summaryParts.push(`${stats.incomeCategoriesCreated} income categories`);
    if (stats.feeTypesCreated) summaryParts.push(`${stats.feeTypesCreated} fee types`);

    await ActivityLog.create({
      userId: req.user!._id,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: 'IMPORT',
      module: 'OrgTemplates',
      details: `Imported org templates to branch ${branch.name}: ${summaryParts.join(', ') || 'nothing new'}`,
      ipAddress: req.ip,
      branchId: branchObjId
    });

    res.json({
      success: true,
      message: 'Import completed successfully',
      data: stats
    });
  } catch (error) {
    console.error('Import org templates error:', error);
    res.status(500).json({ success: false, message: 'Something went wrong during import. Please try again.' });
  }
});

// @desc   Get summary of what exists at org level vs a specific branch
// @route  GET /api/org-templates/compare/:branchId
router.get('/compare/:branchId', orgAdminOnly, async (req: AuthenticatedRequest, res) => {
  try {
    const orgId = await getOrgId(req);
    if (!orgId) return res.status(400).json({ success: false, message: 'Organization ID required' });

    const branchObjId = new mongoose.Types.ObjectId(req.params.branchId);

    const [orgClasses, branchClasses, orgSubjects, branchSubjects,
      orgAYs, branchAYs, orgDepts, branchDepts, orgDesigs, branchDesigs,
      orgSCs, branchSCs, orgECs, branchECs, orgICs, branchICs, orgFTs, branchFTs
    ] = await Promise.all([
      Class.find({ organizationId: orgId, branchId: null, status: 'active' }).lean(),
      Class.find({ organizationId: orgId, branchId: branchObjId, status: 'active' }).lean(),
      Subject.find({ organizationId: orgId, branchId: null, status: 'active' }).lean(),
      Subject.find({ organizationId: orgId, branchId: branchObjId, status: 'active' }).lean(),
      AcademicYear.find({ organizationId: orgId, branchId: null }).lean(),
      AcademicYear.find({ organizationId: orgId, branchId: branchObjId }).lean(),
      Department.find({ organizationId: orgId, branchId: null, status: 'active' }).lean(),
      Department.find({ organizationId: orgId, branchId: branchObjId, status: 'active' }).lean(),
      Designation.find({ organizationId: orgId, branchId: null, status: 'active' }).lean(),
      Designation.find({ organizationId: orgId, branchId: branchObjId, status: 'active' }).lean(),
      StaffCategory.find({ organizationId: orgId, branchId: null, status: 'active' }).lean(),
      StaffCategory.find({ organizationId: orgId, branchId: branchObjId, status: 'active' }).lean(),
      ExpenseCategory.find({ organizationId: orgId, branchId: null, status: 'active' }).lean(),
      ExpenseCategory.find({ organizationId: orgId, branchId: branchObjId, status: 'active' }).lean(),
      IncomeCategory.find({ organizationId: orgId, branchId: null, status: 'active' }).lean(),
      IncomeCategory.find({ organizationId: orgId, branchId: branchObjId, status: 'active' }).lean(),
      FeeTypeConfig.find({ organizationId: orgId, branchId: null }).lean(),
      FeeTypeConfig.find({ organizationId: orgId, branchId: branchObjId }).lean(),
    ]);

    const branchClassNames = new Set(branchClasses.map(c => c.name));
    const branchSubjectCodes = new Set(branchSubjects.map(s => s.code));
    const branchAYNames = new Set(branchAYs.map(a => a.name));
    const branchDeptCodes = new Set(branchDepts.map(d => d.code));
    const branchDesigNames = new Set(branchDesigs.map(d => d.name));
    const branchSCNames = new Set(branchSCs.map(s => s.name));
    const branchECNames = new Set(branchECs.map(e => e.name));
    const branchICNames = new Set(branchICs.map(i => i.name));
    const branchFTNames = new Set(branchFTs.map(f => f.name));

    res.json({
      success: true,
      data: {
        org: {
          classes: orgClasses.map(c => ({ _id: c._id, name: c.name, academicYear: c.academicYear, existsInBranch: branchClassNames.has(c.name) })),
          subjects: orgSubjects.map(s => ({ _id: s._id, name: s.name, code: s.code, existsInBranch: branchSubjectCodes.has(s.code) })),
          academicYears: orgAYs.map(a => ({ _id: a._id, name: a.name, existsInBranch: branchAYNames.has(a.name) })),
          departments: orgDepts.map(d => ({ _id: (d as any)._id, name: d.name, code: d.code, existsInBranch: branchDeptCodes.has(d.code) })),
          designations: orgDesigs.map(d => ({ _id: d._id, name: d.name, existsInBranch: branchDesigNames.has(d.name) })),
          staffCategories: orgSCs.map(s => ({ _id: s._id, name: s.name, existsInBranch: branchSCNames.has(s.name) })),
          expenseCategories: orgECs.map(e => ({ _id: e._id, name: e.name, existsInBranch: branchECNames.has(e.name) })),
          incomeCategories: orgICs.map(i => ({ _id: i._id, name: i.name, existsInBranch: branchICNames.has(i.name) })),
          feeTypes: orgFTs.map(f => ({ _id: (f as any)._id, name: f.name, existsInBranch: branchFTNames.has(f.name) })),
        },
        branch: {
          classCount: branchClasses.length,
          subjectCount: branchSubjects.length,
          academicYearCount: branchAYs.length,
          departmentCount: branchDepts.length,
          designationCount: branchDesigs.length,
          staffCategoryCount: branchSCs.length,
          expenseCategoryCount: branchECs.length,
          incomeCategoryCount: branchICs.length,
          feeTypeCount: branchFTs.length,
        }
      }
    });
  } catch (error) {
    console.error('Compare error:', error);
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════════════
// ORG-LEVEL ACADEMIC YEARS  (branchId = null)
// ═══════════════════════════════════════════════════════════

router.get('/academic-years', orgAdminOnly, async (req: AuthenticatedRequest, res) => {
  try {
    const orgId = await getOrgId(req);
    if (!orgId) return res.status(400).json({ success: false, message: 'Organization ID required' });
    const { status, search } = req.query;
    const filter: any = { organizationId: orgId, branchId: null };
    if (status) filter.status = status;
    if (search) filter.name = { $regex: search, $options: 'i' };
    const data = await AcademicYear.find(filter).sort({ name: -1 }).lean();
    res.json({ success: true, data });
  } catch (error) {
    console.error('Get org template academic years error:', error);
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
});

const createOrgAYSchema = Joi.object({
  name: Joi.string().required().trim(),
  startDate: Joi.date().required(),
  endDate: Joi.date().required(),
  isCurrent: Joi.boolean().default(false),
  status: Joi.string().valid('active', 'inactive').default('active'),
  organizationId: Joi.string().optional()
});
router.post('/academic-years', orgAdminOnly, validate(createOrgAYSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const orgId = await getOrgId(req);
    if (!orgId) return res.status(400).json({ success: false, message: 'Organization ID required' });
    const exists = await AcademicYear.findOne({ name: req.body.name, organizationId: orgId, branchId: null });
    if (exists) return res.status(400).json({ success: false, message: 'Academic year already exists at org level' });
    const doc = await AcademicYear.create({ ...req.body, organizationId: orgId, branchId: null });
    res.status(201).json({ success: true, data: doc });
  } catch (error) {
    console.error('Create org template academic year error:', error);
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
});

const updateOrgAYSchema = Joi.object({
  name: Joi.string().optional().trim(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
  isCurrent: Joi.boolean().optional(),
  status: Joi.string().valid('active', 'inactive').optional()
});
router.put('/academic-years/:id', orgAdminOnly, validate(updateOrgAYSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const orgId = await getOrgId(req);
    if (!orgId) return res.status(400).json({ success: false, message: 'Organization ID required' });
    const doc = await AcademicYear.findOneAndUpdate(
      { _id: req.params.id, organizationId: orgId, branchId: null },
      { $set: req.body }, { new: true }
    );
    if (!doc) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: doc });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
});

router.delete('/academic-years/:id', orgAdminOnly, async (req: AuthenticatedRequest, res) => {
  try {
    const orgId = await getOrgId(req);
    if (!orgId) return res.status(400).json({ success: false, message: 'Organization ID required' });
    const doc = await AcademicYear.findOneAndDelete({ _id: req.params.id, organizationId: orgId, branchId: null });
    if (!doc) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════════════
// ORG-LEVEL DEPARTMENTS  (branchId = null)
// ═══════════════════════════════════════════════════════════

router.get('/departments', orgAdminOnly, async (req: AuthenticatedRequest, res) => {
  try {
    const orgId = await getOrgId(req);
    if (!orgId) return res.status(400).json({ success: false, message: 'Organization ID required' });
    const filter: any = { organizationId: orgId, branchId: null };
    if (req.query.status) filter.status = req.query.status;
    if (req.query.search) filter.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { code: { $regex: req.query.search, $options: 'i' } }
    ];
    const data = await Department.find(filter).sort({ name: 1 }).lean();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
});

const orgDeptSchema = Joi.object({
  name: Joi.string().required().trim(),
  code: Joi.string().required().trim().uppercase(),
  description: Joi.string().optional().allow('').trim(),
  headOfDepartment: Joi.string().optional().allow('').trim(),
  status: Joi.string().valid('active', 'inactive').default('active'),
  organizationId: Joi.string().optional()
});
router.post('/departments', orgAdminOnly, validate(orgDeptSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const orgId = await getOrgId(req);
    if (!orgId) return res.status(400).json({ success: false, message: 'Organization ID required' });
    const exists = await Department.findOne({ code: req.body.code.toUpperCase(), organizationId: orgId, branchId: null });
    if (exists) return res.status(400).json({ success: false, message: 'Department code already exists at org level' });
    const doc = await Department.create({ ...req.body, code: req.body.code.toUpperCase(), organizationId: orgId, branchId: null });
    res.status(201).json({ success: true, data: doc });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
});

const updateOrgDeptSchema = Joi.object({
  name: Joi.string().optional().trim(),
  code: Joi.string().optional().trim().uppercase(),
  description: Joi.string().optional().allow('').trim(),
  headOfDepartment: Joi.string().optional().allow('').trim(),
  status: Joi.string().valid('active', 'inactive').optional()
});
router.put('/departments/:id', orgAdminOnly, validate(updateOrgDeptSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const orgId = await getOrgId(req);
    if (!orgId) return res.status(400).json({ success: false, message: 'Organization ID required' });
    const doc = await Department.findOneAndUpdate(
      { _id: req.params.id, organizationId: orgId, branchId: null },
      { $set: req.body }, { new: true }
    );
    if (!doc) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: doc });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
});

router.delete('/departments/:id', orgAdminOnly, async (req: AuthenticatedRequest, res) => {
  try {
    const orgId = await getOrgId(req);
    if (!orgId) return res.status(400).json({ success: false, message: 'Organization ID required' });
    const doc = await Department.findOneAndDelete({ _id: req.params.id, organizationId: orgId, branchId: null });
    if (!doc) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════════════
// ORG-LEVEL DESIGNATIONS  (branchId = null)
// ═══════════════════════════════════════════════════════════

router.get('/designations', orgAdminOnly, async (req: AuthenticatedRequest, res) => {
  try {
    const orgId = await getOrgId(req);
    if (!orgId) return res.status(400).json({ success: false, message: 'Organization ID required' });
    const filter: any = { organizationId: orgId, branchId: null };
    if (req.query.status) filter.status = req.query.status;
    if (req.query.search) filter.name = { $regex: req.query.search, $options: 'i' };
    const data = await Designation.find(filter).sort({ name: 1 }).lean();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
});

const orgDesigSchema = Joi.object({
  name: Joi.string().required().trim(),
  description: Joi.string().optional().allow('').trim(),
  status: Joi.string().valid('active', 'inactive').default('active'),
  organizationId: Joi.string().optional()
});
router.post('/designations', orgAdminOnly, validate(orgDesigSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const orgId = await getOrgId(req);
    if (!orgId) return res.status(400).json({ success: false, message: 'Organization ID required' });
    const exists = await Designation.findOne({ name: req.body.name, organizationId: orgId, branchId: null });
    if (exists) return res.status(400).json({ success: false, message: 'Designation already exists at org level' });
    const doc = await Designation.create({ ...req.body, organizationId: orgId, branchId: null });
    res.status(201).json({ success: true, data: doc });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
});

const updateOrgDesigSchema = Joi.object({
  name: Joi.string().optional().trim(),
  description: Joi.string().optional().allow('').trim(),
  status: Joi.string().valid('active', 'inactive').optional()
});
router.put('/designations/:id', orgAdminOnly, validate(updateOrgDesigSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const orgId = await getOrgId(req);
    if (!orgId) return res.status(400).json({ success: false, message: 'Organization ID required' });
    const doc = await Designation.findOneAndUpdate(
      { _id: req.params.id, organizationId: orgId, branchId: null },
      { $set: req.body }, { new: true }
    );
    if (!doc) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: doc });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
});

router.delete('/designations/:id', orgAdminOnly, async (req: AuthenticatedRequest, res) => {
  try {
    const orgId = await getOrgId(req);
    if (!orgId) return res.status(400).json({ success: false, message: 'Organization ID required' });
    const doc = await Designation.findOneAndDelete({ _id: req.params.id, organizationId: orgId, branchId: null });
    if (!doc) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════════════
// ORG-LEVEL STAFF CATEGORIES  (branchId = null)
// ═══════════════════════════════════════════════════════════

router.get('/staff-categories', orgAdminOnly, async (req: AuthenticatedRequest, res) => {
  try {
    const orgId = await getOrgId(req);
    if (!orgId) return res.status(400).json({ success: false, message: 'Organization ID required' });
    const filter: any = { organizationId: orgId, branchId: null };
    if (req.query.status) filter.status = req.query.status;
    if (req.query.search) filter.name = { $regex: req.query.search, $options: 'i' };
    const data = await StaffCategory.find(filter).sort({ name: 1 }).lean();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
});

const orgStaffCatSchema = Joi.object({
  name: Joi.string().required().trim(),
  description: Joi.string().optional().allow('').trim(),
  status: Joi.string().valid('active', 'inactive').default('active'),
  organizationId: Joi.string().optional()
});
router.post('/staff-categories', orgAdminOnly, validate(orgStaffCatSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const orgId = await getOrgId(req);
    if (!orgId) return res.status(400).json({ success: false, message: 'Organization ID required' });
    const exists = await StaffCategory.findOne({ name: req.body.name, organizationId: orgId, branchId: null });
    if (exists) return res.status(400).json({ success: false, message: 'Staff category already exists at org level' });
    const doc = await StaffCategory.create({ ...req.body, organizationId: orgId, branchId: null });
    res.status(201).json({ success: true, data: doc });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
});

router.put('/staff-categories/:id', orgAdminOnly, validate(Joi.object({
  name: Joi.string().optional().trim(),
  description: Joi.string().optional().allow('').trim(),
  status: Joi.string().valid('active', 'inactive').optional()
})), async (req: AuthenticatedRequest, res) => {
  try {
    const orgId = await getOrgId(req);
    if (!orgId) return res.status(400).json({ success: false, message: 'Organization ID required' });
    const doc = await StaffCategory.findOneAndUpdate(
      { _id: req.params.id, organizationId: orgId, branchId: null },
      { $set: req.body }, { new: true }
    );
    if (!doc) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: doc });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
});

router.delete('/staff-categories/:id', orgAdminOnly, async (req: AuthenticatedRequest, res) => {
  try {
    const orgId = await getOrgId(req);
    if (!orgId) return res.status(400).json({ success: false, message: 'Organization ID required' });
    const doc = await StaffCategory.findOneAndDelete({ _id: req.params.id, organizationId: orgId, branchId: null });
    if (!doc) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════════════
// ORG-LEVEL EXPENSE CATEGORIES  (branchId = null)
// ═══════════════════════════════════════════════════════════

router.get('/expense-categories', orgAdminOnly, async (req: AuthenticatedRequest, res) => {
  try {
    const orgId = await getOrgId(req);
    if (!orgId) return res.status(400).json({ success: false, message: 'Organization ID required' });
    const filter: any = { organizationId: orgId, branchId: null };
    if (req.query.status) filter.status = req.query.status;
    if (req.query.search) filter.name = { $regex: req.query.search, $options: 'i' };
    const data = await ExpenseCategory.find(filter).sort({ name: 1 }).lean();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
});

const orgExpCatSchema = Joi.object({
  name: Joi.string().required().trim(),
  description: Joi.string().optional().allow('').trim(),
  status: Joi.string().valid('active', 'inactive').default('active'),
  organizationId: Joi.string().optional()
});
router.post('/expense-categories', orgAdminOnly, validate(orgExpCatSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const orgId = await getOrgId(req);
    if (!orgId) return res.status(400).json({ success: false, message: 'Organization ID required' });
    const exists = await ExpenseCategory.findOne({ name: req.body.name, organizationId: orgId, branchId: null });
    if (exists) return res.status(400).json({ success: false, message: 'Expense category already exists at org level' });
    const doc = await ExpenseCategory.create({ ...req.body, organizationId: orgId, branchId: null });
    res.status(201).json({ success: true, data: doc });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
});

router.put('/expense-categories/:id', orgAdminOnly, validate(Joi.object({
  name: Joi.string().optional().trim(),
  description: Joi.string().optional().allow('').trim(),
  status: Joi.string().valid('active', 'inactive').optional()
})), async (req: AuthenticatedRequest, res) => {
  try {
    const orgId = await getOrgId(req);
    if (!orgId) return res.status(400).json({ success: false, message: 'Organization ID required' });
    const doc = await ExpenseCategory.findOneAndUpdate(
      { _id: req.params.id, organizationId: orgId, branchId: null },
      { $set: req.body }, { new: true }
    );
    if (!doc) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: doc });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
});

router.delete('/expense-categories/:id', orgAdminOnly, async (req: AuthenticatedRequest, res) => {
  try {
    const orgId = await getOrgId(req);
    if (!orgId) return res.status(400).json({ success: false, message: 'Organization ID required' });
    const doc = await ExpenseCategory.findOneAndDelete({ _id: req.params.id, organizationId: orgId, branchId: null });
    if (!doc) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════════════
// ORG-LEVEL INCOME CATEGORIES  (branchId = null)
// ═══════════════════════════════════════════════════════════

router.get('/income-categories', orgAdminOnly, async (req: AuthenticatedRequest, res) => {
  try {
    const orgId = await getOrgId(req);
    if (!orgId) return res.status(400).json({ success: false, message: 'Organization ID required' });
    const filter: any = { organizationId: orgId, branchId: null };
    if (req.query.status) filter.status = req.query.status;
    if (req.query.search) filter.name = { $regex: req.query.search, $options: 'i' };
    const data = await IncomeCategory.find(filter).sort({ name: 1 }).lean();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
});

const orgIncCatSchema = Joi.object({
  name: Joi.string().required().trim(),
  description: Joi.string().optional().allow('').trim(),
  status: Joi.string().valid('active', 'inactive').default('active'),
  organizationId: Joi.string().optional()
});
router.post('/income-categories', orgAdminOnly, validate(orgIncCatSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const orgId = await getOrgId(req);
    if (!orgId) return res.status(400).json({ success: false, message: 'Organization ID required' });
    const exists = await IncomeCategory.findOne({ name: req.body.name, organizationId: orgId, branchId: null });
    if (exists) return res.status(400).json({ success: false, message: 'Income category already exists at org level' });
    const doc = await IncomeCategory.create({ ...req.body, organizationId: orgId, branchId: null });
    res.status(201).json({ success: true, data: doc });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
});

router.put('/income-categories/:id', orgAdminOnly, validate(Joi.object({
  name: Joi.string().optional().trim(),
  description: Joi.string().optional().allow('').trim(),
  status: Joi.string().valid('active', 'inactive').optional()
})), async (req: AuthenticatedRequest, res) => {
  try {
    const orgId = await getOrgId(req);
    if (!orgId) return res.status(400).json({ success: false, message: 'Organization ID required' });
    const doc = await IncomeCategory.findOneAndUpdate(
      { _id: req.params.id, organizationId: orgId, branchId: null },
      { $set: req.body }, { new: true }
    );
    if (!doc) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: doc });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
});

router.delete('/income-categories/:id', orgAdminOnly, async (req: AuthenticatedRequest, res) => {
  try {
    const orgId = await getOrgId(req);
    if (!orgId) return res.status(400).json({ success: false, message: 'Organization ID required' });
    const doc = await IncomeCategory.findOneAndDelete({ _id: req.params.id, organizationId: orgId, branchId: null });
    if (!doc) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════════════
// ORG-LEVEL FEE TYPES  (branchId = null)
// ═══════════════════════════════════════════════════════════

router.get('/fee-types', orgAdminOnly, async (req: AuthenticatedRequest, res) => {
  try {
    const orgId = await getOrgId(req);
    if (!orgId) return res.status(400).json({ success: false, message: 'Organization ID required' });
    const filter: any = { organizationId: orgId, branchId: null };
    if (req.query.search) filter.name = { $regex: req.query.search, $options: 'i' };
    const data = await FeeTypeConfig.find(filter).sort({ name: 1 }).lean();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
});

const orgFeeTypeSchema = Joi.object({
  name: Joi.string().required().trim(),
  isCommon: Joi.boolean().default(false),
  isActive: Joi.boolean().default(true),
  organizationId: Joi.string().optional()
});
router.post('/fee-types', orgAdminOnly, validate(orgFeeTypeSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const orgId = await getOrgId(req);
    if (!orgId) return res.status(400).json({ success: false, message: 'Organization ID required' });
    const exists = await FeeTypeConfig.findOne({ name: req.body.name, organizationId: orgId, branchId: null });
    if (exists) return res.status(400).json({ success: false, message: 'Fee type already exists at org level' });
    const doc = await FeeTypeConfig.create({ ...req.body, organizationId: orgId, branchId: null });
    res.status(201).json({ success: true, data: doc });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
});

router.put('/fee-types/:id', orgAdminOnly, validate(Joi.object({
  name: Joi.string().optional().trim(),
  isCommon: Joi.boolean().optional(),
  isActive: Joi.boolean().optional()
})), async (req: AuthenticatedRequest, res) => {
  try {
    const orgId = await getOrgId(req);
    if (!orgId) return res.status(400).json({ success: false, message: 'Organization ID required' });
    const doc = await FeeTypeConfig.findOneAndUpdate(
      { _id: req.params.id, organizationId: orgId, branchId: null },
      { $set: req.body }, { new: true }
    );
    if (!doc) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: doc });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
});

router.delete('/fee-types/:id', orgAdminOnly, async (req: AuthenticatedRequest, res) => {
  try {
    const orgId = await getOrgId(req);
    if (!orgId) return res.status(400).json({ success: false, message: 'Organization ID required' });
    const doc = await FeeTypeConfig.findOneAndDelete({ _id: req.params.id, organizationId: orgId, branchId: null });
    if (!doc) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════════════
// BRANCH → BRANCH IMPORT
// ═══════════════════════════════════════════════════════════

const branchImportSchema = Joi.object({
  sourceBranchId: Joi.string().required(),
  targetBranchId: Joi.string().required(),
  classIds: Joi.array().items(Joi.string()).default([]),
  includeSubjects: Joi.boolean().default(true),
  includeChapters: Joi.boolean().default(true),
  includeAcademicYears: Joi.boolean().default(false),
  includeDepartments: Joi.boolean().default(false),
  includeDesignations: Joi.boolean().default(false),
  includeStaffCategories: Joi.boolean().default(false),
  includeExpenseCategories: Joi.boolean().default(false),
  includeIncomeCategories: Joi.boolean().default(false),
  includeFeeTypes: Joi.boolean().default(false),
  divisions: Joi.object().pattern(
    Joi.string(),
    Joi.array().items(Joi.object({ name: Joi.string().required(), capacity: Joi.number().min(1).default(40) }))
  ).default({}),
  organizationId: Joi.string().optional()
});

// @desc   Preview data available in source branch for import
// @route  GET /api/org-templates/branch-preview/:sourceBranchId
router.get('/branch-preview/:sourceBranchId', orgAdminOnly, async (req: AuthenticatedRequest, res) => {
  try {
    const orgId = await getOrgId(req);
    if (!orgId) return res.status(400).json({ success: false, message: 'Organization ID required' });

    const srcBranchId = new mongoose.Types.ObjectId(req.params.sourceBranchId);
    const srcBranch = await Branch.findOne({ _id: srcBranchId, organizationId: orgId });
    if (!srcBranch) return res.status(404).json({ success: false, message: 'Source branch was not found.' });

    const [classes, academicYears, departments, designations, staffCategories, expenseCategories, incomeCategories, feeTypes] = await Promise.all([
      Class.find({ organizationId: orgId, branchId: srcBranchId, status: 'active' }).lean(),
      AcademicYear.find({ organizationId: orgId, branchId: srcBranchId }).lean(),
      Department.find({ organizationId: orgId, branchId: srcBranchId, status: 'active' }).lean(),
      Designation.find({ organizationId: orgId, branchId: srcBranchId, status: 'active' }).lean(),
      StaffCategory.find({ organizationId: orgId, branchId: srcBranchId, status: 'active' }).lean(),
      ExpenseCategory.find({ organizationId: orgId, branchId: srcBranchId, status: 'active' }).lean(),
      IncomeCategory.find({ organizationId: orgId, branchId: srcBranchId, status: 'active' }).lean(),
      FeeTypeConfig.find({ organizationId: orgId, branchId: srcBranchId }).lean(),
    ]);

    res.json({
      success: true,
      data: { classes, academicYears, departments, designations, staffCategories, expenseCategories, incomeCategories, feeTypes }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
});

// @desc   Import data from one branch to another
// @route  POST /api/org-templates/import-from-branch
router.post('/import-from-branch', orgAdminOnly, validate(branchImportSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const orgId = await getOrgId(req);
    if (!orgId) return res.status(400).json({ success: false, message: 'Organization ID required' });

    const { sourceBranchId, targetBranchId, classIds, includeSubjects, includeChapters, includeAcademicYears, includeDepartments, includeDesignations, includeStaffCategories, includeExpenseCategories, includeIncomeCategories, includeFeeTypes, divisions } = req.body;

    if (sourceBranchId === targetBranchId) {
      return res.status(400).json({ success: false, message: 'Source and target branches must be different' });
    }

    const srcBranchObjId = new mongoose.Types.ObjectId(sourceBranchId);
    const tgtBranchObjId = new mongoose.Types.ObjectId(targetBranchId);

    const [srcBranch, tgtBranch] = await Promise.all([
      Branch.findOne({ _id: srcBranchObjId, organizationId: orgId }),
      Branch.findOne({ _id: tgtBranchObjId, organizationId: orgId })
    ]);
    if (!srcBranch) return res.status(404).json({ success: false, message: 'Source branch was not found.' });
    if (!tgtBranch) return res.status(404).json({ success: false, message: 'Target branch was not found.' });

    const stats: Record<string, number> = {
      classesCreated: 0, classesSkipped: 0, divisionsCreated: 0,
      subjectsCreated: 0, subjectsSkipped: 0, chaptersCreated: 0,
      academicYearsCreated: 0, academicYearsSkipped: 0,
      departmentsCreated: 0, departmentsSkipped: 0,
      designationsCreated: 0, designationsSkipped: 0,
      staffCategoriesCreated: 0, staffCategoriesSkipped: 0,
      expenseCategoriesCreated: 0, expenseCategoriesSkipped: 0,
      incomeCategoriesCreated: 0, incomeCategoriesSkipped: 0,
      feeTypesCreated: 0, feeTypesSkipped: 0,
    };

    const classIdMap: Record<string, mongoose.Types.ObjectId> = {};

    // 1. Clone classes
    const srcClasses = await Class.find({
      _id: { $in: classIds.map((id: string) => new mongoose.Types.ObjectId(id)) },
      organizationId: orgId, branchId: srcBranchObjId
    }).lean();

    for (const srcClass of srcClasses) {
      const existing = await Class.findOne({ name: srcClass.name, branchId: tgtBranchObjId, academicYear: srcClass.academicYear });
      if (existing) {
        classIdMap[srcClass._id.toString()] = new mongoose.Types.ObjectId(String(existing._id));
        stats.classesSkipped++;
        continue;
      }
      const newClass = await Class.create({
        name: srcClass.name, description: srcClass.description, academicYear: srcClass.academicYear,
        status: 'active', organizationId: orgId, branchId: tgtBranchObjId
      });
      classIdMap[srcClass._id.toString()] = new mongoose.Types.ObjectId(String(newClass._id));
      stats.classesCreated++;

      const classDivisions = divisions[srcClass._id.toString()] || [];
      for (const div of classDivisions) {
        const divExists = await Division.findOne({ name: div.name, classId: newClass._id, branchId: tgtBranchObjId });
        if (!divExists) {
          await Division.create({
            classId: newClass._id, className: newClass.name, name: div.name,
            capacity: div.capacity || 40, status: 'active', organizationId: orgId, branchId: tgtBranchObjId
          });
          stats.divisionsCreated++;
        }
      }
    }

    // 2. Clone subjects
    if (includeSubjects) {
      const srcClassIds = srcClasses.map(c => c._id);
      const srcSubjects = await Subject.find({
        organizationId: orgId, branchId: srcBranchObjId, classIds: { $in: srcClassIds }
      }).lean();

      const processedSubjectCodes = new Set<string>();
      for (const srcSubj of srcSubjects) {
        if (processedSubjectCodes.has(srcSubj.code)) continue;
        processedSubjectCodes.add(srcSubj.code);

        const existing = await Subject.findOne({ code: srcSubj.code, branchId: tgtBranchObjId });
        if (existing) {
          const newClassIds = (srcSubj.classIds || []).map((cid: any) => classIdMap[cid.toString()]).filter(Boolean);
          if (newClassIds.length > 0) {
            await Subject.updateOne({ _id: existing._id }, { $addToSet: { classIds: { $each: newClassIds } } });
          }
          stats.subjectsSkipped++;
          continue;
        }

        const branchClassIds = (srcSubj.classIds || []).map((cid: any) => classIdMap[cid.toString()]).filter(Boolean);
        const newSubject = await Subject.create({
          name: srcSubj.name, code: srcSubj.code, classIds: branchClassIds,
          maxMark: srcSubj.maxMark, passMark: srcSubj.passMark, isOptional: srcSubj.isOptional,
          status: 'active', organizationId: orgId, branchId: tgtBranchObjId
        });
        stats.subjectsCreated++;

        if (includeChapters) {
          try {
            const Chapter = mongoose.model('Chapter');
            for (const srcClassId of srcSubj.classIds || []) {
              const tgtClassId = classIdMap[srcClassId.toString()];
              if (!tgtClassId) continue;
              const srcChapters = await Chapter.find({
                subjectId: srcSubj._id, classId: srcClassId, organizationId: orgId, branchId: srcBranchObjId
              }).lean();
              for (const ch of srcChapters) {
                const chExists = await Chapter.findOne({
                  subjectId: newSubject._id, classId: tgtClassId,
                  chapterNumber: (ch as any).chapterNumber, branchId: tgtBranchObjId
                });
                if (!chExists) {
                  await Chapter.create({
                    subjectId: newSubject._id, classId: tgtClassId,
                    name: (ch as any).name, chapterNumber: (ch as any).chapterNumber, description: (ch as any).description,
                    status: 'active', organizationId: orgId, branchId: tgtBranchObjId, createdBy: req.user!._id
                  });
                  stats.chaptersCreated++;
                }
              }
            }
          } catch { /* Chapter model may not be registered */ }
        }
      }
    }

    // 3. Clone master data
    if (includeAcademicYears) {
      const srcAYs = await AcademicYear.find({ organizationId: orgId, branchId: srcBranchObjId }).lean();
      for (const ay of srcAYs) {
        const exists = await AcademicYear.findOne({ name: ay.name, branchId: tgtBranchObjId });
        if (exists) { stats.academicYearsSkipped++; continue; }
        await AcademicYear.create({
          name: ay.name, startDate: ay.startDate, endDate: ay.endDate,
          isCurrent: false, status: ay.status, organizationId: orgId, branchId: tgtBranchObjId
        });
        stats.academicYearsCreated++;
      }
    }

    if (includeDepartments) {
      const srcDepts = await Department.find({ organizationId: orgId, branchId: srcBranchObjId, status: 'active' }).lean();
      for (const d of srcDepts) {
        const exists = await Department.findOne({ code: d.code, branchId: tgtBranchObjId });
        if (exists) { stats.departmentsSkipped++; continue; }
        await Department.create({ name: d.name, code: d.code, description: d.description, status: 'active', organizationId: orgId, branchId: tgtBranchObjId });
        stats.departmentsCreated++;
      }
    }

    if (includeDesignations) {
      const srcDesigs = await Designation.find({ organizationId: orgId, branchId: srcBranchObjId, status: 'active' }).lean();
      for (const d of srcDesigs) {
        const exists = await Designation.findOne({ name: d.name, branchId: tgtBranchObjId });
        if (exists) { stats.designationsSkipped++; continue; }
        await Designation.create({ name: d.name, description: d.description, status: 'active', organizationId: orgId, branchId: tgtBranchObjId });
        stats.designationsCreated++;
      }
    }

    if (includeStaffCategories) {
      const srcSCs = await StaffCategory.find({ organizationId: orgId, branchId: srcBranchObjId, status: 'active' }).lean();
      for (const s of srcSCs) {
        const exists = await StaffCategory.findOne({ name: s.name, branchId: tgtBranchObjId });
        if (exists) { stats.staffCategoriesSkipped++; continue; }
        await StaffCategory.create({ name: s.name, description: s.description, status: 'active', organizationId: orgId, branchId: tgtBranchObjId });
        stats.staffCategoriesCreated++;
      }
    }

    if (includeExpenseCategories) {
      const srcECs = await ExpenseCategory.find({ organizationId: orgId, branchId: srcBranchObjId, status: 'active' }).lean();
      for (const e of srcECs) {
        const exists = await ExpenseCategory.findOne({ name: e.name, branchId: tgtBranchObjId });
        if (exists) { stats.expenseCategoriesSkipped++; continue; }
        await ExpenseCategory.create({ name: e.name, description: e.description, status: 'active', organizationId: orgId, branchId: tgtBranchObjId });
        stats.expenseCategoriesCreated++;
      }
    }

    if (includeIncomeCategories) {
      const srcICs = await IncomeCategory.find({ organizationId: orgId, branchId: srcBranchObjId, status: 'active' }).lean();
      for (const i of srcICs) {
        const exists = await IncomeCategory.findOne({ name: i.name, branchId: tgtBranchObjId });
        if (exists) { stats.incomeCategoriesSkipped++; continue; }
        await IncomeCategory.create({ name: i.name, description: i.description, status: 'active', organizationId: orgId, branchId: tgtBranchObjId });
        stats.incomeCategoriesCreated++;
      }
    }

    if (includeFeeTypes) {
      const srcFTs = await FeeTypeConfig.find({ organizationId: orgId, branchId: srcBranchObjId }).lean();
      for (const f of srcFTs) {
        const exists = await FeeTypeConfig.findOne({ name: f.name, branchId: tgtBranchObjId });
        if (exists) { stats.feeTypesSkipped++; continue; }
        await FeeTypeConfig.create({ name: f.name, isCommon: f.isCommon, isActive: f.isActive, organizationId: orgId, branchId: tgtBranchObjId });
        stats.feeTypesCreated++;
      }
    }

    const summaryParts: string[] = [];
    if (stats.classesCreated) summaryParts.push(`${stats.classesCreated} classes`);
    if (stats.divisionsCreated) summaryParts.push(`${stats.divisionsCreated} divisions`);
    if (stats.subjectsCreated) summaryParts.push(`${stats.subjectsCreated} subjects`);
    if (stats.chaptersCreated) summaryParts.push(`${stats.chaptersCreated} chapters`);
    if (stats.academicYearsCreated) summaryParts.push(`${stats.academicYearsCreated} academic years`);
    if (stats.departmentsCreated) summaryParts.push(`${stats.departmentsCreated} departments`);
    if (stats.designationsCreated) summaryParts.push(`${stats.designationsCreated} designations`);
    if (stats.staffCategoriesCreated) summaryParts.push(`${stats.staffCategoriesCreated} staff categories`);
    if (stats.expenseCategoriesCreated) summaryParts.push(`${stats.expenseCategoriesCreated} expense categories`);
    if (stats.incomeCategoriesCreated) summaryParts.push(`${stats.incomeCategoriesCreated} income categories`);
    if (stats.feeTypesCreated) summaryParts.push(`${stats.feeTypesCreated} fee types`);

    await ActivityLog.create({
      userId: req.user!._id, userName: req.user!.name, userRole: req.user!.role,
      action: 'IMPORT', module: 'BranchToBranch',
      details: `Imported from branch ${srcBranch.name} to ${tgtBranch.name}: ${summaryParts.join(', ') || 'nothing new'}`,
      ipAddress: req.ip, branchId: tgtBranchObjId
    });

    res.json({ success: true, message: 'Branch-to-branch import completed', data: stats });
  } catch (error) {
    console.error('Branch-to-branch import error:', error);
    res.status(500).json({ success: false, message: 'Something went wrong during import. Please try again.' });
  }
});

export default router;
