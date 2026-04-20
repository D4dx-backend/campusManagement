import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Plus, Search, ClipboardList, Pencil, Trash2, Copy, Globe, Eye,
  FileQuestion, Timer, Award, BarChart2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { classesApi, Class } from '@/services/classes';
import { subjectApi, Subject } from '@/services/subjectService';
import { assessmentApi, LmsAssessment } from '@/services/lmsService';

const typeConfig: Record<string, { label: string; color: string }> = {
  quiz: { label: 'Quiz', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  assignment: { label: 'Assignment', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  online_exam: { label: 'Online Exam', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
};

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  draft: { label: 'Draft', variant: 'secondary' },
  published: { label: 'Published', variant: 'default' },
  archived: { label: 'Archived', variant: 'outline' },
};

const Assessments = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState<LmsAssessment[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => { loadClasses(); }, []);

  useEffect(() => {
    if (selectedClassId) {
      loadSubjects();
      setSelectedSubjectId('');
    } else {
      setSubjects([]);
      setSelectedSubjectId('');
    }
  }, [selectedClassId]);

  useEffect(() => { loadAssessments(); }, [selectedClassId, selectedSubjectId, filterType, filterStatus]);

  useEffect(() => {
    const timer = setTimeout(loadAssessments, 300);
    return () => clearTimeout(timer);
  }, [search]);

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

  const loadAssessments = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { limit: 100, search };
      if (selectedClassId) params.classId = selectedClassId;
      if (selectedSubjectId) params.subjectId = selectedSubjectId;
      if (filterType) params.assessmentType = filterType;
      if (filterStatus) params.status = filterStatus;
      const res = await assessmentApi.getAll(params);
      setAssessments(res.data || []);
    } catch {
      toast({ title: 'Error', description: 'Something went wrong while loading assessments. Please try again.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (a: LmsAssessment) => {
    if (!confirm(`Delete "${a.title}"? All submissions will also be deleted.`)) return;
    try {
      await assessmentApi.delete(a._id);
      toast({ title: 'Deleted' });
      loadAssessments();
    } catch {
      toast({ title: 'Error', description: 'Something went wrong while deleting. Please try again.', variant: 'destructive' });
    }
  };

  const handlePublish = async (a: LmsAssessment) => {
    try {
      await assessmentApi.publish(a._id);
      toast({ title: 'Published', description: `"${a.title}" is now live` });
      loadAssessments();
    } catch (err: any) {
      toast({ title: 'Error', description: err.response?.data?.message || 'Something went wrong while publishing. Please try again', variant: 'destructive' });
    }
  };

  const handleDuplicate = async (a: LmsAssessment) => {
    try {
      await assessmentApi.duplicate(a._id);
      toast({ title: 'Duplicated', description: 'A copy has been created' });
      loadAssessments();
    } catch {
      toast({ title: 'Error', description: 'Something went wrong while duplicating. Please try again.', variant: 'destructive' });
    }
  };

  const getRefName = (ref: string | { _id: string; name: string; code?: string }) =>
    typeof ref === 'string' ? ref : ref.name;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Assessments</h1>
            <p className="text-muted-foreground text-sm mt-1">Create quizzes, assignments, and online exams</p>
          </div>
          <Button onClick={() => navigate('/lms/assessments/new')}>
            <Plus className="w-4 h-4 mr-2" />
            Create Assessment
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                <SelectTrigger>
                  <SelectValue placeholder="All Classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Classes</SelectItem>
                  {classes.map(c => (
                    <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={selectedSubjectId}
                onValueChange={setSelectedSubjectId}
                disabled={!selectedClassId || selectedClassId === '__all__'}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Subjects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Subjects</SelectItem>
                  {subjects.map(s => (
                    <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Types</SelectItem>
                  <SelectItem value="quiz">Quiz</SelectItem>
                  <SelectItem value="assignment">Assignment</SelectItem>
                  <SelectItem value="online_exam">Online Exam</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Assessment List */}
        {loading ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
            </CardContent>
          </Card>
        ) : assessments.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <ClipboardList className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
              <h3 className="text-lg font-medium mb-2">No assessments found</h3>
              <p className="text-muted-foreground text-sm mb-4">Create your first quiz, assignment or online exam</p>
              <Button onClick={() => navigate('/lms/assessments/new')} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Create Assessment
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {assessments.map(a => {
              const tc = typeConfig[a.assessmentType] || typeConfig.quiz;
              const sc = statusConfig[a.status] || statusConfig.draft;
              return (
                <Card key={a._id} className="hover:shadow-md transition-shadow">
                  <CardContent className="py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className={`flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0 ${tc.color}`}>
                          <FileQuestion className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-medium">{a.title}</h3>
                            <Badge variant="outline" className="text-[10px]">{tc.label}</Badge>
                            <Badge variant={sc.variant} className="text-[10px]">{sc.label}</Badge>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
                            <span>{getRefName(a.classId)}</span>
                            <span>•</span>
                            <span>{getRefName(a.subjectId)}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <FileQuestion className="w-3 h-3" />
                              {a.questions.length} questions
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Award className="w-3 h-3" />
                              {a.totalMarks} marks
                            </span>
                            {a.duration && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <Timer className="w-3 h-3" />
                                  {a.duration} min
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {a.status === 'draft' && (
                          <Button size="sm" variant="outline" onClick={() => handlePublish(a)} className="text-xs h-7">
                            <Globe className="w-3 h-3 mr-1" />
                            Publish
                          </Button>
                        )}
                        {a.status === 'published' && (
                          <Button
                            size="sm" variant="outline"
                            onClick={() => navigate(`/lms/assessments/${a._id}/results`)}
                            className="text-xs h-7"
                          >
                            <BarChart2 className="w-3 h-3 mr-1" />
                            Results
                          </Button>
                        )}
                        <Button size="icon" variant="ghost" onClick={() => navigate(`/lms/assessments/${a._id}`)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDuplicate(a)} title="Duplicate">
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDelete(a)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Assessments;
