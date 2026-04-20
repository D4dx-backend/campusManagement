import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Check, RotateCcw, Eye, Loader2, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { assessmentApi, submissionApi, LmsAssessment, StudentSubmission } from '@/services/lmsService';

const statusColors: Record<string, string> = {
  not_started: 'bg-gray-100 text-gray-700',
  in_progress: 'bg-blue-100 text-blue-700',
  submitted: 'bg-yellow-100 text-yellow-700',
  graded: 'bg-green-100 text-green-700',
  returned: 'bg-orange-100 text-orange-700',
};

const Submissions = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const assessmentId = searchParams.get('assessmentId') || '';

  const [assessment, setAssessment] = useState<LmsAssessment | null>(null);
  const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('__all__');

  // Grade dialog
  const [gradeOpen, setGradeOpen] = useState(false);
  const [selectedSub, setSelectedSub] = useState<StudentSubmission | null>(null);
  const [gradeMarks, setGradeMarks] = useState<Record<number, number>>({});
  const [feedback, setFeedback] = useState('');
  const [grading, setGrading] = useState(false);

  // Detail dialog
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailSub, setDetailSub] = useState<StudentSubmission | null>(null);

  useEffect(() => {
    if (assessmentId) {
      loadData();
    }
  }, [assessmentId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [aRes, sRes] = await Promise.all([
        assessmentApi.getById(assessmentId),
        submissionApi.getAll({ assessmentId, limit: 200 })
      ]);
      setAssessment(aRes.data);
      setSubmissions(sRes.data);
    } catch (err: any) {
      toast({ title: 'Error', description: err.response?.data?.message || 'Something went wrong while loading. Please try again', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const openGrade = (sub: StudentSubmission) => {
    setSelectedSub(sub);
    // Pre-fill already graded marks
    const marks: Record<number, number> = {};
    sub.answers.forEach(a => {
      if (a.marksAwarded !== undefined) marks[a.questionNumber] = a.marksAwarded;
    });
    setGradeMarks(marks);
    setFeedback(sub.feedback || '');
    setGradeOpen(true);
  };

  const handleGrade = async () => {
    if (!selectedSub) return;
    setGrading(true);
    try {
      const grades = Object.entries(gradeMarks).map(([qn, marks]) => ({
        questionNumber: Number(qn),
        marksAwarded: marks
      }));
      await submissionApi.grade(selectedSub._id, { grades, feedback });
      toast({ title: 'Graded', description: 'Submission graded successfully' });
      setGradeOpen(false);
      loadData();
    } catch (err: any) {
      toast({ title: 'Error', description: err.response?.data?.message || 'Something went wrong while grading. Please try again.', variant: 'destructive' });
    } finally {
      setGrading(false);
    }
  };

  const handleReturn = async (sub: StudentSubmission) => {
    if (!confirm('Return this submission for revision?')) return;
    try {
      await submissionApi.returnForRevision(sub._id, { feedback: 'Please review and resubmit.' });
      toast({ title: 'Returned', description: 'Submission returned to student' });
      loadData();
    } catch (err: any) {
      toast({ title: 'Error', description: err.response?.data?.message || 'Failed', variant: 'destructive' });
    }
  };

  const filtered = submissions.filter(s => {
    if (statusFilter !== '__all__' && s.status !== statusFilter) return false;
    if (search) {
      const student = s.studentId as any;
      const name = student?.name || '';
      const admNo = student?.admissionNo || '';
      const q = search.toLowerCase();
      if (!name.toLowerCase().includes(q) && !admNo.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const getStudentName = (sub: StudentSubmission) => {
    const s = sub.studentId as any;
    return s?.name || 'Unknown';
  };
  const getAdmNo = (sub: StudentSubmission) => {
    const s = sub.studentId as any;
    return s?.admissionNo || '-';
  };

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Submissions & Grading</h1>
            {assessment && (
              <p className="text-sm text-muted-foreground">{assessment.title} • {assessment.totalMarks} marks</p>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search student..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Status</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="graded">Graded</SelectItem>
              <SelectItem value="returned">Returned</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Summary */}
        {!loading && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card><CardContent className="py-3 text-center"><p className="text-2xl font-bold">{submissions.length}</p><p className="text-xs text-muted-foreground">Total</p></CardContent></Card>
            <Card><CardContent className="py-3 text-center"><p className="text-2xl font-bold">{submissions.filter(s => s.status === 'submitted').length}</p><p className="text-xs text-muted-foreground">Pending</p></CardContent></Card>
            <Card><CardContent className="py-3 text-center"><p className="text-2xl font-bold">{submissions.filter(s => s.status === 'graded').length}</p><p className="text-xs text-muted-foreground">Graded</p></CardContent></Card>
            <Card><CardContent className="py-3 text-center"><p className="text-2xl font-bold">{submissions.filter(s => s.isPassed).length}</p><p className="text-xs text-muted-foreground">Passed</p></CardContent></Card>
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">No submissions found</CardContent></Card>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Adm No</TableHead>
                  <TableHead>Attempt</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>%</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(sub => (
                  <TableRow key={sub._id}>
                    <TableCell className="font-medium">{getStudentName(sub)}</TableCell>
                    <TableCell>{getAdmNo(sub)}</TableCell>
                    <TableCell>{sub.attemptNumber}</TableCell>
                    <TableCell>{sub.totalMarksAwarded !== undefined ? `${sub.totalMarksAwarded}/${assessment?.totalMarks}` : '-'}</TableCell>
                    <TableCell>{sub.percentage !== undefined ? `${sub.percentage}%` : '-'}</TableCell>
                    <TableCell><Badge className={statusColors[sub.status] || ''}>{sub.status.replace('_', ' ')}</Badge></TableCell>
                    <TableCell className="text-sm">{sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString() : '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button size="sm" variant="ghost" onClick={() => { setDetailSub(sub); setDetailOpen(true); }}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        {(sub.status === 'submitted' || sub.status === 'graded') && (
                          <Button size="sm" variant="outline" onClick={() => openGrade(sub)}>
                            <Check className="w-4 h-4 mr-1" /> Grade
                          </Button>
                        )}
                        {sub.status === 'submitted' && (
                          <Button size="sm" variant="ghost" onClick={() => handleReturn(sub)}>
                            <RotateCcw className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>

      {/* Grade Dialog */}
      <Dialog open={gradeOpen} onOpenChange={setGradeOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Grade Submission — {selectedSub && getStudentName(selectedSub)}</DialogTitle>
          </DialogHeader>
          {selectedSub && assessment && (
            <div className="space-y-4">
              {selectedSub.answers.map(ans => {
                const q = assessment.questions.find(qq => qq.questionNumber === ans.questionNumber);
                if (!q) return null;
                return (
                  <div key={ans.questionNumber} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Q{ans.questionNumber}: {q.questionText}</p>
                      <Badge variant="outline">{q.marks} marks</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Answer: {ans.selectedOption
                        ? q.options.find(o => o.optionId === ans.selectedOption)?.text || ans.selectedOption
                        : ans.textAnswer || '(no answer)'}
                    </p>
                    {ans.isCorrect !== undefined && (
                      <Badge className={ans.isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                        {ans.isCorrect ? 'Correct' : 'Incorrect'}
                      </Badge>
                    )}
                    <div className="flex items-center gap-2">
                      <Label className="text-xs">Marks:</Label>
                      <Input
                        type="number"
                        min={0}
                        max={q.marks}
                        className="w-20 h-8"
                        value={gradeMarks[ans.questionNumber] ?? ''}
                        onChange={e => setGradeMarks(prev => ({ ...prev, [ans.questionNumber]: Number(e.target.value) }))}
                      />
                      <span className="text-xs text-muted-foreground">/ {q.marks}</span>
                    </div>
                  </div>
                );
              })}
              <div>
                <Label>Feedback</Label>
                <Textarea value={feedback} onChange={e => setFeedback(e.target.value)} placeholder="Optional feedback..." rows={3} className="mt-1" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setGradeOpen(false)}>Cancel</Button>
            <Button onClick={handleGrade} disabled={grading}>
              {grading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Grades
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Submission Details</DialogTitle>
          </DialogHeader>
          {detailSub && assessment && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-muted-foreground">Student:</span> {getStudentName(detailSub)}</div>
                <div><span className="text-muted-foreground">Status:</span> <Badge className={statusColors[detailSub.status]}>{detailSub.status.replace('_', ' ')}</Badge></div>
                <div><span className="text-muted-foreground">Score:</span> {detailSub.totalMarksAwarded ?? '-'}/{assessment.totalMarks}</div>
                <div><span className="text-muted-foreground">Percentage:</span> {detailSub.percentage ?? '-'}%</div>
                <div><span className="text-muted-foreground">Time Spent:</span> {detailSub.timeSpent ? `${Math.floor(detailSub.timeSpent / 60)}m ${detailSub.timeSpent % 60}s` : '-'}</div>
                <div><span className="text-muted-foreground">Attempt:</span> #{detailSub.attemptNumber}</div>
              </div>
              <hr />
              {detailSub.answers.map(ans => {
                const q = assessment.questions.find(qq => qq.questionNumber === ans.questionNumber);
                return (
                  <div key={ans.questionNumber} className="border rounded-lg p-3 space-y-1">
                    <p className="text-sm font-medium">Q{ans.questionNumber}: {q?.questionText}</p>
                    <p className="text-sm">Answer: {ans.selectedOption
                      ? q?.options.find(o => o.optionId === ans.selectedOption)?.text || ans.selectedOption
                      : ans.textAnswer || '(no answer)'}</p>
                    <div className="flex gap-2">
                      {ans.isCorrect !== undefined && <Badge className={ans.isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>{ans.isCorrect ? 'Correct' : 'Wrong'}</Badge>}
                      {ans.marksAwarded !== undefined && <Badge variant="outline">{ans.marksAwarded}/{q?.marks}</Badge>}
                    </div>
                  </div>
                );
              })}
              {detailSub.feedback && (
                <div className="border rounded-lg p-3">
                  <p className="text-sm font-medium mb-1">Feedback</p>
                  <p className="text-sm text-muted-foreground">{detailSub.feedback}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default Submissions;
