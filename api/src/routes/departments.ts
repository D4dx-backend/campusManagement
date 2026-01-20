import express from 'express';
import { Department } from '../models/Department';
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
const createDepartmentSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().trim(),
  description: Joi.string().optional().allow('').trim(),
  code: Joi.string().min(2).max(10).required().trim().uppercase(),
  headOfDepartment: Joi.string().optional().allow('').trim(),
  status: Joi.string().valid('active', 'inactive').default('active'),
  branchId: Joi.string().optional().allow('').trim()
});

const updateDepartmentSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional().trim(),
  description: Joi.string().optional().allow('').trim(),
  code: Joi.string().min(2).max(10).optional().trim().uppercase(),
  headOfDepartment: Joi.string().optional().allow('').trim(),
  status: Joi.string().valid('active', 'inactive').optional(),
  branchId: Joi.string().optional().allow('').trim()
});

const queryDepartmentsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().optional().allow(''),
  status: Joi.string().valid('active', 'inactive').optional(),
  sortBy: Joi.string().valid('name', 'code', 'createdAt').default('name'),
  sortOrder: Joi.string().valid('asc', 'desc').default('asc')
});

// @desc    Get all departments
// @route   GET /api/departments
// @access  Private
router.get('/', checkPermission('departments', 'read'), validateQuery(queryDepartmentsSchema), async (req: AuthenticatedRequest, res) => {
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
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { headOfDepartment: { $regex: search, $options: 'i' } }
      ];
    }

    if (status) filter.status = status;

    // Calculate pagination
    const skip = (page - 1) * limit;
    const sortOptions: any = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query with staff count
    const [departments, total] = await Promise.all([
      Department.find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean(),
      Department.countDocuments(filter)
    ]);

    // Get staff count for each department
    const departmentsWithStaffCount = await Promise.all(
      departments.map(async (department) => {
        const staffCount = await Staff.countDocuments({
          department: department.name,
          branchId: department.branchId
        });
        return {
          ...department,
          staffCount
        };
      })
    );

    const response: ApiResponse = {
      success: true,
      message: 'Departments retrieved successfully',
      data: departmentsWithStaffCount,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Get departments error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error retrieving departments'
    };
    res.status(500).json(response);
  }
});

// @desc    Get department by ID
// @route   GET /api/departments/:id
// @access  Private
router.get('/:id', checkPermission('departments', 'read'), async (req: AuthenticatedRequest, res) => {
  try {
    const filter: any = { _id: req.params.id };

    // Branch filter for non-super admins
    if (req.user!.role !== 'super_admin') {
      filter.branchId = req.user!.branchId;
    }

    const department = await Department.findOne(filter);

    if (!department) {
      const response: ApiResponse = {
        success: false,
        message: 'Department not found'
      };
      return res.status(404).json(response);
    }

    // Get staff count and list
    const [staffCount, staffList] = await Promise.all([
      Staff.countDocuments({
        department: department.name,
        branchId: department.branchId
      }),
      Staff.find({
        department: department.name,
        branchId: department.branchId,
        status: 'active'
      }).select('name designation employeeId').limit(10)
    ]);

    const response: ApiResponse = {
      success: true,
      message: 'Department retrieved successfully',
      data: {
        ...department.toObject(),
        staffCount,
        staffList
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Get department error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error retrieving department'
    };
    res.status(500).json(response);
  }
});

// @desc    Create new department
// @route   POST /api/departments
// @access  Private
router.post('/', checkPermission('departments', 'create'), validate(createDepartmentSchema), async (req: AuthenticatedRequest, res) => {
  try {
    
    const { name, description, code, headOfDepartment, branchId } = req.body;

    // Determine the branchId to use
    const targetBranchId = req.user!.branchId || branchId;
    
    if (!targetBranchId) {
      const response: ApiResponse = {
        success: false,
        message: 'Branch ID is required to create a department'
      };
      return res.status(400).json(response);
    }

    // Check if department code already exists for the same branch
    const existingDepartment = await Department.findOne({
      code,
      branchId: targetBranchId
    });

    if (existingDepartment) {
      const response: ApiResponse = {
        success: false,
        message: 'Department with this code already exists'
      };
      return res.status(400).json(response);
    }

    // Check if department name already exists for the same branch
    const existingName = await Department.findOne({
      name,
      branchId: targetBranchId
    });

    if (existingName) {
      const response: ApiResponse = {
        success: false,
        message: 'Department with this name already exists'
      };
      return res.status(400).json(response);
    }

    // Create department
    const departmentData = {
      name,
      description,
      code: code.toUpperCase(),
      headOfDepartment,
      branchId: targetBranchId
    };

    const department = new Department(departmentData);
    await department.save();

    // Log activity
    await ActivityLog.create({
      userId: req.user!._id,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: 'CREATE',
      module: 'Departments',
      details: `Created department: ${department.name} (${department.code})`,
      ipAddress: req.ip,
      branchId: targetBranchId
    });

    const response: ApiResponse = {
      success: true,
      message: 'Department created successfully',
      data: department
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Create department error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error creating department'
    };
    res.status(500).json(response);
  }
});

// @desc    Update department
// @route   PUT /api/departments/:id
// @access  Private
router.put('/:id', checkPermission('departments', 'update'), validate(updateDepartmentSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const filter: any = { _id: req.params.id };

    // Branch filter for non-super admins
    if (req.user!.role !== 'super_admin') {
      filter.branchId = req.user!.branchId;
    }

    const existingDepartment = await Department.findOne(filter);
    if (!existingDepartment) {
      const response: ApiResponse = {
        success: false,
        message: 'Department not found'
      };
      return res.status(404).json(response);
    }

    // Check if department code is being updated and already exists
    if (req.body.code && req.body.code !== existingDepartment.code) {
      const duplicateCode = await Department.findOne({
        code: req.body.code.toUpperCase(),
        branchId: existingDepartment.branchId,
        _id: { $ne: req.params.id }
      });

      if (duplicateCode) {
        const response: ApiResponse = {
          success: false,
          message: 'Another department with this code already exists'
        };
        return res.status(400).json(response);
      }
    }

    // Check if department name is being updated and already exists
    if (req.body.name && req.body.name !== existingDepartment.name) {
      const duplicateName = await Department.findOne({
        name: req.body.name,
        branchId: existingDepartment.branchId,
        _id: { $ne: req.params.id }
      });

      if (duplicateName) {
        const response: ApiResponse = {
          success: false,
          message: 'Another department with this name already exists'
        };
        return res.status(400).json(response);
      }
    }

    // Prepare update data
    const updateData = { ...req.body };

    if (updateData.branchId) {
      if (req.user!.role !== 'super_admin') {
        const response: ApiResponse = {
          success: false,
          message: 'Only super admins can change department branch'
        };
        return res.status(403).json(response);
      }
    }
    if (updateData.code) {
      updateData.code = updateData.code.toUpperCase();
    }

    const updatedDepartment = await Department.findOneAndUpdate(
      filter,
      updateData,
      { new: true, runValidators: true }
    );

    // If department name changed, update staff records
    if (req.body.name && req.body.name !== existingDepartment.name) {
      await Staff.updateMany(
        { department: existingDepartment.name, branchId: existingDepartment.branchId },
        { department: req.body.name }
      );
    }

    // Log activity
    await ActivityLog.create({
      userId: req.user!._id,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: 'UPDATE',
      module: 'Departments',
      details: `Updated department: ${updatedDepartment!.name} (${updatedDepartment!.code})`,
      ipAddress: req.ip,
      branchId: updatedDepartment!.branchId
    });

    const response: ApiResponse = {
      success: true,
      message: 'Department updated successfully',
      data: updatedDepartment
    };

    res.json(response);
  } catch (error) {
    console.error('Update department error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error updating department'
    };
    res.status(500).json(response);
  }
});

