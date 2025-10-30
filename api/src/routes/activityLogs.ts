import express from 'express';
import { ActivityLog } from '../models/ActivityLog';
import { authenticate, checkPermission } from '../middleware/auth';
import { validateQuery } from '../middleware/validation';
import { AuthenticatedRequest, ApiResponse, QueryParams } from '../types';
import Joi from 'joi';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// Validation schemas
const queryActivityLogsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().optional().allow(''),
  userId: Joi.string().optional().allow(''),
  userRole: Joi.string().valid('super_admin', 'branch_admin', 'accountant', 'teacher', 'staff').optional(),
  module: Joi.string().optional().allow(''),
  action: Joi.string().optional().allow(''),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
  sortBy: Joi.string().valid('timestamp', 'userName', 'module', 'action').default('timestamp'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc')
});

// @desc    Get all activity logs
// @route   GET /api/activity-logs
// @access  Private
router.get('/', checkPermission('activity_logs', 'read'), validateQuery(queryActivityLogsSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      userId = '',
      userRole = '',
      module = '',
      action = '',
      startDate,
      endDate,
      sortBy = 'timestamp',
      sortOrder = 'desc'
    } = req.query as QueryParams;

    // Build filter object
    const filter: any = {};

    // Branch filter (non-super admins can only see their branch logs)
    if (req.user!.role !== 'super_admin') {
      filter.branchId = req.user!.branchId;
    }

    if (search) {
      filter.$or = [
        { userName: { $regex: search, $options: 'i' } },
        { module: { $regex: search, $options: 'i' } },
        { action: { $regex: search, $options: 'i' } },
        { details: { $regex: search, $options: 'i' } }
      ];
    }

    if (userId) filter.userId = userId;
    if (userRole) filter.userRole = userRole;
    if (module) filter.module = { $regex: module, $options: 'i' };
    if (action) filter.action = { $regex: action, $options: 'i' };

    if (startDate && endDate) {
      filter.timestamp = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string)
      };
    } else if (startDate) {
      filter.timestamp = { $gte: new Date(startDate as string) };
    } else if (endDate) {
      filter.timestamp = { $lte: new Date(endDate as string) };
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    const sortOptions: any = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query
    const [logs, total] = await Promise.all([
      ActivityLog.find(filter)
        .populate('userId', 'name email')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean(),
      ActivityLog.countDocuments(filter)
    ]);

    const response: ApiResponse = {
      success: true,
      message: 'Activity logs retrieved successfully',
      data: logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Get activity logs error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error retrieving activity logs'
    };
    res.status(500).json(response);
  }
});

