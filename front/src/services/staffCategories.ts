import api from '@/lib/api';

export interface StaffCategory {
  _id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive';
  branchId: string;
  createdAt: string;
  updatedAt: string;
}

export interface StaffCategoryResponse {
  success: boolean;
  message: string;
  data: StaffCategory[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const staffCategoriesApi = {
  getStaffCategories: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }): Promise<StaffCategoryResponse> => {
    const response = await api.get('/staff-categories', { params });
    return response.data;
  },

  createStaffCategory: async (data: Partial<StaffCategory>): Promise<{ success: boolean; message: string; data: StaffCategory }> => {
    const response = await api.post('/staff-categories', data);
    return response.data;
  },

  updateStaffCategory: async (id: string, data: Partial<StaffCategory>): Promise<{ success: boolean; message: string; data: StaffCategory }> => {
    const response = await api.put(`/staff-categories/${id}`, data);
    return response.data;
  },

  deleteStaffCategory: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/staff-categories/${id}`);
    return response.data;
  },
};
