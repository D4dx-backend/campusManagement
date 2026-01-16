import express from 'express';
import { Expense } from '../models/Expense';
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
const createExpenseSchema = Joi.object({
  date: Joi.date().required().messages({
    'date.base': 'Date must be a valid date',
    'any.required': 'Date is required'
  }),
  category: Joi.string().required().trim().messages({
    'string.base': 'Category must be a string',
    'any.required': 'Category is required',
    'string.empty': 'Category cannot be empty'
  }),
  description: Joi.string().min(5).max(500).required().trim().messages({
    'string.base': 'Description must be a string',
    'string.min': 'Description must be at least 5 characters long',
    'string.max': 'Description cannot exceed 500 characters',
    'any.required': 'Description is required',
    'string.empty': 'Description cannot be empty'
  }),
  amount: Joi.number().min(0).required().messages({
    'number.base': 'Amount must be a number',
    'number.min': 'Amount cannot be negative',
    'any.required': 'Amount is required'
  }),
  paymentMethod: Joi.string().valid('cash', 'bank').required().messages({
    'string.base': 'Payment method must be a string',
    'any.only': 'Payment method must be either "cash" or "bank"',
    'any.required': 'Payment method is required'
  }),
  approvedBy: Joi.string().required().trim().messages({
    'string.base': 'Approved by must be a string',
    'any.required': 'Approved by is required',
    'string.empty': 'Approved by cannot be empty'
  }),
  remarks: Joi.string().optional().allow('').trim()
});

const updateExpenseSchema = Joi.object({
  date: Joi.date().optional().messages({
    'date.base': 'Date must be a valid date'
  }),
  category: Joi.string().optional().trim().messages({
    'string.base': 'Category must be a string',
    'string.empty': 'Category cannot be empty'
  }),
  description: Joi.string().min(5).max(500).optional().trim().messages({
    'string.base': 'Description must be a string',
    'string.min': 'Description must be at least 5 characters long',
    'string.max': 'Description cannot exceed 500 characters',
    'string.empty': 'Description cannot be empty'
  }),
  amount: Joi.number().min(0).optional().messages({
    'number.base': 'Amount must be a number',
    'number.min': 'Amount cannot be negative'
  }),
  paymentMethod: Joi.string().valid('cash', 'bank').optional().messages({
    'string.base': 'Payment method must be a string',
    'any.only': 'Payment method must be either "cash" or "bank"'
  }),
  approvedBy: Joi.string().optional().trim().messages({
    'string.base': 'Approved by must be a string',
    'string.empty': 'Approved by cannot be empty'
  }),
  remarks: Joi.string().optional().allow('').trim()
});

const queryExpensesSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1).messages({
    'number.base': 'Page must be a number',
    'number.integer': 'Page must be an integer',
    'number.min': 'Page must be at least 1'
  }),
  limit: Joi.number().integer().min(1).max(100).default(10).messages({
    'number.base': 'Limit must be a number',
    'number.integer': 'Limit must be an integer',
    'number.min': 'Limit must be at least 1',
    'number.max': 'Limit cannot exceed 100'
  }),
  search: Joi.string().optional().allow(''),
  category: Joi.string().optional().messages({
    'string.base': 'Category must be a string'
  }),
  paymentMethod: Joi.string().valid('cash', 'bank').optional().messages({
    'string.base': 'Payment method must be a string',
    'any.only': 'Payment method must be either "cash" or "bank"'
  }),
  startDate: Joi.date().optional().messages({
    'date.base': 'Start date must be a valid date'
  }),
  endDate: Joi.date().optional().messages({
    'date.base': 'End date must be a valid date'
  }),
  sortBy: Joi.string().valid('date', 'category', 'amount', 'description', 'createdAt').default('date').messages({
    'string.base': 'Sort by must be a string',
    'any.only': 'Sort by must be one of: date, category, amount, description, createdAt'
  }),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc').messages({
    'string.base': 'Sort order must be a string',
    'any.only': 'Sort order must be either "asc" or "desc"'
  })
});

