import { apiClient } from '@/lib/api';
import { Staff } from '@/types';

export interface StaffQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  department?: string;
  designation?: string;
  status?: 'active' | 'inactive' | 'terminated' | 'resigned';
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
  category?: string;
  designation: string;
  department: string;
  dateOfJoining: string;
  phone: string;
  email: string;
  address: string;
  salary: number;
}

export interface SalaryIncrementData {
  newSalary: number;
  effectiveDate: string;
  reason: string;
}

export interface SeparationData {
  separationType: 'terminated' | 'resigned';
  separationDate: string;
  lastWorkingDate: string;
  separationReason: string;
}

export const staffService = {
  getStaff: async (params?: StaffQueryParams) => {
    const response = await apiClient.get<Staff[]>('/staff', params);
    return response.data;
  },

  getStaffMember: async (id: string) => {
    const response = await apiClient.get<Staff>(`/staff/${id}`);
    return response.data;
  },

  createStaff: async (staffData: CreateStaffData) => {
    const response = await apiClient.post<Staff>('/staff', staffData);
    return response.data;
  },

  updateStaff: async (id: string, staffData: Partial<CreateStaffData>) => {
    const response = await apiClient.put<Staff>(`/staff/${id}`, staffData);
    return response.data;
  },

  deleteStaff: async (id: string) => {
    const response = await apiClient.delete(`/staff/${id}`);
    return response.data;
  },

  getStaffStats: async () => {
    const response = await apiClient.get<StaffStats>('/staff/stats/overview');
    return response.data;
  },

  // Salary increment
  addSalaryIncrement: async (id: string, data: SalaryIncrementData) => {
    const response = await apiClient.post(`/staff/${id}/salary-increment`, data);
    return response.data;
  },

  getSalaryHistory: async (id: string) => {
    const response = await apiClient.get(`/staff/${id}/salary-history`);
    return response.data;
  },

  // Separation (termination/resignation)
  recordSeparation: async (id: string, data: SeparationData) => {
    const response = await apiClient.post(`/staff/${id}/separation`, data);
    return response.data;
  },

  // Experience certificate
  getExperienceCertificate: async (id: string) => {
    const response = await apiClient.get(`/staff/${id}/experience-certificate`);
    return response.data;
  },
};