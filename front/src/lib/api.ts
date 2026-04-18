import axios, { AxiosInstance, AxiosResponse } from 'axios';

// API Response interface
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token and branch context
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Inject selected branch for org_admin branch-level context
    const selectedBranchId = localStorage.getItem('selected_branch_id');
    if (selectedBranchId) {
      // Add branchId as query param — backend getOrgBranchFilter already supports this
      config.params = { ...config.params, branchId: selectedBranchId };
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Generic API methods
export const apiClient = {
  get: <T>(url: string, params?: any): Promise<AxiosResponse<ApiResponse<T>>> =>
    api.get(url, { params }),
  
  post: <T>(url: string, data?: any): Promise<AxiosResponse<ApiResponse<T>>> =>
    api.post(url, data),
  
  put: <T>(url: string, data?: any): Promise<AxiosResponse<ApiResponse<T>>> =>
    api.put(url, data),
  
  delete: <T>(url: string): Promise<AxiosResponse<ApiResponse<T>>> =>
    api.delete(url),
};

export default api;