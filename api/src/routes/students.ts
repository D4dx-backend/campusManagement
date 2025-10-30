import express from 'express';
import { Student } from '../models/Student';
import { Class } from '../models/Class';
import { ActivityLog } from '../models/ActivityLog';
import { authenticate, checkPermission } from '../middleware/auth';
import { validate, validateQuery } from '../middleware/validation';
import { createStudentSchema, updateStudentSchema, queryStudentsSchema } from '../validations/student';
import { AuthenticatedRequest, ApiResponse, QueryParams } from '../types';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// @desc    Get all students
// @route   GET /api/students
// @access  Private
router.get('/', checkPermission('students', 'read'), validateQuery(queryStudentsSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      class: studentClass = '',
      section = '',
      status = '',
      transport = '',
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
        { name: { $regex: search, $options: 'i' } },
        { admissionNo: { $regex: search, $options: 'i' } },
        { guardianName: { $regex: search, $options: 'i' } }
      ];
    }

    if (studentClass) filter.class = studentClass;
    if (section) filter.section = section;
    if (status) filter.status = status;
    if (transport) filter.transport = transport;

    // Calculate pagination
    const skip = (page - 1) * limit;
    const sortOptions: any = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query
    const [students, total] = await Promise.all([
      Student.find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean(),
      Student.countDocuments(filter)
    ]);

    const response: ApiResponse = {
      success: true,
      message: 'Students retrieved successfully',
      data: students,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Get students error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error retrieving students'
    };
    res.status(500).json(response);
  }
});

// @desc    Get student by ID
// @route   GET /api/students/:id
// @access  Private
router.get('/:id', checkPermission('students', 'read'), async (req: AuthenticatedRequest, res) => {
  try {
    const filter: any = { _id: req.params.id };

    // Branch filter for non-super admins
    if (req.user!.role !== 'super_admin') {
      filter.branchId = req.user!.branchId;
    }

    const student = await Student.findOne(filter);

    if (!student) {
      const response: ApiResponse = {
        success: false,
        message: 'Student not found'
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse = {
      success: true,
      message: 'Student retrieved successfully',
      data: student
    };

    res.json(response);
  } catch (error) {
    console.error('Get student error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error retrieving student'
    };
    res.status(500).json(response);
  }
});

// @desc    Create new student
// @route   POST /api/students
// @access  Private
router.post('/', checkPermission('students', 'create'), validate(createStudentSchema), async (req: AuthenticatedRequest, res) => {
  try {
    // Check if admission number already exists
    const existingStudent = await Student.findOne({ admissionNo: req.body.admissionNo });
    if (existingStudent) {
      const response: ApiResponse = {
        success: false,
        message: 'Student with this admission number already exists'
      };
      return res.status(400).json(response);
    }

    // Get class information
    const classInfo = await Class.findById(req.body.class);
    if (!classInfo) {
      const response: ApiResponse = {
        success: false,
        message: 'Invalid class selected'
      };
      return res.status(400).json(response);
    }

    // Create student with branch ID and class information
    const studentData = {
      ...req.body,
      classId: req.body.class,
      class: classInfo.name,
      branchId: req.user!.branchId || req.body.branchId
    };

    const student = new Student(studentData);
    await student.save();

    // Log activity
    await ActivityLog.create({
      userId: req.user!._id,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: 'CREATE',
      module: 'Students',
      details: `Created student: ${student.name} (${student.admissionNo})`,
      ipAddress: req.ip,
      branchId: student.branchId
    });

    const response: ApiResponse = {
      success: true,
      message: 'Student created successfully',
      data: student
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Create student error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error creating student'
    };
    res.status(500).json(response);
  }
});

// @desc    Update student
// @route   PUT /api/students/:id
// @access  Private
router.put('/:id', checkPermission('students', 'update'), validate(updateStudentSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const filter: any = { _id: req.params.id };

    // Branch filter for non-super admins
    if (req.user!.role !== 'super_admin') {
      filter.branchId = req.user!.branchId;
    }

    // Handle class update if provided
    let updateData = { ...req.body };
    if (req.body.class) {
      const classInfo = await Class.findById(req.body.class);
      if (!classInfo) {
        const response: ApiResponse = {
          success: false,
          message: 'Invalid class selected'
        };
        return res.status(400).json(response);
      }
      updateData.classId = req.body.class;
      updateData.class = classInfo.name;
    }

    const student = await Student.findOneAndUpdate(
      filter,
      updateData,
      { new: true, runValidators: true }
    );

    if (!student) {
      const response: ApiResponse = {
        success: false,
        message: 'Student not found'
      };
      return res.status(404).json(response);
    }

    // Log activity
    await ActivityLog.create({
      userId: req.user!._id,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: 'UPDATE',
      module: 'Students',
      details: `Updated student: ${student.name} (${student.admissionNo})`,
      ipAddress: req.ip,
      branchId: student.branchId
    });

    const response: ApiResponse = {
      success: true,
      message: 'Student updated successfully',
      data: student
    };

    res.json(response);
  } catch (error) {
    console.error('Update student error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error updating student'
    };
    res.status(500).json(response);
  }
});

// @desc    Delete student
// @route   DELETE /api/students/:id
// @access  Private
router.delete('/:id', checkPermission('students', 'delete'), async (req: AuthenticatedRequest, res) => {
  try {
    const filter: any = { _id: req.params.id };

    // Branch filter for non-super admins
    if (req.user!.role !== 'super_admin') {
      filter.branchId = req.user!.branchId;
    }

    const student = await Student.findOneAndDelete(filter);

    if (!student) {
      const response: ApiResponse = {
        success: false,
        message: 'Student not found'
      };
      return res.status(404).json(response);
    }

    // Log activity
    await ActivityLog.create({
      userId: req.user!._id,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: 'DELETE',
      module: 'Students',
      details: `Deleted student: ${student.name} (${student.admissionNo})`,
      ipAddress: req.ip,
      branchId: student.branchId
    });

    const response: ApiResponse = {
      success: true,
      message: 'Student deleted successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Delete student error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error deleting student'
    };
    res.status(500).json(response);
  }
});

// @desc    Get student statistics
// @route   GET /api/students/stats
// @access  Private
router.get('/stats/overview', checkPermission('students', 'read'), async (req: AuthenticatedRequest, res) => {
  try {
    const filter: any = {};

    // Branch filter for non-super admins
    if (req.user!.role !== 'super_admin') {
      filter.branchId = req.user!.branchId;
    }

    const [
      totalStudents,
      activeStudents,
      inactiveStudents,
      transportStats,
      classStats
    ] = await Promise.all([
      Student.countDocuments(filter),
      Student.countDocuments({ ...filter, status: 'active' }),
      Student.countDocuments({ ...filter, status: 'inactive' }),
      Student.aggregate([
        { $match: filter },
        { $group: { _id: '$transport', count: { $sum: 1 } } }
      ]),
      Student.aggregate([
        { $match: filter },
        { $group: { _id: '$class', count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ])
    ]);

    const response: ApiResponse = {
      success: true,
      message: 'Student statistics retrieved successfully',
      data: {
        total: totalStudents,
        active: activeStudents,
        inactive: inactiveStudents,
        transportStats,
        classStats
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Get student stats error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error retrieving student statistics'
    };
    res.status(500).json(response);
  }
});

export default router;