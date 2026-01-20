import express from 'express';
import { FeeStructure } from '../models/FeeStructure';
import { ActivityLog } from '../models/ActivityLog';
import { authenticate, checkPermission } from '../middleware/auth';
import { validate, validateQuery } from '../middleware/validation';
import { AuthenticatedRequest, ApiResponse } from '../types';
import Joi from 'joi';

const router = express.Router();
router.use(authenticate);

// Validation schemas
const createFeeStructureSchema = Joi.object({
  title: Joi.string().required().trim().min(2).max(100),
  feeType: Joi.string().valid('tuition', 'transport', 'cocurricular', 'maintenance', 'exam', 'textbook', 'other').required(),
  classId: Joi.string().required(),
  className: Joi.string().required().trim(),
  amount: Joi.number().min(0).required(),
  transportDistanceGroup: Joi.string().valid('group1', 'group2', 'group3', 'group4').optional(),
  distanceRange: Joi.string().optional().trim(),
  isActive: Joi.boolean().optional(),
  academicYear: Joi.string().required().trim()
});

const querySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(50),
  search: Joi.string().allow('').optional(),
  feeType: Joi.string().valid('tuition', 'transport', 'cocurricular', 'maintenance', 'exam', 'textbook', 'other').optional(),
  classId: Joi.string().optional(),
  isActive: Joi.boolean().optional(),
  branchId: Joi.string().optional()
});

// GET /api/fee-structures - Get all fee structures
router.get(
  '/',
  checkPermission('fees', 'read'),
  validateQuery(querySchema),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { page = 1, limit = 50, search = '', feeType, classId, isActive, branchId } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      // Build query
      const query: any = {};

      // Branch filter
      if (req.user!.role !== 'super_admin') {
        query.branchId = req.user!.branchId;
      } else if (branchId) {
        // Super admin can filter by specific branch
        query.branchId = branchId;
      }

      // Search filter
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { className: { $regex: search, $options: 'i' } }
        ];
      }

      // Type filters
      if (feeType) query.feeType = feeType;
      if (classId) query.classId = classId;
      if (isActive !== undefined) query.isActive = isActive;

      const [feeStructures, total] = await Promise.all([
        FeeStructure.find(query)
          .populate('classId', 'name')
          .populate('branchId', 'name')
          .sort({ className: 1, feeType: 1 })
          .skip(skip)
          .limit(Number(limit))
          .lean(),
        FeeStructure.countDocuments(query)
      ]);

      res.json({
        success: true,
        data: feeStructures,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error: any) {
      console.error('Error fetching fee structures:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch fee structures',
        error: error.message
      });
    }
  }
);

// GET /api/fee-structures/by-class/:classId - Get fee structures for a specific class
router.get(
  '/by-class/:classId',
  checkPermission('fees', 'read'),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { classId } = req.params;
      const { academicYear, branchId } = req.query;

      const query: any = {
        classId,
        isActive: true
      };

      if (req.user!.role !== 'super_admin') {
        query.branchId = req.user!.branchId;
      } else if (branchId) {
        query.branchId = branchId;
      }

      if (academicYear) {
        query.academicYear = academicYear;
      }

      const feeStructures = await FeeStructure.find(query)
        .populate('classId', 'name')
        .sort({ feeType: 1, transportDistanceGroup: 1 })
        .lean();

      // Group by fee type for easier frontend consumption
      const groupedFees: any = {};
      feeStructures.forEach((fee: any) => {
        if (!groupedFees[fee.feeType]) {
          groupedFees[fee.feeType] = [];
        }
        groupedFees[fee.feeType].push(fee);
      });

      res.json({
        success: true,
        data: {
          feeStructures,
          groupedFees
        }
      });
    } catch (error: any) {
      console.error('Error fetching fee structures by class:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch fee structures',
        error: error.message
      });
    }
  }
);

// POST /api/fee-structures - Create new fee structure
router.post(
  '/',
  checkPermission('fees', 'create'),
  validate(createFeeStructureSchema),
  async (req: AuthenticatedRequest, res) => {
    try {
      const feeStructureData = {
        ...req.body,
        branchId: req.user!.role === 'super_admin' && req.body.branchId 
          ? req.body.branchId 
          : req.user!.branchId
      };

      const feeStructure = new FeeStructure(feeStructureData);
      await feeStructure.save();

      // Log activity
      await ActivityLog.create({
        userId: req.user!._id,
        userName: req.user!.name,
        userRole: req.user!.role,
        action: 'CREATE',
        module: 'FeeStructure',
        details: `Created fee structure: ${feeStructure.title} for ${feeStructure.className}`,
        ipAddress: req.ip,
        branchId: req.user!.branchId
      });

      res.status(201).json({
        success: true,
        message: 'Fee structure created successfully',
        data: feeStructure
      });
    } catch (error: any) {
      console.error('Error creating fee structure:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create fee structure',
        error: error.message
      });
    }
  }
);

// PUT /api/fee-structures/:id - Update fee structure
router.put(
  '/:id',
  checkPermission('fees', 'update'),
  validate(createFeeStructureSchema),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;

      const query: any = { _id: id };
      if (req.user!.role !== 'super_admin') {
        query.branchId = req.user!.branchId;
      }

      const feeStructure = await FeeStructure.findOneAndUpdate(
        query,
        req.body,
        { new: true, runValidators: true }
      );

      if (!feeStructure) {
        return res.status(404).json({
          success: false,
          message: 'Fee structure not found'
        });
      }

      // Log activity
      await ActivityLog.create({
        userId: req.user!._id,
        userName: req.user!.name,
        userRole: req.user!.role,
        action: 'UPDATE',
        module: 'FeeStructure',
        details: `Updated fee structure: ${feeStructure.title}`,
        ipAddress: req.ip,
        branchId: req.user!.branchId
      });

      res.json({
        success: true,
        message: 'Fee structure updated successfully',
        data: feeStructure
      });
    } catch (error: any) {
      console.error('Error updating fee structure:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update fee structure',
        error: error.message
      });
    }
  }
);

// DELETE /api/fee-structures/:id - Delete fee structure
router.delete(
  '/:id',
  checkPermission('fees', 'delete'),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;

      const query: any = { _id: id };
      if (req.user!.role !== 'super_admin') {
        query.branchId = req.user!.branchId;
      }

      const feeStructure = await FeeStructure.findOneAndDelete(query);

      if (!feeStructure) {
        return res.status(404).json({
          success: false,
          message: 'Fee structure not found'
        });
      }

      // Log activity
      await ActivityLog.create({
        userId: req.user!._id,
        userName: req.user!.name,
        userRole: req.user!.role,
        action: 'DELETE',
        module: 'FeeStructure',
        details: `Deleted fee structure: ${feeStructure.title}`,
        ipAddress: req.ip,
        branchId: req.user!.branchId
      });

      res.json({
        success: true,
        message: 'Fee structure deleted successfully'
      });
    } catch (error: any) {
      console.error('Error deleting fee structure:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete fee structure',
        error: error.message
      });
    }
  }
);

export default router;
