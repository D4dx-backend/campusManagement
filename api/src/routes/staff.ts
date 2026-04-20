import express from 'express';
import { Staff } from '../models/Staff';
import { Department } from '../models/Department';
import { Branch } from '../models/Branch';
import { Organization } from '../models/Organization';
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
const createStaffSchema = Joi.object({
  employeeId: Joi.string().required().trim(),
  name: Joi.string().min(2).max(100).required().trim(),
  category: Joi.string().optional().allow('').trim(),
  designation: Joi.string().required().trim(),
  department: Joi.string().required().trim(),
  dateOfJoining: Joi.date().required(),
  phone: Joi.string().pattern(/^(\+\d{1,4}\d{6,14}|\d{10})$/).required().messages({
    'string.pattern.base': 'Phone must be either 10 digits or include country code (e.g., +911234567890)'
  }),
  email: Joi.string().email().optional().allow(''),
  address: Joi.string().min(10).max(500).required().trim(),
  salary: Joi.number().min(0).required(),
  status: Joi.string().valid('active', 'inactive', 'terminated', 'resigned').default('active')
});

const updateStaffSchema = Joi.object({
  employeeId: Joi.string().optional().trim(),
  name: Joi.string().min(2).max(100).optional().trim(),
  category: Joi.string().optional().allow('').trim(),
  designation: Joi.string().optional().trim(),
  department: Joi.string().optional().trim(),
  dateOfJoining: Joi.date().optional(),
  phone: Joi.string().pattern(/^(\+\d{1,4}\d{6,14}|\d{10})$/).optional().messages({
    'string.pattern.base': 'Phone must be either 10 digits or include country code (e.g., +911234567890)'
  }),
  email: Joi.string().email().optional().allow(''),
  address: Joi.string().min(10).max(500).optional().trim(),
  salary: Joi.number().min(0).optional(),
  status: Joi.string().valid('active', 'inactive', 'terminated', 'resigned').optional()
});

const queryStaffSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().optional().allow(''),
  category: Joi.string().optional().allow(''),
  department: Joi.string().optional().allow(''),
  designation: Joi.string().optional().allow(''),
  status: Joi.string().valid('active', 'inactive', 'terminated', 'resigned').optional(),
  sortBy: Joi.string().valid('name', 'employeeId', 'designation', 'salary', 'createdAt').default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc')
});

// @desc    Get all staff members
// @route   GET /api/staff
// @access  Private
router.get('/', checkPermission('staff', 'read'), validateQuery(queryStaffSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      category = '',
      department = '',
      designation = '',
      status = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query as QueryParams;

    // Build filter object
    const filter: any = {};

    // Org + Branch filter
    Object.assign(filter, getOrgBranchFilter(req));

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
        { designation: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (category) filter.category = category;
    if (department) filter.department = department;
    if (designation) filter.designation = { $regex: designation, $options: 'i' };
    if (status) filter.status = status;

    // Calculate pagination
    const skip = (page - 1) * limit;
    const sortOptions: any = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query
    const [staff, total] = await Promise.all([
      Staff.find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean(),
      Staff.countDocuments(filter)
    ]);

    const response: ApiResponse = {
      success: true,
      message: 'Staff members retrieved successfully',
      data: staff,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Get staff error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error retrieving staff members'
    };
    res.status(500).json(response);
  }
});

