import { Branch } from '../models/Branch';
import { AuthenticatedRequest } from '../types';

/**
 * Get the appropriate branchId for the current user and operation
 * For super admin users without a branchId, uses the first available active branch
 * For other users, uses their assigned branchId
 */
export const getBranchId = async (req: AuthenticatedRequest, providedBranchId?: string): Promise<string | null> => {
  // Use provided branchId if available
  if (providedBranchId) {
    return providedBranchId;
  }

  // Use user's branchId if available
  if (req.user!.branchId) {
    return req.user!.branchId;
  }

  // For platform/org admin users without a branchId, use the first available active branch
  if (['platform_admin', 'org_admin'].includes(req.user!.role)) {
    const branchFilter: any = { status: 'active' };
    if (req.user!.organizationId) {
      branchFilter.organizationId = req.user!.organizationId;
    }
    const firstBranch = await Branch.findOne(branchFilter);
    if (firstBranch) {
      return firstBranch._id.toString();
    }
  }

  return null;
};

/**
 * Get the appropriate branchId for the current user and operation
 * Throws an error if no branchId can be determined
 */
export const getRequiredBranchId = async (req: AuthenticatedRequest, providedBranchId?: string): Promise<string> => {
  const branchId = await getBranchId(req, providedBranchId);
  
  if (!branchId) {
    throw new Error('Branch information is required for this operation');
  }
  
  return branchId;
};