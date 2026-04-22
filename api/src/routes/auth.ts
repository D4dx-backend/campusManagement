import express from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { ActivityLog } from '../models/ActivityLog';
import { validate } from '../middleware/validation';
import { authenticate, authorize } from '../middleware/auth';
import { loginSchema, registerSchema, changePasswordSchema } from '../validations/auth';
import { AuthenticatedRequest, ApiResponse } from '../types';

const router = express.Router();

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', validate(loginSchema), async (req, res) => {
  try {
    const { mobile, pin } = req.body;

    // Find user by mobile (try exact match first, then with country code prefix for legacy data)
    let user = await User.findOne({ mobile }).select('+pin');
    if (!user) {
      // Fallback: search for mobile stored with country code (e.g., +919876543210)
      user = await User.findOne({ mobile: { $regex: new RegExp(mobile + '$') } }).select('+pin');
    }
    if (!user) {
      const response: ApiResponse = {
        success: false,
        message: 'Incorrect mobile number or PIN. Please try again.'
      };
      return res.status(401).json(response);
    }

    // Check if user is active
    if (user.status !== 'active') {
      const response: ApiResponse = {
        success: false,
        message: 'Account is inactive. Please contact administrator.'
      };
      return res.status(401).json(response);
    }

    // Check if user is approved
    if (user.approvalStatus && user.approvalStatus !== 'approved') {
      const response: ApiResponse = {
        success: false,
        message: user.approvalStatus === 'pending'
          ? 'Your account is pending approval. Please contact the organization admin.'
          : 'Your account access has been rejected. Please contact the organization admin.'
      };
      return res.status(401).json(response);
    }

    // Check PIN
    const isMatch = await user.comparePin(pin);
    if (!isMatch) {
      const response: ApiResponse = {
        success: false,
        message: 'Incorrect mobile number or PIN. Please try again.'
      };
      return res.status(401).json(response);
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not defined');
    }
    
    const token = jwt.sign(
      { userId: user._id },
      jwtSecret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as any
    );

    // Log activity
    await ActivityLog.create({
      userId: user._id,
      userName: user.name,
      userRole: user.role,
      action: 'LOGIN',
      module: 'Authentication',
      details: 'User logged in successfully',
      ipAddress: req.ip,
      organizationId: user.organizationId,
      branchId: user.branchId
    });

    const response: ApiResponse = {
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          mobile: user.mobile,
          role: user.role,
          organizationId: user.organizationId,
          branchId: user.branchId,
          studentId: (user as any).studentId || undefined,
          permissions: user.permissions,
          status: user.status,
          lastLogin: user.lastLogin
        }
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Login error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Something went wrong during login. Please try again.'
    };
    res.status(500).json(response);
  }
});

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Private (Super Admin only)
router.post('/register', authenticate, authorize('platform_admin', 'org_admin'), validate(registerSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const { email, mobile, pin, name, role, branchId, organizationId, permissions, status } = req.body;

    // Determine organizationId
    let assignedOrgId;
    if (role === 'platform_admin') {
      assignedOrgId = undefined;
    } else if (req.user!.role === 'platform_admin') {
      assignedOrgId = organizationId;
    } else {
      assignedOrgId = req.user!.organizationId;
    }

    // Validate: non-platform roles need an org
    if (role !== 'platform_admin' && !assignedOrgId) {
      const response: ApiResponse = {
        success: false,
        message: 'Organization ID is required for non-platform admin users'
      };
      return res.status(400).json(response);
    }

    // Additional validation based on current user role
    if (!['platform_admin', 'org_admin'].includes(role) && req.user!.role === 'org_admin' && !branchId) {
      const response: ApiResponse = {
        success: false,
        message: 'Branch ID is required when org admin creates branch-level users'
      };
      return res.status(400).json(response);
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { mobile }]
    });

    if (existingUser) {
      const response: ApiResponse = {
        success: false,
        message: 'A user with this email or mobile number already exists.'
      };
      return res.status(400).json(response);
    }

    // Determine branchId based on user role and current user
    let assignedBranchId;
    if (['platform_admin', 'org_admin'].includes(role)) {
      assignedBranchId = undefined; // Platform/org admins don't have a branch
    } else if (['platform_admin', 'org_admin'].includes(req.user!.role)) {
      // Platform/org admin creating user - use provided branchId
      assignedBranchId = branchId;
    } else {
      // Branch-level user creating user - use their own branch
      assignedBranchId = req.user!.branchId;
      
      if (!assignedBranchId) {
        const response: ApiResponse = {
          success: false,
          message: 'Your account is not assigned to a branch. Please contact administrator to fix your account.'
        };
        return res.status(400).json(response);
      }
    }



    // Ensure branch-level users have a branchId
    if (!['platform_admin', 'org_admin'].includes(role) && !assignedBranchId) {
      const response: ApiResponse = {
        success: false,
        message: 'Unable to determine branch for user. Please contact administrator.'
      };
      return res.status(400).json(response);
    }

    // Set default permissions based on role
    let defaultPermissions = permissions || [];
    
    // Accountants automatically get accounting module permissions
    if (role === 'accountant') {
      const hasAccountingPermission = defaultPermissions.some(
        (p: any) => p.module === 'accounting'
      );
      
      if (!hasAccountingPermission) {
        defaultPermissions.push({
          module: 'accounting',
          actions: ['create', 'read', 'update', 'delete']
        });
      }
    }

    // Create new user
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

    // Log activity
    await ActivityLog.create({
      userId: req.user!._id,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: 'CREATE',
      module: 'Users',
      details: `Created new user: ${name} (${role})`,
      ipAddress: req.ip,
      organizationId: req.user!.organizationId,
      branchId: req.user!.branchId
    });

    const response: ApiResponse = {
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          mobile: user.mobile,
          role: user.role,
          organizationId: user.organizationId,
          branchId: user.branchId,
          permissions: user.permissions,
          status: user.status
        }
      }
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Registration error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Something went wrong during registration. Please try again.'
    };
    res.status(500).json(response);
  }
});

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
router.get('/profile', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const response: ApiResponse = {
      success: true,
      message: 'Profile retrieved successfully',
      data: {
        user: req.user
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Profile error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Something went wrong while loading profile. Please try again.'
    };
    res.status(500).json(response);
  }
});

