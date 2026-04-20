import api from '@/lib/api';

// ── Types ──

export interface Chapter {
  _id: string;
  subjectId: string | { _id: string; name: string; code: string };
  classId: string | { _id: string; name: string };
  name: string;
  chapterNumber: number;
  description?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface LessonContent {
  _id: string;
  chapterId: string | { _id: string; name: string; chapterNumber: number };
  subjectId: string | { _id: string; name: string; code: string };
  classId: string | { _id: string; name: string };
  title: string;
  contentType: 'lesson' | 'video' | 'document' | 'image' | 'link' | 'interactive' | 'audio' | 'meeting';
  body?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  externalUrl?: string;
  meetingUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
  isDownloadable?: boolean;
  sortOrder: number;
  status: 'draft' | 'published' | 'archived';
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface LmsStats {
  totalChapters: number;
  totalContent: number;
  publishedContent: number;
  draftContent: number;
  contentByType: Record<string, number>;
}

interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  pagination?: { page: number; limit: number; total: number; pages: number };
}

interface SingleResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// ── Chapter API ──

export const chapterApi = {
  getAll: async (params?: Record<string, any>): Promise<PaginatedResponse<Chapter>> => {
    const response = await api.get('/lms/chapters', { params });
    return response.data;
  },
  getById: async (id: string): Promise<SingleResponse<Chapter>> => {
    const response = await api.get(`/lms/chapters/${id}`);
    return response.data;
  },
  create: async (data: Partial<Chapter>): Promise<SingleResponse<Chapter>> => {
    const response = await api.post('/lms/chapters', data);
    return response.data;
  },
  update: async (id: string, data: Partial<Chapter>): Promise<SingleResponse<Chapter>> => {
    const response = await api.put(`/lms/chapters/${id}`, data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/lms/chapters/${id}`);
    return response.data;
  },
  reorder: async (items: { _id: string; chapterNumber: number }[]) => {
    const response = await api.put('/lms/chapters-reorder', { items });
    return response.data;
  }
};

// ── Content API ──

export const contentApi = {
  getAll: async (params?: Record<string, any>): Promise<PaginatedResponse<LessonContent>> => {
    const response = await api.get('/lms/content', { params });
    return response.data;
  },
  getById: async (id: string): Promise<SingleResponse<LessonContent>> => {
    const response = await api.get(`/lms/content/${id}`);
    return response.data;
  },
  create: async (data: FormData | Record<string, any>): Promise<SingleResponse<LessonContent>> => {
    const isFormData = data instanceof FormData;
    const response = await api.post('/lms/content', data, isFormData ? {
      headers: { 'Content-Type': 'multipart/form-data' }
    } : undefined);
    return response.data;
  },
  update: async (id: string, data: FormData | Record<string, any>): Promise<SingleResponse<LessonContent>> => {
    const isFormData = data instanceof FormData;
    const response = await api.put(`/lms/content/${id}`, data, isFormData ? {
      headers: { 'Content-Type': 'multipart/form-data' }
    } : undefined);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/lms/content/${id}`);
    return response.data;
  },
  publish: async (id: string) => {
    const response = await api.post(`/lms/content/${id}/publish`);
    return response.data;
  },
  reorder: async (items: { _id: string; sortOrder: number }[]) => {
    const response = await api.put('/lms/content-reorder', { items });
    return response.data;
  }
};

// ── Stats API ──

export const lmsStatsApi = {
  getStats: async (params?: Record<string, any>): Promise<SingleResponse<LmsStats>> => {
    const response = await api.get('/lms/stats', { params });
    return response.data;
  }
};

// ── Assessment Types ──

export interface AssessmentQuestion {
  questionNumber: number;
  questionText: string;
  questionType: 'mcq' | 'true_false' | 'short_answer' | 'long_answer' | 'fill_blank';
  options: { optionId: string; text: string; isCorrect: boolean }[];
  correctAnswer?: string;
  marks: number;
  explanation?: string;
  imageUrl?: string;
}

export interface AssessmentSettings {
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showResults: 'immediately' | 'after_due_date' | 'manual';
  allowRetake: boolean;
  maxRetakes: number;
  showCorrectAnswers: boolean;
}

export interface LmsAssessment {
  _id: string;
  subjectId: string | { _id: string; name: string; code: string };
  classId: string | { _id: string; name: string };
  chapterId?: string | { _id: string; name: string; chapterNumber: number } | null;
  title: string;
  assessmentType: 'quiz' | 'assignment' | 'online_exam';
  instructions?: string;
  totalMarks: number;
  passingMarks: number;
  duration?: number;
  questions: AssessmentQuestion[];
  settings: AssessmentSettings;
  status: 'draft' | 'published' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export interface SubmissionAnswer {
  questionNumber: number;
  selectedOption?: string;
  textAnswer?: string;
  isCorrect?: boolean;
  marksAwarded?: number;
}

export interface StudentSubmission {
  _id: string;
  assessmentId: string | LmsAssessment;
  studentId: string | { _id: string; name: string; admissionNo: string; classId?: string };
  submissionType: 'mcq_answers' | 'text' | 'file' | 'mixed';
  answers: SubmissionAnswer[];
  files: { fileUrl: string; fileName: string; fileSize: number; mimeType: string; uploadedAt: string }[];
  textResponse?: string;
  totalMarksAwarded?: number;
  percentage?: number;
  grade?: string;
  isPassed?: boolean;
  feedback?: string;
  gradedBy?: string | { _id: string; name: string };
  gradedAt?: string;
  startedAt?: string;
  submittedAt?: string;
  timeSpent?: number;
  attemptNumber: number;
  status: 'not_started' | 'in_progress' | 'submitted' | 'graded' | 'returned';
  createdAt: string;
  updatedAt: string;
}

export interface AssessmentSummary {
  assessment: { _id: string; title: string; totalMarks: number; passingMarks: number };
  summary: {
    totalSubmissions: number;
    gradedCount: number;
    passedCount: number;
    failedCount: number;
    avgScore: number;
    highestScore: number;
    lowestScore: number;
    passRate: number;
  };
  questionAnalysis: {
    questionNumber: number;
    questionText: string;
    questionType: string;
    marks: number;
    attempted: number;
    correct: number;
    accuracy: number;
  }[];
  submissions: {
    _id: string;
    student: { _id: string; name: string; admissionNo: string };
    totalMarksAwarded?: number;
    percentage?: number;
    isPassed?: boolean;
    status: string;
    submittedAt?: string;
    attemptNumber: number;
  }[];
}

// ── Assessment API ──

export const assessmentApi = {
  getAll: async (params?: Record<string, any>): Promise<PaginatedResponse<LmsAssessment>> => {
    const response = await api.get('/lms/assessments', { params });
    return response.data;
  },
  getById: async (id: string): Promise<SingleResponse<LmsAssessment>> => {
    const response = await api.get(`/lms/assessments/${id}`);
    return response.data;
  },
  getForStudent: async (id: string): Promise<SingleResponse<LmsAssessment>> => {
    const response = await api.get(`/lms/assessments/${id}/student`);
    return response.data;
  },
  create: async (data: Partial<LmsAssessment>): Promise<SingleResponse<LmsAssessment>> => {
    const response = await api.post('/lms/assessments', data);
    return response.data;
  },
  update: async (id: string, data: Partial<LmsAssessment>): Promise<SingleResponse<LmsAssessment>> => {
    const response = await api.put(`/lms/assessments/${id}`, data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/lms/assessments/${id}`);
    return response.data;
  },
  publish: async (id: string) => {
    const response = await api.post(`/lms/assessments/${id}/publish`);
    return response.data;
  },
  duplicate: async (id: string, data?: { classId?: string; subjectId?: string }) => {
    const response = await api.post(`/lms/assessments/${id}/duplicate`, data || {});
    return response.data;
  }
};

// ── Submission API ──

export const submissionApi = {
  getAll: async (params?: Record<string, any>): Promise<PaginatedResponse<StudentSubmission>> => {
    const response = await api.get('/lms/submissions', { params });
    return response.data;
  },
  getById: async (id: string): Promise<SingleResponse<StudentSubmission>> => {
    const response = await api.get(`/lms/submissions/${id}`);
    return response.data;
  },
  submit: async (data: {
    assessmentId: string;
    studentId: string;
    answers?: SubmissionAnswer[];
    textResponse?: string;
    submissionType?: string;
    startedAt?: string;
    timeSpent?: number;
  }): Promise<SingleResponse<StudentSubmission>> => {
    const response = await api.post('/lms/submissions', data);
    return response.data;
  },
  grade: async (id: string, data: {
    answers?: SubmissionAnswer[];
    feedback?: string;
    totalMarksAwarded?: number;
    grade?: string;
  }): Promise<SingleResponse<StudentSubmission>> => {
    const response = await api.post(`/lms/submissions/${id}/grade`, data);
    return response.data;
  },
  returnForRevision: async (id: string, feedback?: string) => {
    const response = await api.post(`/lms/submissions/${id}/return`, { feedback });
    return response.data;
  },
  getAssessmentSummary: async (assessmentId: string): Promise<SingleResponse<AssessmentSummary>> => {
    const response = await api.get(`/lms/submissions/assessment-summary/${assessmentId}`);
    return response.data;
  }
};

// ── Class Content Assignment Types ──

export interface RecurringConfig {
  frequency: 'daily' | 'weekly' | 'bi_weekly' | 'monthly';
  dayOfWeek?: number;
  dayOfMonth?: number;
  endDate?: string;
}

export interface ClassContentAssignment {
  _id: string;
  contentType: 'lesson' | 'assessment';
  contentId: string;
  classId: string | { _id: string; name: string };
  divisionIds: (string | { _id: string; name: string })[];
  availableFrom: string;
  availableUntil?: string;
  dueDate?: string;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  isPublished: boolean;
  assignedBy: string | { _id: string; name: string };
  scheduleType: 'immediate' | 'scheduled' | 'recurring';
  recurringConfig?: RecurringConfig;
  title: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

// ── Class Content Assignment API ──

export const contentAssignmentApi = {
  getAll: async (params?: Record<string, any>): Promise<PaginatedResponse<ClassContentAssignment>> => {
    const response = await api.get('/lms/assignments', { params });
    return response.data;
  },
  getById: async (id: string): Promise<SingleResponse<ClassContentAssignment>> => {
    const response = await api.get(`/lms/assignments/${id}`);
    return response.data;
  },
  getCalendar: async (params: { classId?: string; month: number; year: number }): Promise<{ success: boolean; data: ClassContentAssignment[] }> => {
    const response = await api.get('/lms/assignments/calendar', { params });
    return response.data;
  },
  create: async (data: {
    contentType: string;
    contentId: string;
    classId?: string;
    classIds?: string[];
    divisionIds?: string[];
    availableFrom: string;
    availableUntil?: string;
    dueDate?: string;
    scheduleType?: string;
    recurringConfig?: RecurringConfig;
    title: string;
    description?: string;
  }): Promise<{ success: boolean; message: string; data: ClassContentAssignment[] }> => {
    const response = await api.post('/lms/assignments', data);
    return response.data;
  },
  update: async (id: string, data: Partial<ClassContentAssignment>): Promise<SingleResponse<ClassContentAssignment>> => {
    const response = await api.put(`/lms/assignments/${id}`, data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/lms/assignments/${id}`);
    return response.data;
  },
  activate: async (id: string): Promise<SingleResponse<ClassContentAssignment>> => {
    const response = await api.post(`/lms/assignments/${id}/activate`);
    return response.data;
  },
  complete: async (id: string): Promise<SingleResponse<ClassContentAssignment>> => {
    const response = await api.post(`/lms/assignments/${id}/complete`);
    return response.data;
  },
  getStudentAssignments: async (params?: Record<string, any>): Promise<{ success: boolean; data: ClassContentAssignment[] }> => {
    const response = await api.get('/lms/assignments/student/my', { params });
    return response.data;
  }
};

// ── Content Progress Types ──

export interface ContentProgressEntry {
  _id: string;
  studentId: string | { _id: string; name: string; admissionNo: string };
  contentId: string | { _id: string; title: string; contentType: string };
  chapterId: string | { _id: string; name: string; chapterNumber: number };
  subjectId: string | { _id: string; name: string };
  classId: string | { _id: string; name: string };
  isCompleted: boolean;
  completedAt?: string;
  timeSpent: number;
  lastAccessedAt: string;
  accessCount: number;
  videoProgress?: number;
  lastPosition?: number;
}

export interface SubjectProgressSummary {
  subjectId: string;
  classId: string;
  subjectName: string;
  className: string;
  totalContent: number;
  completedContent: number;
  completionRate: number;
  realCompletionRate: number;
  totalAvailable: number;
  totalTimeSpent: number;
  totalAccessCount: number;
  lastAccessed: string;
}

export interface ClassProgressOverview {
  overview: {
    uniqueStudentCount: number;
    totalViews: number;
    completedEntries: number;
    totalEntries: number;
    totalTimeSpent: number;
    overallCompletion: number;
  };
  students: {
    studentId: string;
    studentName: string;
    admissionNo: string;
    section: string;
    totalViewed: number;
    completedCount: number;
    totalTimeSpent: number;
    lastAccessed: string;
  }[];
}

export interface DashboardData {
  totals: { studentCount: number; totalViews: number; totalCompleted: number; totalTime: number };
  bySubject: {
    subjectId: string;
    subjectName: string;
    studentCount: number;
    completedCount: number;
    totalEntries: number;
    totalTimeSpent: number;
    completionRate: number;
  }[];
  recentActivity: ContentProgressEntry[];
}

export interface ClassPerformanceReport {
  assessments: {
    _id: string;
    title: string;
    totalMarks: number;
    passingMarks: number;
    stats: {
      totalSubmissions: number;
      avgScore: number;
      avgPercentage: number;
      passedCount: number;
      highestScore: number;
      lowestScore: number;
    };
  }[];
  contentEngagement: {
    chapterId: string;
    chapterName: string;
    chapterNumber: number;
    studentCount: number;
    totalViews: number;
    completedCount: number;
    totalEntries: number;
    avgTimeSpent: number;
    completionRate: number;
  }[];
}

export interface StudentActivityReport {
  summary: {
    totalContentViewed: number;
    totalCompleted: number;
    totalTimeSpent: number;
    totalAssessments: number;
    avgScore: number;
  };
  contentProgress: ContentProgressEntry[];
  submissions: StudentSubmission[];
}

// ── Progress API ──

export const progressApi = {
  track: async (data: {
    studentId: string;
    contentId: string;
    chapterId: string;
    subjectId: string;
    classId: string;
    timeSpent?: number;
    isCompleted?: boolean;
    videoProgress?: number;
    lastPosition?: number;
  }): Promise<SingleResponse<ContentProgressEntry>> => {
    const response = await api.post('/lms/progress/track', data);
    return response.data;
  },
  getStudentProgress: async (studentId: string, params?: Record<string, any>): Promise<{ success: boolean; data: SubjectProgressSummary[] }> => {
    const response = await api.get(`/lms/progress/student/${studentId}`, { params });
    return response.data;
  },
  getClassProgress: async (classId: string, params?: Record<string, any>): Promise<SingleResponse<ClassProgressOverview>> => {
    const response = await api.get(`/lms/progress/class/${classId}`, { params });
    return response.data;
  },
  getDashboard: async (params?: Record<string, any>): Promise<SingleResponse<DashboardData>> => {
    const response = await api.get('/lms/progress/dashboard', { params });
    return response.data;
  }
};

// ── Reports API ──

export const lmsReportsApi = {
  getClassPerformance: async (params: { classId: string; subjectId?: string }): Promise<SingleResponse<ClassPerformanceReport>> => {
    const response = await api.get('/lms/reports/class-performance', { params });
    return response.data;
  },
  getStudentActivity: async (params: { studentId: string; classId?: string; dateFrom?: string; dateTo?: string }): Promise<SingleResponse<StudentActivityReport>> => {
    const response = await api.get('/lms/reports/student-activity', { params });
    return response.data;
  },
  getContentEngagement: async (params?: Record<string, any>) => {
    const response = await api.get('/lms/reports/content-engagement', { params });
    return response.data;
  }
};

// ── Clone & Rollover ─────────────────────────────────────
export interface CloneResult {
  clonedChapters: number;
  clonedContent: number;
  clonedAssessments: number;
}

export interface RolloverResult {
  totalChapters: number;
  totalContent: number;
  totalAssessments: number;
  subjectsMapped: number;
}

export interface SubjectMapping {
  sourceSubjectId: string;
  targetSubjectId: string;
}

export const lmsCloneApi = {
  cloneSubjectContent: async (data: {
    sourceClassId: string;
    sourceSubjectId: string;
    targetClassId: string;
    targetSubjectId: string;
    includeAssessments?: boolean;
  }): Promise<SingleResponse<CloneResult>> => {
    const response = await api.post('/lms/clone/subject-content', data);
    return response.data;
  },
  cloneChapter: async (data: {
    chapterId: string;
    targetClassId: string;
    targetSubjectId: string;
  }): Promise<SingleResponse<{ chapter: any; contentCloned: number }>> => {
    const response = await api.post('/lms/clone/chapter', data);
    return response.data;
  },
  rollover: async (data: {
    sourceClassId: string;
    targetClassId: string;
    subjectMappings: SubjectMapping[];
    includeAssessments?: boolean;
  }): Promise<SingleResponse<RolloverResult>> => {
    const response = await api.post('/lms/rollover', data);
    return response.data;
  }
};

// ── Import (Org → Branch, Cross-Branch) ─────────────────────────────
export interface AvailableOrgChapter extends Chapter {
  contentCount: number;
}

export interface BranchWithContent {
  _id: string;
  name: string;
  code: string;
  chapterCount: number;
}

export const lmsImportApi = {
  getAvailableOrgContent: async (params?: { classId?: string; subjectId?: string }): Promise<{ success: boolean; data: AvailableOrgChapter[]; meta: { assessmentCount: number } }> => {
    const response = await api.get('/lms/import/available', { params });
    return response.data;
  },
  getBranches: async (): Promise<{ success: boolean; data: BranchWithContent[] }> => {
    const response = await api.get('/lms/import/branches');
    return response.data;
  },
  importFromOrg: async (data: {
    targetBranchId: string;
    subjectId: string;
    classId: string;
    includeAssessments?: boolean;
  }): Promise<SingleResponse<CloneResult>> => {
    const response = await api.post('/lms/import/from-org', data);
    return response.data;
  },
  importFromBranch: async (data: {
    sourceBranchId: string;
    targetBranchId: string;
    subjectId: string;
    classId: string;
    includeAssessments?: boolean;
  }): Promise<SingleResponse<CloneResult>> => {
    const response = await api.post('/lms/import/from-branch', data);
    return response.data;
  }
};

// ── Question Pool ────────────────────────────────────────
export interface QuestionPoolItem {
  _id?: string;
  questionText: string;
  questionType: 'mcq' | 'true_false' | 'short_answer' | 'long_answer' | 'fill_blank';
  options: { optionId: string; text: string; isCorrect: boolean }[];
  correctAnswer?: string;
  marks: number;
  explanation?: string;
  imageUrl?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
}

export interface QuestionPool {
  _id: string;
  subjectId: string | { _id: string; name: string; code: string };
  classId: string | { _id: string; name: string };
  chapterId?: string | { _id: string; name: string; chapterNumber: number };
  name: string;
  description?: string;
  questions: QuestionPoolItem[];
  questionCount?: number;
  difficultyBreakdown?: { easy: number; medium: number; hard: number };
  createdAt: string;
  updatedAt: string;
}

export const questionPoolApi = {
  getAll: async (params?: Record<string, any>): Promise<PaginatedResponse<QuestionPool>> => {
    const response = await api.get('/lms/question-pools', { params });
    return response.data;
  },
  getById: async (id: string): Promise<SingleResponse<QuestionPool>> => {
    const response = await api.get(`/lms/question-pools/${id}`);
    return response.data;
  },
  create: async (data: Partial<QuestionPool>): Promise<SingleResponse<QuestionPool>> => {
    const response = await api.post('/lms/question-pools', data);
    return response.data;
  },
  update: async (id: string, data: Partial<QuestionPool>): Promise<SingleResponse<QuestionPool>> => {
    const response = await api.put(`/lms/question-pools/${id}`, data);
    return response.data;
  },
  delete: async (id: string): Promise<SingleResponse<null>> => {
    const response = await api.delete(`/lms/question-pools/${id}`);
    return response.data;
  },
  addQuestions: async (id: string, questions: QuestionPoolItem[]): Promise<SingleResponse<QuestionPool>> => {
    const response = await api.post(`/lms/question-pools/${id}/add-questions`, { questions });
    return response.data;
  },
  generate: async (id: string, opts: { count: number; difficulty?: string; questionTypes?: string[] }): Promise<SingleResponse<{ questions: any[]; totalMarks: number }>> => {
    const response = await api.post(`/lms/question-pools/${id}/generate`, opts);
    return response.data;
  }
};
