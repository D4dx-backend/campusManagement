import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { branchesApi, Branch } from '@/services/branches';

interface BranchContextType {
  /** List of branches the current user can access */
  branches: Branch[];
  /** Currently selected branch (null = org-level / all branches) */
  selectedBranch: Branch | null;
  /** ID of selected branch, or null for all */
  selectedBranchId: string | null;
  /** Switch to a specific branch — pass null for "All Branches" */
  switchBranch: (branchId: string | null) => void;
  /** Whether the user is currently in branch-level context */
  isBranchContext: boolean;
  /** Loading state while fetching branches */
  isLoading: boolean;
}

const BranchContext = createContext<BranchContextType | undefined>(undefined);

export const useBranchContext = () => {
  const ctx = useContext(BranchContext);
  if (!ctx) throw new Error('useBranchContext must be used within BranchProvider');
  return ctx;
};

const STORAGE_KEY = 'selected_branch_id';

export const BranchProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch branches when user changes
  useEffect(() => {
    if (!user) {
      setBranches([]);
      setSelectedBranchId(null);
      localStorage.removeItem(STORAGE_KEY);
      return;
    }

    const role = user.role;

    // Platform admin doesn't need branch context
    if (role === 'platform_admin') {
      setBranches([]);
      setSelectedBranchId(null);
      localStorage.removeItem(STORAGE_KEY);
      return;
    }

    // Branch-level users are locked to their branch
    if (role !== 'org_admin') {
      setSelectedBranchId(user.branchId || null);
      setBranches([]);
      if (user.branchId) {
        localStorage.setItem(STORAGE_KEY, user.branchId);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
      return;
    }

    // org_admin: fetch all branches in their org
    const fetchBranches = async () => {
      setIsLoading(true);
      try {
        const res = await branchesApi.getBranches();
        const active = (res.data || []).filter((b) => b.status === 'active');
        setBranches(active);

        // Restore previously selected branch
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored && active.some((b) => (b._id || b.id) === stored)) {
          setSelectedBranchId(stored);
        } else {
          setSelectedBranchId(null); // default: all branches (org-level)
        }
      } catch {
        setBranches([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBranches();
  }, [user]);

  const switchBranch = useCallback(
    (branchId: string | null) => {
      setSelectedBranchId(branchId);
      if (branchId) {
        localStorage.setItem(STORAGE_KEY, branchId);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
      // Invalidate all cached queries so every page refetches with new branchId
      queryClient.invalidateQueries();
    },
    [queryClient]
  );

  const selectedBranch = selectedBranchId
    ? branches.find((b) => (b._id || b.id) === selectedBranchId) || null
    : null;

  const isBranchContext = !!selectedBranchId;

  return (
    <BranchContext.Provider
      value={{
        branches,
        selectedBranch,
        selectedBranchId,
        switchBranch,
        isBranchContext,
        isLoading,
      }}
    >
      {children}
    </BranchContext.Provider>
  );
};
