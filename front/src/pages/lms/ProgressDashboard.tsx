import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, Eye, CheckCircle2, Clock, Loader2, BookOpen, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { classesApi, Class } from '@/services/classes';
import { subjectApi, Subject } from '@/services/subjectService';
import { progressApi, DashboardData, ClassProgressOverview } from '@/services/lmsService';

const formatTime = (seconds: number) => {
  if (!seconds) return '0m';
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
};

const ProgressDashboard = () => {
  const { toast } = useToast();

  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [loading, setLoading] = useState(true);

  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [classDetail, setClassDetail] = useState<ClassProgressOverview | null>(null);

  useEffect(() => { loadClasses(); }, []);
  useEffect(() => {
    if (selectedClassId) {
      loadSubjects();
      setSelectedSubjectId('');
    } else {
      setSubjects([]);
    }
  }, [selectedClassId]);

  useEffect(() => { loadDashboard(); }, [selectedClassId]);
  useEffect(() => {
    if (selectedClassId) loadClassDetail();
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

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (selectedClassId) params.classId = selectedClassId;
      const res = await progressApi.getDashboard(params);
      setDashboard(res.data);
    } catch {
      toast({ title: 'Error', description: 'Something went wrong while loading. Please try again dashboard', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const loadClassDetail = async () => {
    try {
      const params: any = {};
      if (selectedSubjectId) params.subjectId = selectedSubjectId;
      const res = await progressApi.getClassProgress(selectedClassId, params);
      setClassDetail(res.data);
    } catch { /* ignore */ }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold">Progress Dashboard</h1>
          <p className="text-sm text-muted-foreground">Track student engagement and content completion</p>
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          <Select value={selectedClassId || '__all__'} onValueChange={v => setSelectedClassId(v === '__all__' ? '' : v)}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Classes" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Classes</SelectItem>
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

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
        ) : dashboard && (
          <>
            {/* Totals */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="py-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{dashboard.totals.studentCount}</p>
                    <p className="text-xs text-muted-foreground">Active Students</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <Eye className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{dashboard.totals.totalViews}</p>
                    <p className="text-xs text-muted-foreground">Total Views</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{dashboard.totals.totalCompleted}</p>
                    <p className="text-xs text-muted-foreground">Completed</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{formatTime(dashboard.totals.totalTime)}</p>
                    <p className="text-xs text-muted-foreground">Total Time</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* By Subject */}
            {dashboard.bySubject.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <BookOpen className="w-4 h-4" /> Subject-wise Progress
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {dashboard.bySubject.map(s => (
                    <div key={s.subjectId} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{s.subjectName}</span>
                          <Badge variant="outline" className="text-xs">{s.studentCount} students</Badge>
                        </div>
                        <span className="text-sm font-medium">{Math.round(s.completionRate)}%</span>
                      </div>
                      <Progress value={s.completionRate} className="h-2" />
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <span>{s.completedCount}/{s.totalEntries} completed</span>
                        <span>{formatTime(s.totalTimeSpent)} spent</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Class Detail - Student Table */}
            {selectedClassId && classDetail && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Student Progress</CardTitle>
                    <Badge variant="outline">
                      {Math.round(classDetail.overview.overallCompletion)}% overall
                    </Badge>
                  </div>
                </CardHeader>
                {classDetail.students.length === 0 ? (
                  <CardContent className="py-8 text-center text-muted-foreground">No progress data for this class yet</CardContent>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Adm No</TableHead>
                        <TableHead>Section</TableHead>
                        <TableHead>Viewed</TableHead>
                        <TableHead>Completed</TableHead>
                        <TableHead>Time Spent</TableHead>
                        <TableHead>Last Active</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {classDetail.students.map(s => (
                        <TableRow key={s.studentId}>
                          <TableCell className="font-medium">{s.studentName}</TableCell>
                          <TableCell>{s.admissionNo}</TableCell>
                          <TableCell>{s.section || '-'}</TableCell>
                          <TableCell>{s.totalViewed}</TableCell>
                          <TableCell>{s.completedCount}</TableCell>
                          <TableCell>{formatTime(s.totalTimeSpent)}</TableCell>
                          <TableCell className="text-sm">{s.lastAccessed ? new Date(s.lastAccessed).toLocaleDateString() : '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </Card>
            )}

            {/* Recent Activity */}
            {dashboard.recentActivity.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" /> Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {dashboard.recentActivity.slice(0, 10).map(a => {
                      const student = a.studentId as any;
                      const content = a.contentId as any;
                      const subject = a.subjectId as any;
                      return (
                        <div key={a._id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 text-sm">
                          <div>
                            <span className="font-medium">{student?.name || 'Student'}</span>
                            <span className="text-muted-foreground"> viewed </span>
                            <span className="font-medium">{content?.title || 'Content'}</span>
                            {subject?.name && (
                              <Badge variant="outline" className="ml-2 text-xs">{subject.name}</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {a.isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />}
                            {a.lastAccessedAt && new Date(a.lastAccessedAt).toLocaleDateString()}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default ProgressDashboard;
