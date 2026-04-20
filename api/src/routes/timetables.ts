import express from 'express';
import mongoose from 'mongoose';
import { Timetable } from '../models/Timetable';
import { TimetableConfig } from '../models/TimetableConfig';
import { Student } from '../models/Student';
import { Staff } from '../models/Staff';
import { ActivityLog } from '../models/ActivityLog';
import { authenticate, checkPermission } from '../middleware/auth';
import { validate, validateQuery } from '../middleware/validation';
import { AuthenticatedRequest, ApiResponse, QueryParams } from '../types';
import {
  createTimetableSchema,
  updateTimetableSchema,
  cloneTimetableSchema,
  checkConflictsSchema,
  queryTimetableSchema,
  autoGenerateSchema,
} from '../validations/timetable';
import { getOrgBranchFilter, getOrgBranchForCreate } from '../utils/orgFilter';
import { getGeminiClient, isGeminiEnabled } from '../config/gemini';

const router = express.Router();

router.use(authenticate);

// ── Helper: detect teacher conflicts ──
async function detectTeacherConflicts(
  entries: Array<{ dayOfWeek: number; slotNumber: number; staffId: string; staffName: string }>,
  configId: string,
  academicYearId: string,
  branchId: string | mongoose.Types.ObjectId,
  excludeTimetableId?: string
) {
  // Get the config so we can map slotNumber → time
  const config = await TimetableConfig.findById(configId).lean();
  if (!config) return [];

  // Build a time lookup: dayOfWeek → slotNumber → { startTime, endTime }
  const timeLookup: Record<string, { startTime: string; endTime: string }> = {};
  for (const day of config.daySchedules) {
    for (const slot of day.slots) {
      timeLookup[`${day.dayOfWeek}-${slot.slotNumber}`] = {
        startTime: slot.startTime,
        endTime: slot.endTime,
      };
    }
  }

  // Gather unique staffIds from entries
  const staffIds = [...new Set(entries.map((e) => e.staffId))];
  if (staffIds.length === 0) return [];

  // Find all other active timetables in this branch+academicYear that reference any of these staff
  const otherFilter: any = {
    branchId,
    academicYearId,
    status: 'active',
    'entries.staffId': { $in: staffIds.map((id) => new mongoose.Types.ObjectId(id)) },
  };
  if (excludeTimetableId) {
    otherFilter._id = { $ne: new mongoose.Types.ObjectId(excludeTimetableId) };
  }

  const otherTimetables = await Timetable.find(otherFilter)
    .populate('classId', 'name')
    .populate('divisionId', 'name')
    .populate('configId')
    .lean();

  const conflicts: Array<{
    staffId: string;
    staffName: string;
    dayOfWeek: number;
    slotNumber: number;
    time: string;
    conflictWith: { timetableId: string; className: string; divisionName: string };
  }> = [];

  for (const entry of entries) {
    const key = `${entry.dayOfWeek}-${entry.slotNumber}`;
    const timeInfo = timeLookup[key];
    if (!timeInfo) continue;

    for (const other of otherTimetables) {
      const otherConfig = other.configId as any;
      if (!otherConfig?.daySchedules) continue;

      // Find matching slot times in the other timetable's config
      const otherDay = otherConfig.daySchedules.find((d: any) => d.dayOfWeek === entry.dayOfWeek);
      if (!otherDay) continue;

      for (const otherEntry of other.entries) {
        if (otherEntry.staffId.toString() !== entry.staffId) continue;
        if (otherEntry.dayOfWeek !== entry.dayOfWeek) continue;

        const otherSlot = otherDay.slots.find((s: any) => s.slotNumber === otherEntry.slotNumber);
        if (!otherSlot) continue;

        // Check time overlap
        if (timeInfo.startTime < otherSlot.endTime && timeInfo.endTime > otherSlot.startTime) {
          conflicts.push({
            staffId: entry.staffId,
            staffName: entry.staffName,
            dayOfWeek: entry.dayOfWeek,
            slotNumber: entry.slotNumber,
            time: `${timeInfo.startTime}-${timeInfo.endTime}`,
            conflictWith: {
              timetableId: (other._id as any).toString(),
              className: (other.classId as any)?.name || '',
              divisionName: (other.divisionId as any)?.name || '',
            },
          });
        }
      }
    }
  }

  return conflicts;
}

