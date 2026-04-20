/**
 * Feature Registry — single source of truth for all toggleable feature modules.
 *
 * Each feature key maps to:
 *  - label / description for UI
 *  - routePrefixes: API route prefixes governed by this feature
 *  - modules: permission-module names that belong to this feature (used for sidebar filtering on frontend)
 */

export const FEATURE_KEYS = [
  'students',
  'staff',
  'academics',
  'exams',
  'lms',
  'attendance',
  'finance',
  'accounting',
  'transport',
  'reports',
] as const;

export type FeatureKey = (typeof FEATURE_KEYS)[number];

export interface FeatureDefinition {
  key: FeatureKey;
  label: string;
  description: string;
  routePrefixes: string[];
  modules: string[];
}

export const FEATURE_REGISTRY: Record<FeatureKey, FeatureDefinition> = {
  students: {
    key: 'students',
    label: 'Student Management',
    description: 'Student records, admissions, profiles and promotions',
    routePrefixes: ['/api/students', '/api/promotions'],
    modules: ['students', 'promotions'],
  },
  staff: {
    key: 'staff',
    label: 'Staff Management',
    description: 'Staff information, departments, designations and categories',
    routePrefixes: ['/api/staff', '/api/staff-categories', '/api/departments', '/api/designations'],
    modules: ['staff', 'staff_categories', 'departments', 'designations'],
  },
  academics: {
    key: 'academics',
    label: 'Academic Setup',
    description: 'Classes, divisions, subjects, textbooks and academic years',
    routePrefixes: ['/api/classes', '/api/divisions', '/api/subjects', '/api/textbooks', '/api/textbook-indents', '/api/academic-years', '/api/timetable-configs', '/api/timetables'],
    modules: ['classes', 'divisions', 'subjects', 'textbooks', 'textbook_indents', 'academic_years', 'timetable', 'timetable_configs'],
  },
  exams: {
    key: 'exams',
    label: 'Exam & Assessment',
    description: 'Exams, mark entry, scores, progress cards',
    routePrefixes: ['/api/exams', '/api/marks'],
    modules: ['exams', 'marks'],
  },
  lms: {
    key: 'lms',
    label: 'Learning Management',
    description: 'Content library, chapters, assessments and quizzes',
    routePrefixes: ['/api/lms'],
    modules: ['lms'],
  },
  attendance: {
    key: 'attendance',
    label: 'Attendance',
    description: 'Daily attendance marking, reports and leave requests',
    routePrefixes: ['/api/attendance', '/api/leave-requests'],
    modules: ['attendance', 'leave_requests'],
  },
  finance: {
    key: 'finance',
    label: 'Finance',
    description: 'Fee management, payroll, expenses, income and receipt configuration',
    routePrefixes: ['/api/fees', '/api/fee-structures', '/api/fee-type-configs', '/api/payroll', '/api/expenses', '/api/expense-categories', '/api/income-categories', '/api/income', '/api/receipt-configs'],
    modules: ['fees', 'fee_structures', 'fee_type_configs', 'payroll', 'expenses', 'expense_categories', 'income_categories', 'income', 'receipt_configs'],
  },
  accounting: {
    key: 'accounting',
    label: 'Accounting',
    description: 'Day book, ledger, balance sheet and annual reports',
    routePrefixes: ['/api/accounting', '/api/accounts'],
    modules: ['accounting', 'accounts'],
  },
  transport: {
    key: 'transport',
    label: 'Transport',
    description: 'Transport routes and stop management',
    routePrefixes: ['/api/transport-routes'],
    modules: ['transport_routes'],
  },
  reports: {
    key: 'reports',
    label: 'Reports & Analytics',
    description: 'Fee reports, transport reports and analytics',
    routePrefixes: ['/api/reports'],
    modules: ['reports'],
  },
};

/**
 * Build a lookup: route prefix → feature key.
 * Used by the featureAccess middleware to quickly resolve which feature a request belongs to.
 */
export const ROUTE_TO_FEATURE: Map<string, FeatureKey> = new Map();
for (const def of Object.values(FEATURE_REGISTRY)) {
  for (const prefix of def.routePrefixes) {
    ROUTE_TO_FEATURE.set(prefix, def.key);
  }
}

/**
 * Build a lookup: module name → feature key.
 * Used by the frontend to map menu items to feature keys.
 */
export const MODULE_TO_FEATURE: Map<string, FeatureKey> = new Map();
for (const def of Object.values(FEATURE_REGISTRY)) {
  for (const mod of def.modules) {
    MODULE_TO_FEATURE.set(mod, def.key);
  }
}
