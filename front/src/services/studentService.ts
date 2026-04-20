import { apiClient } from '@/lib/api';
import { Student } from '@/types';

export interface StudentQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  branchId?: string;
  class?: string;
  classId?: string;
  section?: string;
  status?: 'active' | 'inactive' | 'suspended' | 'tc_issued';
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
  dateOfAdmission: string;
  fatherName: string;
  fatherPhone: string;
  fatherEmail?: string;
  fatherJobCompany?: string;
  motherName?: string;
  motherPhone?: string;
  motherEmail?: string;
  motherJobCompany?: string;
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
  },

  // Get next auto-generated admission number
  getNextAdmissionNo: async (classId: string, divisionName: string): Promise<string> => {
    const response = await apiClient.get<{ admissionNo: string }>('/students/next-admission-no', { classId, divisionName });
    return response.data.data.admissionNo;
  },

  // Issue Transfer Certificate
  issueTC: async (id: string, data: {
    transferSchoolName?: string;
    transferDate?: string;
    reason?: string;
    remarks?: string;
    tcNumber?: string;
  }) => {
    const response = await apiClient.post(`/students/${id}/transfer`, data);
    return response.data;
  },

  // Suspend student
  suspendStudent: async (id: string, data: {
    suspensionReason: string;
    suspensionDate?: string;
    suspensionEndDate?: string;
  }) => {
    const response = await apiClient.post(`/students/${id}/suspend`, data);
    return response.data;
  },

  // Revoke suspension
  revokeSuspension: async (id: string) => {
    const response = await apiClient.post(`/students/${id}/revoke-suspension`, {});
    return response.data;
  }
};