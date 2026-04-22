import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Pencil, Trash2, Loader2, ArrowLeft, GripVertical } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { classesApi, Class } from '@/services/classes';
import { subjectApi, Subject } from '@/services/subjectService';
import { chapterApi, Chapter } from '@/services/lmsService';

const ChapterManagement = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialClassId = searchParams.get('classId') || '';
  const initialSubjectId = searchParams.get('subjectId') || '';

  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Chapter | null>(null);

  const [selectedClassId, setSelectedClassId] = useState(initialClassId);
  const [selectedSubjectId, setSelectedSubjectId] = useState(initialSubjectId);

  const [formData, setFormData] = useState({
    name: '',
    chapterNumber: 1,
    description: '',
    status: 'active' as 'active' | 'inactive'
  });

  useEffect(() => { loadClasses(); }, []);

  useEffect(() => {
    if (selectedClassId) {
      loadSubjects();
    } else {
      setSubjects([]);
      setSelectedSubjectId('');
    }
  }, [selectedClassId]);

  useEffect(() => {
    if (selectedClassId && selectedSubjectId) {
      loadChapters();
    } else {
      setChapters([]);
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
        sortBy: 'chapterNumber',
        sortOrder: 'asc'
      });
      setChapters(res.data || []);
    } catch {
      toast({ title: 'Error', description: 'Something went wrong while loading. Please try again chapters', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setFormData({
      name: '',
      chapterNumber: chapters.length + 1,
      description: '',
      status: 'active'
    });
    setDialogOpen(true);
  };

  const openEdit = (ch: Chapter) => {
    setEditing(ch);
    setFormData({
      name: ch.name,
      chapterNumber: ch.chapterNumber,
      description: ch.description || '',
      status: ch.status
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name) {
      toast({ title: 'Validation', description: 'Chapter name is required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await chapterApi.update(editing._id, formData);
        toast({ title: 'Success', description: 'Chapter updated' });
      } else {
        await chapterApi.create({
          ...formData,
          classId: selectedClassId,
          subjectId: selectedSubjectId
        } as any);
        toast({ title: 'Success', description: 'Chapter created' });
      }
      setDialogOpen(false);
      loadChapters();
    } catch (err: any) {
      toast({ title: 'Error', description: err.response?.data?.message || 'Something went wrong while saving. Please try again', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (ch: Chapter) => {
    if (!confirm(`Delete chapter "${ch.name}"? All content inside will also be deleted.`)) return;
    try {
      await chapterApi.delete(ch._id);
      toast({ title: 'Deleted', description: 'Chapter and its content deleted' });
      loadChapters();
    } catch {
      toast({ title: 'Error', description: 'Something went wrong while deleting. Please try again.', variant: 'destructive' });
    }
  };

  const selectedClassName = classes.find(c => c._id === selectedClassId)?.name || '';
  const selectedSubjectName = subjects.find(s => s._id === selectedSubjectId)?.name || '';

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/lms')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Chapter Management</h1>
            {selectedClassName && selectedSubjectName && (
              <p className="text-muted-foreground text-sm mt-0.5">{selectedClassName} — {selectedSubjectName}</p>
            )}
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      <SelectItem key={s._id} value={s._id}>{s.name} ({s.code})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Chapters List */}
        {selectedClassId && selectedSubjectId && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                Chapters
                {chapters.length > 0 && <span className="text-muted-foreground font-normal ml-2">({chapters.length})</span>}
              </h2>
              <Button onClick={openCreate}>
                <Plus className="w-4 h-4 mr-2" />
                Add Chapter
              </Button>
            </div>

            {loading ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Loader2 className="w-8 h-8 mx-auto animate-spin text-muted-foreground" />
                </CardContent>
              </Card>
            ) : chapters.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground mb-3">No chapters yet. Create the first one!</p>
                  <Button onClick={openCreate} variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Chapter
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {chapters.map(ch => (
                  <Card key={ch._id}>
                    <CardContent className="py-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 text-primary font-bold text-sm flex-shrink-0">
                            {ch.chapterNumber}
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-medium truncate">{ch.name}</h3>
                            {ch.description && (
                              <p className="text-sm text-muted-foreground truncate">{ch.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                          <Badge variant={ch.status === 'active' ? 'default' : 'secondary'}>
                            {ch.status}
                          </Badge>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => navigate(`/lms/chapters/${ch._id}/content?classId=${selectedClassId}&subjectId=${selectedSubjectId}`)}
                            title="View Content"
                          >
                            <span className="text-xs font-medium">📚</span>
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => openEdit(ch)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => handleDelete(ch)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
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

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Chapter' : 'Create Chapter'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Chapter Number</Label>
              <Input
                type="number"
                min={1}
                value={formData.chapterNumber}
                onChange={e => setFormData(prev => ({ ...prev, chapterNumber: parseInt(e.target.value) || 1 }))}
              />
            </div>
            <div className="grid gap-2">
              <Label>Chapter Name *</Label>
              <Input
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Photosynthesis"
              />
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of the chapter..."
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={v => setFormData(prev => ({ ...prev, status: v as 'active' | 'inactive' }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editing ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default ChapterManagement;
