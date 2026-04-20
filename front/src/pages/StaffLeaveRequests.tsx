import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Loader2, Plus, CheckCircle, XCircle, Clock, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import staffLeaveService, { StaffLeaveRequest, CreateStaffLeaveData, ReviewStaffLeaveData } from '@/services/staffLeaveService';

const statusBadge = (status: string) => {
  switch (status) {
    case 'pending':
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
    case 'approved':
      return <Badge variant="outline" className="bg-green-50 text-green-700"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
    case 'rejected':
      return <Badge variant="outline" className="bg-red-50 text-red-700"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const leaveTypeLabel: Record<string, string> = {
  casual: 'Casual Leave',
  sick: 'Sick Leave',
  earned: 'Earned Leave',
  other: 'Other',
};

const StaffLeaveRequests = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = ['platform_admin', 'org_admin', 'branch_admin'].includes(user?.role || '');

  // Filter state
  const [filterStatus, setFilterStatus] = useState<string>('');

  // Create dialog state
  const [createOpen, setCreateOpen] = useState(false);
  const [leaveType, setLeaveType] = useState('casual');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [reason, setReason] = useState('');

  // Review dialog state
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewId, setReviewId] = useState('');
  const [reviewStatus, setReviewStatus] = useState<'approved' | 'rejected'>('approved');
  const [reviewNote, setReviewNote] = useState('');

  // Fetch leave requests
  const { data, isLoading } = useQuery({
    queryKey: ['staff-leave-requests', filterStatus],
    queryFn: () => staffLeaveService.getAll({ status: filterStatus || undefined, limit: 50 }),
  });

  const requests: StaffLeaveRequest[] = data?.data || [];

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (d: CreateStaffLeaveData) => staffLeaveService.create(d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-leave-requests'] });
      toast({ title: 'Leave request submitted' });
      setCreateOpen(false);
      resetCreateForm();
    },
    onError: (e: any) => toast({ title: 'Error', description: e?.response?.data?.message || 'Failed', variant: 'destructive' }),
  });

  // Review mutation
  const reviewMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ReviewStaffLeaveData }) => staffLeaveService.review(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-leave-requests'] });
      toast({ title: 'Leave request reviewed' });
      setReviewOpen(false);
    },
    onError: (e: any) => toast({ title: 'Error', description: e?.response?.data?.message || 'Failed', variant: 'destructive' }),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => staffLeaveService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-leave-requests'] });
      toast({ title: 'Leave request cancelled' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e?.response?.data?.message || 'Failed', variant: 'destructive' }),
  });

  const resetCreateForm = () => {
    setLeaveType('casual');
    setFromDate('');
    setToDate('');
    setReason('');
  };

  const handleCreate = () => {
    if (!fromDate || !toDate || !reason.trim()) {
      toast({ title: 'Please fill all fields', variant: 'destructive' });
      return;
    }
    createMutation.mutate({ leaveType, fromDate, toDate, reason: reason.trim() });
  };

  const handleReview = () => {
    reviewMutation.mutate({ id: reviewId, data: { status: reviewStatus, reviewNote: reviewNote.trim() || undefined } });
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString();

  const dayCount = (from: string, to: string) => {
    const diff = new Date(to).getTime() - new Date(from).getTime();
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{isAdmin ? 'Staff Leave Requests' : 'My Leave Requests'}</h1>
            <p className="text-muted-foreground text-sm">
              {isAdmin ? 'Manage staff and teacher leave requests' : 'Submit and track your leave requests'}
            </p>
          </div>
          {!isAdmin && (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />Apply for Leave
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-3 items-center">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">No leave requests found</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    {isAdmin && <TableHead>Staff Name</TableHead>}
                    {isAdmin && <TableHead>Role</TableHead>}
                    <TableHead>Type</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Days</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((req) => (
                    <TableRow key={req._id}>
                      {isAdmin && <TableCell className="font-medium">{req.userName}</TableCell>}
                      {isAdmin && <TableCell><Badge variant="secondary">{req.role}</Badge></TableCell>}
                      <TableCell>{leaveTypeLabel[req.leaveType] || req.leaveType}</TableCell>
                      <TableCell>{formatDate(req.fromDate)}</TableCell>
                      <TableCell>{formatDate(req.toDate)}</TableCell>
                      <TableCell>{dayCount(req.fromDate, req.toDate)}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{req.reason}</TableCell>
                      <TableCell>{statusBadge(req.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {isAdmin && req.status === 'pending' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setReviewId(req._id);
                                setReviewStatus('approved');
                                setReviewNote('');
                                setReviewOpen(true);
                              }}
                            >
                              Review
                            </Button>
                          )}
                          {!isAdmin && req.status === 'pending' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive"
                              onClick={() => deleteMutation.mutate(req._id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                          {req.reviewNote && (
                            <span className="text-xs text-muted-foreground italic" title={req.reviewNote}>
                              {req.reviewNote.substring(0, 30)}{req.reviewNote.length > 30 ? '…' : ''}
                            </span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Create Leave Dialog */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Apply for Leave</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Leave Type</Label>
                <Select value={leaveType} onValueChange={setLeaveType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="casual">Casual Leave</SelectItem>
                    <SelectItem value="sick">Sick Leave</SelectItem>
                    <SelectItem value="earned">Earned Leave</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>From Date</Label>
                  <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                </div>
                <div>
                  <Label>To Date</Label>
                  <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} min={fromDate} />
                </div>
              </div>
              <div>
                <Label>Reason</Label>
                <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Enter reason for leave" rows={3} />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Submit
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Review Dialog */}
        <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Review Leave Request</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Decision</Label>
                <Select value={reviewStatus} onValueChange={(v) => setReviewStatus(v as 'approved' | 'rejected')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approved">Approve</SelectItem>
                    <SelectItem value="rejected">Reject</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Note (optional)</Label>
                <Textarea value={reviewNote} onChange={(e) => setReviewNote(e.target.value)} placeholder="Add a note..." rows={2} />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={handleReview} disabled={reviewMutation.isPending}>
                {reviewMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Confirm
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default StaffLeaveRequests;
