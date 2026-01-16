import express from 'express';
import mongoose from 'mongoose';
import { Division } from '../models/Division';
import { Class } from '../models/Class';
import { Staff } from '../models/Staff';
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
const createDivisionSchema = Joi.object({
  classId: Joi.string().required(),
  className: Joi.string().required().trim(),
  name: Joi.string().required().trim(),
  capacity: Joi.number().integer().min(1).required(),
  classTeacherId: Joi.string().optional().allow(''),
  status: Joi.string().valid('active', 'inactive').default('active')
});

const updateDivisionSchema = Joi.object({
  classId: Joi.string().optional(),
  className: Joi.string().optional().trim(),
  name: Joi.string().optional().trim(),
  capacity: Joi.number().integer().min(1).optional(),
  classTeacherId: Joi.string().optional().allow(''),
  classTeacherName: Joi.string().optional().allow('').trim(),
  status: Joi.string().valid('active', 'inactive').optional()
});

const queryDivisionsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().optional().allow(''),
  classId: Joi.string().optional().allow(''),
  status: Joi.string().valid('active', 'inactive').optional(),
  sortBy: Joi.string().valid('name', 'className', 'capacity', 'createdAt').default('className'),
  sortOrder: Joi.string().valid('asc', 'desc').default('asc')
});

// @desc    Get all divisions
// @route   GET /api/divisions
// @access  Private
router.get('/', checkPermission('divisions', 'read'), validateQuery(queryDivisionsSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      classId = '',
      status = '',
      sortBy = 'className',
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
        { className: { $regex: search, $options: 'i' } },
        { classTeacherName: { $regex: search, $options: 'i' } }
      ];
    }

    if (classId) filter.classId = classId;
    if (status) filter.status = status;

    // Calculate pagination
    const skip = (page - 1) * limit;
    const sortOptions: any = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query with student count
    const [divisions, total] = await Promise.all([
      Division.aggregate([
        { $match: filter },
        {
          $lookup: {
            from: 'classes',
            localField: 'classId',
            foreignField: '_id',
            as: 'classInfo'
          }
        },
        {
          $lookup: {
            from: 'staff',
            localField: 'classTeacherId',
            foreignField: '_id',
            as: 'teacherInfo'
          }
        },
        {
          $addFields: {
            className: { $arrayElemAt: ['$classInfo.name', 0] },
            classTeacherName: { $arrayElemAt: ['$teacherInfo.name', 0] }
          }
        },
        { $project: { classInfo: 0, teacherInfo: 0 } },
        { $sort: sortOptions },
        { $skip: skip },
        { $limit: limit }
      ]),
      Division.countDocuments(filter)
    ]);

    // Get student count for each division
    const divisionsWithStudentCount = await Promise.all(
      divisions.map(async (division) => {
        const studentCount = await Student.countDocuments({
          class: division.className,
          section: division.name,
          branchId: division.branchId
        });
        return {
          ...division,
          studentCount,
          availableCapacity: division.capacity - studentCount
        };
      })
    );

    const response: ApiResponse = {
      success: true,
      message: 'Divisions retrieved successfully',
      data: divisionsWithStudentCount,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Get divisions error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error retrieving divisions'
    };
    res.status(500).json(response);
  }
});

