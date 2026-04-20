import api from '@/lib/api';

export interface Announcement {
  _id: string;
  title: string;
  message: string;
  type: 'general' | 'academic' | 'event' | 'emergency';
  targetScope: 'organization' | 'branch' | 'class' | 'division' | 'student';
  targetRoles: string[];
  targetBranchIds: string[];
  targetBranchNames: string[];
  targetClassId?: string;
  targetClassName?: string;
  targetDivisionId?: string;
  targetDivisionName?: string;
  targetStudentIds: string[];
  targetStudentNames: string[];
  priority: 'low' | 'normal' | 'high' | 'urgent';
  attachmentUrl?: string;
  isActive: boolean;
  expiresAt?: string;
  isRead?: boolean;
  createdBy: string;
  createdByName: string;
  createdByRole: string;
  createdAt: string;
}

export interface CreateAnnouncementData {
  title: string;
  message: string;
  type: string;
  targetScope: string;
  targetRoles: string[];
  targetBranchIds?: string[];
  targetBranchNames?: string[];
  targetClassId?: string;
  targetClassName?: string;
  targetDivisionId?: string;
  targetDivisionName?: string;
  targetStudentIds?: string[];
  targetStudentNames?: string[];
  priority: string;
  expiresAt?: string;
}

export interface AnnouncementQueryParams {
  page?: number;
  limit?: number;
  type?: string;
}

const announcementService = {
  getAll: (params?: AnnouncementQueryParams) =>
    api.get('/announcements', { params }).then((r) => r.data),

  create: (data: CreateAnnouncementData) =>
    api.post('/announcements', data).then((r) => r.data),

  update: (id: string, data: CreateAnnouncementData) =>
    api.put(`/announcements/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/announcements/${id}`).then((r) => r.data),

  markRead: (id: string) =>
    api.put(`/announcements/${id}/read`).then((r) => r.data),

  markAllRead: () =>
    api.put('/announcements/read-all').then((r) => r.data),

  getUnreadCount: () =>
    api.get('/announcements/unread-count').then((r) => r.data),
};

export default announcementService;
