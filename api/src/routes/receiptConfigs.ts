import express from 'express';
import { Types } from 'mongoose';
import { ReceiptConfig } from '../models/ReceiptConfig';
import { Branch } from '../models/Branch';
import { authenticate, authorize } from '../middleware/auth';
import { AuthenticatedRequest, ApiResponse } from '../types';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// @desc    Get all receipt configurations
// @route   GET /api/receipt-configs
// @access  Private (Super Admin only)
router.get('/', authorize('super_admin'), async (req: AuthenticatedRequest, res) => {
  try {
    const configs = await ReceiptConfig.find().populate('branchId', 'name code');

    const response: ApiResponse = {
      success: true,
      message: 'Receipt configurations retrieved successfully',
      data: configs
    };

    res.json(response);
  } catch (error) {
    console.error('Get receipt configs error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error retrieving receipt configurations'
    };
    res.status(500).json(response);
  }
});

// @desc    Get current user's receipt configuration
// @route   GET /api/receipt-configs/current
// @access  Private
router.get('/current', async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;

    let config;

    if (user.role === 'super_admin') {
      // For super admin, get the first active config or allow branch selection via query param
      const branchId = req.query.branchId as string;
      
      if (branchId) {
        config = await ReceiptConfig.findOne({ 
          branchId, 
          isActive: true 
        }).populate('branchId', 'name code');
      } else {
        // Get the first active config available
        config = await ReceiptConfig.findOne({ 
          isActive: true 
        }).populate('branchId', 'name code');
      }
    } else {
      // For other users, check if they have a branchId
      if (!user.branchId) {
        const response: ApiResponse = {
          success: false,
          message: 'User is not assigned to any branch'
        };
        return res.status(400).json(response);
      }

      config = await ReceiptConfig.findOne({ 
        branchId: user.branchId, 
        isActive: true 
      }).populate('branchId', 'name code');
    }

    if (!config) {
      const response: ApiResponse = {
        success: false,
        message: 'Receipt configuration not found'
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse = {
      success: true,
      message: 'Receipt configuration retrieved successfully',
      data: config
    };

    res.json(response);
  } catch (error) {
    console.error('Get current receipt config error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error retrieving receipt configuration'
    };
    res.status(500).json(response);
  }
});

// @desc    Get receipt configuration by branch
// @route   GET /api/receipt-configs/branch/:branchId
// @access  Private
router.get('/branch/:branchId', async (req: AuthenticatedRequest, res) => {
  try {
    const { branchId } = req.params;
    const user = req.user!;

    // Check if user has access to this branch
    if (user.role !== 'super_admin' && user.branchId && !new Types.ObjectId(user.branchId).equals(branchId)) {
      const response: ApiResponse = {
        success: false,
        message: 'Access denied to this branch'
      };
      return res.status(403).json(response);
    }

    const config = await ReceiptConfig.findOne({ 
      branchId, 
      isActive: true 
    }).populate('branchId', 'name code');

    if (!config) {
      const response: ApiResponse = {
        success: false,
        message: 'Receipt configuration not found for this branch'
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse = {
      success: true,
      message: 'Receipt configuration retrieved successfully',
      data: config
    };

    res.json(response);
  } catch (error) {
    console.error('Get receipt config by branch error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error retrieving receipt configuration'
    };
    res.status(500).json(response);
  }
});

// @desc    Create receipt configuration
// @route   POST /api/receipt-configs
// @access  Private (Super Admin and Branch Admin)
router.post('/', authorize('super_admin', 'branch_admin'), async (req: AuthenticatedRequest, res) => {
  try {
    const {
      branchId,
      schoolName,
      address,
      phone,
      email,
      website,
      logo,
      principalName,
      taxNumber,
      registrationNumber,
      footerText,
      isActive = true
    } = req.body;

    const user = req.user!;

    // Check if user has access to this branch
    if (user.role !== 'super_admin' && user.branchId && !new Types.ObjectId(user.branchId).equals(branchId)) {
      const response: ApiResponse = {
        success: false,
        message: 'Access denied to create configuration for this branch'
      };
      return res.status(403).json(response);
    }

    // Get branch details
    const branch = await Branch.findById(branchId);
    if (!branch) {
      const response: ApiResponse = {
        success: false,
        message: 'Branch not found'
      };
      return res.status(404).json(response);
    }

    // Check if ANY config already exists for this branch (only one config per branch allowed)
    const existingConfig = await ReceiptConfig.findOne({ branchId });
    if (existingConfig) {
      const response: ApiResponse = {
        success: false,
        message: 'Receipt configuration already exists for this branch. Please update the existing configuration instead.'
      };
      return res.status(400).json(response);
    }

    const config = new ReceiptConfig({
      branchId,
      branchName: branch.name,
      schoolName,
      address,
      phone,
      email,
      website,
      logo,
      principalName,
      taxNumber,
      registrationNumber,
      footerText,
      isActive
    });

    await config.save();

    const response: ApiResponse = {
      success: true,
      message: 'Receipt configuration created successfully',
      data: config
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Create receipt config error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error creating receipt configuration'
    };
    res.status(500).json(response);
  }
});

// @desc    Update receipt configuration
// @route   PUT /api/receipt-configs/:id
// @access  Private (Super Admin and Branch Admin)
router.put('/:id', authorize('super_admin', 'branch_admin'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const user = req.user!;

    const config = await ReceiptConfig.findById(id);
    if (!config) {
      const response: ApiResponse = {
        success: false,
        message: 'Receipt configuration not found'
      };
      return res.status(404).json(response);
    }

    // Check if user has access to this branch
    if (user.role !== 'super_admin' && user.branchId && !new Types.ObjectId(user.branchId).equals(config.branchId)) {
      const response: ApiResponse = {
        success: false,
        message: 'Access denied to update this configuration'
      };
      return res.status(403).json(response);
    }

    // If making this config active, deactivate others for the same branch
    if (updateData.isActive && !config.isActive) {
      await ReceiptConfig.updateMany(
        { branchId: config.branchId, _id: { $ne: id } },
        { isActive: false }
      );
    }

    // Update branch name if branchId changed
    if (updateData.branchId && updateData.branchId !== config.branchId.toString()) {
      const branch = await Branch.findById(updateData.branchId);
      if (branch) {
        updateData.branchName = branch.name;
      }
    }

    const updatedConfig = await ReceiptConfig.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    const response: ApiResponse = {
      success: true,
      message: 'Receipt configuration updated successfully',
      data: updatedConfig
    };

    res.json(response);
  } catch (error) {
    console.error('Update receipt config error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error updating receipt configuration'
    };
    res.status(500).json(response);
  }
});

// @desc    Delete receipt configuration
// @route   DELETE /api/receipt-configs/:id
// @access  Private (Super Admin and Branch Admin)
router.delete('/:id', authorize('super_admin', 'branch_admin'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const user = req.user!;

    const config = await ReceiptConfig.findById(id);
    if (!config) {
      const response: ApiResponse = {
        success: false,
        message: 'Receipt configuration not found'
      };
      return res.status(404).json(response);
    }

    // Check if user has access to this branch
    if (user.role !== 'super_admin' && user.branchId && !new Types.ObjectId(user.branchId).equals(config.branchId)) {
      const response: ApiResponse = {
        success: false,
        message: 'Access denied to delete this configuration'
      };
      return res.status(403).json(response);
    }

    await ReceiptConfig.findByIdAndDelete(id);

    const response: ApiResponse = {
      success: true,
      message: 'Receipt configuration deleted successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Delete receipt config error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error deleting receipt configuration'
    };
    res.status(500).json(response);
  }
});

export default router;