// @desc    Get division by ID
// @route   GET /api/divisions/:id
// @access  Private
router.get('/:id', checkPermission('divisions', 'read'), async (req: AuthenticatedRequest, res) => {
  try {
    const filter: any = { _id: req.params.id };

    // Branch filter for non-super admins
    if (req.user!.role !== 'super_admin') {
      filter.branchId = req.user!.branchId;
    }

    const divisionData = await Division.aggregate([
      { $match: filter },
      {
        $lookup: {
          from: 'classes',
          localField: 'classId',
          foreignField: '_id',
          as: 'classInfo'
        }
      },
      {
        $lookup: {
          from: 'staff',
          localField: 'classTeacherId',
          foreignField: '_id',
          as: 'teacherInfo'
        }
      },
      {
        $addFields: {
          className: { $arrayElemAt: ['$classInfo.name', 0] },
          classTeacherName: { $arrayElemAt: ['$teacherInfo.name', 0] }
        }
      },
      { $project: { classInfo: 0, teacherInfo: 0 } }
    ]);

    if (!divisionData || divisionData.length === 0) {
      const response: ApiResponse = {
        success: false,
        message: 'Division not found'
      };
      return res.status(404).json(response);
    }

    const division = divisionData[0];

    // Get student count
    const studentCount = await Student.countDocuments({
      class: division.className,
      section: division.name,
      branchId: division.branchId
    });

    const response: ApiResponse = {
      success: true,
      message: 'Division retrieved successfully',
      data: {
        ...division,
        studentCount,
        availableCapacity: division.capacity - studentCount
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Get division error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error retrieving division'
    };
    res.status(500).json(response);
  }
});

// @desc    Create new division
// @route   POST /api/divisions
// @access  Private
router.post('/', checkPermission('divisions', 'create'), validate(createDivisionSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const { classId, name, capacity, classTeacherId } = req.body;

    // Verify class exists and belongs to the same branch (super admin can access any branch)
    const classFilter: any = { _id: classId };
    if (req.user!.role !== 'super_admin') {
      classFilter.branchId = req.user!.branchId;
    }
    const classExists = await Class.findOne(classFilter);

    if (!classExists) {
      const response: ApiResponse = {
        success: false,
        message: 'Class not found'
      };
      return res.status(404).json(response);
    }

    // Check if division name already exists for the same class
    const divisionFilter: any = { classId, name };
    if (req.user!.role !== 'super_admin') {
      divisionFilter.branchId = req.user!.branchId;
    } else {
      // For super admin, use the class's branchId
      divisionFilter.branchId = classExists.branchId;
    }
    const existingDivision = await Division.findOne(divisionFilter);

    if (existingDivision) {
      const response: ApiResponse = {
        success: false,
        message: 'Division with this name already exists for the class'
      };
      return res.status(400).json(response);
    }

    // Verify class teacher exists if provided
    let classTeacherName = '';
    if (classTeacherId) {
      const teacherFilter: any = { _id: classTeacherId };
      if (req.user!.role !== 'super_admin') {
        teacherFilter.branchId = req.user!.branchId;
      } else {
        // For super admin, use the class's branchId
        teacherFilter.branchId = classExists.branchId;
      }
      const teacher = await Staff.findOne(teacherFilter);

      if (!teacher) {
        const response: ApiResponse = {
          success: false,
          message: 'Class teacher not found'
        };
        return res.status(404).json(response);
      }
      classTeacherName = teacher.name;
    }

    // Create division
    const divisionData = {
      classId,
      className: classExists.name,
      name,
      capacity,
      classTeacherId: classTeacherId || undefined,
      classTeacherName: classTeacherName || undefined,
      branchId: req.user!.role !== 'super_admin' ? req.user!.branchId : classExists.branchId
    };

    const division = new Division(divisionData);
    await division.save();

    // Log activity
    await ActivityLog.create({
      userId: req.user!._id,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: 'CREATE',
      module: 'Divisions',
      details: `Created division: ${classExists.name}-${name}`,
      ipAddress: req.ip,
      branchId: division.branchId
    });

    const response: ApiResponse = {
      success: true,
      message: 'Division created successfully',
      data: division
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Create division error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error creating division'
    };
    res.status(500).json(response);
  }
});

