import { apiClient } from '@/lib/api';

export interface AttendanceRecord {
  studentId: string;
  status: 'present' | 'absent' | 'late' | 'half_day';
}

export interface MarkAttendanceData {
  date: string;
  classId: string;
  section?: string;
  academicYear: string;
  records: AttendanceRecord[];
}

export interface AttendanceQueryParams {
  classId?: string;
  section?: string;
  date?: string;
  month?: number;
  year?: number;
  studentId?: string;
}

export interface MonthlyReportParams {
  classId: string;
  section?: string;
  month: number;
  year: number;
}

export interface MonthlyStudentReport {
  studentId: string;
  studentName: string;
  admissionNo: string;
  daily: Record<number, string>;
  presentCount: number;
  absentCount: number;
}

export interface MonthlyReportData {
  month: number;
  year: number;
  daysInMonth: number;
  students: MonthlyStudentReport[];
  attendanceDates: Array<{ date: string; day: number; dayOfWeek: number }>;
}

export interface AttendanceStats {
  today: {
    classesMarked: number;
    totalStudents: number;
    present: number;
    absent: number;
    percentage: number;
  };
}

export const attendanceService = {
  markAttendance: async (data: MarkAttendanceData) => {
    const response = await apiClient.post('/attendance', data);
    return response.data;
  },

  getAttendance: async (params?: AttendanceQueryParams) => {
    const response = await apiClient.get('/attendance', params);
    return response.data;
  },

  getMonthlyReport: async (params: MonthlyReportParams) => {
    const response = await apiClient.get<MonthlyReportData>('/attendance/report/monthly', params);
    return response.data;
  },

  getStats: async () => {
    const response = await apiClient.get<AttendanceStats>('/attendance/stats');
    return response.data;
  },
};

// -- Leave Request Service --

export interface LeaveRequestData {
  studentId: string;
  fromDate: string;
  toDate: string;
  reason: string;
}

export interface ReviewLeaveData {
  status: 'approved' | 'rejected';
  reviewNote?: string;
}

export interface LeaveRequest {
  _id: string;
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  section: string;
  fromDate: string;
  toDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNote?: string;
  requestedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeaveRequestQueryParams {
  page?: number;
  limit?: number;
  classId?: string;
  studentId?: string;
  status?: 'pending' | 'approved' | 'rejected';
}

export const leaveRequestService = {
  create: async (data: LeaveRequestData) => {
    const response = await apiClient.post<LeaveRequest>('/leave-requests', data);
    return response.data;
  },

  getAll: async (params?: LeaveRequestQueryParams) => {
    const response = await apiClient.get<LeaveRequest[]>('/leave-requests', params);
    return response.data;
  },

  getPendingCount: async () => {
    const response = await apiClient.get<{ count: number }>('/leave-requests/pending-count');
    return response.data;
  },

  review: async (id: string, data: ReviewLeaveData) => {
    const response = await apiClient.put<LeaveRequest>(`/leave-requests/${id}/review`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await apiClient.delete(`/leave-requests/${id}`);
    return response.data;
  },
};