// @desc    Get all expenses
// @route   GET /api/expenses
// @access  Private
router.get('/', checkPermission('expenses', 'read'), validateQuery(queryExpensesSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      category = '',
      paymentMethod = '',
      startDate,
      endDate,
      sortBy = 'date',
      sortOrder = 'desc'
    } = req.query as QueryParams;

    // Build filter object
    const filter: any = {};

    // Branch filter (non-super admins can only see their branch data)
    if (req.user!.role !== 'super_admin') {
      filter.branchId = req.user!.branchId;
    }

    if (search) {
      filter.$or = [
        { description: { $regex: search, $options: 'i' } },
        { voucherNo: { $regex: search, $options: 'i' } },
        { approvedBy: { $regex: search, $options: 'i' } }
      ];
    }

    if (category) filter.category = category;
    if (paymentMethod) filter.paymentMethod = paymentMethod;

    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string)
      };
    } else if (startDate) {
      filter.date = { $gte: new Date(startDate as string) };
    } else if (endDate) {
      filter.date = { $lte: new Date(endDate as string) };
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    const sortOptions: any = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query
    const [expenses, total] = await Promise.all([
      Expense.find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean(),
      Expense.countDocuments(filter)
    ]);

    const response: ApiResponse = {
      success: true,
      message: 'Expenses retrieved successfully',
      data: expenses,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Get expenses error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error retrieving expenses'
    };
    res.status(500).json(response);
  }
});

// @desc    Get expense by ID
// @route   GET /api/expenses/:id
// @access  Private
router.get('/:id', checkPermission('expenses', 'read'), async (req: AuthenticatedRequest, res) => {
  try {
    const filter: any = { _id: req.params.id };

    // Branch filter for non-super admins
    if (req.user!.role !== 'super_admin') {
      filter.branchId = req.user!.branchId;
    }

    const expense = await Expense.findOne(filter);

    if (!expense) {
      const response: ApiResponse = {
        success: false,
        message: 'Expense not found'
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse = {
      success: true,
      message: 'Expense retrieved successfully',
      data: expense
    };

    res.json(response);
  } catch (error) {
    console.error('Get expense error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error retrieving expense'
    };
    res.status(500).json(response);
  }
});

// @desc    Create new expense
// @route   POST /api/expenses
// @access  Private
router.post('/', checkPermission('expenses', 'create'), validate(createExpenseSchema), async (req: AuthenticatedRequest, res) => {
  try {

    // Check if user has branchId
    if (!req.user!.branchId && !req.body.branchId) {
      const response: ApiResponse = {
        success: false,
        message: 'Branch ID is required to create expense'
      };
      return res.status(400).json(response);
    }

    // Validate category exists in expense categories (optional check)
    const branchId = req.user!.branchId || req.body.branchId;
    const categoryExists = await ExpenseCategory.findOne({
      name: req.body.category,
      branchId: branchId,
      status: 'active'
    });

    if (!categoryExists) {
      // Don't fail the request, just log it - category validation is now dynamic
    }

    // Generate voucher number
    const voucherNo = `VCH${Date.now()}`;

    // Create expense
    const expenseData = {
      ...req.body,
      voucherNo,
      branchId: req.user!.branchId || req.body.branchId
    };


    const expense = new Expense(expenseData);
    await expense.save();


    // Log activity
    await ActivityLog.create({
      userId: req.user!._id,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: 'CREATE',
      module: 'Expenses',
      details: `Created expense: ${expense.description} - ₹${expense.amount} (${expense.voucherNo})`,
      ipAddress: req.ip,
      branchId: expense.branchId
    });

    const response: ApiResponse = {
      success: true,
      message: 'Expense created successfully',
      data: expense
    };

    res.status(201).json(response);
  } catch (error: any) {
    console.error('Create expense error:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code
    });

    let errorMessage = 'Failed to create expense';
    
    // Handle specific MongoDB errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err: any) => err.message);
      errorMessage = `Validation failed: ${validationErrors.join(', ')}`;
    } else if (error.code === 11000) {
      errorMessage = 'Duplicate voucher number. Please try again.';
    } else if (error.name === 'CastError') {
      errorMessage = 'Invalid data format provided';
    }

    const response: ApiResponse = {
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    };
    
    res.status(500).json(response);
  }
});

