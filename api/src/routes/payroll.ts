import express from 'express';
import { PayrollEntry } from '../models/PayrollEntry';
import { Staff } from '../models/Staff';
import { ActivityLog } from '../models/ActivityLog';
import { authenticate, checkPermission } from '../middleware/auth';
import { validate, validateQuery } from '../middleware/validation';
import { AuthenticatedRequest, ApiResponse, QueryParams } from '../types';
import Joi from 'joi';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// Validation schemas
const createPayrollSchema = Joi.object({
  staffId: Joi.string().required(),
  month: Joi.string().required().trim(),
  year: Joi.number().integer().min(2020).max(2050).required(),
  allowances: Joi.number().min(0).default(0),
  deductions: Joi.number().min(0).default(0),
  paymentMethod: Joi.string().valid('cash', 'bank').required(),
  status: Joi.string().valid('paid', 'pending').default('paid')
});

const updatePayrollSchema = Joi.object({
  allowances: Joi.number().min(0).optional(),
  deductions: Joi.number().min(0).optional(),
  paymentMethod: Joi.string().valid('cash', 'bank').optional(),
  status: Joi.string().valid('paid', 'pending').optional()
});

const queryPayrollSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().optional().allow(''),
  month: Joi.string().optional().allow(''),
  year: Joi.number().integer().optional(),
  status: Joi.string().valid('paid', 'pending').optional(),
  paymentMethod: Joi.string().valid('cash', 'bank').optional(),
  sortBy: Joi.string().valid('staffName', 'month', 'year', 'netSalary', 'paymentDate', 'createdAt').default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc')
});

// @desc    Get all payroll entries
// @route   GET /api/payroll
// @access  Private
router.get('/', checkPermission('payroll', 'read'), validateQuery(queryPayrollSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      month = '',
      year,
      status = '',
      paymentMethod = '',
      sortBy = 'createdAt',
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
        { staffName: { $regex: search, $options: 'i' } }
      ];
    }

    if (month) filter.month = month;
    if (year) filter.year = year;
    if (status) filter.status = status;
    if (paymentMethod) filter.paymentMethod = paymentMethod;

    // Calculate pagination
    const skip = (page - 1) * limit;
    const sortOptions: any = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query
    const [payrollEntries, total] = await Promise.all([
      PayrollEntry.find(filter)
        .populate('staffId', 'name employeeId designation department')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean(),
      PayrollEntry.countDocuments(filter)
    ]);

    const response: ApiResponse = {
      success: true,
      message: 'Payroll entries retrieved successfully',
      data: payrollEntries,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Get payroll entries error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error retrieving payroll entries'
    };
    res.status(500).json(response);
  }
});

