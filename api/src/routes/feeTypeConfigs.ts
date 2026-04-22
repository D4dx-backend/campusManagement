import express from 'express';
import { FeeTypeConfig } from '../models/FeeTypeConfig';
import { ActivityLog } from '../models/ActivityLog';
import { authenticate, checkPermission } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { AuthenticatedRequest, ApiResponse } from '../types';
import Joi from 'joi';

import { getOrgBranchFilter, getOrgBranchForCreate } from '../utils/orgFilter';

const router = express.Router();
router.use(authenticate);

const feeTypeConfigSchema = Joi.object({
  name: Joi.string().required().trim().min(2).max(100),
  isCommon: Joi.boolean().optional().default(false),
  isActive: Joi.boolean().optional(),
  branchId: Joi.string().optional().allow('', null)
});

// GET /api/fee-type-configs
router.get('/', checkPermission('fees', 'read'), async (req: AuthenticatedRequest, res) => {
  try {
    const query: any = {};

    Object.assign(query, getOrgBranchFilter(req));

    if (req.query.isActive !== undefined) {
      query.isActive = req.query.isActive === 'true';
    }

    const feeTypes = await FeeTypeConfig.find(query).sort({ name: 1 }).lean();

    const response: ApiResponse = {
      success: true,
      message: 'Fee type configurations retrieved successfully',
      data: feeTypes
    };
    res.json(response);
  } catch (error: any) {
    console.error('Error fetching fee type configs:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch fee type configurations' });
  }
});

// POST /api/fee-type-configs
router.post('/', checkPermission('fees', 'create'), validate(feeTypeConfigSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const orgBranch = getOrgBranchForCreate(req);
    const branchId = ['platform_admin', 'org_admin'].includes(req.user!.role)
      ? req.body.branchId || null
      : req.user!.branchId;

    if (!branchId) {
      return res.status(400).json({ success: false, message: 'Branch ID is required. Please specify a branch.' });
    }

    const existing = await FeeTypeConfig.findOne({ name: req.body.name, branchId });
    if (existing) {
      return res.status(400).json({ success: false, message: 'A fee type with this name already exists' });
    }

    const feeType = await FeeTypeConfig.create({ ...req.body, organizationId: orgBranch.organizationId, branchId });

    await ActivityLog.create({
      userId: req.user!._id,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: 'CREATE',
      module: 'FeeTypeConfig',
      details: `Created fee type: ${feeType.name}`,
      ipAddress: req.ip,
      branchId
    });

    const response: ApiResponse = { success: true, message: 'Fee type created successfully', data: feeType };
    res.status(201).json(response);
  } catch (error: any) {
    console.error('Error creating fee type config:', error);
    res.status(500).json({ success: false, message: 'Failed to create fee type' });
  }
});

// PUT /api/fee-type-configs/:id
router.put('/:id', checkPermission('fees', 'update'), validate(feeTypeConfigSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const query: any = { _id: id };
    Object.assign(query, getOrgBranchFilter(req));

    const feeType = await FeeTypeConfig.findOneAndUpdate(query, req.body, { new: true, runValidators: true });

    if (!feeType) {
      return res.status(404).json({ success: false, message: 'Fee type was not found.' });
    }

    await ActivityLog.create({
      userId: req.user!._id,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: 'UPDATE',
      module: 'FeeTypeConfig',
      details: `Updated fee type: ${feeType.name}`,
      ipAddress: req.ip,
      organizationId: req.user!.organizationId,
      branchId: req.user!.branchId
    });

    const response: ApiResponse = { success: true, message: 'Fee type updated successfully', data: feeType };
    res.json(response);
  } catch (error: any) {
    console.error('Error updating fee type config:', error);
    res.status(500).json({ success: false, message: 'Failed to update fee type' });
  }
});

// DELETE /api/fee-type-configs/:id
router.delete('/:id', checkPermission('fees', 'delete'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const query: any = { _id: id };
    Object.assign(query, getOrgBranchFilter(req));

    const feeType = await FeeTypeConfig.findOneAndDelete(query);

    if (!feeType) {
      return res.status(404).json({ success: false, message: 'Fee type was not found.' });
    }

    await ActivityLog.create({
      userId: req.user!._id,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: 'DELETE',
      module: 'FeeTypeConfig',
      details: `Deleted fee type: ${feeType.name}`,
      ipAddress: req.ip,
      organizationId: req.user!.organizationId,
      branchId: req.user!.branchId
    });

    const response: ApiResponse = { success: true, message: 'Fee type deleted successfully' };
    res.json(response);
  } catch (error: any) {
    console.error('Error deleting fee type config:', error);
    res.status(500).json({ success: false, message: 'Failed to delete fee type' });
  }
});

export default router;
