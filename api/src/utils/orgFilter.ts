import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../types';

/**
 * Safely convert a value to a Mongoose ObjectId.
 * Returns the original value if it's already an ObjectId, or converts a valid string.
 * Returns undefined for invalid values so they're excluded from the filter.
 */
function toObjectId(val: any): mongoose.Types.ObjectId | undefined {
  if (!val) return undefined;
  if (val instanceof mongoose.Types.ObjectId) return val;
  if (typeof val === 'string' && mongoose.Types.ObjectId.isValid(val)) {
    return new mongoose.Types.ObjectId(val);
  }
  return undefined;
}

/**
 * Get organization and branch filter based on the current user's role.
 * - platform_admin: no filter (sees all) unless query params provided
 * - org_admin: filter by their organizationId
 * - branch_admin and below: filter by organizationId + branchId
 *
 * All IDs are cast to ObjectId so they work with both .find() and .aggregate().
 */
export function getOrgBranchFilter(req: AuthenticatedRequest): { organizationId?: any; branchId?: any } {
  const filter: any = {};

  if (req.user!.role === 'platform_admin') {
    // Platform admin can optionally filter by org/branch via query params
    const orgId = toObjectId(req.query.organizationId);
    const brId = toObjectId(req.query.branchId);
    if (orgId) filter.organizationId = orgId;
    if (brId) filter.branchId = brId;
  } else if (req.user!.role === 'org_admin') {
    filter.organizationId = toObjectId(req.user!.organizationId);
    const brId = toObjectId(req.query.branchId);
    if (brId) filter.branchId = brId;
  } else {
    // Branch-level users
    filter.organizationId = toObjectId(req.user!.organizationId);
    filter.branchId = toObjectId(req.user!.branchId);
  }

  return filter;
}

/**
 * Get organizationId and branchId for creating new documents.
 * Uses the user's own org/branch unless they're platform/org admin using request body values.
 * Also checks req.query.branchId as fallback (set by frontend branch-switcher interceptor).
 */
export function getOrgBranchForCreate(req: AuthenticatedRequest): { organizationId?: any; branchId?: any } {
  const result: any = {};

  if (req.user!.role === 'platform_admin') {
    result.organizationId = toObjectId(req.body.organizationId);
    result.branchId = toObjectId(req.body.branchId) || toObjectId(req.query.branchId as string);
  } else if (req.user!.role === 'org_admin') {
    result.organizationId = toObjectId(req.user!.organizationId);
    result.branchId = toObjectId(req.body.branchId) || toObjectId(req.query.branchId as string) || toObjectId(req.user!.branchId);
  } else {
    result.organizationId = toObjectId(req.user!.organizationId);
    result.branchId = toObjectId(req.user!.branchId);
  }

  return result;
}
