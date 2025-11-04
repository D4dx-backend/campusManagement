import { apiClient } from '@/lib/api';

export interface Class {
  _id: string;
  id?: string; // Add id as optional for compatibility
  name: string;
  academicYear: string;
  status: 'active' | 'inactive';
  branchId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClassData {
  name: string;
  academicYear: string;
  status: 'active' | 'inactive';
  branchId?: string;
}

export interface UpdateClassData extends Partial<CreateClassData> {}

export interface ClassesResponse {
  success: boolean;
  data: Class[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export interface ClassResponse {
  success: boolean;
  data: Class;
}

export interface ClassStatsResponse {
  success: boolean;
  data: {
    total: number;
    active: number;
    inactive: number;
    academicYearStats?: Array<{ _id: string; count: number }>;
    classWithDivisions?: Array<{ name: string; academicYear: string; divisionCount: number }>;
  };
}

export const classesApi = {
  getClasses: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    academicYear?: string;
  }): Promise<ClassesResponse> => {
    const response = await apiClient.get<Class[]>('/classes', params);
    // The API returns { success, message, data, pagination }
    // Transform the data to add id field for compatibility
    const classesWithId = (response.data.data || []).map((cls: any) => ({
      ...cls,
      id: cls._id // Add id field for frontend compatibility
    }));
    
    return {
      success: response.data.success,
      data: classesWithId,
      pagination: {
        currentPage: response.data.pagination?.page || 1,
        totalPages: response.data.pagination?.pages || 1,
        totalItems: response.data.pagination?.total || 0,
        itemsPerPage: response.data.pagination?.limit || 10,
      }
    };
  },

  getClass: async (id: string): Promise<ClassResponse> => {
    const response = await apiClient.get<Class>(`/classes/${id}`);
    return {
      success: response.data.success,
      data: { ...response.data.data, id: response.data.data._id }
    };
  },

  createClass: async (data: CreateClassData): Promise<ClassResponse> => {
    const response = await apiClient.post<Class>('/classes', data);
    return {
      success: response.data.success,
      data: { ...response.data.data, id: response.data.data._id }
    };
  },

  updateClass: async (id: string, data: UpdateClassData): Promise<ClassResponse> => {
    const response = await apiClient.put<Class>(`/classes/${id}`, data);
    return {
      success: response.data.success,
      data: { ...response.data.data, id: response.data.data._id }
    };
  },

  deleteClass: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete(`/classes/${id}`);
    return {
      success: response.data.success,
      message: response.data.message
    };
  },

  getClassStats: async (): Promise<ClassStatsResponse> => {
    const response = await apiClient.get<ClassStatsResponse['data']>('/classes/stats/overview');
    return {
      success: response.data.success,
      data: response.data.data
    };
  },
};