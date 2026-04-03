import api from '@/lib/api';

export interface FeeTypeConfig {
  _id: string;
  name: string;
  isCommon: boolean;
  isActive: boolean;
  branchId: string;
  createdAt: string;
  updatedAt: string;
}

export interface FeeTypeConfigInput {
  name: string;
  isCommon: boolean;
  isActive?: boolean;
}

class FeeTypeConfigService {
  async getFeeTypeConfigs(params?: { isActive?: boolean; branchId?: string }) {
    const { data } = await api.get('/fee-type-configs', { params });
    return data;
  }

  async createFeeTypeConfig(payload: FeeTypeConfigInput) {
    const { data } = await api.post('/fee-type-configs', payload);
    return data;
  }

  async updateFeeTypeConfig(id: string, payload: Partial<FeeTypeConfigInput>) {
    const { data } = await api.put(`/fee-type-configs/${id}`, payload);
    return data;
  }

  async deleteFeeTypeConfig(id: string) {
    const { data } = await api.delete(`/fee-type-configs/${id}`);
    return data;
  }
}

export default new FeeTypeConfigService();
