import express from 'express';
import Joi from 'joi';
import { User } from '../models/User';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { AuthenticatedRequest, ApiResponse } from '../types';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

const createUserSchema = Joi.object({
  email: Joi.string().email().required(),
  mobile: Joi.string().pattern(/^[0-9]{10}$/).required(),
  pin: Joi.string().min(4).max(6).required(),
  name: Joi.string().min(2).max(50).required(),
  role: Joi.string().valid('super_admin', 'branch_admin', 'accountant', 'teacher', 'staff').required(),
  branchId: Joi.string().optional().allow(''),
  permissions: Joi.array()
    .items(
      Joi.object({
        module: Joi.string().required(),
        actions: Joi.array().items(Joi.string().valid('create', 'read', 'update', 'delete')).required(),
      })
    )
    .default([]),
  status: Joi.string().valid('active', 'inactive').default('active'),
});

const updateUserSchema = Joi.object({
  email: Joi.string().email().optional(),
  mobile: Joi.string().pattern(/^[0-9]{10}$/).optional(),
  pin: Joi.string().min(4).max(6).optional(),
  name: Joi.string().min(2).max(50).optional(),
  role: Joi.string().valid('super_admin', 'branch_admin', 'accountant', 'teacher', 'staff').optional(),
  branchId: Joi.string().optional().allow(''),
  permissions: Joi.array()
    .items(
      Joi.object({
        module: Joi.string().required(),
        actions: Joi.array().items(Joi.string().valid('create', 'read', 'update', 'delete')).required(),
      })
    )
    .optional(),
  status: Joi.string().valid('active', 'inactive').optional(),
});

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Super Admin and Branch Admin)
router.get('/', authorize('super_admin', 'branch_admin'), async (req: AuthenticatedRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string || '';
    const role = req.query.role as string;
    const status = req.query.status as string;

    // Build filter
    const filter: any = {};
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } }
      ];
    }

    if (req.user!.role !== 'super_admin') {
      filter.branchId = req.user!.branchId;
    }

    if (role) {
      filter.role = role;
    }

    if (status) {
      filter.status = status;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute query
    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-pin')
        .populate('branchId', 'name code')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter)
    ]);

    const response: ApiResponse = {
      success: true,
      message: 'Users retrieved successfully',
      data: users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Get users error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error retrieving users'
    };
    res.status(500).json(response);
  }
});

