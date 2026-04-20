import express from 'express';
import { StaffCategory } from '../models/StaffCategory';
import { Staff } from '../models/Staff';
import { ActivityLog } from '../models/ActivityLog';
import { authenticate, checkPermission } from '../middleware/auth';
import { validate, validateQuery } from '../middleware/validation';
import { AuthenticatedRequest, ApiResponse, QueryParams } from '../types';
import Joi from 'joi';

import { getOrgBranchFilter, getOrgBranchForCreate } from '../utils/orgFilter';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// Validation schemas
const createStaffCategorySchema = Joi.object({
  name: Joi.string().required().trim(),
  description: Joi.string().optional().allow('').trim(),
  status: Joi.string().valid('active', 'inactive').default('active'),
  branchId: Joi.string().required()
});

const updateStaffCategorySchema = Joi.object({
  name: Joi.string().optional().trim(),
  description: Joi.string().optional().allow('').trim(),
  status: Joi.string().valid('active', 'inactive').optional(),
  branchId: Joi.string().optional()
});

const queryStaffCategoriesSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().optional().allow(''),
  status: Joi.string().valid('active', 'inactive').optional(),
  sortBy: Joi.string().valid('name', 'createdAt').default('name'),
  sortOrder: Joi.string().valid('asc', 'desc').default('asc')
});

// @desc    Get all staff categories
// @route   GET /api/staff-categories
// @access  Private
router.get('/', checkPermission('staff', 'read'), validateQuery(queryStaffCategoriesSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      status = '',
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query as QueryParams;

    const filter: any = {};
    Object.assign(filter, getOrgBranchFilter(req));

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (status) filter.status = status;

    const skip = (page - 1) * limit;
    const sortOptions: any = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [categories, total] = await Promise.all([
      StaffCategory.find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit),
      StaffCategory.countDocuments(filter)
    ]);

    const response: ApiResponse = {
      success: true,
      message: 'Staff categories retrieved successfully',
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
    console.error('Get staff categories error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Something went wrong while loading staff categories. Please try again.'
    };
    res.status(500).json(response);
  }
});

// @desc    Create new staff category
// @route   POST /api/staff-categories
// @access  Private
router.post('/', checkPermission('staff', 'create'), validate(createStaffCategorySchema), async (req: AuthenticatedRequest, res) => {
  try {
    const branchId = req.user!.branchId || req.body.branchId;

    if (!branchId) {
      const response: ApiResponse = {
        success: false,
        message: 'Branch ID is required to create staff category'
      };
      return res.status(400).json(response);
    }

    const existing = await StaffCategory.findOne({
      name: req.body.name,
      organizationId: req.user!.organizationId,
      branchId
    });

    if (existing) {
      const response: ApiResponse = {
        success: false,
        message: 'A staff category with this name already exists. Please use a different name.'
      };
      return res.status(400).json(response);
    }

    const categoryData = {
      ...req.body,
      organizationId: req.user!.organizationId,
      branchId
    };

    const newCategory = new StaffCategory(categoryData);
    await newCategory.save();

    await ActivityLog.create({
      userId: req.user!._id,
      action: 'create',
      module: 'staff',
      description: `Created staff category: ${newCategory.name}`,
      targetId: newCategory._id,
      targetModel: 'StaffCategory',
      organizationId: req.user!.organizationId,
      branchId
    });

    const response: ApiResponse = {
      success: true,
      message: 'Staff category created successfully',
      data: newCategory
    };

    res.status(201).json(response);
  } catch (error: any) {
    console.error('Create staff category error:', error);
    if (error.code === 11000) {
      const response: ApiResponse = {
        success: false,
        message: 'A staff category with this name already exists. Please use a different name.'
      };
      return res.status(400).json(response);
    }
    const response: ApiResponse = {
      success: false,
      message: 'Something went wrong while creating the staff category. Please try again.'
    };
    res.status(500).json(response);
  }
});

// @desc    Update staff category
// @route   PUT /api/staff-categories/:id
// @access  Private
router.put('/:id', checkPermission('staff', 'update'), validate(updateStaffCategorySchema), async (req: AuthenticatedRequest, res) => {
  try {
    const filter: any = { _id: req.params.id };
    Object.assign(filter, getOrgBranchFilter(req));

    const category = await StaffCategory.findOne(filter);

    if (!category) {
      const response: ApiResponse = {
        success: false,
        message: 'Staff category was not found.'
      };
      return res.status(404).json(response);
    }

    const oldName = category.name;

    Object.assign(category, req.body);
    await category.save();

    // If name changed, update all staff records with the old category name
    if (req.body.name && req.body.name !== oldName) {
      await Staff.updateMany(
        { category: oldName, ...getOrgBranchFilter(req) },
        { $set: { category: req.body.name } }
      );
    }

    await ActivityLog.create({
      userId: req.user!._id,
      action: 'update',
      module: 'staff',
      description: `Updated staff category: ${category.name}`,
      targetId: category._id,
      targetModel: 'StaffCategory',
      organizationId: req.user!.organizationId,
      branchId: req.user!.branchId
    });

    const response: ApiResponse = {
      success: true,
      message: 'Staff category updated successfully',
      data: category
    };

    res.json(response);
  } catch (error: any) {
    console.error('Update staff category error:', error);
    if (error.code === 11000) {
      const response: ApiResponse = {
        success: false,
        message: 'A staff category with this name already exists. Please use a different name.'
      };
      return res.status(400).json(response);
    }
    const response: ApiResponse = {
      success: false,
      message: 'Something went wrong while updating the staff category. Please try again.'
    };
    res.status(500).json(response);
  }
});

// @desc    Delete staff category
// @route   DELETE /api/staff-categories/:id
// @access  Private
router.delete('/:id', checkPermission('staff', 'delete'), async (req: AuthenticatedRequest, res) => {
  try {
    const filter: any = { _id: req.params.id };
    Object.assign(filter, getOrgBranchFilter(req));

    const category = await StaffCategory.findOne(filter);

    if (!category) {
      const response: ApiResponse = {
        success: false,
        message: 'Staff category was not found.'
      };
      return res.status(404).json(response);
    }

    // Check if any staff members use this category
    const staffCount = await Staff.countDocuments({
      category: category.name,
      ...getOrgBranchFilter(req)
    });

    if (staffCount > 0) {
      const response: ApiResponse = {
        success: false,
        message: `Cannot delete: ${staffCount} staff member(s) are using this category`
      };
      return res.status(400).json(response);
    }

    await StaffCategory.findByIdAndDelete(req.params.id);

    await ActivityLog.create({
      userId: req.user!._id,
      action: 'delete',
      module: 'staff',
      description: `Deleted staff category: ${category.name}`,
      targetId: category._id,
      targetModel: 'StaffCategory',
      organizationId: req.user!.organizationId,
      branchId: req.user!.branchId
    });

    const response: ApiResponse = {
      success: true,
      message: 'Staff category deleted successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Delete staff category error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Something went wrong while deleting the staff category. Please try again.'
    };
    res.status(500).json(response);
  }
});

export default router;
