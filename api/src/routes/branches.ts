import express from 'express';
import { Branch } from '../models/Branch';
import { authenticate, authorize } from '../middleware/auth';
import { AuthenticatedRequest, ApiResponse } from '../types';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// @desc    Get all branches
// @route   GET /api/branches
// @access  Private (Super Admin only)
router.get('/', authorize('super_admin'), async (req: AuthenticatedRequest, res) => {
  try {
    const branches = await Branch.find().populate('createdBy', 'name email');

    const response: ApiResponse = {
      success: true,
      message: 'Branches retrieved successfully',
      data: branches
    };

    res.json(response);
  } catch (error) {
    console.error('Get branches error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error retrieving branches'
    };
    res.status(500).json(response);
  }
});

// Add more branch management routes here...

export default router;