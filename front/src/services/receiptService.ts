import { apiClient } from '@/lib/api';
import api from '@/lib/api';
import { ReceiptConfig, CreateReceiptConfigData, UpdateReceiptConfigData, ReceiptData } from '@/types/receipt';

export interface ReceiptConfigResponse {
  success: boolean;
  data: ReceiptConfig[];
}

export interface SingleReceiptConfigResponse {
  success: boolean;
  data: ReceiptConfig;
}

export const receiptService = {
  // Get all receipt configurations
  getReceiptConfigs: async (): Promise<ReceiptConfigResponse> => {
    const response = await apiClient.get<ReceiptConfig[]>('/receipt-configs');
    return response.data;
  },

  // Get receipt config by branch
  getReceiptConfigByBranch: async (branchId: string): Promise<SingleReceiptConfigResponse> => {
    const response = await apiClient.get<ReceiptConfig>(`/receipt-configs/branch/${branchId}`);
    return response.data;
  },

  // Get current user's receipt config (API handles branch automatically)
  getCurrentReceiptConfig: async (): Promise<SingleReceiptConfigResponse> => {
    const response = await apiClient.get<ReceiptConfig>('/receipt-configs/current');
    return response.data;
  },





  // Create receipt configuration - simplified approach
  createReceiptConfig: async (data: CreateReceiptConfigData): Promise<SingleReceiptConfigResponse> => {
    
    const currentUser = localStorage.getItem('auth_user');
    const user = currentUser ? JSON.parse(currentUser) : null;
    
    try {
      const response = await apiClient.post<ReceiptConfig>('/receipt-configs', data);
      return response.data;
    } catch (error: any) {
      console.error('Receipt config creation failed:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      // Provide specific error message based on the error type
      if (error.response?.status === 403) {
        throw new Error(error.response?.data?.message || 'Access denied. Only admins and branch admins can manage receipt configurations.');
      } else if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please login again.');
      } else {
        throw new Error(error.response?.data?.message || 'Failed to create receipt configuration');
      }
    }
  },

  // Update receipt configuration
  updateReceiptConfig: async (id: string, data: UpdateReceiptConfigData): Promise<SingleReceiptConfigResponse> => {
    const response = await apiClient.put<ReceiptConfig>(`/receipt-configs/${id}`, data);
    return response.data;
  },

  // Delete receipt configuration
  deleteReceiptConfig: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete(`/receipt-configs/${id}`);
    return response.data;
  },

  // Generate receipt PDF
  generateReceipt: async (paymentId: string): Promise<Blob> => {
    const response = await apiClient.get(`/fees/${paymentId}/receipt`, {
      responseType: 'blob'
    });
    return response.data;
  },

  // Get receipt data for preview
  getReceiptData: async (paymentId: string): Promise<{ success: boolean; data: ReceiptData }> => {
    const response = await apiClient.get<ReceiptData>(`/fees/${paymentId}/receipt-data`);
    return response.data;
  },

  // Upload logo file
  uploadLogo: async (file: File, branchId?: string): Promise<{ success: boolean; data: { logoPath: string } }> => {
    const formData = new FormData();
    formData.append('logo', file);
    if (branchId) {
      formData.append('branchId', branchId);
    }

    // Use fetch instead of axios for file uploads to avoid any header conflicts
    const token = localStorage.getItem('auth_token');
    const response = await fetch('/api/upload/logo', {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        // Don't set Content-Type, let browser set it with boundary for FormData
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  }
};