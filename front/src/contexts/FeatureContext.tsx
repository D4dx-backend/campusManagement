import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useBranchContext } from '@/contexts/BranchContext';
import { featureService } from '@/services/featureService';
import { FeatureKey, ALL_FEATURE_KEYS } from '@/types';

/**
 * Module → Feature mapping (mirrors the backend registry).
 * Used to map a sidebar menu item's `module` permission to a feature key.
 */
const MODULE_TO_FEATURE: Record<string, FeatureKey> = {
  students: 'students',
  promotions: 'students',
  staff: 'staff',
  staff_categories: 'staff',
  departments: 'staff',
  designations: 'staff',
  classes: 'academics',
  divisions: 'academics',
  subjects: 'academics',
  textbooks: 'academics',
  textbook_indents: 'academics',
  academic_years: 'academics',
  exams: 'exams',
  marks: 'exams',
  lms: 'lms',
  attendance: 'attendance',
  leave_requests: 'attendance',
  fees: 'finance',
  fee_structures: 'finance',
  fee_type_configs: 'finance',
  payroll: 'finance',
  expenses: 'finance',
  expense_categories: 'finance',
  income_categories: 'finance',
  income: 'finance',
  receipt_configs: 'finance',
  accounting: 'accounting',
  accounts: 'accounting',
  transport_routes: 'transport',
  reports: 'reports',
};

interface FeatureContextType {
  /** List of feature keys enabled for current user's org+branch context */
  enabledFeatures: FeatureKey[];
  /** Check if a feature key is enabled */
  isFeatureEnabled: (featureKey: FeatureKey) => boolean;
  /** Check if a module (permission module name) is enabled via its parent feature */
  isModuleEnabled: (moduleName: string) => boolean;
  /** Whether we are still loading features from the API */
  isLoading: boolean;
  /** Re-fetch features (call after toggling features in settings) */
  refetch: () => void;
}

const FeatureContext = createContext<FeatureContextType | undefined>(undefined);

export const useFeatureAccess = () => {
  const ctx = useContext(FeatureContext);
  if (!ctx) throw new Error('useFeatureAccess must be used within FeatureProvider');
  return ctx;
};

export const FeatureProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const { selectedBranchId } = useBranchContext();
  const [enabledFeatures, setEnabledFeatures] = useState<FeatureKey[]>([...ALL_FEATURE_KEYS]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchEffective = useCallback(async () => {
    if (!user) {
      setEnabledFeatures([...ALL_FEATURE_KEYS]);
      return;
    }

    // Platform admin gets everything — no need to call API
    if (user.role === 'platform_admin') {
      setEnabledFeatures([...ALL_FEATURE_KEYS]);
      return;
    }

    setIsLoading(true);
    try {
      const res = await featureService.getEffective(selectedBranchId);
      if (res.data?.data?.enabledFeatures) {
        setEnabledFeatures(res.data.data.enabledFeatures);
      }
    } catch {
      // On error, default to all features enabled (fail-open for UX)
      setEnabledFeatures([...ALL_FEATURE_KEYS]);
    } finally {
      setIsLoading(false);
    }
  }, [user, selectedBranchId]);

  useEffect(() => {
    fetchEffective();
  }, [fetchEffective]);

  const featureSet = new Set(enabledFeatures);

  const isFeatureEnabled = useCallback(
    (featureKey: FeatureKey) => featureSet.has(featureKey),
    [enabledFeatures]
  );

  const isModuleEnabled = useCallback(
    (moduleName: string) => {
      if (!moduleName) return true;
      const normalized = moduleName
        .trim()
        .replace(/([a-z])([A-Z])/g, '$1_$2')
        .replace(/\s+/g, '_')
        .replace(/-+/g, '_')
        .toLowerCase();
      const featureKey = MODULE_TO_FEATURE[normalized];
      // If module is not mapped to any feature, consider it always enabled
      if (!featureKey) return true;
      return featureSet.has(featureKey);
    },
    [enabledFeatures]
  );

  return (
    <FeatureContext.Provider
      value={{ enabledFeatures, isFeatureEnabled, isModuleEnabled, isLoading, refetch: fetchEffective }}
    >
      {children}
    </FeatureContext.Provider>
  );
};
