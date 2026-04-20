import { apiClient } from '@/lib/api';

const api = apiClient;

export interface OrgTemplateClass {
  _id: string;
  name: string;
  description?: string;
  academicYear: string;
  status: 'active' | 'inactive';
  organizationId: string;
}

export interface OrgTemplateSubject {
  _id: string;
  name: string;
  code: string;
  classIds: (string | { _id: string; name: string; academicYear: string })[];
  maxMark: number;
  passMark: number;
  isOptional: boolean;
  status: 'active' | 'inactive';
}

export interface OrgTemplateAcademicYear {
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  status?: 'active' | 'inactive';
}

export interface OrgTemplateMasterItem {
  _id: string;
  name: string;
  description?: string;
  code?: string;
  isCommon?: boolean;
}

export interface ImportPreview {
  classes: OrgTemplateClass[];
  subjects: OrgTemplateSubject[];
  unlinkedSubjects: OrgTemplateSubject[];
  chapterCounts: Record<string, number>;
  academicYears: OrgTemplateAcademicYear[];
  departments: OrgTemplateMasterItem[];
  designations: OrgTemplateMasterItem[];
  staffCategories: OrgTemplateMasterItem[];
  expenseCategories: OrgTemplateMasterItem[];
  incomeCategories: OrgTemplateMasterItem[];
  feeTypes: OrgTemplateMasterItem[];
}

export interface ImportStats {
  classesCreated: number;
  classesSkipped: number;
  divisionsCreated: number;
  subjectsCreated: number;
  subjectsSkipped: number;
  chaptersCreated: number;
  academicYearsCreated?: number;
  academicYearsSkipped?: number;
  departmentsCreated?: number;
  departmentsSkipped?: number;
  designationsCreated?: number;
  designationsSkipped?: number;
  staffCategoriesCreated?: number;
  staffCategoriesSkipped?: number;
  expenseCategoriesCreated?: number;
  expenseCategoriesSkipped?: number;
  incomeCategoriesCreated?: number;
  incomeCategoriesSkipped?: number;
  feeTypesCreated?: number;
  feeTypesSkipped?: number;
}

export interface CompareData {
  org: {
    classes: { _id: string; name: string; academicYear: string; existsInBranch: boolean }[];
    subjects: { _id: string; name: string; code: string; existsInBranch: boolean }[];
    academicYears: { _id: string; name: string; existsInBranch: boolean }[];
    departments: { _id: string; name: string; code: string; existsInBranch: boolean }[];
    designations: { _id: string; name: string; existsInBranch: boolean }[];
    staffCategories: { _id: string; name: string; existsInBranch: boolean }[];
    expenseCategories: { _id: string; name: string; existsInBranch: boolean }[];
    incomeCategories: { _id: string; name: string; existsInBranch: boolean }[];
    feeTypes: { _id: string; name: string; existsInBranch: boolean }[];
  };
  branch: Record<string, number>;
}

