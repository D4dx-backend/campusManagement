import api from '@/lib/api';

export interface MarkEntry {
  studentId: string;
  studentName: string;
  admissionNo: string;
  mark: number | null;
  grade: string;
  remarks?: string;
}

export interface MarkSheet {
  _id: string;
  examId: string;
  examName: string;
  subjectId: string;
  subjectName: string;
  classId: string;
  className: string;
  divisionId?: string;
  divisionName?: string;
  academicYear: string;
  maxMark: number;
  passMark: number;
  examDate?: string;
  entries: MarkEntry[];
  isFinalized: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ConsolidatedData {
  subjects: string[];
  students: Array<{
    studentId: string;
    studentName: string;
    admissionNo: string;
    marks: Record<string, { mark: number | null; grade: string; maxMark: number; passMark: number }>;
    total: number;
    percentage: number;
  }>;
  totalMaxMarks: number;
  examName: string;
  className: string;
  divisionName: string;
  academicYear: string;
}

export interface BulkSubjectEntry {
  subjectId: string;
  entries: Array<{ studentId: string; mark: number | null; grade: string }>;
}

export const markApi = {
  getSheet: async (params: { examId: string; classId: string; subjectId?: string; divisionId?: string }) => {
    const response = await api.get('/marks/sheet', { params });
    return response.data as { success: boolean; data: MarkSheet[] };
  },

  getStudents: async (params: { classId: string; divisionId?: string }) => {
    const response = await api.get('/marks/students', { params });
    return response.data as { success: boolean; data: Array<{ _id: string; name: string; admissionNo: string; class: string; section: string }> };
  },

  save: async (data: {
    examId: string;
    subjectId: string;
    classId: string;
    divisionId?: string;
    examDate?: string;
    entries: MarkEntry[];
    isFinalized?: boolean;
  }) => {
    const response = await api.post('/marks/save', data);
    return response.data;
  },

  bulkSave: async (data: {
    examId: string;
    classId: string;
    divisionId?: string;
    subjects: BulkSubjectEntry[];
    isFinalized?: boolean;
  }) => {
    const response = await api.post('/marks/bulk-save', data);
    return response.data;
  },

  getConsolidated: async (params: { examId: string; classId: string; divisionId?: string; academicYear?: string }) => {
    const response = await api.get('/marks/consolidated', { params });
    return response.data as { success: boolean; data: ConsolidatedData };
  },

  getStudentReport: async (params: { studentId: string; academicYear?: string }) => {
    const response = await api.get('/marks/student-report', { params });
    return response.data;
  },

  getProgressReport: async (params: { classId: string; examIds: string; divisionId?: string; academicYear?: string }) => {
    const response = await api.get('/marks/progress-report', { params });
    return response.data as { success: boolean; data: any };
  }
};
