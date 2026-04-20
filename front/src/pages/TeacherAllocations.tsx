import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Loader2, Plus, Trash2, UserCog } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import teacherAllocationService, { TeacherAllocationItem, CreateAllocationData } from '@/services/teacherAllocationService';
import { classesApi, Class } from '@/services/classes';
import { staffService } from '@/services/staffService';
import { subjectApi, Subject } from '@/services/subjectService';

const TeacherAllocations = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [createOpen, setCreateOpen] = useState(false);
  const [filterClassId, setFilterClassId] = useState('');
  const [filterAY, setFilterAY] = useState('');

  const [classes, setClasses] = useState<Class[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  // Form state
  const [teacherId, setTeacherId] = useState('');
  const [classId, setClassId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [isClassTeacher, setIsClassTeacher] = useState(false);

  useEffect(() => {
    classesApi.getClasses({ limit: 100, status: 'active' }).then((r) => setClasses(r.data || [])).catch(() => {});
    staffService.getStaff({ limit: 200, role: 'teacher' }).then((r: any) => setTeachers(r?.data?.data || r?.data || [])).catch(() => {});
    subjectApi.getAll({ limit: 200 }).then((r) => setSubjects(r.data || [])).catch(() => {});
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ['teacher-allocations', filterClassId, filterAY],
    queryFn: () => teacherAllocationService.getAll({
      classId: filterClassId || undefined,
      academicYear: filterAY || undefined,
      limit: 200,
    }),
  });

  const allocations: TeacherAllocationItem[] = data?.data || [];

  const createMutation = useMutation({
    mutationFn: (d: CreateAllocationData) => teacherAllocationService.create(d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-allocations'] });
      toast({ title: 'Teacher allocated' });
      setCreateOpen(false);
      resetForm();
    },
    onError: (e: any) => toast({ title: 'Error', description: e?.response?.data?.message || 'Failed', variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => teacherAllocationService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-allocations'] });
      toast({ title: 'Allocation removed' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e?.response?.data?.message || 'Failed', variant: 'destructive' }),
  });

  const resetForm = () => {
    setTeacherId(''); setClassId(''); setSubjectId('');
    setAcademicYear(''); setIsClassTeacher(false);
  };

  const handleCreate = () => {
    if (!teacherId || !classId || !academicYear) {
      toast({ title: 'Teacher, Class and Academic Year are required', variant: 'destructive' });
      return;
    }
    const selectedTeacher = teachers.find((t: any) => (t._id || t.id) === teacherId);
    const selectedClass = classes.find((c) => c._id === classId);
    const selectedSubject = subjects.find((s) => (s as any)._id === subjectId);

    createMutation.mutate({
      teacherId,
      teacherName: selectedTeacher?.name || '',
      classId,
      className: selectedClass?.name || '',
      subjectId: subjectId || undefined,
      subjectName: selectedSubject?.name || undefined,
      isClassTeacher,
      academicYear,
    });
  };

  // Get unique academic years from classes
  const academicYears = [...new Set(classes.map((c) => c.academicYear).filter(Boolean))];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Teacher Allocations</h1>
            <p className="text-muted-foreground text-sm">Assign teachers to classes and subjects</p>
          </div>
          <Button onClick={() => { resetForm(); setCreateOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" />Assign Teacher
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          <Select value={filterClassId} onValueChange={setFilterClassId}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Classes" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {classes.map((c) => (
                <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterAY} onValueChange={setFilterAY}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Years" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              {academicYears.map((ay) => (
                <SelectItem key={ay} value={ay}>{ay}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>
            ) : allocations.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">No teacher allocations found</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Teacher</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Academic Year</TableHead>
                    <TableHead>Class Teacher</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allocations.map((a) => (
                    <TableRow key={a._id}>
                      <TableCell className="font-medium">{a.teacherName}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{a.className}</Badge>
                        {a.divisionName && <Badge variant="outline" className="ml-1">{a.divisionName}</Badge>}
                      </TableCell>
                      <TableCell>{a.subjectName || '—'}</TableCell>
                      <TableCell>{a.academicYear}</TableCell>
                      <TableCell>
                        {a.isClassTeacher && <Badge className="bg-green-100 text-green-700">Class Teacher</Badge>}
                      </TableCell>
                      <TableCell>
                        <Button size="icon" variant="ghost" className="text-destructive" onClick={() => deleteMutation.mutate(a._id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Create Dialog */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Teacher to Class</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Teacher *</Label>
                <Select value={teacherId} onValueChange={setTeacherId}>
                  <SelectTrigger><SelectValue placeholder="Select teacher" /></SelectTrigger>
                  <SelectContent>
                    {teachers.map((t: any) => (
                      <SelectItem key={t._id || t.id} value={t._id || t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
                <Label>Subject (optional)</Label>
                <Select value={subjectId} onValueChange={setSubjectId}>
                  <SelectTrigger><SelectValue placeholder="All subjects" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No specific subject</SelectItem>
                    {subjects.map((s: any) => (
                      <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Academic Year *</Label>
                <Select value={academicYear} onValueChange={setAcademicYear}>
                  <SelectTrigger><SelectValue placeholder="Select year" /></SelectTrigger>
                  <SelectContent>
                    {academicYears.map((ay) => (
                      <SelectItem key={ay} value={ay}>{ay}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={isClassTeacher} onCheckedChange={setIsClassTeacher} />
                <Label>Class Teacher</Label>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Assign
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default TeacherAllocations;
