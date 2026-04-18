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
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { examApi, Exam } from '@/services/examService';
import { academicYearApi, AcademicYear } from '@/services/academicYearService';

const examTypeLabels: Record<string, string> = {
  term: 'Term Exam',
  quarterly: 'Quarterly Exam',
  half_yearly: 'Half Yearly Exam',
  annual: 'Annual Exam',
  class_test: 'Class Test',
  other: 'Other'
};

const statusColors: Record<string, string> = {
  upcoming: 'bg-blue-100 text-blue-800',
  ongoing: 'bg-green-100 text-green-800',
  completed: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800'
};

const ExamManagement = () => {
  const { toast } = useToast();
  const [exams, setExams] = useState<Exam[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [filterYear, setFilterYear] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    academicYear: '',
    examType: 'term' as Exam['examType'],
    startDate: '',
    endDate: '',
    status: 'upcoming' as Exam['status']
  });

  useEffect(() => {
    loadAcademicYears();
  }, []);

  useEffect(() => {
    loadExams();
  }, [filterYear]);

  const loadAcademicYears = async () => {
    try {
      const res = await academicYearApi.getAll({ limit: 50, sortBy: 'name', sortOrder: 'desc' });
      setAcademicYears(res.data || []);
      if (res.data?.length > 0) {
        const current = res.data.find((y: AcademicYear) => y.isCurrent) || res.data[0];
        setFilterYear(current.name);
      }
    } catch { /* ignore */ }
  };

  const loadExams = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { limit: 50 };
      if (filterYear) params.academicYear = filterYear;
      const res = await examApi.getAll(params);
      setExams(res.data || []);
    } catch {
      toast({ title: 'Error', description: 'Failed to load exams', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingExam(null);
    setFormData({ name: '', academicYear: filterYear, examType: 'term', startDate: '', endDate: '', status: 'upcoming' });
    setDialogOpen(true);
  };

  const openEdit = (exam: Exam) => {
    setEditingExam(exam);
    setFormData({
      name: exam.name,
      academicYear: exam.academicYear,
      examType: exam.examType,
      startDate: exam.startDate ? new Date(exam.startDate).toISOString().split('T')[0] : '',
      endDate: exam.endDate ? new Date(exam.endDate).toISOString().split('T')[0] : '',
      status: exam.status
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.academicYear || !formData.examType) {
      toast({ title: 'Validation', description: 'Name, academic year, and exam type are required', variant: 'destructive' });
      return;
    }
    try {
      const payload: any = { ...formData };
      if (!payload.startDate) delete payload.startDate;
      if (!payload.endDate) delete payload.endDate;

      if (editingExam) {
        await examApi.update(editingExam._id, payload);
        toast({ title: 'Success', description: 'Exam updated' });
      } else {
        await examApi.create(payload);
        toast({ title: 'Success', description: 'Exam created' });
      }
      setDialogOpen(false);
      loadExams();
    } catch (err: any) {
      toast({ title: 'Error', description: err.response?.data?.message || 'Failed to save', variant: 'destructive' });
    }
  };

  const handleDelete = async (exam: Exam) => {
    if (!confirm(`Delete "${exam.name}"?`)) return;
    try {
      await examApi.delete(exam._id);
      toast({ title: 'Deleted', description: 'Exam deleted' });
      loadExams();
    } catch {
      toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' });
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">MANAGE EXAMS</h1>
          <Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" />Create Exam</Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div>
                <Label>Academic Year</Label>
                <Select value={filterYear} onValueChange={setFilterYear}>
                  <SelectTrigger className="w-[160px]"><SelectValue placeholder="Select Year" /></SelectTrigger>
                  <SelectContent>
                    {academicYears.map(y => (
                      <SelectItem key={y._id} value={y.name}>{y.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin" /></div>
            ) : exams.length === 0 ? (
              <p className="text-center text-muted-foreground py-10">No exams found. Create one to get started.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Academic Year</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {exams.map((exam, i) => (
                    <TableRow key={exam._id}>
                      <TableCell>{i + 1}</TableCell>
                      <TableCell className="font-medium">{exam.name}</TableCell>
                      <TableCell>{examTypeLabels[exam.examType] || exam.examType}</TableCell>
                      <TableCell>{exam.academicYear}</TableCell>
                      <TableCell>{exam.startDate ? new Date(exam.startDate).toLocaleDateString() : '-'}</TableCell>
                      <TableCell>{exam.endDate ? new Date(exam.endDate).toLocaleDateString() : '-'}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[exam.status]}>{exam.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(exam)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(exam)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingExam ? 'Edit Exam' : 'Create Exam'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Exam Name *</Label>
                <Input value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} placeholder="e.g. First Term Exam 2025-26" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Academic Year *</Label>
                  <Select value={formData.academicYear} onValueChange={v => setFormData(p => ({ ...p, academicYear: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {academicYears.map(y => <SelectItem key={y._id} value={y.name}>{y.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Exam Type *</Label>
                  <Select value={formData.examType} onValueChange={v => setFormData(p => ({ ...p, examType: v as Exam['examType'] }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(examTypeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Date</Label>
                  <Input type="date" value={formData.startDate} onChange={e => setFormData(p => ({ ...p, startDate: e.target.value }))} />
                </div>
                <div>
                  <Label>End Date</Label>
                  <Input type="date" value={formData.endDate} onChange={e => setFormData(p => ({ ...p, endDate: e.target.value }))} />
                </div>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={v => setFormData(p => ({ ...p, status: v as Exam['status'] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="ongoing">Ongoing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave}>{editingExam ? 'Update' : 'Create'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default ExamManagement;
