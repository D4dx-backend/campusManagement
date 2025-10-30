import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { AuthenticatedRequest, ApiResponse } from '../types';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// @desc    Debug current user info
// @route   GET /api/debug/me
// @access  Private
router.get('/me', async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;

    const response: ApiResponse = {
      success: true,
      message: 'User info retrieved',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        roleType: typeof user.role,
        branchId: user.branchId,
        status: user.status,
        permissions: user.permissions,
        permissionCount: user.permissions?.length || 0,
        hasReceiptConfigPermission: user.permissions?.some(p => p.module === 'receipt-config'),
        isSuperAdmin: user.role === 'super_admin',
        isBranchAdmin: user.role === 'branch_admin',
        canAccessReceiptConfig: user.role === 'super_admin' || user.role === 'branch_admin'
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Debug me error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error'
    };
    res.status(500).json(response);
  }
});

// @desc    Test authorization for receipt config
// @route   GET /api/debug/test-receipt-auth
// @access  Private (Super Admin and Branch Admin)
router.get('/test-receipt-auth', authorize('super_admin', 'branch_admin'), async (req: AuthenticatedRequest, res) => {
  try {
    const response: ApiResponse = {
      success: true,
      message: 'Authorization successful! You can access receipt configuration.',
      data: {
        userRole: req.user!.role,
        userName: req.user!.name
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Test auth error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error'
    };
    res.status(500).json(response);
  }
});

export default router;
