import { apiClient, ApiResponse } from '@/lib/api';

export interface LoginCredentials {
  mobile: string;
  pin: string;
}

export interface User {
  id: string;
  email: string;
  mobile: string;
  name: string;
  role: 'super_admin' | 'branch_admin' | 'accountant' | 'teacher' | 'staff';
  branchId?: string;
  permissions: Array<{
    module: string;
    actions: string[];
  }>;
  status: 'active' | 'inactive';
  lastLogin?: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface RegisterData {
  email: string;
  mobile: string;
  pin: string;
  name: string;
  role: string;
  branchId?: string;
  permissions?: Array<{
    module: string;
    actions: string[];
  }>;
}

export const authService = {
  // Login user
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/login', credentials);
    
    if (response.data.success && response.data.data) {
      // Store token and user data
      localStorage.setItem('auth_token', response.data.data.token);
      localStorage.setItem('auth_user', JSON.stringify(response.data.data.user));
      return response.data.data;
    }
    
    throw new Error(response.data.message || 'Login failed');
  },

  // Register new user
  register: async (userData: RegisterData): Promise<User> => {
    const response = await apiClient.post<{ user: User }>('/auth/register', userData);
    
    if (response.data.success && response.data.data) {
      return response.data.data.user;
    }
    
    throw new Error(response.data.message || 'Registration failed');
  },

  // Get current user profile
  getProfile: async (): Promise<User> => {
    const response = await apiClient.get<{ user: User }>('/auth/profile');
    
    if (response.data.success && response.data.data) {
      return response.data.data.user;
    }
    
    throw new Error(response.data.message || 'Failed to get profile');
  },

  // Change PIN
  changePin: async (currentPin: string, newPin: string): Promise<void> => {
    const response = await apiClient.put('/auth/change-pin', {
      currentPin,
      newPin
    });
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to change PIN');
    }
  },

  // Logout
  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      // Continue with logout even if API call fails
      console.error('Logout API call failed:', error);
    } finally {
      // Clear local storage
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
    }
  },

  // Get stored user data
  getCurrentUser: (): User | null => {
    const userData = localStorage.getItem('auth_user');
    return userData ? JSON.parse(userData) : null;
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('auth_token');
  },

  // Get stored token
  getToken: (): string | null => {
    return localStorage.getItem('auth_token');
  }
};