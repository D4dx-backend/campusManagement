import { apiClient } from '@/lib/api';
import { 
  TextbookIndent, 
  CreateTextbookIndentData, 
  UpdateTextbookIndentData, 
  ReturnTextbookData,
  TextbookIndentStats 
} from '@/types/textbookIndent';

export interface TextbookIndentQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  studentId?: string;
  class?: string;
  status?: 'pending' | 'issued' | 'partially_returned' | 'returned' | 'cancelled';
  paymentStatus?: 'pending' | 'partial' | 'paid';
  dateFrom?: string;
  dateTo?: string;
  overdue?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const textbookIndentService = {
  // Get all textbook indents
  getTextbookIndents: async (params?: TextbookIndentQueryParams) => {
    const response = await apiClient.get('/textbook-indents', params);
    return response.data;
  },

  // Get textbook indent by ID
  getTextbookIndent: async (id: string) => {
    const response = await apiClient.get(`/textbook-indents/${id}`);
    return response.data;
  },

  // Create textbook indent
  createTextbookIndent: async (data: CreateTextbookIndentData) => {
    const response = await apiClient.post('/textbook-indents', data);
    return response.data;
  },

  // Update textbook indent
  updateTextbookIndent: async (id: string, data: UpdateTextbookIndentData) => {
    const response = await apiClient.put(`/textbook-indents/${id}`, data);
    return response.data;
  },

  // Issue textbook indent (change status to issued)
  issueTextbookIndent: async (id: string) => {
    const response = await apiClient.put(`/textbook-indents/${id}/issue`);
    return response.data;
  },

  // Return textbooks
  returnTextbooks: async (id: string, data: ReturnTextbookData) => {
    const response = await apiClient.put(`/textbook-indents/${id}/return`, data);
    return response.data;
  },

  // Cancel textbook indent
  cancelTextbookIndent: async (id: string, reason?: string) => {
    const response = await apiClient.put(`/textbook-indents/${id}/cancel`, { reason });
    return response.data;
  },

  // Generate receipt for textbook indent
  generateReceipt: async (id: string) => {
    const response = await apiClient.post(`/textbook-indents/${id}/receipt`);
    return response.data;
  },

  // Get textbook indent statistics
  getTextbookIndentStats: async () => {
    const response = await apiClient.get('/textbook-indents/stats/overview');
    return response.data;
  },

  // Get overdue textbook indents (TODO: Implement backend route)
  getOverdueIndents: async () => {
    // const response = await apiClient.get('/textbook-indents/overdue');
    // return response.data;
    return { success: true, data: [] };
  },

  // Get student's textbook history (TODO: Implement backend route)
  getStudentTextbookHistory: async (studentId: string) => {
    // const response = await apiClient.get(`/textbook-indents/student/${studentId}/history`);
    // return response.data;
    return { success: true, data: [] };
  },

  // Bulk issue textbooks for a class (TODO: Implement backend route)
  bulkIssueForClass: async (classId: string, textbookIds: string[]) => {
    // const response = await apiClient.post('/textbook-indents/bulk-issue', {
    //   classId,
    //   textbookIds
    // });
    // return response.data;
    return { success: true, message: 'Bulk issue not implemented yet' };
  }
};