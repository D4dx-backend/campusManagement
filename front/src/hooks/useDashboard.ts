import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

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
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => {
      const response = await apiClient.get<DashboardStats>('/reports/dashboard');
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // Refetch every 10 minutes
  });
};