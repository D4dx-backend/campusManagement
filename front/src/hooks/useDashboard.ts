import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

function getSelectedBranchId(): string | null {
  try { return localStorage.getItem('selected_branch_id'); } catch { return null; }
}

export interface DashboardStats {
  students: {
    total: number;
    active: number;
    inactive: number;
  };
  staff: {
    total: number;
    active: number;
    totalSalary: number;
  };
  fees: {
    totalCollection: number;
    monthlyCollection: number;
    yearlyCollection: number;
  };
  expenses: {
    totalExpenses: number;
    monthlyExpenses: number;
    yearlyExpenses: number;
  };
  textbooks: {
    totalBooks: number;
    availableBooks: number;
    totalValue: number;
  };
  recentActivities: Array<{
    userName: string;
    userRole: string;
    module: string;
    action: string;
    details: string;
    timestamp: string;
  }>;
  generatedAt: string;
}

export const useDashboardStats = () => {
  const branchId = getSelectedBranchId();
  return useQuery({
    queryKey: ['dashboard', 'stats', branchId],
    queryFn: async () => {
      const response = await apiClient.get<DashboardStats>('/reports/dashboard');
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // Refetch every 10 minutes
  });
};

export interface PlatformDashboardStats {
  organizations: { total: number; active: number; inactive: number };
  branches: { total: number; active: number };
  users: { total: number; byRole: Record<string, number> };
  students: { active: number };
  recentOrganizations: Array<{
    _id: string;
    name: string;
    code: string;
    status: string;
    branchCount: number;
    userCount: number;
    createdAt: string;
  }>;
  recentActivities: Array<{
    userName: string;
    userRole: string;
    module: string;
    action: string;
    details: string;
    timestamp: string;
  }>;
  generatedAt: string;
}

export const usePlatformDashboard = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['dashboard', 'platform'],
    queryFn: async () => {
      const response = await apiClient.get<PlatformDashboardStats>('/reports/platform-dashboard');
      return response.data;
    },
    enabled,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
  });
};