import api from '@/lib/api';

export interface Subject {
  _id: string;
  name: string;
  code: string;
  classIds: string[];
  maxMark: number;
  passMark: number;
  isOptional: boolean;
  status: 'active' | 'inactive';
  branchId: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubjectResponse {
  success: boolean;
  message: string;
  data: Subject[];
  pagination?: { page: number; limit: number; total: number; pages: number };
}

export const subjectApi = {
  getAll: async (params?: Record<string, any>): Promise<SubjectResponse> => {
    const response = await api.get('/subjects', { params });
    return response.data;
  },
  getById: async (id: string) => {
    const response = await api.get(`/subjects/${id}`);
    return response.data;
  },
  create: async (data: Partial<Subject>) => {
    const response = await api.post('/subjects', data);
    return response.data;
  },
  update: async (id: string, data: Partial<Subject>) => {
    const response = await api.put(`/subjects/${id}`, data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/subjects/${id}`);
    return response.data;
  }
};
