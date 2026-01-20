import { useQuery } from '@tanstack/react-query';
import {
  accountingService,
  DayBookQueryParams,
  LedgerQueryParams,
  FeeDetailsQueryParams,
  BalanceSheetQueryParams,
  AnnualReportQueryParams,
} from '@/services/accountingService';

// Hook for fetching day book entries
export const useDayBook = (params?: DayBookQueryParams) => {
  return useQuery({
    queryKey: ['daybook', params],
    queryFn: () => accountingService.getDayBook(params),
    staleTime: 30000, // 30 seconds
  });
};

// Hook for fetching ledger accounts
export const useLedger = (params?: LedgerQueryParams) => {
  return useQuery({
    queryKey: ['ledger', params],
    queryFn: () => accountingService.getLedger(params),
    staleTime: 30000,
  });
};

// Hook for fetching fee details
export const useFeeDetails = (params?: FeeDetailsQueryParams) => {
  return useQuery({
    queryKey: ['feeDetails', params],
    queryFn: () => accountingService.getFeeDetails(params),
    staleTime: 30000,
  });
};

// Hook for fetching balance sheet
export const useBalanceSheet = (params?: BalanceSheetQueryParams) => {
  return useQuery({
    queryKey: ['balanceSheet', params],
    queryFn: () => accountingService.getBalanceSheet(params),
    staleTime: 60000, // 1 minute
  });
};

// Hook for fetching annual report
export const useAnnualReport = (params?: AnnualReportQueryParams) => {
  return useQuery({
    queryKey: ['annualReport', params],
    queryFn: () => accountingService.getAnnualReport(params),
    staleTime: 300000, // 5 minutes
  });
};
