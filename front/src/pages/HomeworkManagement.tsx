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
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Loader2, Plus, Trash2, Pencil, BookOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import homeworkService, { HomeworkItem, CreateHomeworkData } from '@/services/homeworkService';
import { classesApi, Class } from '@/services/classes';

const HomeworkManagement = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = ['platform_admin', 'org_admin', 'branch_admin'].includes(user?.role || '');
  const canCreate = isAdmin || user?.role === 'teacher';

  const [createOpen, setCreateOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [filterClassId, setFilterClassId] = useState('');
  const [classes, setClasses] = useState<Class[]>([]);

  // Form state
  const [classId, setClassId] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    classesApi.getClasses({ limit: 100, status: 'active' }).then((r) => setClasses(r.data || [])).catch(() => {});
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ['homework', filterClassId],
    queryFn: () => homeworkService.getAll({ classId: filterClassId || undefined, limit: 50 }),
  });

  const items: HomeworkItem[] = data?.data || [];

  const createMutation = useMutation({
    mutationFn: (d: CreateHomeworkData) =>
      editId ? homeworkService.update(editId, d) : homeworkService.create(d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homework'] });
      toast({ title: editId ? 'Homework updated' : 'Homework assigned' });
      closeForm();
    },
    onError: (e: any) => toast({ title: 'Error', description: e?.response?.data?.message || 'Failed', variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => homeworkService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homework'] });
      toast({ title: 'Homework deleted' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e?.response?.data?.message || 'Failed', variant: 'destructive' }),
  });

  const resetForm = () => {
    setClassId(''); setSubjectName(''); setDate(new Date().toISOString().split('T')[0]);
    setDueDate(''); setTitle(''); setDescription(''); setEditId(null);
  };
  const closeForm = () => { setCreateOpen(false); resetForm(); };

  const openEdit = (hw: HomeworkItem) => {
    setEditId(hw._id); setClassId(hw.classId); setSubjectName(hw.subjectName);
    setDate(hw.date.split('T')[0]); setDueDate(hw.dueDate.split('T')[0]);
    setTitle(hw.title); setDescription(hw.description);
    setCreateOpen(true);
  };

  const handleSubmit = () => {
    if (!classId || !subjectName.trim() || !date || !dueDate || !title.trim() || !description.trim()) {
      toast({ title: 'Please fill all required fields', variant: 'destructive' });
      return;
    }
    const selectedClass = classes.find((c) => c._id === classId);
    createMutation.mutate({
      classId,
      className: selectedClass?.name || '',
      subjectName: subjectName.trim(),
      date,
      dueDate,
      title: title.trim(),
      description: description.trim(),
    });
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString();

  const isOverdue = (dueDate: string) => new Date(dueDate) < new Date();

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Homework / Daily Diary</h1>
            <p className="text-muted-foreground text-sm">Assign and manage daily homework</p>
          </div>
          {canCreate && (
            <Button onClick={() => { resetForm(); setCreateOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" />Assign Homework
            </Button>
          )}
        </div>

        {/* Filter */}
        <div className="flex gap-3">
          <Select value={filterClassId} onValueChange={setFilterClassId}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Classes" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {classes.map((c) => (
                <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>
            ) : items.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">No homework assigned yet</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Assigned By</TableHead>
                    {canCreate && <TableHead>Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((hw) => (
                    <TableRow key={hw._id}>
                      <TableCell>{formatDate(hw.date)}</TableCell>
                      <TableCell><Badge variant="secondary">{hw.className}</Badge></TableCell>
                      <TableCell>{hw.subjectName}</TableCell>
                      <TableCell className="max-w-[200px]">
                        <div className="font-medium truncate">{hw.title}</div>
                        <div className="text-xs text-muted-foreground truncate">{hw.description}</div>
                      </TableCell>
                      <TableCell>
                        <span className={isOverdue(hw.dueDate) ? 'text-red-600 font-medium' : ''}>
                          {formatDate(hw.dueDate)}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">{hw.assignedByName}</TableCell>
                      {canCreate && (
                        <TableCell>
                          <div className="flex gap-1">
                            {(isAdmin || hw.assignedBy === user?._id) && (
                              <>
                                <Button size="icon" variant="ghost" onClick={() => openEdit(hw)}><Pencil className="w-4 h-4" /></Button>
                                <Button size="icon" variant="ghost" className="text-destructive" onClick={() => deleteMutation.mutate(hw._id)}><Trash2 className="w-4 h-4" /></Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Create/Edit Dialog */}
        <Dialog open={createOpen} onOpenChange={(v) => { if (!v) closeForm(); else setCreateOpen(true); }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editId ? 'Edit Homework' : 'Assign Homework'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Class *</Label>
                  <Select value={classId} onValueChange={setClassId}>
                    <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                    <SelectContent>
                      {classes.map((c) => (
                        <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Subject *</Label>
                  <Input value={subjectName} onChange={(e) => setSubjectName(e.target.value)} placeholder="e.g. Mathematics" />
                </div>
              </div>
              <div>
                <Label>Title *</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Homework title" />
              </div>
              <div>
                <Label>Description *</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Homework details..." rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Date *</Label>
                  <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
                <div>
                  <Label>Due Date *</Label>
                  <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} min={date} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
              <Button onClick={handleSubmit} disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editId ? 'Update' : 'Assign'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default HomeworkManagement;