// @desc    Get staff member by ID
// @route   GET /api/staff/:id
// @access  Private
router.get('/:id', checkPermission('staff', 'read'), async (req: AuthenticatedRequest, res) => {
  try {
    const filter: any = { _id: req.params.id };

    // Branch filter for non-super admins
    Object.assign(filter, getOrgBranchFilter(req));

    const staff = await Staff.findOne(filter);

    if (!staff) {
      const response: ApiResponse = {
        success: false,
        message: 'Staff member not found'
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse = {
      success: true,
      message: 'Staff member retrieved successfully',
      data: staff
    };

    res.json(response);
  } catch (error) {
    console.error('Get staff member error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error retrieving staff member'
    };
    res.status(500).json(response);
  }
});

// @desc    Create new staff member
// @route   POST /api/staff
// @access  Private
router.post('/', checkPermission('staff', 'create'), validate(createStaffSchema), async (req: AuthenticatedRequest, res) => {
  try {
    // Check if employee ID already exists
    const existingStaff = await Staff.findOne({ employeeId: req.body.employeeId });
    if (existingStaff) {
      const response: ApiResponse = {
        success: false,
        message: 'Staff member with this employee ID already exists'
      };
      return res.status(400).json(response);
    }

    // Check if email already exists
    const existingEmail = await Staff.findOne({ email: req.body.email });
    if (existingEmail) {
      const response: ApiResponse = {
        success: false,
        message: 'Staff member with this email already exists'
      };
      return res.status(400).json(response);
    }

    const orgBranch = getOrgBranchForCreate(req);

    if (!orgBranch.branchId) {
      const response: ApiResponse = {
        success: false,
        message: 'Branch information is required for staff creation'
      };
      return res.status(400).json(response);
    }

    // Create staff member with branch ID
    const staffData = {
      ...req.body,
      organizationId: orgBranch.organizationId,
      branchId: orgBranch.branchId
    };

    const staff = new Staff(staffData);
    await staff.save();

    // Log activity
    await ActivityLog.create({
      userId: req.user!._id,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: 'CREATE',
      module: 'Staff',
      details: `Created staff member: ${staff.name} (${staff.employeeId})`,
      ipAddress: req.ip,
      branchId: staff.branchId
    });

    const response: ApiResponse = {
      success: true,
      message: 'Staff member created successfully',
      data: staff
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Create staff error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error creating staff member'
    };
    res.status(500).json(response);
  }
});

// @desc    Update staff member
// @route   PUT /api/staff/:id
// @access  Private
router.put('/:id', checkPermission('staff', 'update'), validate(updateStaffSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const filter: any = { _id: req.params.id };

    // Org + Branch filter
    Object.assign(filter, getOrgBranchFilter(req));

    // Check if email is being updated and already exists
    if (req.body.email) {
      const existingEmail = await Staff.findOne({ 
        email: req.body.email, 
        _id: { $ne: req.params.id } 
      });
      if (existingEmail) {
        const response: ApiResponse = {
          success: false,
          message: 'Another staff member with this email already exists'
        };
        return res.status(400).json(response);
      }
    }

    const staff = await Staff.findOneAndUpdate(
      filter,
      req.body,
      { new: true, runValidators: true }
    );

    if (!staff) {
      const response: ApiResponse = {
        success: false,
        message: 'Staff member not found'
      };
      return res.status(404).json(response);
    }

    // Log activity
    await ActivityLog.create({
      userId: req.user!._id,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: 'UPDATE',
      module: 'Staff',
      details: `Updated staff member: ${staff.name} (${staff.employeeId})`,
      ipAddress: req.ip,
      branchId: staff.branchId
    });

    const response: ApiResponse = {
      success: true,
      message: 'Staff member updated successfully',
      data: staff
    };

    res.json(response);
  } catch (error) {
    console.error('Update staff error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error updating staff member'
    };
    res.status(500).json(response);
  }
});

// @desc    Delete staff member
// @route   DELETE /api/staff/:id
// @access  Private
router.delete('/:id', checkPermission('staff', 'delete'), async (req: AuthenticatedRequest, res) => {
  try {
    const filter: any = { _id: req.params.id };

    // Branch filter for non-super admins
    Object.assign(filter, getOrgBranchFilter(req));

    const staff = await Staff.findOneAndDelete(filter);

    if (!staff) {
      const response: ApiResponse = {
        success: false,
        message: 'Staff member not found'
      };
      return res.status(404).json(response);
    }

    // Log activity
    await ActivityLog.create({
      userId: req.user!._id,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: 'DELETE',
      module: 'Staff',
      details: `Deleted staff member: ${staff.name} (${staff.employeeId})`,
      ipAddress: req.ip,
      branchId: staff.branchId
    });

    const response: ApiResponse = {
      success: true,
      message: 'Staff member deleted successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Delete staff error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error deleting staff member'
    };
    res.status(500).json(response);
  }
});

// @desc    Get staff statistics
// @route   GET /api/staff/stats/overview
// @access  Private
router.get('/stats/overview', checkPermission('staff', 'read'), async (req: AuthenticatedRequest, res) => {
  try {
    const filter: any = {};

    // Branch filter for non-super admins
    Object.assign(filter, getOrgBranchFilter(req));

    const [
      totalStaff,
      activeStaff,
      inactiveStaff,
      departmentStats,
      salaryStats
    ] = await Promise.all([
      Staff.countDocuments(filter),
      Staff.countDocuments({ ...filter, status: 'active' }),
      Staff.countDocuments({ ...filter, status: 'inactive' }),
      Staff.aggregate([
        { $match: filter },
        { $group: { _id: '$department', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Staff.aggregate([
        { $match: filter },
        { 
          $group: { 
            _id: null, 
            totalSalary: { $sum: '$salary' },
            avgSalary: { $avg: '$salary' },
            minSalary: { $min: '$salary' },
            maxSalary: { $max: '$salary' }
          } 
        }
      ])
    ]);

    const response: ApiResponse = {
      success: true,
      message: 'Staff statistics retrieved successfully',
      data: {
        total: totalStaff,
        active: activeStaff,
        inactive: inactiveStaff,
        departmentStats,
        salaryStats: salaryStats[0] || {
          totalSalary: 0,
          avgSalary: 0,
          minSalary: 0,
          maxSalary: 0
        }
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Get staff stats error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error retrieving staff statistics'
    };
    res.status(500).json(response);
  }
});

// ── SALARY INCREMENT ────────────────────────────────────────────────

const salaryIncrementSchema = Joi.object({
  newSalary: Joi.number().min(0).required(),
  effectiveDate: Joi.date().required(),
  reason: Joi.string().required().trim()
});

// @desc    Add salary increment for staff
// @route   POST /api/staff/:id/salary-increment
// @access  Private
router.post('/:id/salary-increment', checkPermission('staff', 'update'), validate(salaryIncrementSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const filter: any = { _id: req.params.id };
    Object.assign(filter, getOrgBranchFilter(req));

    const staff = await Staff.findOne(filter);
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff member not found' } as ApiResponse);
    }

    const previousSalary = staff.salary;
    const { newSalary, effectiveDate, reason } = req.body;

    // Push to salary history
    staff.salaryHistory = staff.salaryHistory || [];
    staff.salaryHistory.push({
      previousSalary,
      newSalary,
      effectiveDate,
      reason,
      incrementedBy: req.user!.name,
      createdAt: new Date()
    });

    staff.salary = newSalary;
    await staff.save();

    await ActivityLog.create({
      userId: req.user!._id,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: 'UPDATE',
      module: 'Staff',
      details: `Salary increment for ${staff.name}: ${previousSalary} → ${newSalary} (${reason})`,
      ipAddress: req.ip,
      branchId: staff.branchId
    });

    res.json({ success: true, message: 'Salary increment recorded successfully', data: staff } as ApiResponse);
  } catch (error) {
    console.error('Salary increment error:', error);
    res.status(500).json({ success: false, message: 'Server error recording salary increment' } as ApiResponse);
  }
});

// @desc    Get salary history for staff
// @route   GET /api/staff/:id/salary-history
// @access  Private
router.get('/:id/salary-history', checkPermission('staff', 'read'), async (req: AuthenticatedRequest, res) => {
  try {
    const filter: any = { _id: req.params.id };
    Object.assign(filter, getOrgBranchFilter(req));

    const staff = await Staff.findOne(filter).select('name employeeId salary salaryHistory');
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff member not found' } as ApiResponse);
    }

    res.json({
      success: true,
      message: 'Salary history retrieved successfully',
      data: {
        name: staff.name,
        employeeId: staff.employeeId,
        currentSalary: staff.salary,
        history: (staff.salaryHistory || []).sort((a: any, b: any) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime())
      }
    } as ApiResponse);
  } catch (error) {
    console.error('Get salary history error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving salary history' } as ApiResponse);
  }
});

// ── SEPARATION (TERMINATION / RESIGNATION) ──────────────────────────

const separationSchema = Joi.object({
  separationType: Joi.string().valid('terminated', 'resigned').required(),
  separationDate: Joi.date().required(),
  lastWorkingDate: Joi.date().required(),
  separationReason: Joi.string().required().trim()
});

// @desc    Record staff termination or resignation
// @route   POST /api/staff/:id/separation
// @access  Private
router.post('/:id/separation', checkPermission('staff', 'update'), validate(separationSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const filter: any = { _id: req.params.id };
    Object.assign(filter, getOrgBranchFilter(req));

    const staff = await Staff.findOne(filter);
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff member not found' } as ApiResponse);
    }

    if (staff.status === 'terminated' || staff.status === 'resigned') {
      return res.status(400).json({ success: false, message: 'Staff member is already separated' } as ApiResponse);
    }

    const { separationType, separationDate, lastWorkingDate, separationReason } = req.body;

    staff.status = separationType;
    staff.separationType = separationType;
    staff.separationDate = separationDate;
    staff.lastWorkingDate = lastWorkingDate;
    staff.separationReason = separationReason;
    await staff.save();

    const actionLabel = separationType === 'terminated' ? 'Terminated' : 'Resigned';

    await ActivityLog.create({
      userId: req.user!._id,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: 'UPDATE',
      module: 'Staff',
      details: `${actionLabel}: ${staff.name} (${staff.employeeId}) - ${separationReason}`,
      ipAddress: req.ip,
      branchId: staff.branchId
    });

    res.json({ success: true, message: `Staff ${actionLabel.toLowerCase()} successfully`, data: staff } as ApiResponse);
  } catch (error) {
    console.error('Staff separation error:', error);
    res.status(500).json({ success: false, message: 'Server error processing separation' } as ApiResponse);
  }
});

