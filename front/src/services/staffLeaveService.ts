import api from '@/lib/api';

export interface StaffLeaveRequest {
  _id: string;
  userId: string;
  userName: string;
  role: string;
  leaveType: 'casual' | 'sick' | 'earned' | 'other';
  fromDate: string;
  toDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNote?: string;
  organizationId?: string;
  branchId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStaffLeaveData {
  staffId?: string;
  branchId?: string;
  leaveType: string;
  fromDate: string;
  toDate: string;
  reason: string;
}

export interface ReviewStaffLeaveData {
  status: 'approved' | 'rejected';
  reviewNote?: string;
}

export interface StaffLeaveQueryParams {
  page?: number;
  limit?: number;
  status?: string;
  userId?: string;
  sortBy?: string;
  sortOrder?: string;
}

const staffLeaveService = {
  getAll: (params?: StaffLeaveQueryParams) =>
    api.get('/staff-leave-requests', { params }).then((r) => r.data),

  create: (data: CreateStaffLeaveData) =>
    api.post('/staff-leave-requests', data).then((r) => r.data),

  review: (id: string, data: ReviewStaffLeaveData) =>
    api.put(`/staff-leave-requests/${id}/review`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/staff-leave-requests/${id}`).then((r) => r.data),

  getPendingCount: () =>
    api.get('/staff-leave-requests/pending-count').then((r) => r.data),
};

export default staffLeaveService;