// @desc    Update division
// @route   PUT /api/divisions/:id
// @access  Private
router.put('/:id', checkPermission('divisions', 'update'), validate(updateDivisionSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const filter: any = { _id: req.params.id };

    // Branch filter for non-super admins
    if (req.user!.role !== 'super_admin') {
      filter.branchId = req.user!.branchId;
    }

    const existingDivision = await Division.findOne(filter);
    if (!existingDivision) {
      const response: ApiResponse = {
        success: false,
        message: 'Division not found'
      };
      return res.status(404).json(response);
    }

    // Check if division name is being updated and already exists
    if (req.body.name && req.body.name !== existingDivision.name) {
      const duplicateDivision = await Division.findOne({
        classId: existingDivision.classId,
        name: req.body.name,
        branchId: existingDivision.branchId,
        _id: { $ne: req.params.id }
      });

      if (duplicateDivision) {
        const response: ApiResponse = {
          success: false,
          message: 'Another division with this name already exists for the class'
        };
        return res.status(400).json(response);
      }
    }

    // Verify class teacher exists if provided
    let updateData = { ...req.body };
    if (req.body.classTeacherId) {
      const teacher = await Staff.findOne({
        _id: req.body.classTeacherId,
        branchId: existingDivision.branchId
      });

      if (!teacher) {
        const response: ApiResponse = {
          success: false,
          message: 'Class teacher not found'
        };
        return res.status(404).json(response);
      }
      updateData.classTeacherName = teacher.name;
    } else if (req.body.classTeacherId === '') {
      updateData.classTeacherId = undefined;
      updateData.classTeacherName = undefined;
    }

    const updatedDivision = await Division.findOneAndUpdate(
      filter,
      updateData,
      { new: true, runValidators: true }
    );

    // Log activity
    await ActivityLog.create({
      userId: req.user!._id,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: 'UPDATE',
      module: 'Divisions',
      details: `Updated division: ${updatedDivision!.className}-${updatedDivision!.name}`,
      ipAddress: req.ip,
      branchId: updatedDivision!.branchId
    });

    const response: ApiResponse = {
      success: true,
      message: 'Division updated successfully',
      data: updatedDivision
    };

    res.json(response);
  } catch (error) {
    console.error('Update division error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error updating division'
    };
    res.status(500).json(response);
  }
});

// @desc    Delete division
// @route   DELETE /api/divisions/:id
// @access  Private
router.delete('/:id', checkPermission('divisions', 'delete'), async (req: AuthenticatedRequest, res) => {
  try {
    const filter: any = { _id: req.params.id };

    // Branch filter for non-super admins
    if (req.user!.role !== 'super_admin') {
      filter.branchId = req.user!.branchId;
    }

    const division = await Division.findOne(filter);
    if (!division) {
      const response: ApiResponse = {
        success: false,
        message: 'Division not found'
      };
      return res.status(404).json(response);
    }

    // Check if division has students
    const studentsCount = await Student.countDocuments({
      class: division.className,
      section: division.name,
      branchId: division.branchId
    });

    if (studentsCount > 0) {
      const response: ApiResponse = {
        success: false,
        message: 'Cannot delete division with existing students. Please move students first.'
      };
      return res.status(400).json(response);
    }

    await Division.findOneAndDelete(filter);

    // Log activity
    await ActivityLog.create({
      userId: req.user!._id,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: 'DELETE',
      module: 'Divisions',
      details: `Deleted division: ${division.className}-${division.name}`,
      ipAddress: req.ip,
      branchId: division.branchId
    });

    const response: ApiResponse = {
      success: true,
      message: 'Division deleted successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Delete division error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error deleting division'
    };
    res.status(500).json(response);
  }
});

// @desc    Get divisions by class ID
// @route   GET /api/divisions/class/:classId
// @access  Private
router.get('/class/:classId', checkPermission('divisions', 'read'), async (req: AuthenticatedRequest, res) => {
  try {
    
    // First, let's find the class to get its name
    const classInfo = await Class.findById(req.params.classId);
    
    if (!classInfo) {
      const response: ApiResponse = {
        success: false,
        message: 'Class not found'
      };
      return res.status(404).json(response);
    }

    // Convert classId to ObjectId
    const classIdFilter = new mongoose.Types.ObjectId(req.params.classId);
    
    const filter: any = { classId: classIdFilter };

    // Branch filter for non-super admins
    if (req.user!.role !== 'super_admin') {
      filter.branchId = req.user!.branchId;
    }

    let divisions = await Division.find(filter)
      .populate('classTeacherId', 'name designation')
      .sort({ name: 1 });


    // If no divisions found by classId, try searching by className as fallback
    if (divisions.length === 0) {
      const fallbackFilter: any = { className: classInfo.name };
      
      if (req.user!.role !== 'super_admin') {
        fallbackFilter.branchId = req.user!.branchId;
      }
      
      divisions = await Division.find(fallbackFilter)
        .populate('classTeacherId', 'name designation')
        .sort({ name: 1 });
      
    }


    // Get student count for each division
    const divisionsWithStudentCount = await Promise.all(
      divisions.map(async (division) => {
        const studentCount = await Student.countDocuments({
          classId: division.classId,
          section: division.name,
          branchId: division.branchId
        });
        return {
          ...division.toObject(),
          studentCount,
          availableCapacity: division.capacity - studentCount
        };
      })
    );

    const response: ApiResponse = {
      success: true,
      message: 'Divisions retrieved successfully',
      data: divisionsWithStudentCount
    };

    res.json(response);
  } catch (error) {
    console.error('Get divisions by class error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error retrieving divisions'
    };
    res.status(500).json(response);
  }
});

