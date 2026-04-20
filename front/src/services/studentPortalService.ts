import api from '@/lib/api';

export interface DailyAttendance {
  date: string;
  status: 'present' | 'absent' | 'late' | 'half_day';
}

export interface AttendanceSummary {
  total: number;
  present: number;
  absent: number;
  late: number;
  halfDay: number;
}

export interface MyAttendanceData {
  month: number;
  year: number;
  className: string;
  section: string;
  daily: DailyAttendance[];
  summary: AttendanceSummary;
}

export interface ExamResult {
  examName: string;
  academicYear: string;
  subjects: {
    subjectName: string;
    mark: number | null;
    grade: string;
    maxMark: number;
    passMark: number;
  }[];
  total: number;
  totalMax: number;
}

export interface FeePaymentRecord {
  _id: string;
  receiptNo: string;
  totalAmount: number;
  paymentDate: string;
  paymentMethod: string;
  status: string;
  feeItems?: { title: string; feeType: string; amount: number }[];
}

export interface MyFeesData {
  studentName: string;
  className: string;
  admissionNo: string;
  academicYear: string;
  payments: FeePaymentRecord[];
  feeStructures: { _id: string; title: string; feeTypeName: string; amount: number }[];
  summary: {
    totalDue: number;
    totalPaid: number;
    balance: number;
  };
}

export const studentPortalApi = {
  getMyProfile: () =>
    api.get('/student-portal/my-profile').then(r => r.data),

  getMyAttendance: (month?: number, year?: number) =>
    api.get<{ success: boolean; data: MyAttendanceData }>('/student-portal/my-attendance', {
      params: { month, year },
    }).then(r => r.data),

  getMyMarks: (academicYear?: string) =>
    api.get<{ success: boolean; data: ExamResult[] }>('/student-portal/my-marks', {
      params: { academicYear },
    }).then(r => r.data),

  getMyFees: () =>
    api.get<{ success: boolean; data: MyFeesData }>('/student-portal/my-fees').then(r => r.data),
};
