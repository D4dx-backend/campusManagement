import api from '@/lib/api';

export interface Exam {
  _id: string;
  name: string;
  academicYear: string;
  examType: 'term' | 'quarterly' | 'half_yearly' | 'annual' | 'class_test' | 'other';
  startDate?: string;
  endDate?: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  branchId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExamResponse {
  success: boolean;
  message: string;
  data: Exam[];
  pagination?: { page: number; limit: number; total: number; pages: number };
}

export const examApi = {
  getAll: async (params?: Record<string, any>): Promise<ExamResponse> => {
    const response = await api.get('/exams', { params });
    return response.data;
  },
  getById: async (id: string) => {
    const response = await api.get(`/exams/${id}`);
    return response.data;
  },
  create: async (data: Partial<Exam>) => {
    const response = await api.post('/exams', data);
    return response.data;
  },
  update: async (id: string, data: Partial<Exam>) => {
    const response = await api.put(`/exams/${id}`, data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/exams/${id}`);
    return response.data;
  }
};
