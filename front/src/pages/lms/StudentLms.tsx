import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  BookOpen, Clock, CheckCircle2, Play, FileText, Loader2, AlertTriangle,
  BarChart2, Timer, Trophy, Video, Headphones, Image, Link2, Users, Eye
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  progressApi, SubjectProgressSummary,
  contentAssignmentApi, ClassContentAssignment,
  contentApi, LessonContent
} from '@/services/lmsService';
import ContentViewer from '@/components/lms/ContentViewer';

const formatTime = (seconds: number) => {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
};

const StudentLms = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [subjectProgress, setSubjectProgress] = useState<SubjectProgressSummary[]>([]);
  const [assignments, setAssignments] = useState<ClassContentAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewerContent, setViewerContent] = useState<LessonContent | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [loadingContentId, setLoadingContentId] = useState<string | null>(null);

  const studentId = user?.studentId || user?._id || '';

  useEffect(() => {
    if (studentId) loadData();
  }, [studentId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [progressRes, assignRes] = await Promise.all([
        progressApi.getStudentProgress(studentId),
        contentAssignmentApi.getStudentAssignments()
      ]);
      setSubjectProgress(progressRes.data || []);
      setAssignments(assignRes.data || []);
    } catch (err: any) {
      toast({ title: 'Error', description: 'Something went wrong while loading. Please try again data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Stats summary
  const totalCompleted = subjectProgress.reduce((s, sp) => s + sp.completedContent, 0);
  const totalAvailable = subjectProgress.reduce((s, sp) => s + sp.totalAvailable, 0);
  const totalTimeSpent = subjectProgress.reduce((s, sp) => s + sp.totalTimeSpent, 0);
  const overallCompletion = totalAvailable > 0 ? Math.round((totalCompleted / totalAvailable) * 100) : 0;

  // Separate upcoming due items
  const now = new Date();
  const dueSoon = assignments
    .filter(a => a.dueDate && new Date(a.dueDate) > now)
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    .slice(0, 5);

  const assessmentAssignments = assignments.filter(a => a.contentType === 'assessment' && a.status === 'active');
  const lessonAssignments = assignments.filter(a => a.contentType === 'lesson' && a.status === 'active');

  const openContent = async (contentId: string) => {
    setLoadingContentId(contentId);
    try {
      const res = await contentApi.getById(contentId);
      if (res.data) {
        setViewerContent(res.data);
        setViewerOpen(true);
      }
    } catch {
      toast({ title: 'Error', description: 'Something went wrong while loading content. Please try again.', variant: 'destructive' });
    } finally {
      setLoadingContentId(null);
    }
  };

  const contentTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="w-4 h-4 text-red-500" />;
      case 'audio': return <Headphones className="w-4 h-4 text-yellow-500" />;
      case 'document': return <FileText className="w-4 h-4 text-orange-500" />;
      case 'image': return <Image className="w-4 h-4 text-green-500" />;
      case 'meeting': return <Users className="w-4 h-4 text-pink-500" />;
      case 'link': return <Link2 className="w-4 h-4 text-purple-500" />;
      default: return <BookOpen className="w-4 h-4 text-blue-500" />;
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold">My Learning</h1>
          <p className="text-sm text-muted-foreground">Track your progress across subjects</p>
        </div>

        {/* Overview Stats */}
        <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
          <Card>
            <CardContent className="py-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30"><BarChart2 className="w-4 h-4 text-blue-600" /></div>
              <div>
                <p className="text-2xl font-bold">{overallCompletion}%</p>
                <p className="text-xs text-muted-foreground">Overall</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30"><CheckCircle2 className="w-4 h-4 text-green-600" /></div>
              <div>
                <p className="text-2xl font-bold">{totalCompleted}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30"><Timer className="w-4 h-4 text-purple-600" /></div>
              <div>
                <p className="text-2xl font-bold">{formatTime(totalTimeSpent)}</p>
                <p className="text-xs text-muted-foreground">Time Spent</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30"><Trophy className="w-4 h-4 text-orange-600" /></div>
              <div>
                <p className="text-2xl font-bold">{subjectProgress.length}</p>
                <p className="text-xs text-muted-foreground">Subjects</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Due Soon */}
        {dueSoon.length > 0 && (
          <Card className="border-orange-200 bg-orange-50/50 dark:bg-orange-900/10 dark:border-orange-800/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                Due Soon
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {dueSoon.map(a => (
                <div
                  key={a._id}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-white dark:bg-card border cursor-pointer hover:shadow-sm transition-shadow"
                  onClick={() => {
                    if (a.contentType === 'assessment') navigate(`/lms/attempt/${a.contentId}`);
                    else if (a.contentId) openContent(a.contentId);
                  }}
                >
                  <div className="flex items-center gap-3">
                    {a.contentType === 'assessment' ? (
                      <FileText className="w-4 h-4 text-purple-500" />
                    ) : (
                      <BookOpen className="w-4 h-4 text-blue-500" />
                    )}
                    <div>
                      <p className="text-sm font-medium">{a.title}</p>
                      <p className="text-xs text-muted-foreground capitalize">{a.contentType}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="text-xs">
                      <Clock className="w-3 h-3 mr-1" />
                      {new Date(a.dueDate!).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Subject Progress */}
        <div>
          <h2 className="text-base font-semibold mb-3">Subject Progress</h2>
          {subjectProgress.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No progress recorded yet. Start viewing content to track progress.</CardContent></Card>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {subjectProgress.map(sp => (
                <Card key={`${sp.subjectId}_${sp.classId}`} className="hover:shadow-sm transition-shadow">
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium">{sp.subjectName}</p>
                        <p className="text-xs text-muted-foreground">{sp.className}</p>
                      </div>
                      <Badge variant={sp.realCompletionRate >= 80 ? 'default' : sp.realCompletionRate >= 40 ? 'secondary' : 'outline'}>
                        {sp.realCompletionRate}%
                      </Badge>
                    </div>
                    <Progress value={sp.realCompletionRate} className="h-2 mb-2" />
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> {sp.completedContent}/{sp.totalAvailable}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {formatTime(sp.totalTimeSpent)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Active Assessments */}
        {assessmentAssignments.length > 0 && (
          <div>
            <h2 className="text-base font-semibold mb-3">Active Assessments</h2>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {assessmentAssignments.map(a => (
                <Card
                  key={a._id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate(`/lms/attempt/${a.contentId}`)}
                >
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-sm">{a.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{(a.classId as any)?.name || ''}</p>
                      </div>
                      <Play className="w-4 h-4 text-primary mt-0.5" />
                    </div>
                    {a.dueDate && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Due: {new Date(a.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Active Lessons */}
        {lessonAssignments.length > 0 && (
          <div>
            <h2 className="text-base font-semibold mb-3">Assigned Content</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {lessonAssignments.map(a => (
                <Card
                  key={a._id}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => a.contentId && openContent(a.contentId)}
                >
                  <CardContent className="py-4">
                    <div className="flex items-start gap-3">
                      {contentTypeIcon((a as any).contentType || 'lesson')}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{a.title}</p>
                        <p className="text-xs text-muted-foreground">{(a.classId as any)?.name || ''}</p>
                        {a.dueDate && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Due: {new Date(a.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0"
                        disabled={loadingContentId === a.contentId}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (a.contentId) openContent(a.contentId);
                        }}
                      >
                        {loadingContentId === a.contentId ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Content Viewer Modal */}
        <ContentViewer
          content={viewerContent}
          open={viewerOpen}
          onClose={() => { setViewerOpen(false); setViewerContent(null); }}
        />
      </div>
    </AppLayout>
  );
};

export default StudentLms;
