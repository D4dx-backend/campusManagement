import api from '@/lib/api';

export interface TeacherAllocationItem {
  _id: string;
  teacherId: string;
  teacherName: string;
  classId: string;
  className: string;
  divisionId?: string;
  divisionName?: string;
  subjectId?: string;
  subjectName?: string;
  isClassTeacher: boolean;
  academicYear: string;
  createdAt: string;
}

export interface CreateAllocationData {
  teacherId: string;
  teacherName: string;
  classId: string;
  className: string;
  divisionId?: string;
  divisionName?: string;
  subjectId?: string;
  subjectName?: string;
  isClassTeacher: boolean;
  academicYear: string;
}

export interface AllocationQueryParams {
  teacherId?: string;
  classId?: string;
  academicYear?: string;
  limit?: number;
}

const teacherAllocationService = {
  getAll: (params?: AllocationQueryParams) =>
    api.get('/teacher-allocations', { params }).then((r) => r.data),

  getMy: () =>
    api.get('/teacher-allocations/my').then((r) => r.data),

  create: (data: CreateAllocationData) =>
    api.post('/teacher-allocations', data).then((r) => r.data),

  bulkCreate: (allocations: CreateAllocationData[]) =>
    api.post('/teacher-allocations/bulk', { allocations }).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/teacher-allocations/${id}`).then((r) => r.data),

  deleteByClass: (classId: string, academicYear?: string) =>
    api.delete(`/teacher-allocations/class/${classId}`, { params: { academicYear } }).then((r) => r.data),
};

export default teacherAllocationService;
