import express from 'express';
import { IncomeCategory } from '../models/IncomeCategory';
import { ActivityLog } from '../models/ActivityLog';
import { authenticate, checkPermission } from '../middleware/auth';
import { validate, validateQuery } from '../middleware/validation';
import { AuthenticatedRequest, ApiResponse, QueryParams } from '../types';
import Joi from 'joi';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// Validation schemas
const createIncomeCategorySchema = Joi.object({
  name: Joi.string().required().trim(),
  description: Joi.string().optional().allow('').trim(),
  status: Joi.string().valid('active', 'inactive').default('active')
});

const updateIncomeCategorySchema = Joi.object({
  name: Joi.string().optional().trim(),
  description: Joi.string().optional().allow('').trim(),
  status: Joi.string().valid('active', 'inactive').optional()
});

const queryIncomeCategoriesSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().optional().allow(''),
  status: Joi.string().valid('active', 'inactive').optional(),
  sortBy: Joi.string().valid('name', 'createdAt').default('name'),
  sortOrder: Joi.string().valid('asc', 'desc').default('asc')
});

// @desc    Get all income categories
// @route   GET /api/income-categories
// @access  Private
router.get('/', checkPermission('fees', 'read'), validateQuery(queryIncomeCategoriesSchema), async (req: AuthenticatedRequest, res) => {
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
    const [categories, total] = await Promise.all([
      IncomeCategory.find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit),
      IncomeCategory.countDocuments(filter)
    ]);

    const response: ApiResponse = {
      success: true,
      message: 'Income categories retrieved successfully',
      data: categories,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Get income categories error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error retrieving income categories'
    };
    res.status(500).json(response);
  }
});

// @desc    Create new income category
// @route   POST /api/income-categories
// @access  Private
router.post('/', checkPermission('fees', 'create'), validate(createIncomeCategorySchema), async (req: AuthenticatedRequest, res) => {
  try {
    // Get the appropriate branchId
    const { getRequiredBranchId } = require('../utils/branchHelper');
    let branchId;
    
    try {
      branchId = await getRequiredBranchId(req, req.body.branchId);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        message: error.message || 'Branch information is required for income category creation'
      };
      return res.status(400).json(response);
    }

    // Check if category name already exists for the same branch
    const existingCategory = await IncomeCategory.findOne({
      name: req.body.name,
      branchId: branchId
    });

    if (existingCategory) {
      const response: ApiResponse = {
        success: false,
        message: 'Income category with this name already exists'
      };
      return res.status(400).json(response);
    }

    // Create category with branch ID
    const categoryData = {
      ...req.body,
      branchId: branchId
    };

    const newCategory = new IncomeCategory(categoryData);
    await newCategory.save();

    // Log activity
    await ActivityLog.create({
      userId: req.user!._id,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: 'CREATE',
      module: 'IncomeCategories',
      details: `Created income category: ${newCategory.name}`,
      ipAddress: req.ip,
      branchId: newCategory.branchId
    });

    const response: ApiResponse = {
      success: true,
      message: 'Income category created successfully',
      data: newCategory
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Create income category error:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    const response: ApiResponse = {
      success: false,
      message: error.message || 'Server error creating income category'
    };
    res.status(500).json(response);
  }
});

// @desc    Update income category
// @route   PUT /api/income-categories/:id
// @access  Private
router.put('/:id', checkPermission('fees', 'update'), validate(updateIncomeCategorySchema), async (req: AuthenticatedRequest, res) => {
  try {
    const filter: any = { _id: req.params.id };

    // Branch filter for non-super admins
    if (req.user!.role !== 'super_admin') {
      filter.branchId = req.user!.branchId;
    }

    const updatedCategory = await IncomeCategory.findOneAndUpdate(
      filter,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedCategory) {
      const response: ApiResponse = {
        success: false,
        message: 'Income category not found'
      };
      return res.status(404).json(response);
    }

    // Log activity
    await ActivityLog.create({
      userId: req.user!._id,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: 'UPDATE',
      module: 'IncomeCategories',
      details: `Updated income category: ${updatedCategory.name}`,
      ipAddress: req.ip,
      branchId: updatedCategory.branchId
    });

    const response: ApiResponse = {
      success: true,
      message: 'Income category updated successfully',
      data: updatedCategory
    };

    res.json(response);
  } catch (error) {
    console.error('Update income category error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error updating income category'
    };
    res.status(500).json(response);
  }
});

// @desc    Delete income category
// @route   DELETE /api/income-categories/:id
// @access  Private
router.delete('/:id', checkPermission('fees', 'delete'), async (req: AuthenticatedRequest, res) => {
  try {
    const filter: any = { _id: req.params.id };

    // Branch filter for non-super admins
    if (req.user!.role !== 'super_admin') {
      filter.branchId = req.user!.branchId;
    }

    const deletedCategory = await IncomeCategory.findOneAndDelete(filter);

    if (!deletedCategory) {
      const response: ApiResponse = {
        success: false,
        message: 'Income category not found'
      };
      return res.status(404).json(response);
    }

    // Log activity
    await ActivityLog.create({
      userId: req.user!._id,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: 'DELETE',
      module: 'IncomeCategories',
      details: `Deleted income category: ${deletedCategory.name}`,
      ipAddress: req.ip,
      branchId: deletedCategory.branchId
    });

    const response: ApiResponse = {
      success: true,
      message: 'Income category deleted successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Delete income category error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error deleting income category'
    };
    res.status(500).json(response);
  }
});

export default router;