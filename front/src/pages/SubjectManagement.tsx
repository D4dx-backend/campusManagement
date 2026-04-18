import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Pencil, Trash2, Loader2, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { subjectApi, Subject } from '@/services/subjectService';
import { classesApi, Class } from '@/services/classes';

const SubjectManagement = () => {
  const { toast } = useToast();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Subject | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    classIds: [] as string[],
    maxMark: 100,
    passMark: 33,
    isOptional: false,
    status: 'active' as 'active' | 'inactive'
  });

  useEffect(() => { loadClasses(); loadSubjects(); }, []);

  const loadClasses = async () => {
    try {
      const res = await classesApi.getClasses({ limit: 100, status: 'active' });
      setClasses(res.data || []);
    } catch { /* ignore */ }
  };

  const loadSubjects = async () => {
    setLoading(true);
    try {
      const res = await subjectApi.getAll({ limit: 100, search });
      setSubjects(res.data || []);
    } catch {
      toast({ title: 'Error', description: 'Failed to load subjects', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(loadSubjects, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const openCreate = () => {
    setEditing(null);
    setFormData({ name: '', code: '', classIds: [], maxMark: 100, passMark: 33, isOptional: false, status: 'active' });
    setDialogOpen(true);
  };

  const openEdit = (s: Subject) => {
    setEditing(s);
    setFormData({
      name: s.name,
      code: s.code,
      classIds: s.classIds || [],
      maxMark: s.maxMark,
      passMark: s.passMark,
      isOptional: s.isOptional,
      status: s.status
    });
    setDialogOpen(true);
  };

  const toggleClass = (classId: string) => {
    setFormData(prev => ({
      ...prev,
      classIds: prev.classIds.includes(classId)
        ? prev.classIds.filter(id => id !== classId)
        : [...prev.classIds, classId]
    }));
  };

  const handleSave = async () => {
    if (!formData.name || !formData.code) {
      toast({ title: 'Validation', description: 'Name and code are required', variant: 'destructive' });
      return;
    }
    try {
      if (editing) {
        await subjectApi.update(editing._id, formData);
        toast({ title: 'Success', description: 'Subject updated' });
      } else {
        await subjectApi.create(formData);
        toast({ title: 'Success', description: 'Subject created' });
      }
      setDialogOpen(false);
      loadSubjects();
    } catch (err: any) {
      toast({ title: 'Error', description: err.response?.data?.message || 'Failed to save', variant: 'destructive' });
    }
  };

  const handleDelete = async (s: Subject) => {
    if (!confirm(`Delete subject "${s.name}"?`)) return;
    try {
      await subjectApi.delete(s._id);
      toast({ title: 'Deleted', description: 'Subject deleted' });
      loadSubjects();
    } catch {
      toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' });
    }
  };

  const getClassNames = (classIds: string[]) => {
    if (!classIds?.length) return 'All';
    return classIds.map(id => classes.find(c => c._id === id)?.name).filter(Boolean).join(', ') || '-';
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">SUBJECTS</h1>
          <Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" />Add Subject</Button>
        </div>

        <Card>
          <CardHeader>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search subjects..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin" /></div>
            ) : subjects.length === 0 ? (
              <p className="text-center text-muted-foreground py-10">No subjects found.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Classes</TableHead>
                    <TableHead>Max Mark</TableHead>
                    <TableHead>Pass Mark</TableHead>
                    <TableHead>Optional</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subjects.map((s, i) => (
                    <TableRow key={s._id}>
                      <TableCell>{i + 1}</TableCell>
                      <TableCell className="font-mono">{s.code}</TableCell>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{getClassNames(s.classIds)}</TableCell>
                      <TableCell>{s.maxMark}</TableCell>
                      <TableCell>{s.passMark}</TableCell>
                      <TableCell>{s.isOptional ? <Badge variant="outline">Optional</Badge> : '-'}</TableCell>
                      <TableCell>
                        <Badge variant={s.status === 'active' ? 'default' : 'secondary'}>{s.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(s)}><Pencil className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(s)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit Subject' : 'Add Subject'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Subject Name *</Label>
                  <Input value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Mathematics" />
                </div>
                <div>
                  <Label>Subject Code *</Label>
                  <Input value={formData.code} onChange={e => setFormData(p => ({ ...p, code: e.target.value.toUpperCase() }))} placeholder="e.g. MATH" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Max Mark</Label>
                  <Input type="number" value={formData.maxMark} onChange={e => setFormData(p => ({ ...p, maxMark: Number(e.target.value) }))} />
                </div>
                <div>
                  <Label>Pass Mark</Label>
                  <Input type="number" value={formData.passMark} onChange={e => setFormData(p => ({ ...p, passMark: Number(e.target.value) }))} />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox checked={formData.isOptional} onCheckedChange={(checked) => setFormData(p => ({ ...p, isOptional: !!checked }))} />
                <Label>Optional Subject</Label>
              </div>
              <div>
                <Label>Applicable Classes</Label>
                <div className="grid grid-cols-4 gap-2 mt-2 max-h-48 overflow-y-auto border rounded-md p-3">
                  {classes.map(cls => (
                    <div key={cls._id} className="flex items-center space-x-2">
                      <Checkbox checked={formData.classIds.includes(cls._id)} onCheckedChange={() => toggleClass(cls._id)} />
                      <Label className="text-sm font-normal">{cls.name}</Label>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Leave empty to apply to all classes</p>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={v => setFormData(p => ({ ...p, status: v as 'active' | 'inactive' }))}>
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
              <Button onClick={handleSave}>{editing ? 'Update' : 'Create'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default SubjectManagement;
