import express from 'express';
import { Branch } from '../models/Branch';
import { Organization } from '../models/Organization';
import { authenticate, authorize } from '../middleware/auth';
import { AuthenticatedRequest, ApiResponse } from '../types';
import { resolveSettings } from '../utils/resolveSettings';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// @desc    Get all branches
// @route   GET /api/branches
// @access  Private (Super Admin only)
router.get('/', authorize('platform_admin', 'org_admin'), async (req: AuthenticatedRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string || '';
    const status = req.query.status as string;

    // Build filter
    const filter: any = {};
    
    // Organization isolation
    if (req.user!.role === 'org_admin') {
      filter.organizationId = req.user!.organizationId;
    } else if (req.query.organizationId) {
      filter.organizationId = req.query.organizationId;
    }

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
      message: 'Something went wrong while loading branches. Please try again.'
    };
    res.status(500).json(response);
  }
});

// @desc    Create branch
// @route   POST /api/branches
// @access  Private (Super Admin only)
router.post('/', authorize('platform_admin', 'org_admin'), async (req: AuthenticatedRequest, res) => {
  try {
    const { name, code, address, phone, email, principalName, establishedDate, status, organizationId,
      logo, website, taxId, taxLabel, currency, currencySymbol, country, state, city, pincode,
      registrationNumber, footerText } = req.body;

    // Determine organizationId
    let assignedOrgId;
    if (req.user!.role === 'platform_admin') {
      assignedOrgId = organizationId;
      if (!assignedOrgId) {
        const response: ApiResponse = { success: false, message: 'Organization is required. Please select an organization.' };
        return res.status(400).json(response);
      }
    } else {
      assignedOrgId = req.user!.organizationId;
    }

    // Validate required fields
    if (!name || !code || !address || !phone || !email || !establishedDate) {
      const response: ApiResponse = {
        success: false,
        message: 'Missing required fields: name, code, address, phone, email, and establishedDate are required'
      };
      return res.status(400).json(response);
    }

    // Check if branch code already exists within organization
    const existingBranch = await Branch.findOne({ code: code.toUpperCase(), organizationId: assignedOrgId });
    if (existingBranch) {
      const response: ApiResponse = {
        success: false,
        message: 'A branch with this code already exists. Please use a different code.'
      };
      return res.status(400).json(response);
    }

    // Check if email already exists within organization
    const existingEmail = await Branch.findOne({ email: email.toLowerCase(), organizationId: assignedOrgId });
    if (existingEmail) {
      const response: ApiResponse = {
        success: false,
        message: 'A branch with this email already exists. Please use a different email.'
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
      organizationId: assignedOrgId,
      status: status || 'active',
      logo, website, taxId, taxLabel, currency, currencySymbol, country, state, city, pincode,
      registrationNumber, footerText,
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
        message: 'A branch with this code or email already exists.'
      };
      return res.status(400).json(response);
    }

    const response: ApiResponse = {
      success: false,
      message: 'Something went wrong while creating the branch. Please try again.'
    };
    res.status(500).json(response);
  }
});

// @desc    Get single branch
// @route   GET /api/branches/:id
// @access  Private (Super Admin only)
router.get('/:id', authorize('platform_admin', 'org_admin'), async (req: AuthenticatedRequest, res) => {
  try {
    const branch = await Branch.findById(req.params.id)
      .populate('createdBy', 'name email')
      .lean();

    if (!branch) {
      const response: ApiResponse = {
        success: false,
        message: 'Branch was not found.'
      };
      return res.status(404).json(response);
    }

    // Org isolation: org_admin can only see own org's branches
    if (req.user!.role === 'org_admin' && branch.organizationId?.toString() !== req.user!.organizationId?.toString()) {
      const response: ApiResponse = {
        success: false,
        message: 'You do not have access to this branch.'
      };
      return res.status(403).json(response);
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
      message: 'Something went wrong while loading branch. Please try again.'
    };
    res.status(500).json(response);
  }
});

// @desc    Update branch
// @route   PUT /api/branches/:id
// @access  Private (Super Admin only)
router.put('/:id', authorize('platform_admin', 'org_admin'), async (req: AuthenticatedRequest, res) => {
  try {
    const branch = await Branch.findById(req.params.id);
    
    if (!branch) {
      const response: ApiResponse = {
        success: false,
        message: 'Branch was not found.'
      };
      return res.status(404).json(response);
    }

    // Org isolation: org_admin can only update own org's branches
    if (req.user!.role === 'org_admin' && branch.organizationId?.toString() !== req.user!.organizationId?.toString()) {
      const response: ApiResponse = {
        success: false,
        message: 'You do not have access to this branch.'
      };
      return res.status(403).json(response);
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
          message: 'A branch with this code already exists. Please use a different code.'
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
          message: 'A branch with this email already exists. Please use a different email.'
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
        message: 'A branch with this code or email already exists.'
      };
      return res.status(400).json(response);
    }

    const response: ApiResponse = {
      success: false,
      message: 'Something went wrong while updating the branch. Please try again.'
    };
    res.status(500).json(response);
  }
});

// @desc    Delete branch
// @route   DELETE /api/branches/:id
// @access  Private (Super Admin only)
router.delete('/:id', authorize('platform_admin', 'org_admin'), async (req: AuthenticatedRequest, res) => {
  try {
    const branch = await Branch.findById(req.params.id);
    
    if (!branch) {
      const response: ApiResponse = {
        success: false,
        message: 'Branch was not found.'
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
      message: 'Something went wrong while deleting the branch. Please try again.'
    };
    res.status(500).json(response);
  }
});

// @desc    Get resolved settings for a branch (branch overrides + org defaults merged)
// @route   GET /api/branches/:id/settings
// @access  Private
router.get('/:id/settings', async (req: AuthenticatedRequest, res) => {
  try {
    const branch = await Branch.findById(req.params.id).lean();
    if (!branch) {
      return res.status(404).json({ success: false, message: 'Branch was not found.' });
    }

    // Org isolation
    if (req.user!.role === 'org_admin' && branch.organizationId?.toString() !== req.user!.organizationId?.toString()) {
      return res.status(403).json({ success: false, message: 'You do not have permission to perform this action.' });
    }

    const org = await Organization.findById(branch.organizationId).lean();
    const settings = resolveSettings(org, branch);

    res.json({ success: true, data: settings });
  } catch (error) {
    console.error('Get branch settings error:', error);
    res.status(500).json({ success: false, message: 'Something went wrong while loading settings. Please try again.' });
  }
});

export default router;