// @desc    Get all timetables
// @route   GET /api/timetables
router.get(
  '/',
  checkPermission('timetable', 'read'),
  validateQuery(queryTimetableSchema),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { page = 1, limit = 10, classId = '', divisionId = '', academicYearId = '', status = '' } = req.query as QueryParams;

      const filter: any = {};
      Object.assign(filter, getOrgBranchFilter(req));

      if (classId) filter.classId = classId;
      if (divisionId) filter.divisionId = divisionId;
      if (academicYearId) filter.academicYearId = academicYearId;
      if (status) filter.status = status;

      const skip = (page - 1) * limit;

      const [timetables, total] = await Promise.all([
        Timetable.find(filter)
          .populate('classId', 'name')
          .populate('divisionId', 'name className')
          .populate('academicYearId', 'name')
          .populate('configId', 'name')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Timetable.countDocuments(filter),
      ]);

      const response: ApiResponse = {
        success: true,
        message: 'Timetables retrieved successfully',
        data: timetables,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      };
      res.json(response);
    } catch (error) {
      console.error('Get timetables error:', error);
      res.status(500).json({ success: false, message: 'Something went wrong while loading timetables. Please try again.' });
    }
  }
);

// @desc    Get active timetable for a class+division
// @route   GET /api/timetables/by-class/:classId/:divisionId
router.get(
  '/by-class/:classId/:divisionId',
  checkPermission('timetable', 'read'),
  async (req: AuthenticatedRequest, res) => {
    try {
      const filter: any = {
        classId: req.params.classId,
        divisionId: req.params.divisionId,
        status: 'active',
      };
      Object.assign(filter, getOrgBranchFilter(req));

      const timetable = await Timetable.findOne(filter)
        .populate('classId', 'name')
        .populate('divisionId', 'name className')
        .populate('academicYearId', 'name')
        .populate('configId')
        .lean();

      if (!timetable) {
        return res.status(404).json({ success: false, message: 'No active timetable found for this class/division' });
      }

      res.json({ success: true, message: 'Timetable retrieved successfully', data: timetable });
    } catch (error) {
      console.error('Get timetable by class error:', error);
      res.status(500).json({ success: false, message: 'Something went wrong while loading timetable. Please try again.' });
    }
  }
);

// @desc    Get teacher's own schedule (all timetables with full config for grid rendering)
// @route   GET /api/timetables/my-schedule
router.get('/my-schedule', async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user || !['teacher', 'staff'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Only teachers can access this endpoint' });
    }

    // Find the staff record by matching email within the same branch
    const staff = await Staff.findOne({
      email: req.user.email,
      branchId: req.user.branchId,
      status: 'active',
    }).lean() as any;

    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff profile not found. Ensure your email matches your staff record.' });
    }

    const filter: any = {
      status: 'active',
      'entries.staffId': staff._id,
      branchId: req.user.branchId,
    };
    if (req.user.organizationId) filter.organizationId = req.user.organizationId;

    const timetables = await Timetable.find(filter)
      .populate('classId', 'name')
      .populate('divisionId', 'name className')
      .populate('academicYearId', 'name')
      .populate('configId')
      .lean();

    // Return full timetable objects (with config) so the frontend can render grids
    // Also build a flat schedule for the day-view
    const flatSchedule = timetables.flatMap((tt: any) =>
      tt.entries
        .filter((e: any) => e.staffId.toString() === staff._id.toString())
        .map((e: any) => ({
          ...e,
          timetableId: tt._id,
          className: tt.classId?.name || '',
          divisionName: tt.divisionId?.name || '',
          academicYear: tt.academicYearId?.name || '',
          config: tt.configId,
        }))
    );

    res.json({
      success: true,
      message: 'Schedule retrieved successfully',
      data: {
        staffId: staff._id,
        staffName: staff.name,
        timetables,
        schedule: flatSchedule,
      },
    });
  } catch (error) {
    console.error('Get my schedule error:', error);
    res.status(500).json({ success: false, message: 'Something went wrong while loading your schedule. Please try again.' });
  }
});

