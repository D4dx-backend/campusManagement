import api from '@/lib/api';

export interface Designation {
  _id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive';
  branchId: string;
  createdAt: string;
  updatedAt: string;
}

export interface DesignationResponse {
  success: boolean;
  message: string;
  data: Designation[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const designationsApi = {
  getDesignations: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }): Promise<DesignationResponse> => {
    const response = await api.get('/designations', { params });
    return response.data;
  },

  getDesignation: async (id: string): Promise<{ success: boolean; message: string; data: Designation }> => {
    const response = await api.get(`/designations/${id}`);
    return response.data;
  },

  createDesignation: async (data: Partial<Designation>): Promise<{ success: boolean; message: string; data: Designation }> => {
    const response = await api.post('/designations', data);
    return response.data;
  },

  updateDesignation: async (id: string, data: Partial<Designation>): Promise<{ success: boolean; message: string; data: Designation }> => {
    const response = await api.put(`/designations/${id}`, data);
    return response.data;
  },

  deleteDesignation: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/designations/${id}`);
    return response.data;
  }
};