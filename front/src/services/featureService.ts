import { apiClient } from '@/lib/api';
import { FeatureKey, FeatureRegistryItem } from '@/types';

export const featureService = {
  /** Get the full feature registry (for settings UI) */
  getRegistry: () =>
    apiClient.get<FeatureRegistryItem[]>('/features/registry'),

  /** Get effective features for the current user's context */
  getEffective: (branchId?: string | null) =>
    apiClient.get<{ enabledFeatures: FeatureKey[] }>(
      '/features/effective',
      branchId ? { branchId } : undefined
    ),

  /** Get org's enabled features */
  getOrgFeatures: (organizationId: string) =>
    apiClient.get<{
      organizationId: string;
      organizationName: string;
      enabledFeatures: FeatureKey[];
      allFeatures: FeatureKey[];
    }>(`/features/organization/${organizationId}`),

  /** Update org's enabled features (platform_admin only) */
  updateOrgFeatures: (organizationId: string, enabledFeatures: FeatureKey[]) =>
    apiClient.put<{ enabledFeatures: FeatureKey[] }>(
      `/features/organization/${organizationId}`,
      { enabledFeatures }
    ),

  /** Get branch's enabled features (resolved) */
  getBranchFeatures: (branchId: string) =>
    apiClient.get<{
      branchId: string;
      branchName: string;
      orgEnabledFeatures: FeatureKey[];
      branchEnabledFeatures: FeatureKey[] | null;
      effectiveFeatures: FeatureKey[];
    }>(`/features/branch/${branchId}`),

  /** Update branch's enabled features (org_admin only) */
  updateBranchFeatures: (branchId: string, enabledFeatures: FeatureKey[]) =>
    apiClient.put<{ enabledFeatures: FeatureKey[] }>(
      `/features/branch/${branchId}`,
      { enabledFeatures }
    ),
};