// @desc    Get student's own timetable
// @route   GET /api/timetables/my-timetable
router.get('/my-timetable', async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.studentId) {
      return res.status(403).json({ success: false, message: 'Only students can access this endpoint' });
    }

    const student = await Student.findById(req.user.studentId).lean();
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile was not found.' });
    }

    const filter: any = {
      classId: student.classId,
      status: 'active',
    };
    // Try with section (divisionId) if available
    if (student.section) {
      // section stores the division name; we need to find by classId + division
      const DivisionModel = mongoose.model('Division');
      const division = await DivisionModel.findOne({
        classId: student.classId,
        name: student.section,
        branchId: student.branchId,
      }).lean() as any;
      if (division) {
        filter.divisionId = division._id;
      }
    }

    Object.assign(filter, { branchId: student.branchId, organizationId: student.organizationId });

    const timetable = await Timetable.findOne(filter)
      .populate('classId', 'name')
      .populate('divisionId', 'name className')
      .populate('academicYearId', 'name')
      .populate('configId')
      .lean();

    if (!timetable) {
      return res.status(404).json({ success: false, message: 'No active timetable found for your class' });
    }

    res.json({ success: true, message: 'Timetable retrieved successfully', data: timetable });
  } catch (error) {
    console.error('Get my timetable error:', error);
    res.status(500).json({ success: false, message: 'Something went wrong while loading your timetable. Please try again.' });
  }
});

// @desc    Get teacher schedule across all classes
// @route   GET /api/timetables/staff/:staffId
router.get('/staff/:staffId', checkPermission('timetable', 'read'), async (req: AuthenticatedRequest, res) => {
  try {
    const filter: any = {
      status: 'active',
      'entries.staffId': new mongoose.Types.ObjectId(req.params.staffId),
    };
    Object.assign(filter, getOrgBranchFilter(req));

    const timetables = await Timetable.find(filter)
      .populate('classId', 'name')
      .populate('divisionId', 'name className')
      .populate('academicYearId', 'name')
      .populate('configId')
      .lean();

    // Flatten to just the entries for this staff member, enriched with class/division info
    const schedule = timetables.flatMap((tt) =>
      tt.entries
        .filter((e: any) => e.staffId.toString() === req.params.staffId)
        .map((e: any) => ({
          ...e,
          className: (tt.classId as any)?.name,
          divisionName: (tt.divisionId as any)?.name,
          academicYear: (tt.academicYearId as any)?.name,
          config: tt.configId,
        }))
    );

    res.json({ success: true, message: 'Staff schedule retrieved successfully', data: schedule });
  } catch (error) {
    console.error('Get staff schedule error:', error);
    res.status(500).json({ success: false, message: 'Something went wrong while loading staff schedule. Please try again.' });
  }
});

// @desc    Check teacher conflicts
// @route   POST /api/timetables/check-conflicts
router.post(
  '/check-conflicts',
  checkPermission('timetable', 'read'),
  validate(checkConflictsSchema),
  async (req: AuthenticatedRequest, res) => {
    try {
      const orgBranch = getOrgBranchFilter(req);
      const conflicts = await detectTeacherConflicts(
        req.body.entries,
        req.body.configId,
        req.body.academicYearId,
        orgBranch.branchId || req.user!.branchId!,
        req.body.excludeTimetableId
      );

      res.json({
        success: true,
        message: conflicts.length > 0 ? `${conflicts.length} conflict(s) detected` : 'No conflicts',
        data: { hasConflicts: conflicts.length > 0, conflicts },
      });
    } catch (error) {
      console.error('Check conflicts error:', error);
      res.status(500).json({ success: false, message: 'Something went wrong while checking conflicts. Please try again.' });
    }
  }
);

// @desc    Get single timetable
// @route   GET /api/timetables/:id
router.get('/:id', checkPermission('timetable', 'read'), async (req: AuthenticatedRequest, res) => {
  try {
    const filter: any = { _id: req.params.id };
    Object.assign(filter, getOrgBranchFilter(req));

    const timetable = await Timetable.findOne(filter)
      .populate('classId', 'name')
      .populate('divisionId', 'name className')
      .populate('academicYearId', 'name')
      .populate('configId')
      .lean();

    if (!timetable) {
      return res.status(404).json({ success: false, message: 'Timetable was not found.' });
    }

    res.json({ success: true, message: 'Timetable retrieved successfully', data: timetable });
  } catch (error) {
    console.error('Get timetable error:', error);
    res.status(500).json({ success: false, message: 'Something went wrong while loading timetable. Please try again.' });
  }
});