// @desc    Get activity log by ID
// @route   GET /api/activity-logs/:id
// @access  Private
router.get('/:id', checkPermission('activity_logs', 'read'), async (req: AuthenticatedRequest, res) => {
  try {
    const filter: any = { _id: req.params.id };

    // Branch filter for non-super admins
    if (req.user!.role !== 'super_admin') {
      filter.branchId = req.user!.branchId;
    }

    const log = await ActivityLog.findOne(filter)
      .populate('userId', 'name email mobile role')
      .populate('branchId', 'name code');

    if (!log) {
      const response: ApiResponse = {
        success: false,
        message: 'Activity log not found'
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse = {
      success: true,
      message: 'Activity log retrieved successfully',
      data: log
    };

    res.json(response);
  } catch (error) {
    console.error('Get activity log error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error retrieving activity log'
    };
    res.status(500).json(response);
  }
});

// @desc    Get activity log statistics
// @route   GET /api/activity-logs/stats/overview
// @access  Private
router.get('/stats/overview', checkPermission('activity_logs', 'read'), async (req: AuthenticatedRequest, res) => {
  try {
    const filter: any = {};

    // Branch filter for non-super admins
    if (req.user!.role !== 'super_admin') {
      filter.branchId = req.user!.branchId;
    }

    const currentDate = new Date();
    const startOfDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
    const startOfWeek = new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

    const [
      totalLogs,
      todayLogs,
      weekLogs,
      monthLogs,
      moduleStats,
      actionStats,
      userRoleStats,
      recentActivity
    ] = await Promise.all([
      ActivityLog.countDocuments(filter),
      ActivityLog.countDocuments({ ...filter, timestamp: { $gte: startOfDay } }),
      ActivityLog.countDocuments({ ...filter, timestamp: { $gte: startOfWeek } }),
      ActivityLog.countDocuments({ ...filter, timestamp: { $gte: startOfMonth } }),
      ActivityLog.aggregate([
        { $match: filter },
        { $group: { _id: '$module', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      ActivityLog.aggregate([
        { $match: filter },
        { $group: { _id: '$action', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      ActivityLog.aggregate([
        { $match: filter },
        { $group: { _id: '$userRole', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      ActivityLog.find(filter)
        .sort({ timestamp: -1 })
        .limit(10)
        .select('userName userRole module action details timestamp')
        .lean()
    ]);

    const response: ApiResponse = {
      success: true,
      message: 'Activity log statistics retrieved successfully',
      data: {
        totalLogs,
        todayLogs,
        weekLogs,
        monthLogs,
        moduleStats,
        actionStats,
        userRoleStats,
        recentActivity
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Get activity log stats error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error retrieving activity log statistics'
    };
    res.status(500).json(response);
  }
});

// @desc    Get user activity logs
// @route   GET /api/activity-logs/user/:userId
// @access  Private
router.get('/user/:userId', checkPermission('activity_logs', 'read'), validateQuery(queryActivityLogsSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const { userId } = req.params;
    const {
      page = 1,
      limit = 20,
      module = '',
      action = '',
      startDate,
      endDate,
      sortBy = 'timestamp',
      sortOrder = 'desc'
    } = req.query as QueryParams;

    // Build filter object
    const filter: any = { userId };

    // Branch filter for non-super admins
    if (req.user!.role !== 'super_admin') {
      filter.branchId = req.user!.branchId;
    }

    if (module) filter.module = { $regex: module, $options: 'i' };
    if (action) filter.action = { $regex: action, $options: 'i' };

    if (startDate && endDate) {
      filter.timestamp = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string)
      };
    } else if (startDate) {
      filter.timestamp = { $gte: new Date(startDate as string) };
    } else if (endDate) {
      filter.timestamp = { $lte: new Date(endDate as string) };
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    const sortOptions: any = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query
    const [logs, total] = await Promise.all([
      ActivityLog.find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean(),
      ActivityLog.countDocuments(filter)
    ]);

    const response: ApiResponse = {
      success: true,
      message: 'User activity logs retrieved successfully',
      data: logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Get user activity logs error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error retrieving user activity logs'
    };
    res.status(500).json(response);
  }
});

// @desc    Delete old activity logs (cleanup)
// @route   DELETE /api/activity-logs/cleanup
// @access  Private (Super Admin only)
router.delete('/cleanup', checkPermission('activity_logs', 'delete'), async (req: AuthenticatedRequest, res) => {
  try {
    // Only super admin can perform cleanup
    if (req.user!.role !== 'super_admin') {
      const response: ApiResponse = {
        success: false,
        message: 'Only super admin can perform log cleanup'
      };
      return res.status(403).json(response);
    }

    const { days = 90 } = req.query;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - Number(days));

    const result = await ActivityLog.deleteMany({
      timestamp: { $lt: cutoffDate }
    });

    // Log the cleanup activity
    await ActivityLog.create({
      userId: req.user!._id,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: 'CLEANUP',
      module: 'ActivityLogs',
      details: `Cleaned up ${result.deletedCount} activity logs older than ${days} days`,
      ipAddress: req.ip
    });

    const response: ApiResponse = {
      success: true,
      message: `Successfully deleted ${result.deletedCount} old activity logs`,
      data: {
        deletedCount: result.deletedCount,
        cutoffDate,
        daysOld: Number(days)
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Cleanup activity logs error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error during log cleanup'
    };
    res.status(500).json(response);
  }
});

export default router;