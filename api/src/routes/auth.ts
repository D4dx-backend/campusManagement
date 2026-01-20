import express from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { ActivityLog } from '../models/ActivityLog';
import { validate } from '../middleware/validation';
import { authenticate } from '../middleware/auth';
import { loginSchema, registerSchema, changePasswordSchema } from '../validations/auth';
import { AuthenticatedRequest, ApiResponse } from '../types';

const router = express.Router();

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', validate(loginSchema), async (req, res) => {
  try {
    const { mobile, pin } = req.body;

    // Find user by mobile
    const user = await User.findOne({ mobile }).select('+pin');
    if (!user) {
      const response: ApiResponse = {
        success: false,
        message: 'Invalid credentials'
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

    // Check PIN
    const isMatch = await user.comparePin(pin);
    if (!isMatch) {
      const response: ApiResponse = {
        success: false,
        message: 'Invalid credentials'
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
          branchId: user.branchId,
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
      message: 'Server error during login'
    };
    res.status(500).json(response);
  }
});

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Private (Super Admin only)
router.post('/register', authenticate, validate(registerSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const { email, mobile, pin, name, role, branchId, permissions, status } = req.body;

    // Additional validation based on current user role
    if (role !== 'super_admin' && req.user!.role === 'super_admin' && !branchId) {
      const response: ApiResponse = {
        success: false,
        message: 'Branch ID is required when super admin creates non-super admin users'
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
        message: 'User with this email or mobile already exists'
      };
      return res.status(400).json(response);
    }

    // Determine branchId based on user role and current user
    let assignedBranchId;
    if (role === 'super_admin') {
      assignedBranchId = undefined; // Super admins don't have a branch
    } else if (req.user!.role === 'super_admin') {
      // Super admin creating user - use provided branchId
      assignedBranchId = branchId;
    } else {
      // Non-super admin creating user - use their own branch
      assignedBranchId = req.user!.branchId;
      
      // If the current user doesn't have a branchId, this is a data issue
      if (!assignedBranchId) {
        const response: ApiResponse = {
          success: false,
          message: 'Your account is not assigned to a branch. Please contact administrator to fix your account.'
        };
        return res.status(400).json(response);
      }
    }



    // Ensure non-super admin users have a branchId
    if (role !== 'super_admin' && !assignedBranchId) {
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
      message: 'Server error during registration'
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
      message: 'Server error retrieving profile'
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
        message: 'User not found'
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
      message: 'Server error changing PIN'
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
      message: 'Server error during logout'
    };
    res.status(500).json(response);
  }
});

export default router;