// @desc    Create timetable
// @route   POST /api/timetables
router.post(
  '/',
  checkPermission('timetable', 'create'),
  validate(createTimetableSchema),
  async (req: AuthenticatedRequest, res) => {
    try {
      const orgBranch = getOrgBranchForCreate(req);
      if (!orgBranch.branchId) {
        return res.status(400).json({ success: false, message: 'Branch information is missing. Please select a branch.' });
      }

      const timetableData = {
        classId: req.body.classId,
        divisionId: req.body.divisionId,
        academicYearId: req.body.academicYearId,
        configId: req.body.configId,
        entries: req.body.entries || [],
        effectiveFrom: req.body.effectiveFrom,
        status: req.body.status || 'draft',
        organizationId: orgBranch.organizationId,
        branchId: orgBranch.branchId,
      };

      const newTimetable = new Timetable(timetableData);
      await newTimetable.save();

      await ActivityLog.create({
        userId: req.user!._id,
        userName: req.user!.name,
        userRole: req.user!.role,
        action: 'CREATE',
        module: 'Timetable',
        details: `Created timetable for class/division`,
        ipAddress: req.ip,
        branchId: orgBranch.branchId,
      });

      res.status(201).json({ success: true, message: 'Timetable created successfully', data: newTimetable });
    } catch (error) {
      console.error('Create timetable error:', error);
      res.status(500).json({ success: false, message: 'Something went wrong while creating the timetable. Please try again.' });
    }
  }
);

// @desc    Update timetable (entries, effectiveFrom)
// @route   PUT /api/timetables/:id
router.put(
  '/:id',
  checkPermission('timetable', 'update'),
  validate(updateTimetableSchema),
  async (req: AuthenticatedRequest, res) => {
    try {
      const filter: any = { _id: req.params.id };
      Object.assign(filter, getOrgBranchFilter(req));

      const existing = await Timetable.findOne(filter);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Timetable was not found.' });
      }

      if (existing.status === 'archived') {
        return res.status(400).json({ success: false, message: 'Cannot edit an archived timetable' });
      }

      const updatedTimetable = await Timetable.findOneAndUpdate(filter, req.body, {
        new: true,
        runValidators: true,
      });

      await ActivityLog.create({
        userId: req.user!._id,
        userName: req.user!.name,
        userRole: req.user!.role,
        action: 'UPDATE',
        module: 'Timetable',
        details: `Updated timetable entries`,
        ipAddress: req.ip,
        branchId: existing.branchId,
      });

      res.json({ success: true, message: 'Timetable updated successfully', data: updatedTimetable });
    } catch (error) {
      console.error('Update timetable error:', error);
      res.status(500).json({ success: false, message: 'Something went wrong while updating the timetable. Please try again.' });
    }
  }
);

