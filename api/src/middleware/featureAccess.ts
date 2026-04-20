import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { Organization } from '../models/Organization';
import { Branch } from '../models/Branch';
import { FEATURE_KEYS, ROUTE_TO_FEATURE, FeatureKey } from '../config/featureRegistry';

/**
 * Resolve the effective enabled features for a given org (and optionally branch).
 * Rules:
 *  - undefined / empty array on org → ALL features enabled (backward compat)
 *  - branch.enabledFeatures undefined/empty → inherits org features
 *  - branch.enabledFeatures set → intersection with org features (branch can only narrow)
 */
export function resolveEnabledFeatures(
  orgFeatures: string[] | undefined | null,
  branchFeatures: string[] | undefined | null
): Set<FeatureKey> {
  // Org: empty/undefined = all features
  const orgSet: Set<string> = (!orgFeatures || orgFeatures.length === 0)
    ? new Set(FEATURE_KEYS as readonly string[])
    : new Set(orgFeatures);

  // Branch: empty/undefined = inherit org; otherwise intersection
  if (!branchFeatures || branchFeatures.length === 0) {
    return orgSet as Set<FeatureKey>;
  }

  const effectiveSet = new Set<FeatureKey>();
  for (const f of branchFeatures) {
    if (orgSet.has(f)) {
      effectiveSet.add(f as FeatureKey);
    }
  }
  return effectiveSet;
}

/**
 * Express middleware that checks whether the requested API route's feature
 * is enabled for the user's organization + branch.
 *
 * Must be mounted AFTER authenticate middleware (needs req.user).
 */
export const checkFeatureAccess = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Platform admins bypass feature checks
    if (req.user?.role === 'platform_admin') {
      return next();
    }

    // Determine which feature this route belongs to
    const path = req.baseUrl; // e.g. "/api/students"
    const featureKey = ROUTE_TO_FEATURE.get(path);

    // If this route is not governed by any feature, allow it
    if (!featureKey) {
      return next();
    }

    const orgId = req.user?.organizationId;
    if (!orgId) {
      return next(); // no org context — let auth middleware handle it
    }

    // Load org's enabled features
    const org = await Organization.findById(orgId).select('enabledFeatures').lean();
    if (!org) {
      return next();
    }

    // Load branch features if user has a branch context
    let branchFeatures: string[] | undefined;
    const branchId = req.user?.branchId;
    if (branchId) {
      const branch = await Branch.findById(branchId).select('enabledFeatures').lean();
      branchFeatures = branch?.enabledFeatures as string[] | undefined;
    }

    const effectiveFeatures = resolveEnabledFeatures(
      org.enabledFeatures as string[] | undefined,
      branchFeatures
    );

    if (!effectiveFeatures.has(featureKey)) {
      res.status(403).json({
        success: false,
        message: `This feature (${featureKey}) is not enabled for your organization.`,
      });
      return;
    }

    next();
  } catch (error) {
    next(error);
  }
};
