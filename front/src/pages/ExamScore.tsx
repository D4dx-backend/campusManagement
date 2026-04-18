import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { academicYearApi, AcademicYear } from '@/services/academicYearService';
import { examApi, Exam } from '@/services/examService';
import { classesApi, Class } from '@/services/classes';
import { divisionsApi, Division } from '@/services/divisions';
import { markApi, ConsolidatedData } from '@/services/markService';

const ExamScore = () => {
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);

  const [selectedYear, setSelectedYear] = useState('');
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedDivisionId, setSelectedDivisionId] = useState('__all__');

  const [data, setData] = useState<ConsolidatedData | null>(null);
  const [loading, setLoading] = useState(false);

  // Load master data
  useEffect(() => {
    (async () => {
      try {
        const res = await academicYearApi.getAll({ limit: 50, sortBy: 'name', sortOrder: 'desc' });
        setAcademicYears(res.data || []);
      } catch { /* ignore */ }
      try {
        const res = await classesApi.getClasses({ limit: 100, status: 'active' });
        setClasses(res.data || []);
      } catch { /* ignore */ }
    })();
  }, []);

  // Load exams when year changes
  useEffect(() => {
    if (!selectedYear) { setExams([]); return; }
    (async () => {
      try {
        const res = await examApi.getAll({ academicYear: selectedYear, limit: 100 });
        setExams(res.data || []);
      } catch { setExams([]); }
    })();
    setSelectedExamId('');
    setData(null);
  }, [selectedYear]);

  // Load divisions when class changes
  useEffect(() => {
    if (!selectedClassId) { setDivisions([]); return; }
    (async () => {
      try {
        const res = await divisionsApi.getDivisionsByClass(selectedClassId);
        setDivisions(res.data || []);
      } catch { setDivisions([]); }
    })();
    setSelectedDivisionId('__all__');
    setData(null);
  }, [selectedClassId]);

  // Auto-fetch when exam + class selected
  useEffect(() => {
    if (!selectedExamId || !selectedClassId) { setData(null); return; }
    (async () => {
      setLoading(true);
      try {
        const params: any = { examId: selectedExamId, classId: selectedClassId };
        if (selectedDivisionId && selectedDivisionId !== '__all__') params.divisionId = selectedDivisionId;
        const res = await markApi.getConsolidated(params);
        setData(res.data);
      } catch { setData(null); }
      setLoading(false);
    })();
  }, [selectedExamId, selectedClassId, selectedDivisionId]);

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">EXAM SCORE</h1>

        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-xs font-semibold">Academic Year</Label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger><SelectValue placeholder="Select Year" /></SelectTrigger>
                  <SelectContent>
                    {academicYears.map(y => <SelectItem key={y._id} value={y.name}>{y.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold">Class</Label>
                <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                  <SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger>
                  <SelectContent>
                    {classes.map(c => <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold">Division</Label>
                <Select value={selectedDivisionId} onValueChange={setSelectedDivisionId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All</SelectItem>
                    {divisions.map(d => <SelectItem key={d._id} value={d._id}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold">Exam</Label>
                <Select value={selectedExamId} onValueChange={setSelectedExamId}>
                  <SelectTrigger><SelectValue placeholder="Select Exam" /></SelectTrigger>
                  <SelectContent>
                    {exams.map(e => <SelectItem key={e._id} value={e._id}>{e.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {loading && (
          <div className="flex justify-center py-10">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {data && !loading && (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="outline" className="text-sm">{data.examName}</Badge>
              <Badge variant="outline">{data.className}{data.divisionName ? ' - ' + data.divisionName : ''}</Badge>
              <Badge variant="outline">{data.academicYear}</Badge>
              <Badge className="bg-blue-100 text-blue-800">{data.students.length} Students</Badge>
            </div>

            <Card>
              <CardContent className="p-0">
                {data.students.length === 0 ? (
                  <p className="text-center py-10 text-muted-foreground">No mark data found for this selection.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-10 sticky left-0 bg-background">#</TableHead>
                          <TableHead className="min-w-[180px] sticky left-10 bg-background">Name</TableHead>
                          <TableHead className="w-[100px]">Adm No</TableHead>
                          {data.subjects.map(sub => (
                            <TableHead key={sub} className="text-center min-w-[80px]">{sub}</TableHead>
                          ))}
                          <TableHead className="text-center font-bold">Total</TableHead>
                          <TableHead className="text-center font-bold">%</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.students.map((s, idx) => (
                          <TableRow key={s.studentId}>
                            <TableCell className="sticky left-0 bg-background">{idx + 1}</TableCell>
                            <TableCell className="font-medium sticky left-10 bg-background">{s.studentName}</TableCell>
                            <TableCell>{s.admissionNo}</TableCell>
                            {data.subjects.map(sub => {
                              const m = s.marks[sub];
                              return (
                                <TableCell key={sub} className="text-center">
                                  {m ? (m.grade || (m.mark !== null ? m.mark : '-')) : '-'}
                                </TableCell>
                              );
                            })}
                            <TableCell className="text-center font-semibold">{s.total}</TableCell>
                            <TableCell className="text-center font-semibold">{s.percentage}%</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {!loading && !data && selectedExamId && selectedClassId && (
          <p className="text-center py-10 text-muted-foreground">No data available.</p>
        )}
      </div>
    </AppLayout>
  );
};

export default ExamScore;
