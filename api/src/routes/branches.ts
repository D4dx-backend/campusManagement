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
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string || '';
    const status = req.query.status as string;

    // Build filter
    const filter: any = {};
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } },
        { principalName: { $regex: search, $options: 'i' } }
      ];
    }

    if (status) {
      filter.status = status;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute query
    const [branches, total] = await Promise.all([
      Branch.find(filter)
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Branch.countDocuments(filter)
    ]);

    const response: ApiResponse = {
      success: true,
      message: 'Branches retrieved successfully',
      data: branches,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
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