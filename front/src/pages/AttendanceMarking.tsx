import { useState, useEffect, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Save, CheckCircle, XCircle, Clock, UserCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { classesApi, Class } from '@/services/classes';
import { divisionsApi, Division } from '@/services/divisions';
import { academicYearApi, AcademicYear } from '@/services/academicYearService';
import { studentService } from '@/services/studentService';
import { useMarkAttendance, useAttendance } from '@/hooks/useAttendance';
import { AttendanceRecord } from '@/services/attendanceService';

const statusOptions = [
  { value: 'present', label: 'P', color: 'bg-green-100 text-green-800 hover:bg-green-200' },
  { value: 'absent', label: 'A', color: 'bg-red-100 text-red-800 hover:bg-red-200' },
  { value: 'late', label: 'L', color: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' },
  { value: 'half_day', label: 'H', color: 'bg-orange-100 text-orange-800 hover:bg-orange-200' },
];

interface StudentRecord {
  studentId: string;
  studentName: string;
  admissionNo: string;
  status: 'present' | 'absent' | 'late' | 'half_day';
}

const AttendanceMarking = () => {
  const { toast } = useToast();
  const markAttendanceMutation = useMarkAttendance();

  // Dropdown data
  const [classes, setClasses] = useState<Class[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);

  // Filters
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedYear, setSelectedYear] = useState('');

  // Student records
  const [records, setRecords] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Load attendance if previously marked
  const cleanSection = selectedSection && selectedSection !== '__all__' ? selectedSection : '';
  const { data: existingAttendance } = useAttendance(
    selectedClassId && selectedDate
      ? { classId: selectedClassId, section: cleanSection, date: selectedDate }
      : undefined
  );

  // Load academic years
  useEffect(() => {
    (async () => {
      try {
        const res = await academicYearApi.getAll({ limit: 50, sortBy: 'name', sortOrder: 'desc' });
        setAcademicYears(res.data || []);
        const current = res.data?.find((y: AcademicYear) => y.isCurrent);
        if (current) setSelectedYear(current.name);
      } catch {}
    })();
  }, []);

  // Load classes
  useEffect(() => {
    (async () => {
      try {
        const res = await classesApi.getClasses({ limit: 100, status: 'active' });
        setClasses(res.data || []);
      } catch {}
    })();
  }, []);

  // Load divisions when class changes
  useEffect(() => {
    if (!selectedClassId) { setDivisions([]); return; }
    (async () => {
      try {
        const res = await divisionsApi.getDivisionsByClass(selectedClassId);
        setDivisions(res.data || []);
      } catch {}
    })();
    setSelectedSection('');
  }, [selectedClassId]);

  // Load students when class+section selected
  const handleLoadStudents = async () => {
    if (!selectedClassId || !selectedDate || !selectedYear) {
      toast({ title: 'Error', description: 'Select class, date and academic year', variant: 'destructive' });
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const res = await studentService.getStudents({
        classId: selectedClassId,
        section: selectedSection && selectedSection !== '__all__' ? selectedSection : undefined,
        status: 'active',
        limit: 0,
        sortBy: 'name',
        sortOrder: 'asc',
      } as any);
      const students = res.data || [];

      // Check if attendance was already marked for that day
      const existingRecords = existingAttendance?.data;
      let existingMap: Record<string, string> = {};
      if (Array.isArray(existingRecords) && existingRecords.length > 0) {
        for (const rec of existingRecords[0].records || []) {
          existingMap[rec.studentId] = rec.status;
        }
      }

      setRecords(
        students.map((s: any) => ({
          studentId: s._id || s.id,
          studentName: s.name,
          admissionNo: s.admissionNo,
          status: (existingMap[s._id || s.id] as any) || 'present',
        }))
      );
      setLoaded(true);
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Something went wrong while loading. Please try again students';
      setLoadError(message);
      setRecords([]);
      setLoaded(true);
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
    setLoading(false);
  };

  // Toggle student status
  const toggleStatus = (index: number) => {
    setRecords((prev) => {
      const next = [...prev];
      const current = next[index].status;
      const order: Array<'present' | 'absent' | 'late' | 'half_day'> = ['present', 'absent', 'late', 'half_day'];
      const idx = order.indexOf(current);
      next[index] = { ...next[index], status: order[(idx + 1) % order.length] };
      return next;
    });
  };

  // Mark all present/absent
  const markAll = (status: 'present' | 'absent') => {
    setRecords((prev) => prev.map((r) => ({ ...r, status })));
  };

  // Save attendance
  const handleSave = () => {
    const sectionValue = selectedSection && selectedSection !== '__all__' ? selectedSection : '';
    const data = {
      date: selectedDate,
      classId: selectedClassId,
      section: sectionValue,
      academicYear: selectedYear,
      records: records.map((r) => ({
        studentId: r.studentId,
        status: r.status,
      })),
    };
    markAttendanceMutation.mutate(data);
  };

  // Stats
  const stats = useMemo(() => {
    const p = records.filter((r) => r.status === 'present').length;
    const a = records.filter((r) => r.status === 'absent').length;
    const l = records.filter((r) => r.status === 'late').length;
    const h = records.filter((r) => r.status === 'half_day').length;
    return { present: p, absent: a, late: l, halfDay: h, total: records.length };
  }, [records]);

  const getStatusBadge = (status: string) => {
    const opt = statusOptions.find((o) => o.value === status);
    return opt ? (
      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold cursor-pointer ${opt.color}`}>
        {opt.label}
      </span>
    ) : null;
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Mark Attendance</h1>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
              <div>
                <Label>Date</Label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
              <div>
                <Label>Academic Year</Label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger><SelectValue placeholder="Select Year" /></SelectTrigger>
                  <SelectContent>
                    {academicYears.map((y) => (
                      <SelectItem key={y._id} value={y.name}>{y.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Class</Label>
                <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                  <SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger>
                  <SelectContent>
                    {classes.map((c) => (
                      <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Division</Label>
                <Select value={selectedSection} onValueChange={setSelectedSection}>
                  <SelectTrigger><SelectValue placeholder="All Divisions" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All Divisions</SelectItem>
                    {divisions.map((d) => (
                      <SelectItem key={d._id} value={d.name}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleLoadStudents} disabled={loading || !selectedClassId}>
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Load Students
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Bar */}
        {loaded && records.length > 0 && (
          <div className="flex flex-wrap gap-4">
            <Badge variant="outline" className="px-3 py-1 text-sm">
              <UserCheck className="w-4 h-4 mr-1" /> Total: {stats.total}
            </Badge>
            <Badge className="bg-green-100 text-green-800 px-3 py-1 text-sm">
              <CheckCircle className="w-4 h-4 mr-1" /> Present: {stats.present}
            </Badge>
            <Badge className="bg-red-100 text-red-800 px-3 py-1 text-sm">
              <XCircle className="w-4 h-4 mr-1" /> Absent: {stats.absent}
            </Badge>
            <Badge className="bg-yellow-100 text-yellow-800 px-3 py-1 text-sm">
              <Clock className="w-4 h-4 mr-1" /> Late: {stats.late}
            </Badge>
            <Badge className="bg-orange-100 text-orange-800 px-3 py-1 text-sm">
              Half Day: {stats.halfDay}
            </Badge>
          </div>
        )}

        {/* Attendance Table */}
        {loaded && records.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">Students</CardTitle>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="bg-green-50" onClick={() => markAll('present')}>
                  Mark All Present
                </Button>
                <Button size="sm" variant="outline" className="bg-red-50" onClick={() => markAll('absent')}>
                  Mark All Absent
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Admission No</TableHead>
                    <TableHead className="text-center w-32">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((record, i) => (
                    <TableRow key={record.studentId}>
                      <TableCell>{i + 1}</TableCell>
                      <TableCell className="font-medium">{record.studentName}</TableCell>
                      <TableCell>{record.admissionNo}</TableCell>
                      <TableCell className="text-center">
                        <button onClick={() => toggleStatus(i)} className="focus:outline-none">
                          {getStatusBadge(record.status)}
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex justify-end mt-6">
                <Button onClick={handleSave} disabled={markAttendanceMutation.isPending} className="min-w-[140px]">
                  {markAttendanceMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Attendance
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {loaded && records.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              {loadError ? (
                <div className="space-y-2">
                  <XCircle className="w-10 h-10 mx-auto text-red-400" />
                  <p className="text-red-600 font-medium">{loadError}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <UserCheck className="w-10 h-10 mx-auto text-muted-foreground" />
                  <p className="text-muted-foreground">No active students found for the selected class/division.</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

export default AttendanceMarking;
