import express from 'express';
import { ExpenseCategory } from '../models/ExpenseCategory';
import { ActivityLog } from '../models/ActivityLog';
import { authenticate, checkPermission } from '../middleware/auth';
import { validate, validateQuery } from '../middleware/validation';
import { AuthenticatedRequest, ApiResponse, QueryParams } from '../types';
import Joi from 'joi';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// Validation schemas
const createExpenseCategorySchema = Joi.object({
  name: Joi.string().required().trim(),
  description: Joi.string().optional().allow('').trim(),
  status: Joi.string().valid('active', 'inactive').default('active')
});

const updateExpenseCategorySchema = Joi.object({
  name: Joi.string().optional().trim(),
  description: Joi.string().optional().allow('').trim(),
  status: Joi.string().valid('active', 'inactive').optional()
});

const queryExpenseCategoriesSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().optional().allow(''),
  status: Joi.string().valid('active', 'inactive').optional(),
  sortBy: Joi.string().valid('name', 'createdAt').default('name'),
  sortOrder: Joi.string().valid('asc', 'desc').default('asc')
});

// @desc    Get all expense categories
// @route   GET /api/expense-categories
// @access  Private
router.get('/', checkPermission('expenses', 'read'), validateQuery(queryExpenseCategoriesSchema), async (req: AuthenticatedRequest, res) => {
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
      ExpenseCategory.find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit),
      ExpenseCategory.countDocuments(filter)
    ]);

    const response: ApiResponse = {
      success: true,
      message: 'Expense categories retrieved successfully',
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
    console.error('Get expense categories error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error retrieving expense categories'
    };
    res.status(500).json(response);
  }
});

// @desc    Create new expense category
// @route   POST /api/expense-categories
// @access  Private
router.post('/', checkPermission('expenses', 'create'), validate(createExpenseCategorySchema), async (req: AuthenticatedRequest, res) => {
  try {
    // Get the appropriate branchId
    const { getRequiredBranchId } = require('../utils/branchHelper');
    let branchId;
    
    try {
      branchId = await getRequiredBranchId(req, req.body.branchId);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        message: error.message || 'Branch information is required for expense category creation'
      };
      return res.status(400).json(response);
    }

    // Check if category name already exists for the same branch
    const existingCategory = await ExpenseCategory.findOne({
      name: req.body.name,
      branchId: branchId
    });

    if (existingCategory) {
      const response: ApiResponse = {
        success: false,
        message: 'Expense category with this name already exists'
      };
      return res.status(400).json(response);
    }

    // Create category with branch ID
    const categoryData = {
      ...req.body,
      branchId: branchId
    };

    const newCategory = new ExpenseCategory(categoryData);
    await newCategory.save();

    // Log activity
    await ActivityLog.create({
      userId: req.user!._id,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: 'CREATE',
      module: 'ExpenseCategories',
      details: `Created expense category: ${newCategory.name}`,
      ipAddress: req.ip,
      branchId: newCategory.branchId
    });

    const response: ApiResponse = {
      success: true,
      message: 'Expense category created successfully',
      data: newCategory
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Create expense category error:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    const response: ApiResponse = {
      success: false,
      message: error.message || 'Server error creating expense category'
    };
    res.status(500).json(response);
  }
});

// @desc    Update expense category
// @route   PUT /api/expense-categories/:id
// @access  Private
router.put('/:id', checkPermission('expenses', 'update'), validate(updateExpenseCategorySchema), async (req: AuthenticatedRequest, res) => {
  try {
    const filter: any = { _id: req.params.id };

    // Branch filter for non-super admins
    if (req.user!.role !== 'super_admin') {
      filter.branchId = req.user!.branchId;
    }

    const updatedCategory = await ExpenseCategory.findOneAndUpdate(
      filter,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedCategory) {
      const response: ApiResponse = {
        success: false,
        message: 'Expense category not found'
      };
      return res.status(404).json(response);
    }

    // Log activity
    await ActivityLog.create({
      userId: req.user!._id,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: 'UPDATE',
      module: 'ExpenseCategories',
      details: `Updated expense category: ${updatedCategory.name}`,
      ipAddress: req.ip,
      branchId: updatedCategory.branchId
    });

    const response: ApiResponse = {
      success: true,
      message: 'Expense category updated successfully',
      data: updatedCategory
    };

    res.json(response);
  } catch (error) {
    console.error('Update expense category error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error updating expense category'
    };
    res.status(500).json(response);
  }
});

// @desc    Delete expense category
// @route   DELETE /api/expense-categories/:id
// @access  Private
router.delete('/:id', checkPermission('expenses', 'delete'), async (req: AuthenticatedRequest, res) => {
  try {
    const filter: any = { _id: req.params.id };

    // Branch filter for non-super admins
    if (req.user!.role !== 'super_admin') {
      filter.branchId = req.user!.branchId;
    }

    const deletedCategory = await ExpenseCategory.findOneAndDelete(filter);

    if (!deletedCategory) {
      const response: ApiResponse = {
        success: false,
        message: 'Expense category not found'
      };
      return res.status(404).json(response);
    }

    // Log activity
    await ActivityLog.create({
      userId: req.user!._id,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: 'DELETE',
      module: 'ExpenseCategories',
      details: `Deleted expense category: ${deletedCategory.name}`,
      ipAddress: req.ip,
      branchId: deletedCategory.branchId
    });

    const response: ApiResponse = {
      success: true,
      message: 'Expense category deleted successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Delete expense category error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error deleting expense category'
    };
    res.status(500).json(response);
  }
});

export default router;