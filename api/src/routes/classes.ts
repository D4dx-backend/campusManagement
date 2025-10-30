import express from 'express';
import { Class } from '../models/Class';
import { Division } from '../models/Division';
import { Student } from '../models/Student';
import { ActivityLog } from '../models/ActivityLog';
import { authenticate, checkPermission } from '../middleware/auth';
import { validate, validateQuery } from '../middleware/validation';
import { AuthenticatedRequest, ApiResponse, QueryParams } from '../types';
import Joi from 'joi';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// Validation schemas
const createClassSchema = Joi.object({
  name: Joi.string().required().trim(),
  description: Joi.string().optional().allow('').trim(),
  academicYear: Joi.string().required().trim(),
  status: Joi.string().valid('active', 'inactive').default('active')
});

const updateClassSchema = Joi.object({
  name: Joi.string().optional().trim(),
  description: Joi.string().optional().allow('').trim(),
  academicYear: Joi.string().optional().trim(),
  status: Joi.string().valid('active', 'inactive').optional()
});

const queryClassesSchema = Joi.object({
  page: Joi.alternatives().try(
    Joi.number().integer().min(1),
    Joi.string().pattern(/^\d+$/).custom((value) => parseInt(value, 10))
  ).default(1),
  limit: Joi.alternatives().try(
    Joi.number().integer().min(1).max(100),
    Joi.string().pattern(/^\d+$/).custom((value) => Math.min(parseInt(value, 10), 100))
  ).default(10),
  search: Joi.string().optional().allow(''),
  academicYear: Joi.string().optional().allow(''),
  status: Joi.string().valid('active', 'inactive').optional(),
  sortBy: Joi.string().valid('name', 'academicYear', 'createdAt').default('name'),
  sortOrder: Joi.string().valid('asc', 'desc').default('asc')
});

// @desc    Get all classes
// @route   GET /api/classes
// @access  Private
router.get('/', checkPermission('classes', 'read'), validateQuery(queryClassesSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      academicYear = '',
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

    if (academicYear) filter.academicYear = academicYear;
    if (status) filter.status = status;

    // Calculate pagination
    const skip = (page - 1) * limit;
    const sortOptions: any = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query with division count
    const [classes, total] = await Promise.all([
      Class.aggregate([
        { $match: filter },
        {
          $lookup: {
            from: 'divisions',
            localField: '_id',
            foreignField: 'classId',
            as: 'divisions'
          }
        },
        {
          $addFields: {
            divisionCount: { $size: '$divisions' },
            activeDivisions: {
              $size: {
                $filter: {
                  input: '$divisions',
                  cond: { $eq: ['$$this.status', 'active'] }
                }
              }
            }
          }
        },
        { $project: { divisions: 0 } },
        { $sort: sortOptions },
        { $skip: skip },
        { $limit: limit }
      ]),
      Class.countDocuments(filter)
    ]);

    const response: ApiResponse = {
      success: true,
      message: 'Classes retrieved successfully',
      data: classes,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Get classes error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error retrieving classes'
    };
    res.status(500).json(response);
  }
});