// @desc    Get payroll entry by ID
// @route   GET /api/payroll/:id
// @access  Private
router.get('/:id', checkPermission('payroll', 'read'), async (req: AuthenticatedRequest, res) => {
  try {
    const filter: any = { _id: req.params.id };

    // Branch filter for non-super admins
    if (req.user!.role !== 'super_admin') {
      filter.branchId = req.user!.branchId;
    }

    const payrollEntry = await PayrollEntry.findOne(filter)
      .populate('staffId', 'name employeeId designation department phone email');

    if (!payrollEntry) {
      const response: ApiResponse = {
        success: false,
        message: 'Payroll entry not found'
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse = {
      success: true,
      message: 'Payroll entry retrieved successfully',
      data: payrollEntry
    };

    res.json(response);
  } catch (error) {
    console.error('Get payroll entry error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error retrieving payroll entry'
    };
    res.status(500).json(response);
  }
});

// @desc    Create new payroll entry
// @route   POST /api/payroll
// @access  Private
router.post('/', checkPermission('payroll', 'create'), validate(createPayrollSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const { staffId, month, year, allowances, deductions, paymentMethod, status } = req.body;

    // Verify staff exists and belongs to the same branch
    const staff = await Staff.findOne({
      _id: staffId,
      branchId: req.user!.branchId || req.body.branchId
    });

    if (!staff) {
      const response: ApiResponse = {
        success: false,
        message: 'Staff member not found'
      };
      return res.status(404).json(response);
    }

    // Check if payroll entry already exists for this staff, month, and year
    const existingEntry = await PayrollEntry.findOne({
      staffId,
      month,
      year,
      branchId: req.user!.branchId || req.body.branchId
    });

    if (existingEntry) {
      const response: ApiResponse = {
        success: false,
        message: 'Payroll entry already exists for this staff member for the specified month and year'
      };
      return res.status(400).json(response);
    }

    // Calculate net salary
    const basicSalary = staff.salary;
    const netSalary = basicSalary + (allowances || 0) - (deductions || 0);

    // Create payroll entry
    const payrollData = {
      staffId,
      staffName: staff.name,
      month,
      year,
      basicSalary,
      allowances: allowances || 0,
      deductions: deductions || 0,
      netSalary,
      paymentDate: new Date(),
      paymentMethod,
      status: status || 'paid',
      branchId: req.user!.branchId || req.body.branchId
    };

    const payrollEntry = new PayrollEntry(payrollData);
    await payrollEntry.save();

    // Log activity
    await ActivityLog.create({
      userId: req.user!._id,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: 'CREATE',
      module: 'Payroll',
      details: `Created payroll entry: ${staff.name} - ${month} ${year} - ₹${netSalary}`,
      ipAddress: req.ip,
      branchId: payrollEntry.branchId
    });

    const response: ApiResponse = {
      success: true,
      message: 'Payroll entry created successfully',
      data: payrollEntry
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Create payroll entry error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error creating payroll entry'
    };
    res.status(500).json(response);
  }
});

// @desc    Update payroll entry
// @route   PUT /api/payroll/:id
// @access  Private
router.put('/:id', checkPermission('payroll', 'update'), validate(updatePayrollSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const filter: any = { _id: req.params.id };

    // Branch filter for non-super admins
    if (req.user!.role !== 'super_admin') {
      filter.branchId = req.user!.branchId;
    }

    const existingEntry = await PayrollEntry.findOne(filter).populate('staffId', 'salary');
    if (!existingEntry) {
      const response: ApiResponse = {
        success: false,
        message: 'Payroll entry not found'
      };
      return res.status(404).json(response);
    }

    // Recalculate net salary if allowances or deductions changed
    let updateData = { ...req.body };
    if (req.body.allowances !== undefined || req.body.deductions !== undefined) {
      const allowances = req.body.allowances !== undefined ? req.body.allowances : existingEntry.allowances;
      const deductions = req.body.deductions !== undefined ? req.body.deductions : existingEntry.deductions;
      updateData.netSalary = existingEntry.basicSalary + allowances - deductions;
    }

    const updatedEntry = await PayrollEntry.findOneAndUpdate(
      filter,
      updateData,
      { new: true, runValidators: true }
    ).populate('staffId', 'name employeeId');

    // Log activity
    await ActivityLog.create({
      userId: req.user!._id,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: 'UPDATE',
      module: 'Payroll',
      details: `Updated payroll entry: ${updatedEntry!.staffName} - ${updatedEntry!.month} ${updatedEntry!.year}`,
      ipAddress: req.ip,
      branchId: updatedEntry!.branchId
    });

    const response: ApiResponse = {
      success: true,
      message: 'Payroll entry updated successfully',
      data: updatedEntry
    };

    res.json(response);
  } catch (error) {
    console.error('Update payroll entry error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error updating payroll entry'
    };
    res.status(500).json(response);
  }
});

// @desc    Delete payroll entry
// @route   DELETE /api/payroll/:id
// @access  Private
router.delete('/:id', checkPermission('payroll', 'delete'), async (req: AuthenticatedRequest, res) => {
  try {
    const filter: any = { _id: req.params.id };

    // Branch filter for non-super admins
    if (req.user!.role !== 'super_admin') {
      filter.branchId = req.user!.branchId;
    }

    const payrollEntry = await PayrollEntry.findOneAndDelete(filter);

    if (!payrollEntry) {
      const response: ApiResponse = {
        success: false,
        message: 'Payroll entry not found'
      };
      return res.status(404).json(response);
    }

    // Log activity
    await ActivityLog.create({
      userId: req.user!._id,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: 'DELETE',
      module: 'Payroll',
      details: `Deleted payroll entry: ${payrollEntry.staffName} - ${payrollEntry.month} ${payrollEntry.year}`,
      ipAddress: req.ip,
      branchId: payrollEntry.branchId
    });

    const response: ApiResponse = {
      success: true,
      message: 'Payroll entry deleted successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Delete payroll entry error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error deleting payroll entry'
    };
    res.status(500).json(response);
  }
});

