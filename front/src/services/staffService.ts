import { apiClient } from '@/lib/api';
import { Staff } from '@/types';

export interface StaffQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  department?: string;
  designation?: string;
  status?: 'active' | 'inactive';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface StaffStats {
  total: number;
  active: number;
  inactive: number;
  departmentStats: Array<{ _id: string; count: number }>;
  salaryStats: {
    totalSalary: number;
    avgSalary: number;
    minSalary: number;
    maxSalary: number;
  };
}

export interface CreateStaffData {
  employeeId: string;
  name: string;
  designation: string;
  department: string;
  dateOfJoining: string;
  phone: string;
  email: string;
  address: string;
  salary: number;
}

export const staffService = {
  // Get all staff members
  getStaff: async (params?: StaffQueryParams) => {
    const response = await apiClient.get<Staff[]>('/staff', params);
    return response.data;
  },

  // Get staff member by ID
  getStaffMember: async (id: string) => {
    const response = await apiClient.get<Staff>(`/staff/${id}`);
    return response.data;
  },

  // Create new staff member
  createStaff: async (staffData: CreateStaffData) => {
    const response = await apiClient.post<Staff>('/staff', staffData);
    return response.data;
  },

  // Update staff member
  updateStaff: async (id: string, staffData: Partial<CreateStaffData>) => {
    const response = await apiClient.put<Staff>(`/staff/${id}`, staffData);
    return response.data;
  },

  // Delete staff member
  deleteStaff: async (id: string) => {
    const response = await apiClient.delete(`/staff/${id}`);
    return response.data;
  },

  // Get staff statistics
  getStaffStats: async () => {
    const response = await apiClient.get<StaffStats>('/staff/stats/overview');
    return response.data;
  }
};