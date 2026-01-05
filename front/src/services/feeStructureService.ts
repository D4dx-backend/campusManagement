import api from '@/lib/api';

export interface FeeStructure {
  _id: string;
  title: string;
  feeType: 'tuition' | 'transport' | 'cocurricular' | 'maintenance' | 'exam' | 'textbook' | 'other';
  classId: string;
  className: string;
  amount: number;
  staffDiscountPercent?: number;
  transportDistanceGroup?: 'group1' | 'group2' | 'group3' | 'group4';
  distanceRange?: string;
  isActive: boolean;
  branchId: string;
  academicYear: string;
  createdAt: string;
  updatedAt: string;
}

export interface FeeStructureQuery {
  page?: number;
  limit?: number;
  search?: string;
  feeType?: string;
  classId?: string;
  isActive?: boolean;
  branchId?: string;
}

export interface GroupedFees {
  tuition?: FeeStructure[];
  transport?: FeeStructure[];
  cocurricular?: FeeStructure[];
  maintenance?: FeeStructure[];
  exam?: FeeStructure[];
  textbook?: FeeStructure[];
  other?: FeeStructure[];
}

class FeeStructureService {
  async getFeeStructures(params?: FeeStructureQuery) {
    const { data } = await api.get('/fee-structures', { params });
    return data;
  }

  async getFeeStructuresByClass(classId: string, academicYear?: string, branchId?: string) {
    const { data } = await api.get(`/fee-structures/by-class/${classId}`, {
      params: { academicYear, branchId }
    });
    return data;
  }

  async createFeeStructure(feeStructure: Omit<FeeStructure, '_id' | 'createdAt' | 'updatedAt'>) {
    const { data } = await api.post('/fee-structures', feeStructure);
    return data;
  }

  async updateFeeStructure(id: string, feeStructure: Partial<FeeStructure>) {
    const { data } = await api.put(`/fee-structures/${id}`, feeStructure);
    return data;
  }

  async deleteFeeStructure(id: string) {
    const { data } = await api.delete(`/fee-structures/${id}`);
    return data;
  }
}

export default new FeeStructureService();
