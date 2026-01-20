import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export interface ActivityLogFilters {
  page?: number;
  limit?: number;
  search?: string;
  module?: string;
  action?: string;
  userId?: string;
  userRole?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: 'timestamp' | 'userName' | 'module' | 'action';
  sortOrder?: 'asc' | 'desc';
}

export const useActivityLogs = (filters: ActivityLogFilters = {}) => {
  return useQuery({
    queryKey: ['activityLogs', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.search) params.append('search', filters.search);
      if (filters.module && filters.module !== 'all') params.append('module', filters.module);
      if (filters.action && filters.action !== 'all') params.append('action', filters.action);
      if (filters.userId) params.append('userId', filters.userId);
      if (filters.userRole) params.append('userRole', filters.userRole);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

      const response = await api.get(`/activity-logs?${params.toString()}`);
      return response.data;
    },
  });
};
