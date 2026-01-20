import { Permission, User, UserRole } from '@/types';

export type PermissionAction = 'create' | 'read' | 'update' | 'delete';

const MODULE_ALIASES: Record<string, string> = {
  activity_log: 'activity_logs',
  activitylog: 'activity_logs',
  activity_logs: 'activity_logs',
  text_books: 'textbooks',
  textbook: 'textbooks',
  textbooks: 'textbooks',
  fee: 'fees',
  fee_management: 'fees',
  fee_structures: 'fees',
  income_categories: 'fees',
  expense_categories: 'expenses',
};

export const normalizeModule = (moduleName: string): string => {
  if (!moduleName) return '';
  const normalized = moduleName
    .trim()
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/\s+/g, '_')
    .replace(/-+/g, '_')
    .toLowerCase();
  return MODULE_ALIASES[normalized] || normalized;
};

export const userHasRoleAccess = (user: User | null, roles?: UserRole[]): boolean => {
  if (!roles || roles.length === 0) return true;
  if (!user) return false;
  return roles.includes(user.role);
};

export const userHasModulePermission = (
  user: User | null,
  moduleName?: string,
  action: PermissionAction = 'read'
): boolean => {
  if (!moduleName) return true;
  if (!user) return false;
  if (user.role === 'super_admin' || user.role === 'branch_admin') return true;
  const targetModule = normalizeModule(moduleName);
  return (user.permissions || []).some((permission: Permission) => {
    return normalizeModule(permission.module) === targetModule && permission.actions?.includes(action);
  });
};

export const userHasAccess = (
  user: User | null,
  options: { module?: string; action?: PermissionAction; roles?: UserRole[] } = {}
): boolean => {
  if (!user) return false;
  if (!userHasRoleAccess(user, options.roles)) return false;
  return userHasModulePermission(user, options.module, options.action || 'read');
};

