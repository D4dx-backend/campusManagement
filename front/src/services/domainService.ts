import { apiClient } from '@/lib/api';

export interface DomainMapping {
  _id: string;
  domain: string;
  domainType: 'subdomain' | 'custom';
  organizationId: string | { _id: string; name: string; code: string; logo?: string };
  isPrimary: boolean;
  sslStatus: 'pending' | 'active' | 'error';
  verifiedAt?: string;
  status: 'active' | 'inactive' | 'pending_verification';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface DomainBranding {
  resolved: boolean;
  organizationId: string | null;
  organizationName: string;
  organizationLogo: string | null;
  organizationCode?: string;
  tagline: string;
}

export const domainService = {
  // PUBLIC: Resolve current domain → organization branding (no auth)
  resolveDomain: async (domain: string): Promise<DomainBranding> => {
    const response = await apiClient.get<DomainBranding>('/domains/resolve', { domain });
    return response.data.data!;
  },

  // Get all domain mappings (admin)
  getDomains: async (organizationId?: string): Promise<DomainMapping[]> => {
    const params = organizationId ? { organizationId } : {};
    const response = await apiClient.get<DomainMapping[]>('/domains', params);
    return response.data.data || [];
  },

  // Create domain mapping
  createDomain: async (data: {
    domain: string;
    domainType: 'subdomain' | 'custom';
    organizationId?: string;
    isPrimary?: boolean;
  }): Promise<DomainMapping> => {
    const response = await apiClient.post<DomainMapping>('/domains', data);
    return response.data.data!;
  },

  // Update domain mapping
  updateDomain: async (
    id: string,
    data: { isPrimary?: boolean; status?: string }
  ): Promise<DomainMapping> => {
    const response = await apiClient.put<DomainMapping>(`/domains/${id}`, data);
    return response.data.data!;
  },

  // Delete domain mapping
  deleteDomain: async (id: string): Promise<void> => {
    await apiClient.delete(`/domains/${id}`);
  },

  // Verify domain DNS
  verifyDomain: async (id: string): Promise<{ success: boolean; message: string; data: DomainMapping }> => {
    const response = await apiClient.post<DomainMapping>(`/domains/${id}/verify`);
    return { success: response.data.success, message: response.data.message, data: response.data.data! };
  },
};
