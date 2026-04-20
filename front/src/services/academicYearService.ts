import api from '@/lib/api';

export interface AcademicYear {
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  status: 'active' | 'inactive';
  branchId: string;
  createdAt: string;
  updatedAt: string;
}

export interface AcademicYearResponse {
  success: boolean;
  message: string;
  data: AcademicYear[];
  pagination?: { page: number; limit: number; total: number; pages: number };
}

export const academicYearApi = {
  getAll: async (params?: Record<string, any>): Promise<AcademicYearResponse> => {
    const response = await api.get('/academic-years', { params });
    return response.data;
  },
  getCurrent: async (): Promise<{ success: boolean; data: AcademicYear | null }> => {
    const response = await api.get('/academic-years/current');
    return response.data;
  },
  getById: async (id: string) => {
    const response = await api.get(`/academic-years/${id}`);
    return response.data;
  },
  create: async (data: Partial<AcademicYear>) => {
    const response = await api.post('/academic-years', data);
    return response.data;
  },
  update: async (id: string, data: Partial<AcademicYear>) => {
    const response = await api.put(`/academic-years/${id}`, data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/academic-years/${id}`);
    return response.data;
  }
};
