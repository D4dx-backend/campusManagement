import express from 'express';
import { FeeStructure } from '../models/FeeStructure';
import { FeeTypeConfig } from '../models/FeeTypeConfig';
import { ActivityLog } from '../models/ActivityLog';
import { authenticate, checkPermission } from '../middleware/auth';
import { validate, validateQuery } from '../middleware/validation';
import { AuthenticatedRequest, ApiResponse } from '../types';
import Joi from 'joi';

import { getOrgBranchFilter, getOrgBranchForCreate } from '../utils/orgFilter';

const router = express.Router();
router.use(authenticate);

const createFeeStructureSchema = Joi.object({
  title: Joi.string().required().trim().min(2).max(100),
  feeTypeId: Joi.string().required(),
  feeTypeName: Joi.string().required().trim(),
  isCommon: Joi.boolean().optional().default(false),
  classId: Joi.string().optional().allow('', null),
  className: Joi.string().optional().trim().allow('', null),
  amount: Joi.number().min(0).required(),
  staffDiscountPercent: Joi.number().min(0).max(100).optional(),
  transportDistanceGroup: Joi.string().valid('group1', 'group2', 'group3', 'group4').optional(),
  distanceRange: Joi.string().optional().trim().allow('', null),
  isActive: Joi.boolean().optional(),
  academicYear: Joi.string().required().trim(),
  branchId: Joi.string().optional().allow('', null)
});

const querySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(50),
  search: Joi.string().allow('').optional(),
  feeTypeId: Joi.string().optional(),
  classId: Joi.string().optional(),
  isActive: Joi.boolean().optional(),
  branchId: Joi.string().optional()
});

// GET /api/fee-structures
router.get(
  '/',
  checkPermission('fees', 'read'),
  validateQuery(querySchema),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { page = 1, limit = 50, search = '', feeTypeId, classId, isActive, branchId } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const query: any = {};

      Object.assign(query, getOrgBranchFilter(req));

      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { feeTypeName: { $regex: search, $options: 'i' } },
          { className: { $regex: search, $options: 'i' } }
        ];
      }

      if (feeTypeId) query.feeTypeId = feeTypeId;
      if (classId) query.classId = classId;
      if (isActive !== undefined) query.isActive = isActive;

      const [feeStructures, total] = await Promise.all([
        FeeStructure.find(query)
          .populate('classId', 'name')
          .populate('branchId', 'name')
          .populate('feeTypeId', 'name isCommon')
          .sort({ feeTypeName: 1, className: 1 })
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
      res.status(500).json({ success: false, message: 'Failed to fetch fee structures', error: error.message });
    }
  }
);

// GET /api/fee-structures/by-class/:classId
router.get(
  '/by-class/:classId',
  checkPermission('fees', 'read'),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { classId } = req.params;
      const { academicYear } = req.query;

      const branchFilter: any = {};
      Object.assign(branchFilter, getOrgBranchFilter(req));

      const baseQuery: any = { isActive: true, ...branchFilter };
      if (academicYear) baseQuery.academicYear = academicYear;

      // Fetch class-specific fee structures + common fee structures (isCommon = true)
      const [classSpecific, commonFees] = await Promise.all([
        FeeStructure.find({ ...baseQuery, classId, isCommon: false })
          .populate('classId', 'name')
          .populate('feeTypeId', 'name isCommon')
          .sort({ feeTypeName: 1, transportDistanceGroup: 1 })
          .lean(),
        FeeStructure.find({ ...baseQuery, isCommon: true })
          .populate('feeTypeId', 'name isCommon')
          .sort({ feeTypeName: 1 })
          .lean()
      ]);

      const feeStructures = [...commonFees, ...classSpecific];

      // Group by feeTypeName for easier frontend consumption
      const groupedFees: Record<string, any[]> = {};
      feeStructures.forEach((fee: any) => {
        const key = fee.feeTypeName || 'other';
        if (!groupedFees[key]) groupedFees[key] = [];
        groupedFees[key].push(fee);
      });

      res.json({
        success: true,
        data: { feeStructures, groupedFees }
      });
    } catch (error: any) {
      console.error('Error fetching fee structures by class:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch fee structures', error: error.message });
    }
  }
);

