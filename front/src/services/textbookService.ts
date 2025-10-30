import { apiClient } from '@/lib/api';

export interface TextbookQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  class?: string;
  subject?: string;
  academicYear?: string;
  availability?: 'available' | 'out_of_stock' | 'low_stock';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface TextbookStats {
  totalBooks: number;
  totalTitles: number;
  availableBooks: number;
  issuedBooks: number;
  outOfStockBooks: number;
  lowStockBooks: number;
  classStats: Array<{
    _id: string;
    totalBooks: number;
    availableBooks: number;
    titles: number;
  }>;
  subjectStats: Array<{
    _id: string;
    totalBooks: number;
    availableBooks: number;
    titles: number;
  }>;
  valueStats: {
    totalValue: number;
    availableValue: number;
  };
}

export interface CreateTextbookData {
  bookCode: string;
  title: string;
  subject: string;
  class: string;
  publisher: string;
  price: number;
  quantity: number;
  academicYear: string;
}

export const textbookService = {
  // Get all textbooks
  getTextbooks: async (params?: TextbookQueryParams) => {
    const response = await apiClient.get('/textbooks', params);
    return response.data;
  },

  // Get textbook by ID
  getTextbook: async (id: string) => {
    const response = await apiClient.get(`/textbooks/${id}`);
    return response.data;
  },

  // Create textbook
  createTextbook: async (data: CreateTextbookData) => {
    const response = await apiClient.post('/textbooks', data);
    return response.data;
  },

  // Update textbook
  updateTextbook: async (id: string, data: Partial<CreateTextbookData>) => {
    const response = await apiClient.put(`/textbooks/${id}`, data);
    return response.data;
  },

  // Delete textbook
  deleteTextbook: async (id: string) => {
    const response = await apiClient.delete(`/textbooks/${id}`);
    return response.data;
  },

  // Update stock
  updateStock: async (id: string, adjustment: number, reason?: string) => {
    const response = await apiClient.put(`/textbooks/${id}/stock`, {
      adjustment,
      reason
    });
    return response.data;
  },

  // Get textbook statistics
  getTextbookStats: async () => {
    const response = await apiClient.get('/textbooks/stats/overview');
    return response.data;
  }
};