export const orgTemplateApi = {
  // Classes
  getClasses: async (params?: Record<string, any>) => {
    const res = await api.get('/org-templates/classes', { params });
    return res.data;
  },
  createClass: async (data: Partial<OrgTemplateClass>) => {
    const res = await api.post('/org-templates/classes', data);
    return res.data;
  },
  updateClass: async (id: string, data: Partial<OrgTemplateClass>) => {
    const res = await api.put(`/org-templates/classes/${id}`, data);
    return res.data;
  },
  deleteClass: async (id: string) => {
    const res = await api.delete(`/org-templates/classes/${id}`);
    return res.data;
  },

  // Subjects
  getSubjects: async (params?: Record<string, any>) => {
    const res = await api.get('/org-templates/subjects', { params });
    return res.data;
  },
  createSubject: async (data: Partial<OrgTemplateSubject>) => {
    const res = await api.post('/org-templates/subjects', data);
    return res.data;
  },
  updateSubject: async (id: string, data: Partial<OrgTemplateSubject>) => {
    const res = await api.put(`/org-templates/subjects/${id}`, data);
    return res.data;
  },
  deleteSubject: async (id: string) => {
    const res = await api.delete(`/org-templates/subjects/${id}`);
    return res.data;
  },

  // Import
  getImportPreview: async (params?: Record<string, any>): Promise<{ success: boolean; data: ImportPreview }> => {
    const res = await api.get('/org-templates/import/preview', { params });
    return res.data as any;
  },
  importToBranch: async (data: {
    branchId: string;
    classIds: string[];
    includeSubjects?: boolean;
    includeChapters?: boolean;
    includeAcademicYears?: boolean;
    includeDepartments?: boolean;
    includeDesignations?: boolean;
    includeStaffCategories?: boolean;
    includeExpenseCategories?: boolean;
    includeIncomeCategories?: boolean;
    includeFeeTypes?: boolean;
    divisions?: Record<string, { name: string; capacity: number }[]>;
  }): Promise<{ success: boolean; message: string; data: ImportStats }> => {
    const res = await api.post('/org-templates/import', data);
    return res.data as any;
  },
  compare: async (branchId: string): Promise<{ success: boolean; data: CompareData }> => {
    const res = await api.get(`/org-templates/compare/${branchId}`);
    return res.data as any;
  },

  // Academic Years
  getAcademicYears: async (params?: Record<string, any>) => {
    const res = await api.get('/org-templates/academic-years', { params });
    return res.data;
  },
  createAcademicYear: async (data: Partial<OrgTemplateAcademicYear>) => {
    const res = await api.post('/org-templates/academic-years', data);
    return res.data;
  },
  updateAcademicYear: async (id: string, data: Partial<OrgTemplateAcademicYear>) => {
    const res = await api.put(`/org-templates/academic-years/${id}`, data);
    return res.data;
  },
  deleteAcademicYear: async (id: string) => {
    const res = await api.delete(`/org-templates/academic-years/${id}`);
    return res.data;
  },

  // Master data CRUD (generic pattern for departments, designations, etc.)
  getMasterData: async (type: string, params?: Record<string, any>) => {
    const res = await api.get(`/org-templates/${type}`, { params });
    return res.data;
  },
  createMasterData: async (type: string, data: Record<string, any>) => {
    const res = await api.post(`/org-templates/${type}`, data);
    return res.data;
  },
  updateMasterData: async (type: string, id: string, data: Record<string, any>) => {
    const res = await api.put(`/org-templates/${type}/${id}`, data);
    return res.data;
  },
  deleteMasterData: async (type: string, id: string) => {
    const res = await api.delete(`/org-templates/${type}/${id}`);
    return res.data;
  },

  // Branch-to-branch import
  getBranchPreview: async (sourceBranchId: string): Promise<{ success: boolean; data: { classes: OrgTemplateClass[]; academicYears: OrgTemplateAcademicYear[]; departments: OrgTemplateMasterItem[]; designations: OrgTemplateMasterItem[]; staffCategories: OrgTemplateMasterItem[]; expenseCategories: OrgTemplateMasterItem[]; incomeCategories: OrgTemplateMasterItem[]; feeTypes: OrgTemplateMasterItem[] } }> => {
    const res = await api.get(`/org-templates/branch-preview/${sourceBranchId}`);
    return res.data as any;
  },
  importFromBranch: async (data: {
    sourceBranchId: string;
    targetBranchId: string;
    classIds: string[];
    includeSubjects?: boolean;
    includeChapters?: boolean;
    includeAcademicYears?: boolean;
    includeDepartments?: boolean;
    includeDesignations?: boolean;
    includeStaffCategories?: boolean;
    includeExpenseCategories?: boolean;
    includeIncomeCategories?: boolean;
    includeFeeTypes?: boolean;
    divisions?: Record<string, { name: string; capacity: number }[]>;
  }): Promise<{ success: boolean; message: string; data: ImportStats }> => {
    const res = await api.post('/org-templates/import-from-branch', data);
    return res.data as any;
  },
};
