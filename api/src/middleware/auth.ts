import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { AuthenticatedRequest, UserRole } from '../types';

const toComparableId = (value: unknown): string | null => {
  if (!value) return null;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed || null;
  }
  if (typeof value === 'object' && value !== null) {
    const maybeId = (value as any)._id || (value as any).id;
    if (typeof maybeId === 'string') {
      const trimmed = maybeId.trim();
      return trimmed || null;
    }
    if (maybeId && typeof maybeId.toString === 'function') {
      const stringified = maybeId.toString().trim();
      return stringified || null;
    }
  }
  if (typeof (value as any).toString === 'function') {
    const stringified = (value as any).toString().trim();
    return stringified || null;
  }
  return null;
};

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Please log in to continue. Your session may have expired.'
      });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    const user = await User.findById(decoded.userId).select('-pin');

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Your account was not found. Please log in again.'
      });
      return;
    }

    if (user.status !== 'active') {
      res.status(401).json({
        success: false,
        message: 'Your account is inactive. Please contact the administrator to reactivate it.'
      });
      return;
    }

    req.user = user;

    // Enforce organization-level isolation 
    if (!['platform_admin'].includes(req.user.role)) {
      const userOrgId = toComparableId(req.user.organizationId);
      const requestedOrgId =
        toComparableId(req.params?.organizationId) ||
        toComparableId(req.query?.organizationId) ||
        toComparableId(req.body?.organizationId);

      if (requestedOrgId && userOrgId && requestedOrgId !== userOrgId) {
        res.status(403).json({
          success: false,
          message: 'You do not have permission to access another organization\'s data.'
        });
        return;
      }
    }

    // Enforce branch-level isolation for non-org-admin users whenever a branchId is provided.
    if (!['platform_admin', 'org_admin'].includes(req.user.role)) {
      const userBranchId = toComparableId(req.user.branchId);
      const requestedBranchId =
        toComparableId(req.params?.branchId) ||
        toComparableId(req.query?.branchId) ||
        toComparableId(req.body?.branchId);

      if (requestedBranchId && userBranchId && requestedBranchId !== userBranchId) {
        res.status(403).json({
          success: false,
          message: 'You do not have permission to access another branch\'s data.'
        });
        return;
      }
    }

    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Your session has expired. Please log in again.'
    });
  }
};

export const authorize = (...roles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Please log in to continue.'
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'You do not have the required role to perform this action.'
      });
      return;
    }

    next();
  };
};

export const checkPermission = (module: string, action: 'create' | 'read' | 'update' | 'delete') => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Please log in to continue.'
      });
      return;
    }

    // Platform admin, org admin, and branch admin have all permissions
    if (['platform_admin', 'org_admin', 'branch_admin'].includes(req.user.role)) {
      next();
      return;
    }

    // Check if user has permission for this module and action
    const hasPermission = req.user.permissions.some(
      permission => permission.module === module && permission.actions.includes(action)
    );

    if (!hasPermission) {
      const actionLabel = { create: 'create', read: 'view', update: 'edit', delete: 'delete' }[action] || action;
      const moduleLabel = module.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
      res.status(403).json({
        success: false,
        message: `You don't have permission to ${actionLabel} ${moduleLabel}. Please contact your administrator.`
      });
      return;
    }

    next();
  };
};