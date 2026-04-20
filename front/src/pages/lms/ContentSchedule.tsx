import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Plus, Search, Calendar, Play, CheckCircle2, XCircle, Trash2, Clock,
  Loader2, Send, RotateCcw, Pencil
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { classesApi, Class } from '@/services/classes';
import { subjectApi, Subject } from '@/services/subjectService';
import { divisionsApi, Division } from '@/services/divisions';
import {
  contentAssignmentApi, ClassContentAssignment,
  assessmentApi, LmsAssessment,
  contentApi, LessonContent
} from '@/services/lmsService';

const statusColors: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-700',
  active: 'bg-green-100 text-green-700',
  completed: 'bg-gray-100 text-gray-700',
  cancelled: 'bg-red-100 text-red-700',
};

const ContentSchedule = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [assignments, setAssignments] = useState<ClassContentAssignment[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [filterClassId, setFilterClassId] = useState('');
  const [filterContentType, setFilterContentType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [availableContent, setAvailableContent] = useState<(LmsAssessment | LessonContent)[]>([]);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    contentType: 'assessment' as 'lesson' | 'assessment',
    contentId: '',
    classIds: [] as string[],
    divisionIds: [] as string[],
    title: '',
    description: '',
    availableFrom: new Date().toISOString().slice(0, 16),
    availableUntil: '',
    dueDate: '',
    scheduleType: 'immediate' as 'immediate' | 'scheduled' | 'recurring',
    recurringFrequency: 'weekly' as 'daily' | 'weekly' | 'bi_weekly' | 'monthly',
    recurringDayOfWeek: 1,
    recurringEndDate: ''
  });

  // Select class for loading subjects/divisions in form
  const [formClassId, setFormClassId] = useState('');

  useEffect(() => { loadClasses(); }, []);
  useEffect(() => { loadAssignments(); }, [filterClassId, filterContentType, filterStatus]);
  useEffect(() => {
    const timer = setTimeout(loadAssignments, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // When formClassId changes, load divisions
  useEffect(() => {
    if (formClassId) {
      divisionsApi.getDivisionsByClass(formClassId).then(r => setDivisions(r.data || [])).catch(() => {});
    } else {
      setDivisions([]);
    }
  }, [formClassId]);

  // When contentType changes, load available content
  useEffect(() => {
    loadAvailableContent();
  }, [form.contentType, filterClassId]);

  const loadClasses = async () => {
    try {
      const res = await classesApi.getClasses({ limit: 100, status: 'active' });
      setClasses(res.data || []);
    } catch { /* ignore */ }
  };

  const loadAssignments = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { limit: 100, search };
      if (filterClassId) params.classId = filterClassId;
      if (filterContentType) params.contentType = filterContentType;
      if (filterStatus) params.status = filterStatus;
      const res = await contentAssignmentApi.getAll(params);
      setAssignments(res.data || []);
    } catch {
      toast({ title: 'Error', description: 'Failed to load assignments', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableContent = async () => {
    try {
      if (form.contentType === 'assessment') {
        const res = await assessmentApi.getAll({ limit: 200, status: 'published' });
        setAvailableContent(res.data || []);
      } else {
        const res = await contentApi.getAll({ limit: 200, status: 'published' });
        setAvailableContent(res.data || []);
      }
    } catch { /* ignore */ }
  };

  const openCreate = () => {
    setForm({
      contentType: 'assessment',
      contentId: '',
      classIds: [],
      divisionIds: [],
      title: '',
      description: '',
      availableFrom: new Date().toISOString().slice(0, 16),
      availableUntil: '',
      dueDate: '',
      scheduleType: 'immediate',
      recurringFrequency: 'weekly',
      recurringDayOfWeek: 1,
      recurringEndDate: ''
    });
    setFormClassId('');
    setCreateOpen(true);
  };

  const toggleClass = (classId: string) => {
    setForm(prev => ({
      ...prev,
      classIds: prev.classIds.includes(classId)
        ? prev.classIds.filter(c => c !== classId)
        : [...prev.classIds, classId]
    }));
  };

  const toggleDivision = (divId: string) => {
    setForm(prev => ({
      ...prev,
      divisionIds: prev.divisionIds.includes(divId)
        ? prev.divisionIds.filter(d => d !== divId)
        : [...prev.divisionIds, divId]
    }));
  };

  const handleCreate = async () => {
    if (!form.contentId || form.classIds.length === 0 || !form.title) {
      toast({ title: 'Missing fields', description: 'Select content, at least one class, and a title', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const payload: any = {
        contentType: form.contentType,
        contentId: form.contentId,
        classIds: form.classIds,
        divisionIds: form.divisionIds,
        title: form.title,
        description: form.description,
        availableFrom: form.availableFrom,
        scheduleType: form.scheduleType
      };
      if (form.availableUntil) payload.availableUntil = form.availableUntil;
      if (form.dueDate) payload.dueDate = form.dueDate;
      if (form.scheduleType === 'recurring') {
        payload.recurringConfig = {
          frequency: form.recurringFrequency,
          dayOfWeek: form.recurringDayOfWeek,
          endDate: form.recurringEndDate || undefined
        };
      }

      const res = await contentAssignmentApi.create(payload);
      toast({ title: 'Assigned', description: res.message });
      setCreateOpen(false);
      loadAssignments();
    } catch (err: any) {
      toast({ title: 'Error', description: err.response?.data?.message || 'Failed', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleActivate = async (a: ClassContentAssignment) => {
    try {
      await contentAssignmentApi.activate(a._id);
      toast({ title: 'Activated' });
      loadAssignments();
    } catch (err: any) {
      toast({ title: 'Error', description: err.response?.data?.message || 'Failed', variant: 'destructive' });
    }
  };

  const handleComplete = async (a: ClassContentAssignment) => {
    try {
      await contentAssignmentApi.complete(a._id);
      toast({ title: 'Completed' });
      loadAssignments();
    } catch (err: any) {
      toast({ title: 'Error', description: err.response?.data?.message || 'Failed', variant: 'destructive' });
    }
  };

  const handleDelete = async (a: ClassContentAssignment) => {
    if (!confirm(`Delete "${a.title}"?`)) return;
    try {
      await contentAssignmentApi.delete(a._id);
      toast({ title: 'Deleted' });
      loadAssignments();
    } catch {
      toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' });
    }
  };

  const getClassName = (a: ClassContentAssignment) => {
    const c = a.classId as any;
    return c?.name || '-';
  };

  const formatDate = (d?: string) => {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getContentLabel = (item: any): string => {
    return item?.title || item?.name || 'Unknown';
  };

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Content Scheduling</h1>
            <p className="text-sm text-muted-foreground">Assign content and assessments to classes with scheduling</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/lms/calendar')}>
              <Calendar className="w-4 h-4 mr-2" /> Calendar
            </Button>
            <Button onClick={openCreate}>
              <Plus className="w-4 h-4 mr-2" /> Assign Content
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={filterClassId || '__all__'} onValueChange={v => setFilterClassId(v === '__all__' ? '' : v)}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Class" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Classes</SelectItem>
              {classes.map(c => <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterContentType || '__all__'} onValueChange={v => setFilterContentType(v === '__all__' ? '' : v)}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Types</SelectItem>
              <SelectItem value="lesson">Lesson</SelectItem>
              <SelectItem value="assessment">Assessment</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus || '__all__'} onValueChange={v => setFilterStatus(v === '__all__' ? '' : v)}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Status</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card><CardContent className="py-3 text-center"><p className="text-2xl font-bold">{assignments.length}</p><p className="text-xs text-muted-foreground">Total</p></CardContent></Card>
          <Card><CardContent className="py-3 text-center"><p className="text-2xl font-bold text-green-600">{assignments.filter(a => a.status === 'active').length}</p><p className="text-xs text-muted-foreground">Active</p></CardContent></Card>
          <Card><CardContent className="py-3 text-center"><p className="text-2xl font-bold text-blue-600">{assignments.filter(a => a.status === 'scheduled').length}</p><p className="text-xs text-muted-foreground">Scheduled</p></CardContent></Card>
          <Card><CardContent className="py-3 text-center"><p className="text-2xl font-bold text-gray-500">{assignments.filter(a => a.status === 'completed').length}</p><p className="text-xs text-muted-foreground">Completed</p></CardContent></Card>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
        ) : assignments.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">No assignments yet. Click "Assign Content" to get started.</CardContent></Card>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Available</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.map(a => (
                  <TableRow key={a._id}>
                    <TableCell className="font-medium max-w-[200px] truncate">{a.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">{a.contentType}</Badge>
                    </TableCell>
                    <TableCell>{getClassName(a)}</TableCell>
                    <TableCell className="capitalize text-sm">{a.scheduleType}</TableCell>
                    <TableCell className="text-sm">{formatDate(a.availableFrom)}</TableCell>
                    <TableCell className="text-sm">{formatDate(a.dueDate)}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[a.status] || ''}>{a.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        {a.status === 'scheduled' && (
                          <Button size="sm" variant="outline" onClick={() => handleActivate(a)} title="Activate">
                            <Play className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        {a.status === 'active' && (
                          <Button size="sm" variant="outline" onClick={() => handleComplete(a)} title="Complete">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(a)} title="Delete">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>

      {/* Create Assignment Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Assign Content to Classes</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Title */}
            <div>
              <Label>Title *</Label>
              <Input value={form.title} onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))} placeholder="e.g. Chapter 3 Quiz — Class 5" className="mt-1" />
            </div>

            {/* Content Type */}
            <div>
              <Label>Content Type *</Label>
              <Select value={form.contentType} onValueChange={v => setForm(prev => ({ ...prev, contentType: v as any, contentId: '' }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="assessment">Assessment (Quiz / Assignment / Exam)</SelectItem>
                  <SelectItem value="lesson">Lesson Content</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Select content */}
            <div>
              <Label>Select {form.contentType === 'assessment' ? 'Assessment' : 'Lesson'} *</Label>
              <Select value={form.contentId || '__none__'} onValueChange={v => {
                const id = v === '__none__' ? '' : v;
                setForm(prev => ({ ...prev, contentId: id }));
                // Auto-fill title from content
                if (id) {
                  const item = availableContent.find((c: any) => c._id === id);
                  if (item && !form.title) {
                    setForm(prev => ({ ...prev, title: getContentLabel(item) }));
                  }
                }
              }}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Choose..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">-- Select --</SelectItem>
                  {availableContent.map((c: any) => (
                    <SelectItem key={c._id} value={c._id}>{getContentLabel(c)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Target classes (multi-select) */}
            <div>
              <Label>Assign to Classes *</Label>
              <div className="grid grid-cols-3 gap-2 mt-1 max-h-32 overflow-y-auto border rounded-md p-2">
                {classes.map(c => (
                  <label key={c._id} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={form.classIds.includes(c._id)}
                      onCheckedChange={() => toggleClass(c._id)}
                    />
                    {c.name}
                  </label>
                ))}
              </div>
              {form.classIds.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1">{form.classIds.length} class(es) selected</p>
              )}
            </div>

            {/* Divisions (optional — select a class first) */}
            <div>
              <Label>Filter by Divisions (optional)</Label>
              <Select value={formClassId || '__none__'} onValueChange={v => setFormClassId(v === '__none__' ? '' : v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select class to load divisions" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">-- Select class --</SelectItem>
                  {classes.filter(c => form.classIds.includes(c._id)).map(c => (
                    <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {divisions.length > 0 && (
                <div className="flex gap-2 flex-wrap mt-2">
                  {divisions.map(d => (
                    <label key={d._id} className="flex items-center gap-1.5 text-sm cursor-pointer">
                      <Checkbox
                        checked={form.divisionIds.includes(d._id)}
                        onCheckedChange={() => toggleDivision(d._id)}
                      />
                      {d.className}-{d.name}
                    </label>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">Leave empty to assign to all divisions</p>
            </div>

            {/* Schedule type */}
            <div>
              <Label>Schedule Type</Label>
              <Select value={form.scheduleType} onValueChange={v => setForm(prev => ({ ...prev, scheduleType: v as any }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="immediate">Immediate (active now)</SelectItem>
                  <SelectItem value="scheduled">Scheduled (future date)</SelectItem>
                  <SelectItem value="recurring">Recurring</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date fields */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Available From *</Label>
                <Input type="datetime-local" value={form.availableFrom} onChange={e => setForm(prev => ({ ...prev, availableFrom: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label>Due Date</Label>
                <Input type="datetime-local" value={form.dueDate} onChange={e => setForm(prev => ({ ...prev, dueDate: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label>Available Until</Label>
                <Input type="datetime-local" value={form.availableUntil} onChange={e => setForm(prev => ({ ...prev, availableUntil: e.target.value }))} className="mt-1" />
              </div>
            </div>

            {/* Recurring config */}
            {form.scheduleType === 'recurring' && (
              <div className="border rounded-lg p-3 space-y-3 bg-muted/30">
                <Label className="font-medium">Recurring Settings</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Frequency</Label>
                    <Select value={form.recurringFrequency} onValueChange={v => setForm(prev => ({ ...prev, recurringFrequency: v as any }))}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="bi_weekly">Bi-Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {(form.recurringFrequency === 'weekly' || form.recurringFrequency === 'bi_weekly') && (
                    <div>
                      <Label className="text-xs">Day of Week</Label>
                      <Select value={String(form.recurringDayOfWeek)} onValueChange={v => setForm(prev => ({ ...prev, recurringDayOfWeek: Number(v) }))}>
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, i) => (
                            <SelectItem key={i} value={String(i)}>{day}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div>
                    <Label className="text-xs">End Date</Label>
                    <Input type="date" value={form.recurringEndDate} onChange={e => setForm(prev => ({ ...prev, recurringEndDate: e.target.value }))} className="mt-1" />
                  </div>
                </div>
              </div>
            )}

            {/* Description */}
            <div>
              <Label>Description (optional)</Label>
              <Textarea value={form.description} onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))} rows={2} className="mt-1" placeholder="Notes for this assignment..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <Send className="w-4 h-4 mr-2" />
              Assign ({form.classIds.length} class{form.classIds.length !== 1 ? 'es' : ''})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default ContentSchedule;
