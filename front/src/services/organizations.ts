import apiClient from '@/lib/api';
import { Organization } from '@/types';

export interface CreateOrganizationData {
  name: string;
  code: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  logo?: string;
  status: 'active' | 'inactive';
  subscriptionPlan?: string;
  maxBranches?: number;
}

export interface UpdateOrganizationData extends Partial<CreateOrganizationData> {}

export interface OrganizationsResponse {
  success: boolean;
  data: Organization[];
}

export interface OrganizationResponse {
  success: boolean;
  data: Organization;
}

export const organizationsApi = {
  getOrganizations: async (): Promise<OrganizationsResponse> => {
    const response = await apiClient.get('/organizations');
    const orgsWithId = (response.data.data || []).map((org: any) => ({
      ...org,
      id: org._id,
    }));
    return {
      success: response.data.success,
      data: orgsWithId,
    };
  },

  getOrganization: async (id: string): Promise<OrganizationResponse> => {
    const response = await apiClient.get(`/organizations/${id}`);
    return {
      success: response.data.success,
      data: { ...response.data.data, id: response.data.data._id },
    };
  },

  createOrganization: async (data: CreateOrganizationData): Promise<OrganizationResponse> => {
    const response = await apiClient.post('/organizations', data);
    return {
      success: response.data.success,
      data: { ...response.data.data, id: response.data.data._id },
    };
  },

  updateOrganization: async (id: string, data: UpdateOrganizationData): Promise<OrganizationResponse> => {
    const response = await apiClient.put(`/organizations/${id}`, data);
    return {
      success: response.data.success,
      data: { ...response.data.data, id: response.data.data._id },
    };
  },

  deleteOrganization: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete(`/organizations/${id}`);
    return {
      success: response.data.success,
      message: response.data.message,
    };
  },
};