// @desc    Activate timetable (archives previous active one; blocked if conflicts)
// @route   PUT /api/timetables/:id/activate
router.put('/:id/activate', checkPermission('timetable', 'update'), async (req: AuthenticatedRequest, res) => {
  try {
    const filter: any = { _id: req.params.id };
    Object.assign(filter, getOrgBranchFilter(req));

    const timetable = await Timetable.findOne(filter);
    if (!timetable) {
      return res.status(404).json({ success: false, message: 'Timetable was not found.' });
    }

    if (timetable.status === 'active') {
      return res.status(400).json({ success: false, message: 'Timetable is already active' });
    }
    if (timetable.status === 'archived') {
      return res.status(400).json({ success: false, message: 'Cannot activate an archived timetable' });
    }

    // Check for teacher conflicts before activation
    if (timetable.entries.length > 0) {
      const conflicts = await detectTeacherConflicts(
        timetable.entries.map((e: any) => ({
          dayOfWeek: e.dayOfWeek,
          slotNumber: e.slotNumber,
          staffId: e.staffId.toString(),
          staffName: e.staffName,
        })),
        timetable.configId.toString(),
        timetable.academicYearId.toString(),
        timetable.branchId,
        timetable._id.toString()
      );

      if (conflicts.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot activate: ${conflicts.length} teacher conflict(s) detected. Resolve them first.`,
          data: { conflicts },
        });
      }
    }

    // Archive the currently active timetable for this class+division+academicYear
    await Timetable.updateMany(
      {
        classId: timetable.classId,
        divisionId: timetable.divisionId,
        academicYearId: timetable.academicYearId,
        status: 'active',
        _id: { $ne: timetable._id },
      },
      { status: 'archived' }
    );

    timetable.status = 'active';
    await timetable.save();

    await ActivityLog.create({
      userId: req.user!._id,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: 'UPDATE',
      module: 'Timetable',
      details: `Activated timetable`,
      ipAddress: req.ip,
      branchId: timetable.branchId,
    });

    res.json({ success: true, message: 'Timetable activated successfully', data: timetable });
  } catch (error) {
    console.error('Activate timetable error:', error);
    res.status(500).json({ success: false, message: 'Something went wrong while activating the timetable. Please try again.' });
  }
});

// @desc    Clone timetable to another class+division
// @route   POST /api/timetables/:id/clone
router.post(
  '/:id/clone',
  checkPermission('timetable', 'create'),
  validate(cloneTimetableSchema),
  async (req: AuthenticatedRequest, res) => {
    try {
      const filter: any = { _id: req.params.id };
      Object.assign(filter, getOrgBranchFilter(req));

      const source = await Timetable.findOne(filter).lean();
      if (!source) {
        return res.status(404).json({ success: false, message: 'Source timetable was not found.' });
      }

      const cloned = new Timetable({
        classId: req.body.targetClassId,
        divisionId: req.body.targetDivisionId,
        academicYearId: source.academicYearId,
        configId: source.configId,
        entries: source.entries.map((e: any) => ({
          dayOfWeek: e.dayOfWeek,
          slotNumber: e.slotNumber,
          subjectId: e.subjectId,
          subjectName: e.subjectName,
          staffId: e.staffId,
          staffName: e.staffName,
        })),
        status: 'draft',
        clonedFrom: source._id,
        organizationId: source.organizationId,
        branchId: source.branchId,
      });

      await cloned.save();

      await ActivityLog.create({
        userId: req.user!._id,
        userName: req.user!.name,
        userRole: req.user!.role,
        action: 'CREATE',
        module: 'Timetable',
        details: `Cloned timetable from ${source._id}`,
        ipAddress: req.ip,
        branchId: source.branchId,
      });

      res.status(201).json({ success: true, message: 'Timetable cloned successfully (draft)', data: cloned });
    } catch (error) {
      console.error('Clone timetable error:', error);
      res.status(500).json({ success: false, message: 'Something went wrong while cloning the timetable. Please try again.' });
    }
  }
);

// @desc    Delete timetable (draft only)
// @route   DELETE /api/timetables/:id
router.delete('/:id', checkPermission('timetable', 'delete'), async (req: AuthenticatedRequest, res) => {
  try {
    const filter: any = { _id: req.params.id };
    Object.assign(filter, getOrgBranchFilter(req));

    const timetable = await Timetable.findOne(filter);
    if (!timetable) {
      return res.status(404).json({ success: false, message: 'Timetable was not found.' });
    }

    if (timetable.status === 'active') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete an active timetable. Archive it first or create a new one.',
      });
    }

    await Timetable.findByIdAndDelete(timetable._id);

    await ActivityLog.create({
      userId: req.user!._id,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: 'DELETE',
      module: 'Timetable',
      details: `Deleted timetable`,
      ipAddress: req.ip,
      branchId: timetable.branchId,
    });

    res.json({ success: true, message: 'Timetable deleted successfully' });
  } catch (error) {
    console.error('Delete timetable error:', error);
    res.status(500).json({ success: false, message: 'Something went wrong while deleting the timetable. Please try again.' });
  }
});

// ── Helper: constraint-based timetable generation ──
interface SubjectTeacherMapping {
  subjectId: string;
  subjectName: string;
  staffId: string;
  staffName: string;
  periodsPerWeek: number;
}

interface GeneratedEntry {
  dayOfWeek: number;
  slotNumber: number;
  subjectId: string;
  subjectName: string;
  staffId: string;
  staffName: string;
}

function algorithmicGenerate(
  mappings: SubjectTeacherMapping[],
  daySchedules: Array<{ dayOfWeek: number; slots: Array<{ slotNumber: number; type: string; startTime: string; endTime: string }> }>,
  teacherBusySlots: Map<string, Set<string>> // staffId → Set("dayOfWeek-slotNumber")
): { entries: GeneratedEntry[]; unplaced: Array<{ subjectName: string; staffName: string; remaining: number }> } {
  const entries: GeneratedEntry[] = [];

  // Build available period slots per day (exclude breaks)
  const daySlots: Array<{ dayOfWeek: number; slotNumber: number; startTime: string; endTime: string }> = [];
  for (const ds of daySchedules) {
    for (const slot of ds.slots) {
      if (slot.type === 'period') {
        daySlots.push({ dayOfWeek: ds.dayOfWeek, slotNumber: slot.slotNumber, startTime: slot.startTime, endTime: slot.endTime });
      }
    }
  }

  const totalPeriods = daySlots.length;
  const totalRequested = mappings.reduce((s, m) => s + m.periodsPerWeek, 0);

  // occupied tracks what's already placed in each slot
  const occupied = new Set<string>(); // "dayOfWeek-slotNumber"

  // Track how many periods each subject has been placed on each day (to spread evenly)
  const subjectDayCount: Record<string, Record<number, number>> = {}; // subjectId → { dayOfWeek → count }

  // Sort mappings by periodsPerWeek descending (place hardest constraints first)
  const sortedMappings = [...mappings].sort((a, b) => b.periodsPerWeek - a.periodsPerWeek);

  // Build a pool of { mapping, remaining } work items
  const workItems = sortedMappings.map((m) => ({ ...m, remaining: m.periodsPerWeek }));

  const unplaced: Array<{ subjectName: string; staffName: string; remaining: number }> = [];

  // Round-robin: iterate rounds, placing one period per subject per round
  const maxRounds = Math.max(...workItems.map((w) => w.remaining), 0);

  for (let round = 0; round < maxRounds; round++) {
    for (const item of workItems) {
      if (item.remaining <= 0) continue;

      // Find best available slot for this subject+teacher
      // Preference: days where this subject has fewest placements, and teacher is free
      const dayCounts = subjectDayCount[item.subjectId] || {};

      // Score each available slot
      const candidates = daySlots
        .filter((ds) => {
          const key = `${ds.dayOfWeek}-${ds.slotNumber}`;
          if (occupied.has(key)) return false;
          // Teacher must not be busy (from other timetables)
          const busyKey = `${ds.dayOfWeek}-${ds.startTime}`;
          if (teacherBusySlots.get(item.staffId)?.has(busyKey)) return false;
          return true;
        })
        .map((ds) => ({
          ...ds,
          dayCount: dayCounts[ds.dayOfWeek] || 0,
        }))
        .sort((a, b) => {
          // Prefer days with fewer placements of this subject (spread across week)
          if (a.dayCount !== b.dayCount) return a.dayCount - b.dayCount;
          // Then prefer earlier slots
          return a.slotNumber - b.slotNumber;
        });

      if (candidates.length === 0) {
        // Can't place — will be unplaced
        continue;
      }

      const chosen = candidates[0];
      const key = `${chosen.dayOfWeek}-${chosen.slotNumber}`;
      occupied.add(key);

      // Mark teacher busy at this time for other classes too
      const busySet = teacherBusySlots.get(item.staffId) || new Set();
      busySet.add(`${chosen.dayOfWeek}-${chosen.startTime}`);
      teacherBusySlots.set(item.staffId, busySet);

      // Track day count
      if (!subjectDayCount[item.subjectId]) subjectDayCount[item.subjectId] = {};
      subjectDayCount[item.subjectId][chosen.dayOfWeek] = (subjectDayCount[item.subjectId][chosen.dayOfWeek] || 0) + 1;

      entries.push({
        dayOfWeek: chosen.dayOfWeek,
        slotNumber: chosen.slotNumber,
        subjectId: item.subjectId,
        subjectName: item.subjectName,
        staffId: item.staffId,
        staffName: item.staffName,
      });

      item.remaining--;
    }
  }

  // Collect unplaced
  for (const item of workItems) {
    if (item.remaining > 0) {
      unplaced.push({ subjectName: item.subjectName, staffName: item.staffName, remaining: item.remaining });
    }
  }

  return { entries, unplaced };
}

// ── Helper: Gemini AI generation ──
async function geminiGenerate(
  mappings: SubjectTeacherMapping[],
  daySchedules: Array<{ dayOfWeek: number; slots: Array<{ slotNumber: number; type: string; label: string; startTime: string; endTime: string }> }>,
  teacherBusySlots: Map<string, Set<string>>,
  className: string,
  divisionName: string
): Promise<GeneratedEntry[]> {
  const client = getGeminiClient();
  if (!client) throw new Error('Gemini API not configured');

  const model = client.getGenerativeModel({ model: 'gemini-2.0-flash' });

  // Build the constraint description
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const scheduleDesc = daySchedules.map((ds) => {
    const periods = ds.slots
      .filter((s) => s.type === 'period')
      .map((s) => `Slot ${s.slotNumber}: ${s.startTime}-${s.endTime}`)
      .join(', ');
    return `${dayNames[ds.dayOfWeek]}: ${periods}`;
  }).join('\n');

  const subjectDesc = mappings.map((m) =>
    `- ${m.subjectName} (ID: ${m.subjectId}) — Teacher: ${m.staffName} (ID: ${m.staffId}) — ${m.periodsPerWeek} periods/week`
  ).join('\n');

  // Format busy slots
  const busyDesc: string[] = [];
  for (const [staffId, slots] of teacherBusySlots) {
    const teacher = mappings.find((m) => m.staffId === staffId);
    if (teacher && slots.size > 0) {
      busyDesc.push(`${teacher.staffName}: busy at ${[...slots].join(', ')}`);
    }
  }

  const prompt = `You are a school timetable scheduler. Generate an optimal timetable for ${className} ${divisionName}.

SCHEDULE (period slots available each day):
${scheduleDesc}

SUBJECTS TO SCHEDULE:
${subjectDesc}

TEACHER CONFLICTS (these teachers are already busy at these day-time combinations in OTHER classes — DO NOT assign them at these times):
${busyDesc.length > 0 ? busyDesc.join('\n') : 'None'}

RULES:
1. Each slot can have exactly ONE subject
2. Spread subjects evenly across the week (avoid 2+ consecutive periods of the same subject)
3. Do NOT double-book a teacher at a time when they are already busy
4. Try to place all requested periods. If not possible, place as many as you can
5. Only use slot numbers that exist in the schedule above

Return ONLY a valid JSON array of objects, each with: dayOfWeek (number 0-6), slotNumber (number), subjectId, subjectName, staffId, staffName.
No explanation, no markdown — just the JSON array.`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  // Extract JSON from response (handle markdown code blocks)
  let jsonStr = text;
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (jsonMatch) {
    jsonStr = jsonMatch[0];
  }

  const parsed = JSON.parse(jsonStr) as GeneratedEntry[];

  // Validate the AI output — filter out invalid entries
  const validSlots = new Set<string>();
  for (const ds of daySchedules) {
    for (const slot of ds.slots) {
      if (slot.type === 'period') {
        validSlots.add(`${ds.dayOfWeek}-${slot.slotNumber}`);
      }
    }
  }
  const validSubjectIds = new Set(mappings.map((m) => m.subjectId));
  const validStaffIds = new Set(mappings.map((m) => m.staffId));
  const usedSlots = new Set<string>();

  const validated: GeneratedEntry[] = [];
  for (const entry of parsed) {
    const key = `${entry.dayOfWeek}-${entry.slotNumber}`;
    if (
      validSlots.has(key) &&
      !usedSlots.has(key) &&
      validSubjectIds.has(entry.subjectId) &&
      validStaffIds.has(entry.staffId)
    ) {
      usedSlots.add(key);
      // Re-map names from our mappings to be safe
      const mapping = mappings.find((m) => m.subjectId === entry.subjectId);
      const staffMapping = mappings.find((m) => m.staffId === entry.staffId);
      validated.push({
        dayOfWeek: entry.dayOfWeek,
        slotNumber: entry.slotNumber,
        subjectId: entry.subjectId,
        subjectName: mapping?.subjectName || entry.subjectName,
        staffId: entry.staffId,
        staffName: staffMapping?.staffName || entry.staffName,
      });
    }
  }

  return validated;
}

// @desc    Auto-generate timetable entries
// @route   POST /api/timetables/auto-generate
router.post(
  '/auto-generate',
  checkPermission('timetable', 'create'),
  validate(autoGenerateSchema),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { classId, divisionId, academicYearId, configId, subjectTeacherMappings, useAI } = req.body;
      const orgBranch = getOrgBranchFilter(req);
      const branchId = orgBranch.branchId || req.user!.branchId!;

      // 1. Load the config
      const config = await TimetableConfig.findOne({ _id: configId, ...orgBranch }).lean();
      if (!config) {
        return res.status(404).json({ success: false, message: 'Timetable configuration was not found.' });
      }

      // 2. Build teacher busy-slots from existing active timetables
      const mappings = subjectTeacherMappings as SubjectTeacherMapping[];
      const staffIds: string[] = [...new Set(mappings.map((m) => m.staffId))];
      const existingTimetables = await Timetable.find({
        branchId,
        academicYearId,
        status: 'active',
        'entries.staffId': { $in: staffIds.map((id) => new mongoose.Types.ObjectId(id)) },
      })
        .populate('configId')
        .lean();

      const teacherBusySlots = new Map<string, Set<string>>();
      for (const tt of existingTimetables) {
        // Skip timetable for the same class+division (we're replacing it)
        if (tt.classId.toString() === classId && tt.divisionId.toString() === divisionId) continue;

        const ttConfig = tt.configId as any;
        if (!ttConfig?.daySchedules) continue;

        for (const entry of tt.entries) {
          const sid = entry.staffId.toString();
          if (!staffIds.includes(sid)) continue;

          const daySchedule = ttConfig.daySchedules.find((d: any) => d.dayOfWeek === entry.dayOfWeek);
          if (!daySchedule) continue;
          const slot = daySchedule.slots.find((s: any) => s.slotNumber === entry.slotNumber);
          if (!slot) continue;

          const busySet = teacherBusySlots.get(sid) || new Set<string>();
          busySet.add(`${entry.dayOfWeek}-${slot.startTime}`);
          teacherBusySlots.set(sid, busySet);
        }
      }

      // 3. Generate
      let entries: GeneratedEntry[];
      let unplaced: Array<{ subjectName: string; staffName: string; remaining: number }> = [];
      let method: 'algorithm' | 'ai' = 'algorithm';

      if (useAI && isGeminiEnabled()) {
        try {
          // Get class/division names for better AI context
          const [classDoc, divisionDoc] = await Promise.all([
            mongoose.model('Class').findById(classId).lean(),
            mongoose.model('Division').findById(divisionId).lean(),
          ]);
          const className = (classDoc as any)?.name || 'Class';
          const divisionName = (divisionDoc as any)?.name || 'Division';

          entries = await geminiGenerate(
            mappings,
            config.daySchedules as any,
            teacherBusySlots,
            className,
            divisionName
          );
          method = 'ai';

          // Calculate unplaced for AI too
          const placedCounts: Record<string, number> = {};
          for (const e of entries) {
            placedCounts[e.subjectId] = (placedCounts[e.subjectId] || 0) + 1;
          }
          for (const m of mappings) {
            const placed = placedCounts[m.subjectId] || 0;
            if (placed < m.periodsPerWeek) {
              unplaced.push({ subjectName: m.subjectName, staffName: m.staffName, remaining: m.periodsPerWeek - placed });
            }
          }
        } catch (aiError: any) {
          console.error('Gemini AI generation failed, falling back to algorithm:', aiError.message);
          // Fallback to algorithm
          const result = algorithmicGenerate(mappings, config.daySchedules as any, teacherBusySlots);
          entries = result.entries;
          unplaced = result.unplaced;
          method = 'algorithm';
        }
      } else {
        const result = algorithmicGenerate(mappings, config.daySchedules as any, teacherBusySlots);
        entries = result.entries;
        unplaced = result.unplaced;
      }

      // 4. Create draft timetable
      const timetable = await Timetable.create({
        classId,
        divisionId,
        academicYearId,
        configId,
        entries,
        status: 'draft',
        ...getOrgBranchForCreate(req),
      });

      // 5. Log
      await ActivityLog.create({
        userId: req.user!._id,
        userName: req.user!.name,
        userRole: req.user!.role,
        action: 'CREATE',
        module: 'Timetable',
        details: `Auto-generated timetable (${method}) with ${entries.length} entries`,
        ipAddress: req.ip,
        branchId: timetable.branchId,
      });

      // 6. Populate and return
      const populated = await Timetable.findById(timetable._id)
        .populate('classId', 'name')
        .populate('divisionId', 'name className')
        .populate('academicYearId', 'name')
        .populate('configId')
        .lean();

      res.status(201).json({
        success: true,
        message: unplaced.length > 0
          ? `Timetable generated (${method}) with ${entries.length} entries. ${unplaced.length} subject(s) could not be fully placed.`
          : `Timetable generated successfully (${method}) with ${entries.length} entries.`,
        data: {
          timetable: populated,
          method,
          stats: {
            totalPlaced: entries.length,
            unplaced,
          },
          aiAvailable: isGeminiEnabled(),
        },
      });
    } catch (error) {
      console.error('Auto-generate error:', error);
      res.status(500).json({ success: false, message: 'Something went wrong while auto-generating the timetable. Please try again.' });
    }
  }
);

export default router;
