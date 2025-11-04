import express from 'express';
import { Designation } from '../models/Designation';
import { ActivityLog } from '../models/ActivityLog';
import { authenticate, checkPermission } from '../middleware/auth';
import { validate, validateQuery } from '../middleware/validation';
import { AuthenticatedRequest, ApiResponse, QueryParams } from '../types';
import Joi from 'joi';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// Validation schemas
const createDesignationSchema = Joi.object({
  name: Joi.string().required().trim(),
  description: Joi.string().optional().allow('').trim(),
  status: Joi.string().valid('active', 'inactive').default('active'),
  branchId: Joi.string().required() // branchId is required
});

const updateDesignationSchema = Joi.object({
  name: Joi.string().optional().trim(),
  description: Joi.string().optional().allow('').trim(),
  status: Joi.string().valid('active', 'inactive').optional(),
  branchId: Joi.string().optional() // Allow branchId for super admins
});

const queryDesignationsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().optional().allow(''),
  status: Joi.string().valid('active', 'inactive').optional(),
  sortBy: Joi.string().valid('name', 'createdAt').default('name'),
  sortOrder: Joi.string().valid('asc', 'desc').default('asc')
});

// @desc    Get all designations
// @route   GET /api/designations
// @access  Private
router.get('/', checkPermission('staff', 'read'), validateQuery(queryDesignationsSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      status = '',
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query as QueryParams;

    // Build filter object
    const filter: any = {};

    // Branch filter (non-super admins can only see their branch data)
    if (req.user!.role !== 'super_admin') {
      filter.branchId = req.user!.branchId;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (status) filter.status = status;

    // Calculate pagination
    const skip = (page - 1) * limit;
    const sortOptions: any = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query
    const [designations, total] = await Promise.all([
      Designation.find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit),
      Designation.countDocuments(filter)
    ]);

    const response: ApiResponse = {
      success: true,
      message: 'Designations retrieved successfully',
      data: designations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Get designations error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error retrieving designations'
    };
    res.status(500).json(response);
  }
});

// @desc    Create new designation
// @route   POST /api/designations
// @access  Private
router.post('/', checkPermission('staff', 'create'), validate(createDesignationSchema), async (req: AuthenticatedRequest, res) => {
  try {
    // Debug logging
    console.log('Create designation request body:', req.body);
    console.log('User info:', { id: req.user!._id, role: req.user!.role, branchId: req.user!.branchId });
    
    // Check if designation name already exists for the same branch
    const existingDesignation = await Designation.findOne({
      name: req.body.name,
      branchId: req.user!.branchId || req.body.branchId
    });

    if (existingDesignation) {
      console.log('❌ Designation already exists:', existingDesignation.name);
      const response: ApiResponse = {
        success: false,
        message: 'Designation with this name already exists'
      };
      return res.status(400).json(response);
    }

    // Create designation with branch ID
    const branchId = req.user!.branchId || req.body.branchId;
    
    if (!branchId) {
      const response: ApiResponse = {
        success: false,
        message: 'Branch ID is required to create designation'
      };
      return res.status(400).json(response);
    }
    
    const designationData = {
      ...req.body,
      branchId: branchId
    };

    const newDesignation = new Designation(designationData);
    await newDesignation.save();

    // Log activity
    await ActivityLog.create({
      userId: req.user!._id,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: 'CREATE',
      module: 'Designations',
      details: `Created designation: ${newDesignation.name}`,
      ipAddress: req.ip,
      branchId: newDesignation.branchId
    });

    const response: ApiResponse = {
      success: true,
      message: 'Designation created successfully',
      data: newDesignation
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Create designation error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error creating designation'
    };
    res.status(500).json(response);
  }
});

// @desc    Update designation
// @route   PUT /api/designations/:id
// @access  Private
router.put('/:id', checkPermission('staff', 'update'), validate(updateDesignationSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const filter: any = { _id: req.params.id };

    // Branch filter for non-super admins
    if (req.user!.role !== 'super_admin') {
      filter.branchId = req.user!.branchId;
    }

    const updatedDesignation = await Designation.findOneAndUpdate(
      filter,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedDesignation) {
      const response: ApiResponse = {
        success: false,
        message: 'Designation not found'
      };
      return res.status(404).json(response);
    }

    // Log activity
    await ActivityLog.create({
      userId: req.user!._id,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: 'UPDATE',
      module: 'Designations',
      details: `Updated designation: ${updatedDesignation.name}`,
      ipAddress: req.ip,
      branchId: updatedDesignation.branchId
    });

    const response: ApiResponse = {
      success: true,
      message: 'Designation updated successfully',
      data: updatedDesignation
    };

    res.json(response);
  } catch (error) {
    console.error('Update designation error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error updating designation'
    };
    res.status(500).json(response);
  }
});

// @desc    Delete designation
// @route   DELETE /api/designations/:id
// @access  Private
router.delete('/:id', checkPermission('staff', 'delete'), async (req: AuthenticatedRequest, res) => {
  try {
    const filter: any = { _id: req.params.id };

    // Branch filter for non-super admins
    if (req.user!.role !== 'super_admin') {
      filter.branchId = req.user!.branchId;
    }

    const deletedDesignation = await Designation.findOneAndDelete(filter);

    if (!deletedDesignation) {
      const response: ApiResponse = {
        success: false,
        message: 'Designation not found'
      };
      return res.status(404).json(response);
    }

    // Log activity
    await ActivityLog.create({
      userId: req.user!._id,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: 'DELETE',
      module: 'Designations',
      details: `Deleted designation: ${deletedDesignation.name}`,
      ipAddress: req.ip,
      branchId: deletedDesignation.branchId
    });

    const response: ApiResponse = {
      success: true,
      message: 'Designation deleted successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Delete designation error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error deleting designation'
    };
    res.status(500).json(response);
  }
});

export default router;