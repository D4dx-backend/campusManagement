import { useQuery } from '@tanstack/react-query';
import { reportService, FinancialReportParams } from '@/services/reportService';

// Query keys
export const reportKeys = {
  all: ['reports'] as const,
  dashboard: () => [...reportKeys.all, 'dashboard'] as const,
  financial: (params: FinancialReportParams) => [...reportKeys.all, 'financial', params] as const,
  students: () => [...reportKeys.all, 'students'] as const,
  staff: () => [...reportKeys.all, 'staff'] as const,
  fees: (params: { startDate: string; endDate: string }) => [...reportKeys.all, 'fees', params] as const,
};

// Get dashboard report
export const useDashboardReport = () => {
  return useQuery({
    queryKey: reportKeys.dashboard(),
    queryFn: () => reportService.getDashboardReport(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get financial report
export const useFinancialReport = (params: FinancialReportParams) => {
  return useQuery({
    queryKey: reportKeys.financial(params),
    queryFn: () => reportService.getFinancialReport(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!params.startDate && !!params.endDate,
  });
};

// Get student report
export const useStudentReport = () => {
  return useQuery({
    queryKey: reportKeys.students(),
    queryFn: () => reportService.getStudentReport(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Get staff report
export const useStaffReport = () => {
  return useQuery({
    queryKey: reportKeys.staff(),
    queryFn: () => reportService.getStaffReport(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Get fee report
export const useFeeReport = (params: { startDate: string; endDate: string }) => {
  return useQuery({
    queryKey: reportKeys.fees(params),
    queryFn: () => reportService.getFeeReport(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!params.startDate && !!params.endDate,
  });
};