import api from '@/lib/api';

export interface IncomeCategory {
  _id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive';
  branchId: string;
  createdAt: string;
  updatedAt: string;
}

export interface IncomeCategoryResponse {
  success: boolean;
  message: string;
  data: IncomeCategory[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const incomeCategoriesApi = {
  getIncomeCategories: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }): Promise<IncomeCategoryResponse> => {
    const response = await api.get('/income-categories', { params });
    return response.data;
  },

  getIncomeCategory: async (id: string): Promise<{ success: boolean; message: string; data: IncomeCategory }> => {
    const response = await api.get(`/income-categories/${id}`);
    return response.data;
  },

  createIncomeCategory: async (data: Partial<IncomeCategory>): Promise<{ success: boolean; message: string; data: IncomeCategory }> => {
    const response = await api.post('/income-categories', data);
    return response.data;
  },

  updateIncomeCategory: async (id: string, data: Partial<IncomeCategory>): Promise<{ success: boolean; message: string; data: IncomeCategory }> => {
    const response = await api.put(`/income-categories/${id}`, data);
    return response.data;
  },

  deleteIncomeCategory: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/income-categories/${id}`);
    return response.data;
  }
};