// @desc    Debug endpoint - Test specific class divisions
// @route   GET /api/divisions/debug/class/:classId
// @access  Private
router.get('/debug/class/:classId', checkPermission('divisions', 'read'), async (req: AuthenticatedRequest, res) => {
  try {
    const classId = req.params.classId;
    
    // Convert to ObjectId
    let classIdFilter;
    if (mongoose.Types.ObjectId.isValid(classId)) {
      classIdFilter = new mongoose.Types.ObjectId(classId);
    } else {
      classIdFilter = classId;
    }
    
    // Test different queries
    const allDivisions = await Division.find({});
    const divisionsByClassId = await Division.find({ classId: classIdFilter });
    const divisionsByClassIdString = await Division.find({ classId: classId });
    const userBranch = req.user!.branchId;
    const divisionsByBranch = await Division.find({ branchId: userBranch });
    const divisionsByClassAndBranch = await Division.find({ classId: classIdFilter, branchId: userBranch });
    
    const response: ApiResponse = {
      success: true,
      message: 'Debug class divisions test',
      data: {
        requestedClassId: classId,
        convertedClassId: classIdFilter,
        userBranchId: userBranch,
        results: {
          totalDivisions: allDivisions.length,
          divisionsByClassId: divisionsByClassId.length,
          divisionsByClassIdString: divisionsByClassIdString.length,
          divisionsByBranch: divisionsByBranch.length,
          divisionsByClassAndBranch: divisionsByClassAndBranch.length
        },
        sampleDivisions: allDivisions.slice(0, 3).map(d => ({
          _id: d._id,
          classId: d.classId,
          className: d.className,
          name: d.name,
          branchId: d.branchId
        })),
        matchingDivisions: divisionsByClassId.map(d => ({
          _id: d._id,
          classId: d.classId,
          className: d.className,
          name: d.name,
          branchId: d.branchId
        }))
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Debug class endpoint error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error in debug class endpoint'
    };
    res.status(500).json(response);
  }
});

// @desc    Debug endpoint - Get all divisions with class info
// @route   GET /api/divisions/debug/all
// @access  Private
router.get('/debug/all', checkPermission('divisions', 'read'), async (req: AuthenticatedRequest, res) => {
  try {
    const divisions = await Division.find({})
      .populate('classId', 'name academicYear')
      .sort({ className: 1, name: 1 });

    const classes = await Class.find({}).sort({ name: 1 });

    // Show detailed mapping
    const divisionClassMapping = divisions.map(div => ({
      divisionId: div._id,
      divisionName: div.name,
      classId: div.classId,
      className: div.className,
      branchId: div.branchId,
      populatedClass: div.classId
    }));

    const response: ApiResponse = {
      success: true,
      message: 'Debug data retrieved successfully',
      data: {
        divisions: divisionClassMapping,
        classes: classes.map(cls => ({
          _id: cls._id,
          name: cls.name,
          academicYear: cls.academicYear,
          branchId: cls.branchId
        })),
        totalDivisions: divisions.length,
        totalClasses: classes.length,
        userInfo: {
          role: req.user!.role,
          branchId: req.user!.branchId
        }
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Debug endpoint error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error retrieving debug data'
    };
    res.status(500).json(response);
  }
});

export default router;