// POST /api/fee-structures
router.post(
  '/',
  checkPermission('fees', 'create'),
  validate(createFeeStructureSchema),
  async (req: AuthenticatedRequest, res) => {
    try {
      // Verify feeTypeId exists
      const feeTypeConfig = await FeeTypeConfig.findById(req.body.feeTypeId);
      if (!feeTypeConfig) {
        return res.status(400).json({ success: false, message: 'Invalid fee type' });
      }

      const feeStructureData = {
        ...req.body,
        feeTypeName: feeTypeConfig.name,
        isCommon: feeTypeConfig.isCommon,
        branchId: ['platform_admin', 'org_admin'].includes(req.user!.role) && req.body.branchId
          ? req.body.branchId
          : req.user!.branchId,
        organizationId: req.user!.organizationId
      };

      const feeStructure = new FeeStructure(feeStructureData);
      await feeStructure.save();

      await ActivityLog.create({
        userId: req.user!._id,
        userName: req.user!.name,
        userRole: req.user!.role,
        action: 'CREATE',
        module: 'FeeStructure',
        details: `Created fee structure: ${feeStructure.title} (${feeStructure.feeTypeName})`,
        ipAddress: req.ip,
        organizationId: req.user!.organizationId,
        branchId: req.user!.branchId
      });

      res.status(201).json({ success: true, message: 'Fee structure created successfully', data: feeStructure });
    } catch (error: any) {
      console.error('Error creating fee structure:', error);
      res.status(500).json({ success: false, message: 'Failed to create fee structure', error: error.message });
    }
  }
);

// PUT /api/fee-structures/:id
router.put(
  '/:id',
  checkPermission('fees', 'update'),
  validate(createFeeStructureSchema),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;

      // Verify feeTypeId exists
      const feeTypeConfig = await FeeTypeConfig.findById(req.body.feeTypeId);
      if (!feeTypeConfig) {
        return res.status(400).json({ success: false, message: 'Invalid fee type' });
      }

      const updateData = {
        ...req.body,
        feeTypeName: feeTypeConfig.name,
        isCommon: feeTypeConfig.isCommon
      };

      const query: any = { _id: id };
      Object.assign(query, getOrgBranchFilter(req));

      const feeStructure = await FeeStructure.findOneAndUpdate(query, updateData, {
        new: true,
        runValidators: true
      });

      if (!feeStructure) {
        return res.status(404).json({ success: false, message: 'Fee structure not found' });
      }

      await ActivityLog.create({
        userId: req.user!._id,
        userName: req.user!.name,
        userRole: req.user!.role,
        action: 'UPDATE',
        module: 'FeeStructure',
        details: `Updated fee structure: ${feeStructure.title}`,
        ipAddress: req.ip,
        organizationId: req.user!.organizationId,
        branchId: req.user!.branchId
      });

      res.json({ success: true, message: 'Fee structure updated successfully', data: feeStructure });
    } catch (error: any) {
      console.error('Error updating fee structure:', error);
      res.status(500).json({ success: false, message: 'Failed to update fee structure', error: error.message });
    }
  }
);

// DELETE /api/fee-structures/:id
router.delete(
  '/:id',
  checkPermission('fees', 'delete'),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const query: any = { _id: id };
      Object.assign(query, getOrgBranchFilter(req));

      const feeStructure = await FeeStructure.findOneAndDelete(query);

      if (!feeStructure) {
        return res.status(404).json({ success: false, message: 'Fee structure not found' });
      }

      await ActivityLog.create({
        userId: req.user!._id,
        userName: req.user!.name,
        userRole: req.user!.role,
        action: 'DELETE',
        module: 'FeeStructure',
        details: `Deleted fee structure: ${feeStructure.title}`,
        ipAddress: req.ip,
        organizationId: req.user!.organizationId,
        branchId: req.user!.branchId
      });

      res.json({ success: true, message: 'Fee structure deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting fee structure:', error);
      res.status(500).json({ success: false, message: 'Failed to delete fee structure', error: error.message });
    }
  }
);

export default router;
