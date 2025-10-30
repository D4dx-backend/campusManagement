import { apiClient } from '@/lib/api';

export interface Branch {
  _id: string;
  id?: string; // Add id as optional for compatibility
  name: string;
  code: string;
  address: string;
  phone: string;
  email: string;
  principalName?: string;
  establishedDate: string;
  status: 'active' | 'inactive';
  createdAt: string;
  createdBy: string;
}

export interface CreateBranchData {
  name: string;
  code: string;
  address: string;
  phone: string;
  email: string;
  principalName?: string;
  establishedDate: string;
  status: 'active' | 'inactive';
}

export interface UpdateBranchData extends Partial<CreateBranchData> {}

export interface BranchesResponse {
  success: boolean;
  data: Branch[];
}

export interface BranchResponse {
  success: boolean;
  data: Branch;
}

export const branchesApi = {
  getBranches: async (): Promise<BranchesResponse> => {
    const response = await apiClient.get<Branch[]>('/branches');
    // Transform the data to add id field for compatibility
    const branchesWithId = (response.data.data || []).map((branch: any) => ({
      ...branch,
      id: branch._id // Add id field for frontend compatibility
    }));
    
    return {
      success: response.data.success,
      data: branchesWithId,
    };
  },

  getBranch: async (id: string): Promise<BranchResponse> => {
    const response = await apiClient.get<Branch>(`/branches/${id}`);
    return {
      success: response.data.success,
      data: { ...response.data.data, id: response.data.data._id }
    };
  },

  createBranch: async (data: CreateBranchData): Promise<BranchResponse> => {
    const response = await apiClient.post<Branch>('/branches', data);
    return {
      success: response.data.success,
      data: { ...response.data.data, id: response.data.data._id }
    };
  },

  updateBranch: async (id: string, data: UpdateBranchData): Promise<BranchResponse> => {
    const response = await apiClient.put<Branch>(`/branches/${id}`, data);
    return {
      success: response.data.success,
      data: { ...response.data.data, id: response.data.data._id }
    };
  },

  deleteBranch: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete(`/branches/${id}`);
    return {
      success: response.data.success,
      message: response.data.message
    };
  },
};