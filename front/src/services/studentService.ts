import { apiClient } from '@/lib/api';
import { Student } from '@/types';

export interface StudentQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  class?: string;
  section?: string;
  status?: 'active' | 'inactive';
  transport?: 'school' | 'own' | 'none';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface StudentStats {
  total: number;
  active: number;
  inactive: number;
  transportStats: Array<{ _id: string; count: number }>;
  classStats: Array<{ _id: string; count: number }>;
}

export interface CreateStudentData {
  admissionNo: string;
  name: string;
  class: string;
  section: string;
  dateOfBirth: string;
  guardianName: string;
  guardianPhone: string;
  guardianEmail?: string;
  address: string;
  transport: 'school' | 'own' | 'none';
  transportRoute?: string;
}

export const studentService = {
  // Get all students
  getStudents: async (params?: StudentQueryParams) => {
    const response = await apiClient.get<Student[]>('/students', params);
    return response.data;
  },

  // Get student by ID
  getStudent: async (id: string) => {
    const response = await apiClient.get<Student>(`/students/${id}`);
    return response.data;
  },

  // Create new student
  createStudent: async (studentData: CreateStudentData) => {
    const response = await apiClient.post<Student>('/students', studentData);
    return response.data;
  },

  // Update student
  updateStudent: async (id: string, studentData: Partial<CreateStudentData>) => {
    const response = await apiClient.put<Student>(`/students/${id}`, studentData);
    return response.data;
  },

  // Delete student
  deleteStudent: async (id: string) => {
    const response = await apiClient.delete(`/students/${id}`);
    return response.data;
  },

  // Get student statistics
  getStudentStats: async () => {
    const response = await apiClient.get<StudentStats>('/students/stats/overview');
    return response.data;
  }
};