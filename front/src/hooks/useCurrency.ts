import { useAuth } from '@/contexts/AuthContext';
import { useBranchContext } from '@/contexts/BranchContext';
import { useBranch } from '@/hooks/useBranches';
import { useCurrentOrganization, useOrganization } from '@/hooks/useOrganizations';
import { formatCurrencyAmount } from '@/utils/currency';

interface UseCurrencyOptions {
  branchId?: string | null;
  organizationId?: string | null;
  enabled?: boolean;
}

export const useCurrency = (options: UseCurrencyOptions = {}) => {
  const { user } = useAuth();
  const { selectedBranchId: contextSelectedBranchId } = useBranchContext();

  const enabled = options.enabled ?? true;
  const effectiveBranchId =
    options.branchId !== undefined
      ? options.branchId
      : contextSelectedBranchId || user?.branchId || null;

  const { data: selectedBranchResponse } = useBranch(enabled && effectiveBranchId ? effectiveBranchId : '');
  const selectedBranch = selectedBranchResponse?.data;

  const selectedOrganizationId =
    options.organizationId !== undefined
      ? options.organizationId
      : user?.role === 'platform_admin'
        ? selectedBranch?.organizationId || null
        : null;

  const { data: currentOrganizationResponse } = useCurrentOrganization(
    enabled && !!user && user.role !== 'platform_admin' && !selectedOrganizationId
  );
  const { data: selectedOrganizationResponse } = useOrganization(
    enabled && selectedOrganizationId ? selectedOrganizationId : ''
  );

  const currencyCode =
    selectedBranch?.currency ||
    selectedOrganizationResponse?.data?.currency ||
    currentOrganizationResponse?.data?.currency ||
    'BHD';
  const currencySymbol =
    selectedBranch?.currencySymbol ||
    selectedOrganizationResponse?.data?.currencySymbol ||
    currentOrganizationResponse?.data?.currencySymbol ||
    currencyCode;

  const formatCurrency = (amount: number | string | undefined | null) =>
    formatCurrencyAmount(amount, currencySymbol);

  return {
    currencyCode,
    currencySymbol,
    formatCurrency,
  };
};