import express from 'express';
import Joi from 'joi';
import { Types } from 'mongoose';
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
  role: Joi.string().valid('platform_admin', 'org_admin', 'branch_admin', 'accountant', 'teacher', 'staff').required(),
  organizationId: Joi.string().optional().allow(''),
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
  role: Joi.string().valid('platform_admin', 'org_admin', 'branch_admin', 'accountant', 'teacher', 'staff').optional(),
  organizationId: Joi.string().optional().allow(''),
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
router.get('/', authorize('platform_admin', 'org_admin', 'branch_admin'), async (req: AuthenticatedRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string || '';
    const branchId = req.query.branchId as string || '';
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

    // Organization isolation
    if (req.user!.role === 'platform_admin') {
      // Platform admin can see all users, optionally filter by org
      const orgFilter = req.query.organizationId as string;
      if (orgFilter) filter.organizationId = orgFilter;
    } else if (req.user!.role === 'org_admin') {
      filter.organizationId = req.user!.organizationId;
    } else {
      filter.organizationId = req.user!.organizationId;
      filter.branchId = req.user!.branchId;
    }

    if (req.user!.role !== 'branch_admin' && branchId) {
      if (!Types.ObjectId.isValid(branchId)) {
        const response: ApiResponse = {
          success: false,
          message: 'Invalid branch ID format'
        };
        return res.status(400).json(response);
      }
      filter.branchId = branchId;
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
        .populate('organizationId', 'name code')
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
router.post('/', authorize('platform_admin', 'org_admin', 'branch_admin'), validate(createUserSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const { email, mobile, pin, name, role, branchId, organizationId, permissions, status } = req.body;

    if (req.user!.role === 'branch_admin' && ['platform_admin', 'org_admin', 'branch_admin'].includes(role)) {
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

    // Determine organizationId
    let assignedOrgId;
    if (role === 'platform_admin') {
      assignedOrgId = undefined;
    } else if (req.user!.role === 'platform_admin') {
      assignedOrgId = organizationId;
    } else {
      assignedOrgId = req.user!.organizationId;
    }

    let assignedBranchId;
    if (['platform_admin', 'org_admin'].includes(role)) {
      assignedBranchId = undefined;
    } else if (['platform_admin', 'org_admin'].includes(req.user!.role)) {
      assignedBranchId = branchId;
    } else {
      assignedBranchId = req.user!.branchId;
    }

    if (!['platform_admin', 'org_admin'].includes(role) && !assignedBranchId) {
      const response: ApiResponse = {
        success: false,
        message: 'Branch ID is required for branch-level users'
      };
      return res.status(400).json(response);
    }

    // Auto-grant default permissions based on role
    let defaultPermissions = permissions || [];

    if (role === 'accountant') {
      const moduleDefaults = [
        { module: 'accounting', actions: ['create', 'read', 'update', 'delete'] },
        { module: 'fees', actions: ['create', 'read', 'update', 'delete'] },
        { module: 'expenses', actions: ['create', 'read', 'update', 'delete'] },
        { module: 'reports', actions: ['read'] },
      ];
      for (const def of moduleDefaults) {
        if (!defaultPermissions.some((p: any) => p.module === def.module)) {
          defaultPermissions.push(def);
        }
      }
    }

    if (role === 'teacher') {
      const moduleDefaults = [
        { module: 'classes', actions: ['create', 'read', 'update', 'delete'] },
        { module: 'students', actions: ['read'] },
        { module: 'attendance', actions: ['create', 'read', 'update'] },
        { module: 'timetable', actions: ['read'] },
      ];
      for (const def of moduleDefaults) {
        if (!defaultPermissions.some((p: any) => p.module === def.module)) {
          defaultPermissions.push(def);
        }
      }
    }

    const user = new User({
      email,
      mobile,
      pin,
      name,
      role,
      organizationId: assignedOrgId,
      branchId: assignedBranchId,
      permissions: defaultPermissions,
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
router.put('/:id', authorize('platform_admin', 'org_admin', 'branch_admin'), validate(updateUserSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const userToUpdate = await User.findById(req.params.id).select('+pin');
    if (!userToUpdate) {
      const response: ApiResponse = {
        success: false,
        message: 'User not found'
      };
      return res.status(404).json(response);
    }

    // Org isolation check
    if (req.user!.role === 'org_admin' && userToUpdate.organizationId?.toString() !== req.user!.organizationId?.toString()) {
      const response: ApiResponse = { success: false, message: 'Access denied for this user' };
      return res.status(403).json(response);
    }

    if (req.user!.role === 'branch_admin') {
      if (!req.user!.branchId || userToUpdate.branchId?.toString() !== req.user!.branchId.toString()) {
        const response: ApiResponse = {
          success: false,
          message: 'Access denied for this user'
        };
        return res.status(403).json(response);
      }

      if (req.body.role && ['platform_admin', 'org_admin', 'branch_admin'].includes(req.body.role)) {
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
      if (['platform_admin', 'org_admin'].includes(req.body.role)) {
        userToUpdate.branchId = undefined;
      }
      if (req.body.role === 'platform_admin') {
        userToUpdate.organizationId = undefined;
      }
    }

    if (req.body.branchId && ['platform_admin', 'org_admin'].includes(req.user!.role)) {
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
router.delete('/:id', authorize('platform_admin', 'org_admin', 'branch_admin'), async (req: AuthenticatedRequest, res) => {
  try {
    const userToDelete = await User.findById(req.params.id);
    if (!userToDelete) {
      const response: ApiResponse = {
        success: false,
        message: 'User not found'
      };
      return res.status(404).json(response);
    }

    // Org isolation
    if (req.user!.role === 'org_admin' && userToDelete.organizationId?.toString() !== req.user!.organizationId?.toString()) {
      const response: ApiResponse = { success: false, message: 'Access denied for this user' };
      return res.status(403).json(response);
    }

    if (req.user!.role === 'branch_admin') {
      if (!req.user!.branchId || userToDelete.branchId?.toString() !== req.user!.branchId.toString()) {
        const response: ApiResponse = {
          success: false,
          message: 'Access denied for this user'
        };
        return res.status(403).json(response);
      }

      if (['platform_admin', 'org_admin', 'branch_admin'].includes(userToDelete.role)) {
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

// @desc    Reset user PIN
// @route   POST /api/users/:id/reset-pin
// @access  Private (Platform Admin, Org Admin, Branch Admin)
router.post('/:id/reset-pin', authorize('platform_admin', 'org_admin', 'branch_admin'), async (req: AuthenticatedRequest, res) => {
  try {
    const userToReset = await User.findById(req.params.id);
    if (!userToReset) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Org isolation
    if (req.user!.role === 'org_admin' && userToReset.organizationId?.toString() !== req.user!.organizationId?.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied for this user' });
    }
    if (req.user!.role === 'branch_admin') {
      if (!req.user!.branchId || userToReset.branchId?.toString() !== req.user!.branchId.toString()) {
        return res.status(403).json({ success: false, message: 'Access denied for this user' });
      }
      if (['platform_admin', 'org_admin', 'branch_admin'].includes(userToReset.role)) {
        return res.status(403).json({ success: false, message: 'Branch admins cannot reset admin PINs' });
      }
    }

    // Generate random 4-digit PIN
    const newPin = Math.floor(1000 + Math.random() * 9000).toString();
    userToReset.pin = newPin;
    await userToReset.save();

    res.json({ success: true, message: 'PIN reset successfully', data: { pin: newPin } });
  } catch (error) {
    console.error('Reset PIN error:', error);
    res.status(500).json({ success: false, message: 'Server error resetting PIN' });
  }
});

export default router;