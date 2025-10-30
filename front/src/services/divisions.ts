import api from '@/lib/api';

export interface Division {
  _id: string;
  classId: string;
  className: string;
  name: string;
  capacity: number;
  classTeacherId?: string;
  classTeacherName?: string;
  status: 'active' | 'inactive';
  branchId: string;
  createdAt: string;
  updatedAt: string;
}

export interface DivisionResponse {
  success: boolean;
  message: string;
  data: Division[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const divisionsApi = {
  getDivisions: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    classId?: string;
    status?: string;
  }): Promise<DivisionResponse> => {
    const response = await api.get('/divisions', { params });
    return response.data;
  },

  getDivision: async (id: string): Promise<{ success: boolean; message: string; data: Division }> => {
    const response = await api.get(`/divisions/${id}`);
    return response.data;
  },

  getDivisionsByClass: async (classId: string): Promise<DivisionResponse> => {
    const response = await api.get(`/divisions/class/${classId}`);
    return response.data;
  },

  createDivision: async (data: Partial<Division>): Promise<{ success: boolean; message: string; data: Division }> => {
    const response = await api.post('/divisions', data);
    return response.data;
  },

  updateDivision: async (id: string, data: Partial<Division>): Promise<{ success: boolean; message: string; data: Division }> => {
    const response = await api.put(`/divisions/${id}`, data);
    return response.data;
  },

  deleteDivision: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/divisions/${id}`);
    return response.data;
  },

  getDivisionStats: async (): Promise<{ success: boolean; message: string; data: any }> => {
    const response = await api.get('/divisions/stats/overview');
    return response.data;
  }
};