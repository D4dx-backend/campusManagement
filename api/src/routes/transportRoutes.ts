import { Router } from 'express';
import { TransportRoute } from '../models/TransportRoute';
import { validate, validateQuery } from '../middleware/validation';
import { authenticate, checkPermission } from '../middleware/auth';
import { 
  createTransportRouteSchema, 
  updateTransportRouteSchema,
  queryTransportRoutesSchema 
} from '../validations/transportRoute';
import { AuthenticatedRequest, ApiResponse } from '../types';

import { getOrgBranchFilter, getOrgBranchForCreate } from '../utils/orgFilter';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// @desc    Get all transport routes
// @route   GET /api/transport-routes
// @access  Private
router.get('/', checkPermission('classes', 'read'), validateQuery(queryTransportRoutesSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const { page = 1, limit = 10, search = '', status, sortBy = 'routeName', sortOrder = 'asc', branchId } = req.query;

    // Build query
    const query: any = {};
    
    // Branch filter - with org isolation
    Object.assign(query, getOrgBranchFilter(req));

    // Status filter
    if (status) {
      query.status = status;
    }

    // Search filter
    if (search) {
      query.$or = [
        { routeName: { $regex: search, $options: 'i' } },
        { routeCode: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);
    const total = await TransportRoute.countDocuments(query);

    // Get routes with pagination and sorting
    const routes = await TransportRoute.find(query)
      .sort({ [sortBy as string]: sortOrder === 'asc' ? 1 : -1 })
      .skip(skip)
      .limit(Number(limit));

    const response: ApiResponse = {
      success: true,
      message: 'Transport routes retrieved successfully',
      data: routes,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Get transport routes error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error retrieving transport routes'
    };
    res.status(500).json(response);
  }
});

// @desc    Get single transport route
// @route   GET /api/transport-routes/:id
// @access  Private
router.get('/:id', checkPermission('classes', 'read'), async (req: AuthenticatedRequest, res) => {
  try {
    const filter: any = { _id: req.params.id };
    
    // Branch filter for non-super admins
    Object.assign(filter, getOrgBranchFilter(req));

    const route = await TransportRoute.findOne(filter);

    if (!route) {
      const response: ApiResponse = {
        success: false,
        message: 'Transport route not found'
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse = {
      success: true,
      message: 'Transport route retrieved successfully',
      data: route
    };

    res.json(response);
  } catch (error) {
    console.error('Get transport route error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error retrieving transport route'
    };
    res.status(500).json(response);
  }
});

// @desc    Create new transport route
// @route   POST /api/transport-routes
// @access  Private (admin/super_admin)
router.post('/', checkPermission('classes', 'create'), validate(createTransportRouteSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const { routeName, routeCode, description, classFees, useDistanceGroups, vehicles, status, branchId: bodyBranchId } = req.body;

    const resolvedBranchId = ['platform_admin', 'org_admin'].includes(req.user!.role) ? bodyBranchId : req.user!.branchId;

    if (!resolvedBranchId) {
      const response: ApiResponse = {
        success: false,
        message: 'Branch is required'
      };
      return res.status(400).json(response);
    }

    // Check if route code already exists in this branch
    const existingRoute = await TransportRoute.findOne({ 
      routeCode: routeCode.toUpperCase(),
      branchId: resolvedBranchId 
    });

    if (existingRoute) {
      const response: ApiResponse = {
        success: false,
        message: 'Transport route with this code already exists'
      };
      return res.status(400).json(response);
    }

    const orgBranch = getOrgBranchForCreate(req);
    const route = new TransportRoute({
      routeName,
      routeCode: routeCode.toUpperCase(),
      description,
      classFees: classFees || [],
      useDistanceGroups: useDistanceGroups || false,
      vehicles: vehicles || [],
      status,
      organizationId: orgBranch.organizationId,
      branchId: resolvedBranchId
    });

    await route.save();

    const response: ApiResponse = {
      success: true,
      message: 'Transport route created successfully',
      data: route
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Create transport route error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error creating transport route'
    };
    res.status(500).json(response);
  }
});

// @desc    Update transport route
// @route   PUT /api/transport-routes/:id
// @access  Private (admin/super_admin)
router.put('/:id', checkPermission('classes', 'update'), validate(updateTransportRouteSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const filter: any = { _id: req.params.id };
    
    // Organization & Branch filter
    Object.assign(filter, getOrgBranchFilter(req));

    // If route code is being updated, check for duplicates
    if (req.body.routeCode) {
      const dupBranchId = ['platform_admin', 'org_admin'].includes(req.user!.role) ? req.body.branchId : req.user!.branchId;
      const existingRoute = await TransportRoute.findOne({
        routeCode: req.body.routeCode.toUpperCase(),
        branchId: dupBranchId,
        _id: { $ne: req.params.id }
      });

      if (existingRoute) {
        const response: ApiResponse = {
          success: false,
          message: 'Transport route with this code already exists'
        };
        return res.status(400).json(response);
      }

      req.body.routeCode = req.body.routeCode.toUpperCase();
    }

    const route = await TransportRoute.findOneAndUpdate(
      filter,
      req.body,
      { new: true, runValidators: true }
    );

    if (!route) {
      const response: ApiResponse = {
        success: false,
        message: 'Transport route not found'
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse = {
      success: true,
      message: 'Transport route updated successfully',
      data: route
    };

    res.json(response);
  } catch (error) {
    console.error('Update transport route error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error updating transport route'
    };
    res.status(500).json(response);
  }
});

// @desc    Delete transport route
// @route   DELETE /api/transport-routes/:id
// @access  Private (admin/super_admin)
router.delete('/:id', checkPermission('classes', 'delete'), async (req: AuthenticatedRequest, res) => {
  try {
    const filter: any = { _id: req.params.id };
    
    // Branch filter for non-super admins
    Object.assign(filter, getOrgBranchFilter(req));

    const route = await TransportRoute.findOneAndDelete(filter);

    if (!route) {
      const response: ApiResponse = {
        success: false,
        message: 'Transport route not found'
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse = {
      success: true,
      message: 'Transport route deleted successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Delete transport route error:', error);
    const response: ApiResponse = {
      success: false,
      message: 'Server error deleting transport route'
    };
    res.status(500).json(response);
  }
});

export default router;