// @desc    Create user
// @route   POST /api/users
// @access  Private (Super Admin and Branch Admin)
router.post('/', authorize('super_admin', 'branch_admin'), validate(createUserSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const { email, mobile, pin, name, role, branchId, permissions, status } = req.body;

    if (req.user!.role === 'branch_admin' && (role === 'super_admin' || role === 'branch_admin')) {
      const response: ApiResponse = {
        success: false,
        message: 'Branch admins cannot create admin accounts'
      };
      return res.status(403).json(response);
    }

    const existingUser = await User.findOne({
      $or: [{ email }, { mobile }]
    });

    if (existingUser) {
      const response: ApiResponse = {
        success: false,
        message: 'User with this email or mobile already exists'
      };
      return res.status(400).json(response);
    }

    let assignedBranchId;
    if (role === 'super_admin') {
      assignedBranchId = undefined;
    } else if (req.user!.role === 'super_admin') {
      assignedBranchId = branchId;
    } else {
      assignedBranchId = req.user!.branchId;
    }

    if (role !== 'super_admin' && !assignedBranchId) {
      const response: ApiResponse = {
        success: false,
        message: 'Branch ID is required for non-super admin users'
      };
      return res.status(400).json(response);
    }

    const user = new User({
      email,
      mobile,
      pin,
      name,
      role,
      branchId: assignedBranchId,
      permissions: permissions || [],
      status: status || 'active'
    });

    await user.save();

    const response: ApiResponse = {
      success: true,
      message: 'User created successfully',
      data: user.toJSON()
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Create user error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error creating user'
    };
    res.status(500).json(response);
  }
});

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (Super Admin and Branch Admin)
router.put('/:id', authorize('super_admin', 'branch_admin'), validate(updateUserSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const userToUpdate = await User.findById(req.params.id).select('+pin');
    if (!userToUpdate) {
      const response: ApiResponse = {
        success: false,
        message: 'User not found'
      };
      return res.status(404).json(response);
    }

    if (req.user!.role !== 'super_admin') {
      if (!req.user!.branchId || userToUpdate.branchId?.toString() !== req.user!.branchId.toString()) {
        const response: ApiResponse = {
          success: false,
          message: 'Access denied for this user'
        };
        return res.status(403).json(response);
      }

      if (req.body.role && (req.body.role === 'super_admin' || req.body.role === 'branch_admin')) {
        const response: ApiResponse = {
          success: false,
          message: 'Branch admins cannot assign admin roles'
        };
        return res.status(403).json(response);
      }

      if (req.body.branchId && req.body.branchId !== req.user!.branchId.toString()) {
        const response: ApiResponse = {
          success: false,
          message: 'Branch admins cannot change branch assignment'
        };
        return res.status(403).json(response);
      }
    }

    if (req.body.email && req.body.email !== userToUpdate.email) {
      const emailExists = await User.findOne({ email: req.body.email, _id: { $ne: userToUpdate._id } });
      if (emailExists) {
        const response: ApiResponse = {
          success: false,
          message: 'Email already in use'
        };
        return res.status(400).json(response);
      }
      userToUpdate.email = req.body.email;
    }

    if (req.body.mobile && req.body.mobile !== userToUpdate.mobile) {
      const mobileExists = await User.findOne({ mobile: req.body.mobile, _id: { $ne: userToUpdate._id } });
      if (mobileExists) {
        const response: ApiResponse = {
          success: false,
          message: 'Mobile number already in use'
        };
        return res.status(400).json(response);
      }
      userToUpdate.mobile = req.body.mobile;
    }

    if (req.body.name !== undefined) userToUpdate.name = req.body.name;
    if (req.body.pin) userToUpdate.pin = req.body.pin;
    if (req.body.permissions !== undefined) userToUpdate.permissions = req.body.permissions;
    if (req.body.status !== undefined) userToUpdate.status = req.body.status;

    if (req.body.role !== undefined) {
      userToUpdate.role = req.body.role;
      if (req.body.role === 'super_admin') {
        userToUpdate.branchId = undefined;
      }
    }

    if (req.body.branchId && req.user!.role === 'super_admin') {
      userToUpdate.branchId = req.body.branchId || undefined;
    }

    await userToUpdate.save();

    const response: ApiResponse = {
      success: true,
      message: 'User updated successfully',
      data: userToUpdate.toJSON()
    };

    res.json(response);
  } catch (error) {
    console.error('Update user error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error updating user'
    };
    res.status(500).json(response);
  }
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Super Admin and Branch Admin)
router.delete('/:id', authorize('super_admin', 'branch_admin'), async (req: AuthenticatedRequest, res) => {
  try {
    const userToDelete = await User.findById(req.params.id);
    if (!userToDelete) {
      const response: ApiResponse = {
        success: false,
        message: 'User not found'
      };
      return res.status(404).json(response);
    }

    if (req.user!.role !== 'super_admin') {
      if (!req.user!.branchId || userToDelete.branchId?.toString() !== req.user!.branchId.toString()) {
        const response: ApiResponse = {
          success: false,
          message: 'Access denied for this user'
        };
        return res.status(403).json(response);
      }

      if (userToDelete.role === 'super_admin' || userToDelete.role === 'branch_admin') {
        const response: ApiResponse = {
          success: false,
          message: 'Branch admins cannot delete admin accounts'
        };
        return res.status(403).json(response);
      }
    }

    await User.findByIdAndDelete(req.params.id);

    const response: ApiResponse = {
      success: true,
      message: 'User deleted successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Delete user error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error deleting user'
    };
    res.status(500).json(response);
  }
});

export default router;