import api from '@/lib/api';

export const promotionApi = {
  preview: async (params: { academicYear: string; classId?: string }) => {
    const response = await api.get('/promotions/preview', { params });
    return response.data;
  },

  promote: async (data: {
    fromAcademicYear: string;
    toAcademicYear: string;
    promotions: Array<{
      studentId: string;
      toClassId: string;
      toDivisionId?: string;
      status: 'promoted' | 'detained' | 'tc_issued';
    }>;
  }) => {
    const response = await api.post('/promotions/promote', data);
    return response.data;
  }
};
