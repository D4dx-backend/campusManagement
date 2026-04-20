import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { BookOpen, FileText, Video, Image, Link, Layers, Search, ChevronRight, Plus, FolderOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { classesApi, Class } from '@/services/classes';
import { subjectApi, Subject } from '@/services/subjectService';
import { chapterApi, Chapter, lmsStatsApi, LmsStats } from '@/services/lmsService';

const contentTypeIcons: Record<string, React.ReactNode> = {
  lesson: <FileText className="w-4 h-4" />,
  video: <Video className="w-4 h-4" />,
  document: <FileText className="w-4 h-4" />,
  image: <Image className="w-4 h-4" />,
  link: <Link className="w-4 h-4" />,
  interactive: <Layers className="w-4 h-4" />,
};

const ContentLibrary = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [stats, setStats] = useState<LmsStats | null>(null);
  const [loading, setLoading] = useState(false);

  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => { loadClasses(); }, []);

  useEffect(() => {
    if (selectedClassId) {
      loadSubjects();
      setSelectedSubjectId('');
      setChapters([]);
    } else {
      setSubjects([]);
      setSelectedSubjectId('');
      setChapters([]);
    }
  }, [selectedClassId]);

  useEffect(() => {
    if (selectedClassId && selectedSubjectId) {
      loadChapters();
      loadStats();
    } else {
      setChapters([]);
      setStats(null);
    }
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

  const loadChapters = async () => {
    setLoading(true);
    try {
      const res = await chapterApi.getAll({
        classId: selectedClassId,
        subjectId: selectedSubjectId,
        limit: 100,
        search,
        status: 'active'
      });
      setChapters(res.data || []);
    } catch {
      toast({ title: 'Error', description: 'Failed to load chapters', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const res = await lmsStatsApi.getStats({ classId: selectedClassId, subjectId: selectedSubjectId });
      setStats(res.data);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    if (selectedClassId && selectedSubjectId) {
      const timer = setTimeout(loadChapters, 300);
      return () => clearTimeout(timer);
    }
  }, [search]);

  const getSubjectName = (s: Subject) => `${s.name} (${s.code})`;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Learning Management</h1>
            <p className="text-muted-foreground text-sm mt-1">Manage content, chapters and learning materials</p>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Class</label>
                <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map(c => (
                      <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Subject</label>
                <Select
                  value={selectedSubjectId}
                  onValueChange={setSelectedSubjectId}
                  disabled={!selectedClassId || subjects.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={!selectedClassId ? 'Select class first' : 'Select Subject'} />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map(s => (
                      <SelectItem key={s._id} value={s._id}>{getSubjectName(s)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search chapters..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-9"
                    disabled={!selectedSubjectId}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4 pb-4">
                <p className="text-sm text-muted-foreground">Chapters</p>
                <p className="text-2xl font-bold">{stats.totalChapters}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <p className="text-sm text-muted-foreground">Total Content</p>
                <p className="text-2xl font-bold">{stats.totalContent}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <p className="text-sm text-muted-foreground">Published</p>
                <p className="text-2xl font-bold text-green-600">{stats.publishedContent}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <p className="text-sm text-muted-foreground">Drafts</p>
                <p className="text-2xl font-bold text-orange-500">{stats.draftContent}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Content Area */}
        {!selectedClassId ? (
          <Card>
            <CardContent className="py-16 text-center">
              <BookOpen className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
              <h3 className="text-lg font-medium mb-2">Select a Class</h3>
              <p className="text-muted-foreground text-sm">Choose a class from the dropdown above to browse learning content</p>
            </CardContent>
          </Card>
        ) : !selectedSubjectId ? (
          <Card>
            <CardContent className="py-16 text-center">
              <FolderOpen className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
              <h3 className="text-lg font-medium mb-2">Select a Subject</h3>
              <p className="text-muted-foreground text-sm">Choose a subject to view chapters and content</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Action bar */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                Chapters
                {chapters.length > 0 && <span className="text-muted-foreground font-normal ml-2">({chapters.length})</span>}
              </h2>
              <Button
                onClick={() => navigate(`/lms/chapters?classId=${selectedClassId}&subjectId=${selectedSubjectId}`)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Manage Chapters
              </Button>
            </div>

            {loading ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
                  <p className="text-sm text-muted-foreground mt-3">Loading chapters...</p>
                </CardContent>
              </Card>
            ) : chapters.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Layers className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
                  <h3 className="font-medium mb-1">No chapters yet</h3>
                  <p className="text-muted-foreground text-sm mb-4">Create chapters to organize learning content</p>
                  <Button
                    onClick={() => navigate(`/lms/chapters?classId=${selectedClassId}&subjectId=${selectedSubjectId}`)}
                    variant="outline"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Chapter
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {chapters.map(chapter => (
                  <Card
                    key={chapter._id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => navigate(`/lms/chapters/${chapter._id}/content?classId=${selectedClassId}&subjectId=${selectedSubjectId}`)}
                  >
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary font-bold text-sm">
                            {chapter.chapterNumber}
                          </div>
                          <div>
                            <h3 className="font-medium">{chapter.name}</h3>
                            {chapter.description && (
                              <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">{chapter.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={chapter.status === 'active' ? 'default' : 'secondary'}>
                            {chapter.status}
                          </Badge>
                          <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default ContentLibrary;
