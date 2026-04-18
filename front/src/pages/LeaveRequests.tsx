import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Loader2, Plus, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { classesApi, Class } from '@/services/classes';
import { divisionsApi, Division } from '@/services/divisions';
import { studentService } from '@/services/studentService';
import {
  useLeaveRequests,
  useCreateLeaveRequest,
  useReviewLeaveRequest,
  useDeleteLeaveRequest,
} from '@/hooks/useAttendance';

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

const LeaveRequests = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const isStudent = user?.role === 'student';
  const isTeacherOrAdmin = ['teacher', 'branch_admin', 'org_admin', 'platform_admin'].includes(user?.role || '');

  // Filter state
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterClassId, setFilterClassId] = useState<string>('');
  const [classes, setClasses] = useState<Class[]>([]);

  // Create dialog state
  const [open, setOpen] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [reason, setReason] = useState('');
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Review dialog
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewId, setReviewId] = useState('');
  const [reviewStatus, setReviewStatus] = useState<'approved' | 'rejected'>('approved');
  const [reviewNote, setReviewNote] = useState('');

  // Fetch leave requests
  const params: any = {};
  if (filterStatus) params.status = filterStatus;
  if (filterClassId) params.classId = filterClassId;
  if (isStudent && user?.studentId) params.studentId = user.studentId;

  const { data: leaveData, isLoading } = useLeaveRequests(params);
  const createMutation = useCreateLeaveRequest();
  const reviewMutation = useReviewLeaveRequest();
  const deleteMutation = useDeleteLeaveRequest();

  const leaveRequests = leaveData?.data || [];

  // Load classes for filter
  useEffect(() => {
    if (isTeacherOrAdmin) {
      (async () => {
        try {
          const res = await classesApi.getClasses({ limit: 100, status: 'active' });
          setClasses(res.data || []);
        } catch {}
      })();
    }
  }, [isTeacherOrAdmin]);

  // Student search for create form
  const handleStudentSearch = async (search: string) => {
    setStudentSearch(search);
    if (search.length < 2) { setStudents([]); return; }
    setLoadingStudents(true);
    try {
      const res = await studentService.getStudents({ search, status: 'active', limit: 20 } as any);
      setStudents(res.data || []);
    } catch {}
    setLoadingStudents(false);
  };

  // If student role, auto-set their studentId
  useEffect(() => {
    if (isStudent && user?.studentId) {
      setSelectedStudentId(user.studentId);
    }
  }, [isStudent, user?.studentId]);

  const handleCreate = () => {
    if (!selectedStudentId || !fromDate || !toDate || !reason) {
      toast({ title: 'Error', description: 'Fill all required fields', variant: 'destructive' });
      return;
    }
    createMutation.mutate(
      { studentId: selectedStudentId, fromDate, toDate, reason },
      {
        onSuccess: () => {
          setOpen(false);
          resetForm();
        },
      }
    );
  };

  const handleReview = () => {
    if (!reviewId) return;
    reviewMutation.mutate(
      { id: reviewId, data: { status: reviewStatus, reviewNote } },
      { onSuccess: () => { setReviewOpen(false); setReviewId(''); setReviewNote(''); } }
    );
  };

  const resetForm = () => {
    if (!isStudent) {
      setSelectedStudentId('');
      setStudentSearch('');
      setStudents([]);
    }
    setFromDate('');
    setToDate('');
    setReason('');
  };

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Leave Requests</h1>

          {/* Create Button */}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" /> New Leave Request</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Submit Leave Request</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* Student selector - only for teacher/admin */}
                {!isStudent && (
                  <div>
                    <Label>Search Student</Label>
                    <Input
                      placeholder="Type student name or admission no..."
                      value={studentSearch}
                      onChange={(e) => handleStudentSearch(e.target.value)}
                    />
                    {loadingStudents && <Loader2 className="w-4 h-4 animate-spin mt-1" />}
                    {students.length > 0 && !selectedStudentId && (
                      <div className="border rounded max-h-32 overflow-y-auto mt-1">
                        {students.map((s: any) => (
                          <button
                            key={s._id || s.id}
                            className="w-full text-left px-3 py-1.5 hover:bg-gray-100 text-sm"
                            onClick={() => {
                              setSelectedStudentId(s._id || s.id);
                              setStudentSearch(`${s.name} (${s.admissionNo})`);
                              setStudents([]);
                            }}
                          >
                            {s.name} - {s.admissionNo} ({s.class} {s.section})
                          </button>
                        ))}
                      </div>
                    )}
                    {selectedStudentId && !isStudent && (
                      <Button variant="link" size="sm" className="p-0 h-auto text-xs mt-1" onClick={() => { setSelectedStudentId(''); setStudentSearch(''); }}>
                        Change student
                      </Button>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>From Date</Label>
                    <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                  </div>
                  <div>
                    <Label>To Date</Label>
                    <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
                  </div>
                </div>

                <div>
                  <Label>Reason</Label>
                  <Textarea
                    placeholder="Enter reason for leave..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                  />
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
        </div>

        {/* Filters (teacher/admin only) */}
        {isTeacherOrAdmin && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-4 items-end">
                <div>
                  <Label>Status</Label>
                  <Select value={filterStatus || '__all__'} onValueChange={(v) => setFilterStatus(v === '__all__' ? '' : v)}>
                    <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Class</Label>
                  <Select value={filterClassId || '__all__'} onValueChange={(v) => setFilterClassId(v === '__all__' ? '' : v)}>
                    <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All Classes</SelectItem>
                      {classes.map((c) => (
                        <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Leave Requests Table */}
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : (
          <Card>
            <CardContent className="pt-6">
              {leaveRequests.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">No leave requests found.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>From</TableHead>
                      <TableHead>To</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Status</TableHead>
                      {isTeacherOrAdmin && <TableHead className="text-center">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaveRequests.map((lr: any, idx: number) => (
                      <TableRow key={lr._id}>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell className="font-medium">{lr.studentName}</TableCell>
                        <TableCell>{lr.className} {lr.section}</TableCell>
                        <TableCell>{formatDate(lr.fromDate)}</TableCell>
                        <TableCell>{formatDate(lr.toDate)}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{lr.reason}</TableCell>
                        <TableCell>{statusBadge(lr.status)}</TableCell>
                        {isTeacherOrAdmin && (
                          <TableCell className="text-center">
                            {lr.status === 'pending' ? (
                              <div className="flex gap-1 justify-center">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-green-600 border-green-300 hover:bg-green-50"
                                  onClick={() => { setReviewId(lr._id); setReviewStatus('approved'); setReviewOpen(true); }}
                                >
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 border-red-300 hover:bg-red-50"
                                  onClick={() => { setReviewId(lr._id); setReviewStatus('rejected'); setReviewOpen(true); }}
                                >
                                  Reject
                                </Button>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                {lr.reviewNote && `Note: ${lr.reviewNote}`}
                              </span>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {/* Review Dialog */}
        <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>{reviewStatus === 'approved' ? 'Approve' : 'Reject'} Leave Request</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Note (optional)</Label>
                <Textarea
                  placeholder="Add a note..."
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button
                onClick={handleReview}
                disabled={reviewMutation.isPending}
                className={reviewStatus === 'approved' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
              >
                {reviewMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {reviewStatus === 'approved' ? 'Approve' : 'Reject'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default LeaveRequests;