// ── EXPERIENCE CERTIFICATE ──────────────────────────────────────────

// @desc    Generate experience certificate data for staff
// @route   GET /api/staff/:id/experience-certificate
// @access  Private
router.get('/:id/experience-certificate', checkPermission('staff', 'read'), async (req: AuthenticatedRequest, res) => {
  try {
    const filter: any = { _id: req.params.id };
    Object.assign(filter, getOrgBranchFilter(req));

    const staff = await Staff.findOne(filter);
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff member not found' } as ApiResponse);
    }

    // Get organization and branch info
    const [org, branch] = await Promise.all([
      Organization.findById(staff.organizationId),
      Branch.findById(staff.branchId)
    ]);

    const endDate = staff.lastWorkingDate || (staff.status === 'active' ? new Date() : staff.separationDate || new Date());
    const startDate = staff.dateOfJoining;

    // Calculate duration
    const diffMs = new Date(endDate).getTime() - new Date(startDate).getTime();
    const diffYears = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 365.25));
    const diffMonths = Math.floor((diffMs % (1000 * 60 * 60 * 24 * 365.25)) / (1000 * 60 * 60 * 24 * 30.44));

    const certificateData = {
      staffName: staff.name,
      employeeId: staff.employeeId,
      designation: staff.designation,
      department: staff.department,
      category: staff.category,
      dateOfJoining: staff.dateOfJoining,
      lastWorkingDate: endDate,
      duration: `${diffYears} year(s) and ${diffMonths} month(s)`,
      status: staff.status,
      organizationName: org?.name || '',
      organizationAddress: org?.address || '',
      organizationPhone: org?.phone || '',
      organizationEmail: org?.email || '',
      organizationLogo: org?.logo || '',
      branchName: branch?.name || '',
      branchAddress: branch?.address || '',
      principalName: branch?.principalName || '',
      issueDate: new Date(),
    };

    res.json({ success: true, message: 'Experience certificate data generated', data: certificateData } as ApiResponse);
  } catch (error) {
    console.error('Experience certificate error:', error);
    res.status(500).json({ success: false, message: 'Server error generating experience certificate' } as ApiResponse);
  }
});

export default router;