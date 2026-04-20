import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart2, FileText, Users, TrendingUp, Clock, Loader2, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { classesApi, Class } from '@/services/classes';
import { subjectApi, Subject } from '@/services/subjectService';
import {
  lmsReportsApi, ClassPerformanceReport, StudentActivityReport
} from '@/services/lmsService';

const formatTime = (seconds: number) => {
  if (!seconds) return '0m';
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
};

const LmsReports = () => {
  const { toast } = useToast();

  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [tab, setTab] = useState('class');

  // Class performance
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [classReport, setClassReport] = useState<ClassPerformanceReport | null>(null);
  const [classLoading, setClassLoading] = useState(false);

  // Student activity
  const [studentIdInput, setStudentIdInput] = useState('');
  const [studentClassId, setStudentClassId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [studentReport, setStudentReport] = useState<StudentActivityReport | null>(null);
  const [studentLoading, setStudentLoading] = useState(false);

  useEffect(() => { loadClasses(); }, []);
  useEffect(() => {
    if (selectedClassId) {
      loadSubjects();
      setSelectedSubjectId('');
    }
  }, [selectedClassId]);
  useEffect(() => {
    if (selectedClassId) loadClassReport();
  }, [selectedClassId, selectedSubjectId]);

  const loadClasses = async () => {
    try {
      const res = await classesApi.getClasses({ limit: 100, status: 'active' });
      setClasses(res.data || []);
    } catch { /* ignore */ }
  };

  const loadSubjects = async () => {
    try {
      const res = await subjectApi.getAll({ limit: 100, classId: selectedClassId, status: 'active' });
      setSubjects(res.data || []);
    } catch { /* ignore */ }
  };

  const loadClassReport = async () => {
    setClassLoading(true);
    try {
      const params: any = { classId: selectedClassId };
      if (selectedSubjectId) params.subjectId = selectedSubjectId;
      const res = await lmsReportsApi.getClassPerformance(params);
      setClassReport(res.data);
    } catch {
      toast({ title: 'Error', description: 'Something went wrong while loading. Please try again report', variant: 'destructive' });
    } finally {
      setClassLoading(false);
    }
  };

  const loadStudentReport = async () => {
    if (!studentIdInput) {
      toast({ title: 'Enter student ID', variant: 'destructive' });
      return;
    }
    setStudentLoading(true);
    try {
      const params: any = { studentId: studentIdInput };
      if (studentClassId) params.classId = studentClassId;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      const res = await lmsReportsApi.getStudentActivity(params);
      setStudentReport(res.data);
    } catch {
      toast({ title: 'Error', description: 'Something went wrong while loading. Please try again student report', variant: 'destructive' });
    } finally {
      setStudentLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold">LMS Reports</h1>
          <p className="text-sm text-muted-foreground">Detailed analytics and performance reports</p>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="class"><BarChart2 className="w-4 h-4 mr-1.5" /> Class Performance</TabsTrigger>
            <TabsTrigger value="student"><Users className="w-4 h-4 mr-1.5" /> Student Activity</TabsTrigger>
          </TabsList>

          {/* ── CLASS PERFORMANCE TAB ── */}
          <TabsContent value="class" className="space-y-4">
            <div className="flex gap-3 flex-wrap">
              <Select value={selectedClassId || '__none__'} onValueChange={v => setSelectedClassId(v === '__none__' ? '' : v)}>
                <SelectTrigger className="w-[160px]"><SelectValue placeholder="Select Class" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">-- Select --</SelectItem>
                  {classes.map(c => <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
              {selectedClassId && (
                <Select value={selectedSubjectId || '__all__'} onValueChange={v => setSelectedSubjectId(v === '__all__' ? '' : v)}>
                  <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Subjects" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All Subjects</SelectItem>
                    {subjects.map(s => <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            </div>

            {!selectedClassId ? (
              <Card><CardContent className="py-12 text-center text-muted-foreground">Select a class to view performance report</CardContent></Card>
            ) : classLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
            ) : classReport && (
              <>
                {/* Assessment Performance */}
                {classReport.assessments.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <FileText className="w-4 h-4" /> Assessment Performance
                      </CardTitle>
                    </CardHeader>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Assessment</TableHead>
                          <TableHead>Total Marks</TableHead>
                          <TableHead>Submissions</TableHead>
                          <TableHead>Avg Score</TableHead>
                          <TableHead>Avg %</TableHead>
                          <TableHead>Pass Rate</TableHead>
                          <TableHead>High/Low</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {classReport.assessments.map(a => {
                          const passRate = a.stats.totalSubmissions > 0
                            ? Math.round((a.stats.passedCount / a.stats.totalSubmissions) * 100)
                            : 0;
                          return (
                            <TableRow key={a._id}>
                              <TableCell className="font-medium">{a.title}</TableCell>
                              <TableCell>{a.totalMarks}</TableCell>
                              <TableCell>{a.stats.totalSubmissions}</TableCell>
                              <TableCell>{a.stats.avgScore ? a.stats.avgScore.toFixed(1) : '-'}</TableCell>
                              <TableCell>{a.stats.avgPercentage ? `${a.stats.avgPercentage.toFixed(0)}%` : '-'}</TableCell>
                              <TableCell>
                                <Badge variant={passRate >= 60 ? 'default' : passRate > 0 ? 'secondary' : 'outline'}>
                                  {passRate}%
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm">{a.stats.highestScore || '-'} / {a.stats.lowestScore || '-'}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </Card>
                )}

                {/* Content Engagement */}
                {classReport.contentEngagement.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" /> Content Engagement by Chapter
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {classReport.contentEngagement.map(ce => (
                        <div key={ce.chapterId} className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Ch {ce.chapterNumber}: {ce.chapterName}</span>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span><Users className="w-3 h-3 inline mr-0.5" /> {ce.studentCount}</span>
                              <span><Clock className="w-3 h-3 inline mr-0.5" /> {formatTime(Math.round(ce.avgTimeSpent))}</span>
                              <span className="font-medium text-foreground">{Math.round(ce.completionRate)}%</span>
                            </div>
                          </div>
                          <Progress value={ce.completionRate} className="h-2" />
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {classReport.assessments.length === 0 && classReport.contentEngagement.length === 0 && (
                  <Card><CardContent className="py-8 text-center text-muted-foreground">No data available for this class</CardContent></Card>
                )}
              </>
            )}
          </TabsContent>

          {/* ── STUDENT ACTIVITY TAB ── */}
          <TabsContent value="student" className="space-y-4">
            <div className="flex gap-3 flex-wrap items-end">
              <div className="w-[240px]">
                <Label className="text-xs">Student ID (MongoDB _id)</Label>
                <Input value={studentIdInput} onChange={e => setStudentIdInput(e.target.value)} placeholder="Enter student ID..." className="mt-1" />
              </div>
              <Select value={studentClassId || '__all__'} onValueChange={v => setStudentClassId(v === '__all__' ? '' : v)}>
                <SelectTrigger className="w-[140px]"><SelectValue placeholder="Class" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All</SelectItem>
                  {classes.map(c => <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <div>
                <Label className="text-xs">From</Label>
                <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="mt-1 w-[140px]" />
              </div>
              <div>
                <Label className="text-xs">To</Label>
                <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="mt-1 w-[140px]" />
              </div>
              <button
                onClick={loadStudentReport}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium"
              >
                Load Report
              </button>
            </div>

            {studentLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
            ) : studentReport && (
              <>
                {/* Summary */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <Card><CardContent className="py-3 text-center"><p className="text-2xl font-bold">{studentReport.summary.totalContentViewed}</p><p className="text-xs text-muted-foreground">Content Viewed</p></CardContent></Card>
                  <Card><CardContent className="py-3 text-center"><p className="text-2xl font-bold">{studentReport.summary.totalCompleted}</p><p className="text-xs text-muted-foreground">Completed</p></CardContent></Card>
                  <Card><CardContent className="py-3 text-center"><p className="text-2xl font-bold">{formatTime(studentReport.summary.totalTimeSpent)}</p><p className="text-xs text-muted-foreground">Time Spent</p></CardContent></Card>
                  <Card><CardContent className="py-3 text-center"><p className="text-2xl font-bold">{studentReport.summary.totalAssessments}</p><p className="text-xs text-muted-foreground">Assessments</p></CardContent></Card>
                  <Card><CardContent className="py-3 text-center"><p className="text-2xl font-bold">{studentReport.summary.avgScore}%</p><p className="text-xs text-muted-foreground">Avg Score</p></CardContent></Card>
                </div>

                {/* Content Progress */}
                {studentReport.contentProgress.length > 0 && (
                  <Card>
                    <CardHeader><CardTitle className="text-base">Content Activity</CardTitle></CardHeader>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Content</TableHead>
                          <TableHead>Subject</TableHead>
                          <TableHead>Chapter</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Time</TableHead>
                          <TableHead>Views</TableHead>
                          <TableHead>Last Access</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {studentReport.contentProgress.map((p: any) => (
                          <TableRow key={p._id}>
                            <TableCell className="font-medium">{p.contentId?.title || '-'}</TableCell>
                            <TableCell>{p.subjectId?.name || '-'}</TableCell>
                            <TableCell>{p.chapterId?.name || '-'}</TableCell>
                            <TableCell>
                              {p.isCompleted ? (
                                <Badge className="bg-green-100 text-green-700"><CheckCircle2 className="w-3 h-3 mr-1" /> Done</Badge>
                              ) : (
                                <Badge variant="outline">In Progress</Badge>
                              )}
                            </TableCell>
                            <TableCell>{formatTime(p.timeSpent)}</TableCell>
                            <TableCell>{p.accessCount}</TableCell>
                            <TableCell className="text-sm">{p.lastAccessedAt ? new Date(p.lastAccessedAt).toLocaleDateString() : '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Card>
                )}

                {/* Submissions */}
                {studentReport.submissions.length > 0 && (
                  <Card>
                    <CardHeader><CardTitle className="text-base">Assessment Submissions</CardTitle></CardHeader>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Assessment</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Score</TableHead>
                          <TableHead>%</TableHead>
                          <TableHead>Result</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Submitted</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {studentReport.submissions.map((s: any) => (
                          <TableRow key={s._id}>
                            <TableCell className="font-medium">{s.assessmentId?.title || '-'}</TableCell>
                            <TableCell className="capitalize">{s.assessmentId?.assessmentType || '-'}</TableCell>
                            <TableCell>{s.totalMarksAwarded !== undefined ? `${s.totalMarksAwarded}/${s.assessmentId?.totalMarks}` : '-'}</TableCell>
                            <TableCell>{s.percentage !== undefined ? `${s.percentage}%` : '-'}</TableCell>
                            <TableCell>
                              {s.isPassed !== undefined && (
                                <Badge className={s.isPassed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                                  {s.isPassed ? 'Pass' : 'Fail'}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell><Badge variant="outline">{s.status?.replace('_', ' ')}</Badge></TableCell>
                            <TableCell className="text-sm">{s.submittedAt ? new Date(s.submittedAt).toLocaleDateString() : '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Card>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default LmsReports;
