import { apiClient } from '@/lib/api';

export interface PayrollQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  month?: string;
  year?: number;
  status?: 'paid' | 'pending';
  paymentMethod?: 'cash' | 'bank';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PayrollStats {
  totalEntries: number;
  totalAmountPaid: number;
  currentMonthStats: {
    total: number;
    count: number;
    avgSalary: number;
  };
  monthlyStats: Array<{
    _id: { month: string; year: number };
    total: number;
    count: number;
  }>;
  paymentMethodStats: Array<{
    _id: string;
    total: number;
    count: number;
  }>;
  statusStats: Array<{
    _id: string;
    count: number;
  }>;
}

export interface CreatePayrollData {
  staffId: string;
  month: string;
  year: number;
  allowances?: number;
  deductions?: number;
  paymentMethod: 'cash' | 'bank';
  status?: 'paid' | 'pending';
}

export const payrollService = {
  // Get all payroll entries
  getPayrollEntries: async (params?: PayrollQueryParams) => {
    const response = await apiClient.get('/payroll', params);
    return response.data;
  },

  // Get payroll entry by ID
  getPayrollEntry: async (id: string) => {
    const response = await apiClient.get(`/payroll/${id}`);
    return response.data;
  },

  // Create payroll entry
  createPayrollEntry: async (data: CreatePayrollData) => {
    const response = await apiClient.post('/payroll', data);
    return response.data;
  },

  // Update payroll entry
  updatePayrollEntry: async (id: string, data: Partial<CreatePayrollData>) => {
    const response = await apiClient.put(`/payroll/${id}`, data);
    return response.data;
  },

  // Delete payroll entry
  deletePayrollEntry: async (id: string) => {
    const response = await apiClient.delete(`/payroll/${id}`);
    return response.data;
  },

  // Get payroll statistics
  getPayrollStats: async () => {
    const response = await apiClient.get<PayrollStats>('/payroll/stats/overview');
    return response.data;
  },

  // Get pending payroll for month/year
  getPendingPayroll: async (month: string, year: number) => {
    const response = await apiClient.get(`/payroll/pending/${month}/${year}`);
    return response.data;
  }
};