// @desc    Update expense
// @route   PUT /api/expenses/:id
// @access  Private
router.put('/:id', checkPermission('expenses', 'update'), validate(updateExpenseSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const filter: any = { _id: req.params.id };

    // Branch filter for non-super admins
    if (req.user!.role !== 'super_admin') {
      filter.branchId = req.user!.branchId;
    }

    const expense = await Expense.findOneAndUpdate(
      filter,
      req.body,
      { new: true, runValidators: true }
    );

    if (!expense) {
      const response: ApiResponse = {
        success: false,
        message: 'Expense not found'
      };
      return res.status(404).json(response);
    }

    // Log activity
    await ActivityLog.create({
      userId: req.user!._id,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: 'UPDATE',
      module: 'Expenses',
      details: `Updated expense: ${expense.description} - ₹${expense.amount} (${expense.voucherNo})`,
      ipAddress: req.ip,
      branchId: expense.branchId
    });

    const response: ApiResponse = {
      success: true,
      message: 'Expense updated successfully',
      data: expense
    };

    res.json(response);
  } catch (error) {
    console.error('Update expense error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error updating expense'
    };
    res.status(500).json(response);
  }
});

// @desc    Delete expense
// @route   DELETE /api/expenses/:id
// @access  Private
router.delete('/:id', checkPermission('expenses', 'delete'), async (req: AuthenticatedRequest, res) => {
  try {
    const filter: any = { _id: req.params.id };

    // Branch filter for non-super admins
    if (req.user!.role !== 'super_admin') {
      filter.branchId = req.user!.branchId;
    }

    const expense = await Expense.findOneAndDelete(filter);

    if (!expense) {
      const response: ApiResponse = {
        success: false,
        message: 'Expense not found'
      };
      return res.status(404).json(response);
    }

    // Log activity
    await ActivityLog.create({
      userId: req.user!._id,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: 'DELETE',
      module: 'Expenses',
      details: `Deleted expense: ${expense.description} - ₹${expense.amount} (${expense.voucherNo})`,
      ipAddress: req.ip,
      branchId: expense.branchId
    });

    const response: ApiResponse = {
      success: true,
      message: 'Expense deleted successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Delete expense error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error deleting expense'
    };
    res.status(500).json(response);
  }
});

// @desc    Get expense statistics
// @route   GET /api/expenses/stats/overview
// @access  Private
router.get('/stats/overview', checkPermission('expenses', 'read'), async (req: AuthenticatedRequest, res) => {
  try {
    const filter: any = {};

    // Branch filter for non-super admins
    if (req.user!.role !== 'super_admin') {
      filter.branchId = req.user!.branchId;
    }

    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const startOfYear = new Date(currentDate.getFullYear(), 0, 1);

    const [
      totalExpenses,
      monthlyExpenses,
      yearlyExpenses,
      categoryStats,
      paymentMethodStats,
      monthlyTrend
    ] = await Promise.all([
      Expense.aggregate([
        { $match: filter },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]),
      Expense.aggregate([
        { $match: { ...filter, date: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]),
      Expense.aggregate([
        { $match: { ...filter, date: { $gte: startOfYear } } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]),
      Expense.aggregate([
        { $match: filter },
        { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { total: -1 } }
      ]),
      Expense.aggregate([
        { $match: filter },
        { $group: { _id: '$paymentMethod', total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]),
      Expense.aggregate([
        { $match: { ...filter, date: { $gte: new Date(currentDate.getFullYear(), currentDate.getMonth() - 11, 1) } } },
        {
          $group: {
            _id: {
              year: { $year: '$date' },
              month: { $month: '$date' }
            },
            total: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ])
    ]);

    const response: ApiResponse = {
      success: true,
      message: 'Expense statistics retrieved successfully',
      data: {
        totalExpenses: totalExpenses[0] || { total: 0, count: 0 },
        monthlyExpenses: monthlyExpenses[0] || { total: 0, count: 0 },
        yearlyExpenses: yearlyExpenses[0] || { total: 0, count: 0 },
        categoryStats,
        paymentMethodStats,
        monthlyTrend
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Get expense stats error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error retrieving expense statistics'
    };
    res.status(500).json(response);
  }
});

export default router;