// @desc    Get class by ID with divisions
// @route   GET /api/classes/:id
// @access  Private
router.get('/:id', checkPermission('classes', 'read'), async (req: AuthenticatedRequest, res) => {
  try {
    const filter: any = { _id: req.params.id };

    // Branch filter for non-super admins
    if (req.user!.role !== 'super_admin') {
      filter.branchId = req.user!.branchId;
    }

    const classData = await Class.aggregate([
      { $match: filter },
      {
        $lookup: {
          from: 'divisions',
          localField: '_id',
          foreignField: 'classId',
          as: 'divisions'
        }
      },
      {
        $addFields: {
          divisionCount: { $size: '$divisions' },
          activeDivisions: {
            $size: {
              $filter: {
                input: '$divisions',
                cond: { $eq: ['$$this.status', 'active'] }
              }
            }
          }
        }
      }
    ]);

    if (!classData || classData.length === 0) {
      const response: ApiResponse = {
        success: false,
        message: 'Class not found'
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse = {
      success: true,
      message: 'Class retrieved successfully',
      data: classData[0]
    };

    res.json(response);
  } catch (error) {
    console.error('Get class error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error retrieving class'
    };
    res.status(500).json(response);
  }
});

// @desc    Create new class
// @route   POST /api/classes
// @access  Private
router.post('/', checkPermission('classes', 'create'), validate(createClassSchema), async (req: AuthenticatedRequest, res) => {
  try {
    // Check if class name already exists for the same academic year and branch
    const existingClass = await Class.findOne({
      name: req.body.name,
      academicYear: req.body.academicYear,
      branchId: req.user!.branchId || req.body.branchId
    });

    if (existingClass) {
      const response: ApiResponse = {
        success: false,
        message: 'Class with this name already exists for the academic year'
      };
      return res.status(400).json(response);
    }

    // Create class with branch ID - ensure branchId is always set
    const classData = {
      ...req.body,
      branchId: req.user!.branchId || req.body.branchId
    };

    // Validate that branchId exists
    if (!classData.branchId) {
      const response: ApiResponse = {
        success: false,
        message: 'Branch ID is required. User must be assigned to a branch.'
      };
      return res.status(400).json(response);
    }

    const newClass = new Class(classData);
    await newClass.save();

    // Log activity
    await ActivityLog.create({
      userId: req.user!._id,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: 'CREATE',
      module: 'Classes',
      details: `Created class: ${newClass.name} (${newClass.academicYear})`,
      ipAddress: req.ip,
      branchId: newClass.branchId
    });

    const response: ApiResponse = {
      success: true,
      message: 'Class created successfully',
      data: newClass
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Create class error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error creating class'
    };
    res.status(500).json(response);
  }
});

// @desc    Update class
// @route   PUT /api/classes/:id
// @access  Private
router.put('/:id', checkPermission('classes', 'update'), validate(updateClassSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const filter: any = { _id: req.params.id };

    // Branch filter for non-super admins
    if (req.user!.role !== 'super_admin') {
      filter.branchId = req.user!.branchId;
    }

    // Check if class name is being updated and already exists
    if (req.body.name || req.body.academicYear) {
      const existingClass = await Class.findOne({
        name: req.body.name || undefined,
        academicYear: req.body.academicYear || undefined,
        branchId: req.user!.branchId,
        _id: { $ne: req.params.id }
      });

      if (existingClass) {
        const response: ApiResponse = {
          success: false,
          message: 'Another class with this name already exists for the academic year'
        };
        return res.status(400).json(response);
      }
    }

    const updatedClass = await Class.findOneAndUpdate(
      filter,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedClass) {
      const response: ApiResponse = {
        success: false,
        message: 'Class not found'
      };
      return res.status(404).json(response);
    }

    // Log activity
    await ActivityLog.create({
      userId: req.user!._id,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: 'UPDATE',
      module: 'Classes',
      details: `Updated class: ${updatedClass.name} (${updatedClass.academicYear})`,
      ipAddress: req.ip,
      branchId: updatedClass.branchId
    });

    const response: ApiResponse = {
      success: true,
      message: 'Class updated successfully',
      data: updatedClass
    };

    res.json(response);
  } catch (error) {
    console.error('Update class error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error updating class'
    };
    res.status(500).json(response);
  }
});

// @desc    Delete class
// @route   DELETE /api/classes/:id
// @access  Private
router.delete('/:id', checkPermission('classes', 'delete'), async (req: AuthenticatedRequest, res) => {
  try {
    const filter: any = { _id: req.params.id };

    // Branch filter for non-super admins
    if (req.user!.role !== 'super_admin') {
      filter.branchId = req.user!.branchId;
    }

    // Check if class has divisions
    const divisionsCount = await Division.countDocuments({ classId: req.params.id });
    if (divisionsCount > 0) {
      const response: ApiResponse = {
        success: false,
        message: 'Cannot delete class with existing divisions. Please delete divisions first.'
      };
      return res.status(400).json(response);
    }

    // Check if class has students
    const studentsCount = await Student.countDocuments({ class: req.params.id });
    if (studentsCount > 0) {
      const response: ApiResponse = {
        success: false,
        message: 'Cannot delete class with existing students. Please move students first.'
      };
      return res.status(400).json(response);
    }

    const deletedClass = await Class.findOneAndDelete(filter);

    if (!deletedClass) {
      const response: ApiResponse = {
        success: false,
        message: 'Class not found'
      };
      return res.status(404).json(response);
    }

    // Log activity
    await ActivityLog.create({
      userId: req.user!._id,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: 'DELETE',
      module: 'Classes',
      details: `Deleted class: ${deletedClass.name} (${deletedClass.academicYear})`,
      ipAddress: req.ip,
      branchId: deletedClass.branchId
    });

    const response: ApiResponse = {
      success: true,
      message: 'Class deleted successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Delete class error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error deleting class'
    };
    res.status(500).json(response);
  }
});

// @desc    Get class statistics
// @route   GET /api/classes/stats/overview
// @access  Private
router.get('/stats/overview', checkPermission('classes', 'read'), async (req: AuthenticatedRequest, res) => {
  try {
    const filter: any = {};

    // Branch filter for non-super admins
    if (req.user!.role !== 'super_admin') {
      filter.branchId = req.user!.branchId;
    }

    const [
      totalClasses,
      activeClasses,
      inactiveClasses,
      academicYearStats,
      classWithDivisions
    ] = await Promise.all([
      Class.countDocuments(filter),
      Class.countDocuments({ ...filter, status: 'active' }),
      Class.countDocuments({ ...filter, status: 'inactive' }),
      Class.aggregate([
        { $match: filter },
        { $group: { _id: '$academicYear', count: { $sum: 1 } } },
        { $sort: { _id: -1 } }
      ]),
      Class.aggregate([
        { $match: filter },
        {
          $lookup: {
            from: 'divisions',
            localField: '_id',
            foreignField: 'classId',
            as: 'divisions'
          }
        },
        {
          $project: {
            name: 1,
            academicYear: 1,
            divisionCount: { $size: '$divisions' }
          }
        },
        { $sort: { name: 1 } }
      ])
    ]);

    const response: ApiResponse = {
      success: true,
      message: 'Class statistics retrieved successfully',
      data: {
        total: totalClasses,
        active: activeClasses,
        inactive: inactiveClasses,
        academicYearStats,
        classWithDivisions
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Get class stats error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error retrieving class statistics'
    };
    res.status(500).json(response);
  }
});

export default router;