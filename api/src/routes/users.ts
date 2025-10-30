import express from 'express';
import { User } from '../models/User';
import { authenticate, authorize } from '../middleware/auth';
import { AuthenticatedRequest, ApiResponse } from '../types';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Super Admin only)
router.get('/', authorize('super_admin'), async (req: AuthenticatedRequest, res) => {
  try {
    const users = await User.find().select('-pin').populate('branchId', 'name code');

    const response: ApiResponse = {
      success: true,
      message: 'Users retrieved successfully',
      data: users
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

// Add more user management routes here...

export default router;