// @desc    Get payroll statistics
// @route   GET /api/payroll/stats/overview
// @access  Private
router.get('/stats/overview', checkPermission('payroll', 'read'), async (req: AuthenticatedRequest, res) => {
  try {
    const filter: any = {};

    // Branch filter for non-super admins
    if (req.user!.role !== 'super_admin') {
      filter.branchId = req.user!.branchId;
    }

    const currentDate = new Date();
    const currentMonth = currentDate.toLocaleString('default', { month: 'long' });
    const currentYear = currentDate.getFullYear();

    const [
      totalPayrollEntries,
      totalAmountPaid,
      currentMonthStats,
      monthlyStats,
      paymentMethodStats,
      statusStats
    ] = await Promise.all([
      PayrollEntry.countDocuments(filter),
      PayrollEntry.aggregate([
        { $match: filter },
        { $group: { _id: null, total: { $sum: '$netSalary' } } }
      ]),
      PayrollEntry.aggregate([
        { $match: { ...filter, month: currentMonth, year: currentYear } },
        { 
          $group: { 
            _id: null, 
            total: { $sum: '$netSalary' }, 
            count: { $sum: 1 },
            avgSalary: { $avg: '$netSalary' }
          } 
        }
      ]),
      PayrollEntry.aggregate([
        { $match: filter },
        { 
          $group: { 
            _id: { month: '$month', year: '$year' }, 
            total: { $sum: '$netSalary' }, 
            count: { $sum: 1 } 
          } 
        },
        { $sort: { '_id.year': -1, '_id.month': -1 } },
        { $limit: 12 }
      ]),
      PayrollEntry.aggregate([
        { $match: filter },
        { $group: { _id: '$paymentMethod', total: { $sum: '$netSalary' }, count: { $sum: 1 } } }
      ]),
      PayrollEntry.aggregate([
        { $match: filter },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ])
    ]);

    const response: ApiResponse = {
      success: true,
      message: 'Payroll statistics retrieved successfully',
      data: {
        totalEntries: totalPayrollEntries,
        totalAmountPaid: totalAmountPaid[0]?.total || 0,
        currentMonthStats: currentMonthStats[0] || { total: 0, count: 0, avgSalary: 0 },
        monthlyStats,
        paymentMethodStats,
        statusStats
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Get payroll stats error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error retrieving payroll statistics'
    };
    res.status(500).json(response);
  }
});

// @desc    Get staff members without payroll for a specific month/year
// @route   GET /api/payroll/pending/:month/:year
// @access  Private
router.get('/pending/:month/:year', checkPermission('payroll', 'read'), async (req: AuthenticatedRequest, res) => {
  try {
    const { month, year } = req.params;
    const filter: any = {};

    // Branch filter for non-super admins
    if (req.user!.role !== 'super_admin') {
      filter.branchId = req.user!.branchId;
    }

    // Get all active staff
    const allStaff = await Staff.find({ ...filter, status: 'active' }).select('_id name employeeId designation salary');

    // Get staff who already have payroll entries for this month/year
    const processedStaff = await PayrollEntry.find({
      month,
      year: parseInt(year),
      branchId: req.user!.branchId
    }).select('staffId');

    const processedStaffIds = processedStaff.map(entry => entry.staffId.toString());

    // Filter out staff who already have payroll entries
    const pendingStaff = allStaff.filter(staff => !processedStaffIds.includes(staff._id.toString()));

    const response: ApiResponse = {
      success: true,
      message: 'Pending payroll staff retrieved successfully',
      data: {
        month,
        year: parseInt(year),
        pendingCount: pendingStaff.length,
        totalStaff: allStaff.length,
        processedCount: processedStaff.length,
        pendingStaff
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Get pending payroll error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error retrieving pending payroll data'
    };
    res.status(500).json(response);
  }
});

export default router;