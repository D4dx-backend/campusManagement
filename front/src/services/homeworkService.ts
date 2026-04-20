import api from '@/lib/api';

export interface HomeworkItem {
  _id: string;
  classId: string;
  className: string;
  divisionId?: string;
  divisionName?: string;
  subjectId?: string;
  subjectName: string;
  date: string;
  dueDate: string;
  title: string;
  description: string;
  attachmentUrl?: string;
  assignedBy: string;
  assignedByName: string;
  createdAt: string;
}

export interface CreateHomeworkData {
  classId: string;
  className: string;
  divisionId?: string;
  divisionName?: string;
  subjectId?: string;
  subjectName: string;
  date: string;
  dueDate: string;
  title: string;
  description: string;
  attachmentUrl?: string;
}

export interface HomeworkQueryParams {
  page?: number;
  limit?: number;
  classId?: string;
  date?: string;
  fromDate?: string;
  toDate?: string;
}

const homeworkService = {
  getAll: (params?: HomeworkQueryParams) =>
    api.get('/homework', { params }).then((r) => r.data),

  getForStudent: (params?: HomeworkQueryParams) =>
    api.get('/homework/student', { params }).then((r) => r.data),

  create: (data: CreateHomeworkData) =>
    api.post('/homework', data).then((r) => r.data),

  update: (id: string, data: CreateHomeworkData) =>
    api.put(`/homework/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/homework/${id}`).then((r) => r.data),
};

export default homeworkService;
