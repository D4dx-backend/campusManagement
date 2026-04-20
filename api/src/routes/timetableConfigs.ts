import express from 'express';
import { TimetableConfig } from '../models/TimetableConfig';
import { Timetable } from '../models/Timetable';
import { ActivityLog } from '../models/ActivityLog';
import { authenticate, checkPermission } from '../middleware/auth';
import { validate, validateQuery } from '../middleware/validation';
import { AuthenticatedRequest, ApiResponse, QueryParams } from '../types';
import {
  createTimetableConfigSchema,
  updateTimetableConfigSchema,
  queryTimetableConfigSchema,
} from '../validations/timetable';
import { getOrgBranchFilter, getOrgBranchForCreate } from '../utils/orgFilter';

const router = express.Router();

router.use(authenticate);

// @desc    Get all timetable configs
// @route   GET /api/timetable-configs
router.get(
  '/',
  checkPermission('timetable', 'read'),
  validateQuery(queryTimetableConfigSchema),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { page = 1, limit = 10, search = '', academicYearId = '', status = '' } = req.query as QueryParams;

      const filter: any = {};
      Object.assign(filter, getOrgBranchFilter(req));

      if (search) {
        filter.name = { $regex: search, $options: 'i' };
      }
      if (academicYearId) filter.academicYearId = academicYearId;
      if (status) filter.status = status;

      const skip = (page - 1) * limit;

      const [configs, total] = await Promise.all([
        TimetableConfig.find(filter)
          .populate('academicYearId', 'name startDate endDate')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        TimetableConfig.countDocuments(filter),
      ]);

      const response: ApiResponse = {
        success: true,
        message: 'Timetable configs retrieved successfully',
        data: configs,
        pagination: { page, limit, total, pages: (limit > 0 ? Math.ceil(total / limit) : 1) },
      };
      res.json(response);
    } catch (error) {
      console.error('Get timetable configs error:', error);
      res.status(500).json({ success: false, message: 'Something went wrong while loading timetable configs. Please try again.' });
    }
  }
);

// @desc    Get single timetable config
// @route   GET /api/timetable-configs/:id
router.get('/:id', checkPermission('timetable', 'read'), async (req: AuthenticatedRequest, res) => {
  try {
    const filter: any = { _id: req.params.id };
    Object.assign(filter, getOrgBranchFilter(req));

    const config = await TimetableConfig.findOne(filter)
      .populate('academicYearId', 'name startDate endDate')
      .lean();

    if (!config) {
      return res.status(404).json({ success: false, message: 'Timetable configuration was not found.' });
    }

    res.json({ success: true, message: 'Timetable config retrieved successfully', data: config });
  } catch (error) {
    console.error('Get timetable config error:', error);
    res.status(500).json({ success: false, message: 'Something went wrong while loading timetable config. Please try again.' });
  }
});

// @desc    Create timetable config
// @route   POST /api/timetable-configs
router.post(
  '/',
  checkPermission('timetable', 'create'),
  validate(createTimetableConfigSchema),
  async (req: AuthenticatedRequest, res) => {
    try {
      const orgBranch = getOrgBranchForCreate(req);

      if (!orgBranch.branchId) {
        return res.status(400).json({ success: false, message: 'Branch information is missing. Please select a branch.' });
      }

      const configData = {
        name: req.body.name,
        academicYearId: req.body.academicYearId,
        workingDays: req.body.workingDays,
        daySchedules: req.body.daySchedules,
        status: req.body.status,
        organizationId: orgBranch.organizationId,
        branchId: orgBranch.branchId,
      };

      const newConfig = new TimetableConfig(configData);
      await newConfig.save();

      await ActivityLog.create({
        userId: req.user!._id,
        userName: req.user!.name,
        userRole: req.user!.role,
        action: 'CREATE',
        module: 'Timetable',
        details: `Created timetable config: ${newConfig.name}`,
        ipAddress: req.ip,
        branchId: newConfig.branchId,
      });

      res.status(201).json({ success: true, message: 'Timetable config created successfully', data: newConfig });
    } catch (error: any) {
      console.error('Create timetable config error:', error);
      if (error.code === 11000) {
        return res
          .status(400)
          .json({ success: false, message: 'A timetable config with this name already exists for this academic year' });
      }
      res.status(500).json({ success: false, message: 'Something went wrong while creating the timetable config. Please try again.' });
    }
  }
);

// @desc    Update timetable config
// @route   PUT /api/timetable-configs/:id
router.put(
  '/:id',
  checkPermission('timetable', 'update'),
  validate(updateTimetableConfigSchema),
  async (req: AuthenticatedRequest, res) => {
    try {
      const filter: any = { _id: req.params.id };
      Object.assign(filter, getOrgBranchFilter(req));

      const updatedConfig = await TimetableConfig.findOneAndUpdate(filter, req.body, {
        new: true,
        runValidators: true,
      });

      if (!updatedConfig) {
        return res.status(404).json({ success: false, message: 'Timetable configuration was not found.' });
      }

      await ActivityLog.create({
        userId: req.user!._id,
        userName: req.user!.name,
        userRole: req.user!.role,
        action: 'UPDATE',
        module: 'Timetable',
        details: `Updated timetable config: ${updatedConfig.name}`,
        ipAddress: req.ip,
        branchId: updatedConfig.branchId,
      });

      res.json({ success: true, message: 'Timetable config updated successfully', data: updatedConfig });
    } catch (error: any) {
      console.error('Update timetable config error:', error);
      if (error.code === 11000) {
        return res
          .status(400)
          .json({ success: false, message: 'A timetable config with this name already exists for this academic year' });
      }
      res.status(500).json({ success: false, message: 'Something went wrong while updating the timetable config. Please try again.' });
    }
  }
);

// @desc    Delete timetable config
// @route   DELETE /api/timetable-configs/:id
router.delete('/:id', checkPermission('timetable', 'delete'), async (req: AuthenticatedRequest, res) => {
  try {
    const filter: any = { _id: req.params.id };
    Object.assign(filter, getOrgBranchFilter(req));

    // Check if any timetables reference this config
    const usageCount = await Timetable.countDocuments({ configId: req.params.id });
    if (usageCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete config: ${usageCount} timetable(s) are using it. Delete or reassign them first.`,
      });
    }

    const deletedConfig = await TimetableConfig.findOneAndDelete(filter);
    if (!deletedConfig) {
      return res.status(404).json({ success: false, message: 'Timetable configuration was not found.' });
    }

    await ActivityLog.create({
      userId: req.user!._id,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: 'DELETE',
      module: 'Timetable',
      details: `Deleted timetable config: ${deletedConfig.name}`,
      ipAddress: req.ip,
      branchId: deletedConfig.branchId,
    });

    res.json({ success: true, message: 'Timetable config deleted successfully' });
  } catch (error) {
    console.error('Delete timetable config error:', error);
    res.status(500).json({ success: false, message: 'Something went wrong while deleting the timetable config. Please try again.' });
  }
});

export default router;
