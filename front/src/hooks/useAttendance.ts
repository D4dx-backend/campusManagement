import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  attendanceService,
  leaveRequestService,
  MarkAttendanceData,
  AttendanceQueryParams,
  MonthlyReportParams,
  LeaveRequestData,
  ReviewLeaveData,
  LeaveRequestQueryParams,
} from '@/services/attendanceService';
import { useToast } from '@/hooks/use-toast';

// ─── Query Keys ─────────────────────────────────────────────────────

export const attendanceKeys = {
  all: ['attendance'] as const,
  lists: () => [...attendanceKeys.all, 'list'] as const,
  list: (params: AttendanceQueryParams) => [...attendanceKeys.lists(), params] as const,
  monthly: (params: MonthlyReportParams) => [...attendanceKeys.all, 'monthly', params] as const,
  stats: () => [...attendanceKeys.all, 'stats'] as const,
};

export const leaveRequestKeys = {
  all: ['leaveRequests'] as const,
  lists: () => [...leaveRequestKeys.all, 'list'] as const,
  list: (params: LeaveRequestQueryParams) => [...leaveRequestKeys.lists(), params] as const,
  pendingCount: () => [...leaveRequestKeys.all, 'pendingCount'] as const,
};

// ─── Attendance Hooks ───────────────────────────────────────────────

export const useAttendance = (params?: AttendanceQueryParams) => {
  return useQuery({
    queryKey: attendanceKeys.list(params || {}),
    queryFn: () => attendanceService.getAttendance(params),
    enabled: !!(params?.classId && (params?.date || (params?.month && params?.year))),
    staleTime: 2 * 60 * 1000,
  });
};

export const useMonthlyReport = (params: MonthlyReportParams) => {
  return useQuery({
    queryKey: attendanceKeys.monthly(params),
    queryFn: () => attendanceService.getMonthlyReport(params),
    enabled: !!(params.classId && params.month && params.year),
    staleTime: 2 * 60 * 1000,
  });
};

export const useAttendanceStats = () => {
  return useQuery({
    queryKey: attendanceKeys.stats(),
    queryFn: () => attendanceService.getStats(),
    staleTime: 5 * 60 * 1000,
  });
};

export const useMarkAttendance = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: MarkAttendanceData) => attendanceService.markAttendance(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.all });
      toast({
        title: 'Success',
        description: response.message || 'Attendance saved successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to save attendance',
        variant: 'destructive',
      });
    },
  });
};

// ─── Leave Request Hooks ────────────────────────────────────────────

export const useLeaveRequests = (params?: LeaveRequestQueryParams) => {
  return useQuery({
    queryKey: leaveRequestKeys.list(params || {}),
    queryFn: () => leaveRequestService.getAll(params),
    staleTime: 2 * 60 * 1000,
  });
};

export const usePendingLeaveCount = () => {
  return useQuery({
    queryKey: leaveRequestKeys.pendingCount(),
    queryFn: () => leaveRequestService.getPendingCount(),
    staleTime: 60 * 1000,
  });
};

export const useCreateLeaveRequest = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: LeaveRequestData) => leaveRequestService.create(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: leaveRequestKeys.all });
      toast({
        title: 'Success',
        description: response.message || 'Leave request submitted',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to submit leave request',
        variant: 'destructive',
      });
    },
  });
};

export const useReviewLeaveRequest = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ReviewLeaveData }) =>
      leaveRequestService.review(id, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: leaveRequestKeys.all });
      toast({
        title: 'Success',
        description: response.message || 'Leave request reviewed',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to review leave request',
        variant: 'destructive',
      });
    },
  });
};

export const useDeleteLeaveRequest = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => leaveRequestService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leaveRequestKeys.all });
      toast({ title: 'Success', description: 'Leave request deleted' });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete leave request',
        variant: 'destructive',
      });
    },
  });
};
