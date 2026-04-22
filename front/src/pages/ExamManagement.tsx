import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, ClipboardList } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { examApi, Exam } from '@/services/examService';
import { academicYearApi, AcademicYear } from '@/services/academicYearService';
import { formatters } from '@/utils/exportUtils';
import { pageConfigurations } from '@/utils/pageTemplates';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [filterValues, setFilterValues] = useState<any>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

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
      toast({ title: 'Error', description: 'Something went wrong while loading. Please try again exams', variant: 'destructive' });
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
      toast({ title: 'Error', description: err.response?.data?.message || 'Something went wrong while saving. Please try again', variant: 'destructive' });
    }
  };

  const handleDelete = async (exam: Exam) => {
    if (!confirm(`Delete "${exam.name}"?`)) return;
    try {
      await examApi.delete(exam._id);
      toast({ title: 'Deleted', description: 'Exam deleted' });
      loadExams();
    } catch {
      toast({ title: 'Error', description: 'Something went wrong while deleting. Please try again.', variant: 'destructive' });
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">MANAGE EXAMS</h1>
          <Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" />Create Exam</Button>
        </div>

        {(() => {
          const filteredExams = exams.filter(exam => {
            const matchSearch = !searchTerm || exam.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchType = !filterValues.examType || exam.examType === filterValues.examType;
            const matchStatus = !filterValues.status || exam.status === filterValues.status;
            return matchSearch && matchType && matchStatus;
          });

          const totalItems = filteredExams.length;
          const totalPages = Math.ceil(totalItems / itemsPerPage);
          const paginatedExams = filteredExams.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

          const config = pageConfigurations.exams;
          // Dynamically add academic year options to the filter
          const filters = config.filters.map((f: any) => {
            if (f.key === 'academicYear') {
              return { ...f, options: academicYears.map(y => ({ label: y.name, value: y.name })) };
            }
            return f;
          });

          return (
            <DataTable
              searchPlaceholder="Search exams..."
              searchValue={searchTerm}
              onSearchChange={(v) => { setSearchTerm(v); setCurrentPage(1); }}
              filters={filters}
              filterValues={{ ...filterValues, academicYear: filterYear }}
              onFilterChange={(values) => {
                if (values.academicYear !== undefined) setFilterYear(values.academicYear);
                setFilterValues(values);
                setCurrentPage(1);
              }}
              onFilterReset={() => { setFilterValues({}); setFilterYear(''); setCurrentPage(1); }}
              exportConfig={{
                filename: 'exams',
                columns: config.exportColumns.map(col => ({
                  ...col,
                  formatter: col.formatter ? formatters[col.formatter] : undefined
                }))
              }}
              pagination={{
                currentPage,
                totalPages,
                totalItems,
                itemsPerPage,
                onPageChange: setCurrentPage,
                onItemsPerPageChange: (v) => { setItemsPerPage(v); setCurrentPage(1); }
              }}
              data={paginatedExams}
              isLoading={loading}
              emptyState={{
                icon: <ClipboardList className="w-12 h-12 text-muted-foreground mx-auto mb-4" />,
                message: "No exams found"
              }}
            >
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-3 font-semibold">#</th>
                      <th className="text-left p-3 font-semibold">Name</th>
                      <th className="text-left p-3 font-semibold">Type</th>
                      <th className="text-left p-3 font-semibold">Academic Year</th>
                      <th className="text-left p-3 font-semibold">Start Date</th>
                      <th className="text-left p-3 font-semibold">End Date</th>
                      <th className="text-left p-3 font-semibold">Status</th>
                      <th className="text-right p-3 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedExams.map((exam, i) => (
                      <tr key={exam._id} className="border-b hover:bg-muted/30">
                        <td className="p-3">{(currentPage - 1) * itemsPerPage + i + 1}</td>
                        <td className="p-3 font-medium">{exam.name}</td>
                        <td className="p-3">{examTypeLabels[exam.examType] || exam.examType}</td>
                        <td className="p-3">{exam.academicYear}</td>
                        <td className="p-3">{exam.startDate ? new Date(exam.startDate).toLocaleDateString() : '-'}</td>
                        <td className="p-3">{exam.endDate ? new Date(exam.endDate).toLocaleDateString() : '-'}</td>
                        <td className="p-3">
                          <Badge className={statusColors[exam.status]}>{exam.status}</Badge>
                        </td>
                        <td className="p-3 text-right space-x-2">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(exam)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(exam)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </DataTable>
          );
        })()}

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
