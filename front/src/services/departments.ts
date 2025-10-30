import api from '@/lib/api';

export interface Department {
  _id: string;
  name: string;
  description?: string;
  code: string;
  headOfDepartment?: string;
  status: 'active' | 'inactive';
  branchId: string;
  createdAt: string;
  updatedAt: string;
}

export interface DepartmentResponse {
  success: boolean;
  message: string;
  data: Department[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const departmentsApi = {
  getDepartments: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }): Promise<DepartmentResponse> => {
    const response = await api.get('/departments', { params });
    return response.data;
  },

  getDepartment: async (id: string): Promise<{ success: boolean; message: string; data: Department }> => {
    const response = await api.get(`/departments/${id}`);
    return response.data;
  },

  createDepartment: async (data: Partial<Department>): Promise<{ success: boolean; message: string; data: Department }> => {
    const response = await api.post('/departments', data);
    return response.data;
  },

  updateDepartment: async (id: string, data: Partial<Department>): Promise<{ success: boolean; message: string; data: Department }> => {
    const response = await api.put(`/departments/${id}`, data);
    return response.data;
  },

  deleteDepartment: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/departments/${id}`);
    return response.data;
  }
};