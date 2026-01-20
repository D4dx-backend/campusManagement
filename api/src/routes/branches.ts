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

// @desc    Create branch
// @route   POST /api/branches
// @access  Private (Super Admin only)
router.post('/', authorize('super_admin'), async (req: AuthenticatedRequest, res) => {
  try {
    const { name, code, address, phone, email, principalName, establishedDate, status } = req.body;

    // Validate required fields
    if (!name || !code || !address || !phone || !email || !establishedDate) {
      const response: ApiResponse = {
        success: false,
        message: 'Missing required fields: name, code, address, phone, email, and establishedDate are required'
      };
      return res.status(400).json(response);
    }

    // Check if branch code already exists
    const existingBranch = await Branch.findOne({ code: code.toUpperCase() });
    if (existingBranch) {
      const response: ApiResponse = {
        success: false,
        message: 'Branch with this code already exists'
      };
      return res.status(400).json(response);
    }

    // Check if email already exists
    const existingEmail = await Branch.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      const response: ApiResponse = {
        success: false,
        message: 'Branch with this email already exists'
      };
      return res.status(400).json(response);
    }

    const branch = await Branch.create({
      name,
      code: code.toUpperCase(),
      address,
      phone,
      email: email.toLowerCase(),
      principalName,
      establishedDate,
      status: status || 'active',
      createdBy: req.user!._id
    });

    const populatedBranch = await Branch.findById(branch._id)
      .populate('createdBy', 'name email')
      .lean();

    const response: ApiResponse = {
      success: true,
      message: 'Branch created successfully',
      data: populatedBranch
    };

    res.status(201).json(response);
  } catch (error: any) {
    console.error('Create branch error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const response: ApiResponse = {
        success: false,
        message: Object.values(error.errors).map((e: any) => e.message).join(', ')
      };
      return res.status(400).json(response);
    }

    // Handle duplicate key error
    if (error.code === 11000) {
      const response: ApiResponse = {
        success: false,
        message: 'Branch code or email already exists'
      };
      return res.status(400).json(response);
    }

    const response: ApiResponse = {
      success: false,
      message: 'Server error creating branch'
    };
    res.status(500).json(response);
  }
});

// @desc    Get single branch
// @route   GET /api/branches/:id
// @access  Private (Super Admin only)
router.get('/:id', authorize('super_admin'), async (req: AuthenticatedRequest, res) => {
  try {
    const branch = await Branch.findById(req.params.id)
      .populate('createdBy', 'name email')
      .lean();

    if (!branch) {
      const response: ApiResponse = {
        success: false,
        message: 'Branch not found'
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse = {
      success: true,
      message: 'Branch retrieved successfully',
      data: branch
    };

    res.json(response);
  } catch (error) {
    console.error('Get branch error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error retrieving branch'
    };
    res.status(500).json(response);
  }
});

// @desc    Update branch
// @route   PUT /api/branches/:id
// @access  Private (Super Admin only)
router.put('/:id', authorize('super_admin'), async (req: AuthenticatedRequest, res) => {
  try {
    const branch = await Branch.findById(req.params.id);
    
    if (!branch) {
      const response: ApiResponse = {
        success: false,
        message: 'Branch not found'
      };
      return res.status(404).json(response);
    }

    // Check if code is being updated and if it already exists
    if (req.body.code && req.body.code.toUpperCase() !== branch.code) {
      const existingBranch = await Branch.findOne({ 
        code: req.body.code.toUpperCase(),
        _id: { $ne: req.params.id }
      });
      if (existingBranch) {
        const response: ApiResponse = {
          success: false,
          message: 'Branch with this code already exists'
        };
        return res.status(400).json(response);
      }
      req.body.code = req.body.code.toUpperCase();
    }

    // Check if email is being updated and if it already exists
    if (req.body.email && req.body.email.toLowerCase() !== branch.email) {
      const existingEmail = await Branch.findOne({ 
        email: req.body.email.toLowerCase(),
        _id: { $ne: req.params.id }
      });
      if (existingEmail) {
        const response: ApiResponse = {
          success: false,
          message: 'Branch with this email already exists'
        };
        return res.status(400).json(response);
      }
      req.body.email = req.body.email.toLowerCase();
    }

    // Update branch
    Object.assign(branch, req.body);
    await branch.save();

    const populatedBranch = await Branch.findById(branch._id)
      .populate('createdBy', 'name email')
      .lean();

    const response: ApiResponse = {
      success: true,
      message: 'Branch updated successfully',
      data: populatedBranch
    };

    res.json(response);
  } catch (error: any) {
    console.error('Update branch error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const response: ApiResponse = {
        success: false,
        message: Object.values(error.errors).map((e: any) => e.message).join(', ')
      };
      return res.status(400).json(response);
    }

    // Handle duplicate key error
    if (error.code === 11000) {
      const response: ApiResponse = {
        success: false,
        message: 'Branch code or email already exists'
      };
      return res.status(400).json(response);
    }

    const response: ApiResponse = {
      success: false,
      message: 'Server error updating branch'
    };
    res.status(500).json(response);
  }
});

// @desc    Delete branch
// @route   DELETE /api/branches/:id
// @access  Private (Super Admin only)
router.delete('/:id', authorize('super_admin'), async (req: AuthenticatedRequest, res) => {
  try {
    const branch = await Branch.findById(req.params.id);
    
    if (!branch) {
      const response: ApiResponse = {
        success: false,
        message: 'Branch not found'
      };
      return res.status(404).json(response);
    }

    await Branch.findByIdAndDelete(req.params.id);

    const response: ApiResponse = {
      success: true,
      message: 'Branch deleted successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Delete branch error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error deleting branch'
    };
    res.status(500).json(response);
  }
});

export default router;