// @desc    Delete department
// @route   DELETE /api/departments/:id
// @access  Private
router.delete('/:id', checkPermission('departments', 'delete'), async (req: AuthenticatedRequest, res) => {
  try {
    const filter: any = { _id: req.params.id };

    // Branch filter for non-super admins
    if (req.user!.role !== 'super_admin') {
      filter.branchId = req.user!.branchId;
    }

    const department = await Department.findOne(filter);
    if (!department) {
      const response: ApiResponse = {
        success: false,
        message: 'Department not found'
      };
      return res.status(404).json(response);
    }

    // Check if department has staff members
    const staffCount = await Staff.countDocuments({
      department: department.name,
      branchId: department.branchId
    });

    if (staffCount > 0) {
      const response: ApiResponse = {
        success: false,
        message: 'Cannot delete department with existing staff members. Please reassign staff first.'
      };
      return res.status(400).json(response);
    }

    await Department.findOneAndDelete(filter);

    // Log activity
    await ActivityLog.create({
      userId: req.user!._id,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: 'DELETE',
      module: 'Departments',
      details: `Deleted department: ${department.name} (${department.code})`,
      ipAddress: req.ip,
      branchId: department.branchId
    });

    const response: ApiResponse = {
      success: true,
      message: 'Department deleted successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Delete department error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error deleting department'
    };
    res.status(500).json(response);
  }
});

// @desc    Get department statistics
// @route   GET /api/departments/stats/overview
// @access  Private
router.get('/stats/overview', checkPermission('departments', 'read'), async (req: AuthenticatedRequest, res) => {
  try {
    const filter: any = {};

    // Branch filter for non-super admins
    if (req.user!.role !== 'super_admin') {
      filter.branchId = req.user!.branchId;
    }

    const [
      totalDepartments,
      activeDepartments,
      inactiveDepartments,
      departmentStaffStats
    ] = await Promise.all([
      Department.countDocuments(filter),
      Department.countDocuments({ ...filter, status: 'active' }),
      Department.countDocuments({ ...filter, status: 'inactive' }),
      Department.aggregate([
        { $match: filter },
        {
          $lookup: {
            from: 'staff',
            let: { deptName: '$name', branchId: '$branchId' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$department', '$$deptName'] },
                      { $eq: ['$branchId', '$$branchId'] }
                    ]
                  }
                }
              }
            ],
            as: 'staff'
          }
        },
        {
          $project: {
            name: 1,
            code: 1,
            headOfDepartment: 1,
            staffCount: { $size: '$staff' },
            activeStaffCount: {
              $size: {
                $filter: {
                  input: '$staff',
                  cond: { $eq: ['$$this.status', 'active'] }
                }
              }
            }
          }
        },
        { $sort: { staffCount: -1 } }
      ])
    ]);

    const response: ApiResponse = {
      success: true,
      message: 'Department statistics retrieved successfully',
      data: {
        total: totalDepartments,
        active: activeDepartments,
        inactive: inactiveDepartments,
        departmentStaffStats
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Get department stats error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error retrieving department statistics'
    };
    res.status(500).json(response);
  }
});

export default router;