// @desc    Change user PIN
// @route   PUT /api/auth/change-pin
// @access  Private
router.put('/change-pin', authenticate, validate(changePasswordSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const { currentPin, newPin } = req.body;

    // Get user with PIN
    const user = await User.findById(req.user!._id).select('+pin');
    if (!user) {
      const response: ApiResponse = {
        success: false,
        message: 'User was not found.'
      };
      return res.status(404).json(response);
    }

    // Verify current PIN
    const isMatch = await user.comparePin(currentPin);
    if (!isMatch) {
      const response: ApiResponse = {
        success: false,
        message: 'Current PIN is incorrect'
      };
      return res.status(400).json(response);
    }

    // Update PIN
    user.pin = newPin;
    await user.save();

    // Log activity
    await ActivityLog.create({
      userId: user._id,
      userName: user.name,
      userRole: user.role,
      action: 'UPDATE',
      module: 'Authentication',
      details: 'Changed PIN',
      ipAddress: req.ip,
      organizationId: user.organizationId,
      branchId: user.branchId
    });

    const response: ApiResponse = {
      success: true,
      message: 'PIN changed successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Change PIN error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Something went wrong while changing PIN. Please try again.'
    };
    res.status(500).json(response);
  }
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
router.post('/logout', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    // Log activity
    await ActivityLog.create({
      userId: req.user!._id,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: 'LOGOUT',
      module: 'Authentication',
      details: 'User logged out',
      ipAddress: req.ip,
      organizationId: req.user!.organizationId,
      branchId: req.user!.branchId
    });

    const response: ApiResponse = {
      success: true,
      message: 'Logout successful'
    };

    res.json(response);
  } catch (error) {
    console.error('Logout error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Something went wrong during logout. Please try again.'
    };
    res.status(500).json(response);
  }
});

export default router;