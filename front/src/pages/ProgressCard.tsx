import { useState, useEffect, useRef } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Loader2, Printer } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useBranchContext } from '@/contexts/BranchContext';
import { academicYearApi, AcademicYear } from '@/services/academicYearService';
import { examApi, Exam } from '@/services/examService';
import { subjectApi, Subject } from '@/services/subjectService';
import { classesApi, Class } from '@/services/classes';
import { divisionsApi, Division } from '@/services/divisions';
import { markApi } from '@/services/markService';

interface ProgressReportData {
  exams: string[];
  subjects: string[];
  students: Array<{
    studentId: string;
    studentName: string;
    admissionNo: string;
    grades: Record<string, Record<string, { mark: number | null; grade: string }>>;
  }>;
  className: string;
  divisionName: string;
  academicYear: string;
}

const ProgressCard = () => {
  const { toast } = useToast();
  const { selectedBranch } = useBranchContext();
  const printRef = useRef<HTMLDivElement>(null);

  // Master data
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);

  // Filters
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedDivisionId, setSelectedDivisionId] = useState('__all__');
  const [selectedExamIds, setSelectedExamIds] = useState<string[]>([]);
  const [selectedSubjectNames, setSelectedSubjectNames] = useState<string[]>([]);
  const [pageSize, setPageSize] = useState<'A4' | 'A5'>('A4');

  // Data
  const [data, setData] = useState<ProgressReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [printStudentId, setPrintStudentId] = useState<string | null>(null);

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
    setSelectedExamIds([]);
    setData(null);
  }, [selectedYear]);

  // Load divisions + subjects when class changes
  useEffect(() => {
    if (!selectedClassId) { setDivisions([]); setAllSubjects([]); return; }
    (async () => {
      try {
        const res = await divisionsApi.getDivisionsByClass(selectedClassId);
        setDivisions(res.data || []);
      } catch { setDivisions([]); }
      try {
        const res = await subjectApi.getAll({ classId: selectedClassId, status: 'active', limit: 100 });
        const subs = res.data || [];
        setAllSubjects(subs);
        setSelectedSubjectNames(subs.map(s => s.name));
      } catch { setAllSubjects([]); }
    })();
    setSelectedDivisionId('__all__');
    setData(null);
  }, [selectedClassId]);

  const toggleExam = (id: string) => {
    setSelectedExamIds(prev => prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]);
  };

  const toggleSubject = (name: string) => {
    setSelectedSubjectNames(prev => prev.includes(name) ? prev.filter(s => s !== name) : [...prev, name]);
  };

  const toggleAllExams = (checked: boolean) => {
    setSelectedExamIds(checked ? exams.map(e => e._id) : []);
  };

  const toggleAllSubjects = (checked: boolean) => {
    setSelectedSubjectNames(checked ? allSubjects.map(s => s.name) : []);
  };

  const handleSubmit = async () => {
    if (!selectedClassId || selectedExamIds.length === 0) {
      toast({ title: 'Required', description: 'Select class and at least one exam', variant: 'destructive' });
      return;
    }
    if (selectedSubjectNames.length === 0) {
      toast({ title: 'Required', description: 'Select at least one subject', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const params: any = {
        classId: selectedClassId,
        examIds: selectedExamIds.join(','),
      };
      if (selectedDivisionId && selectedDivisionId !== '__all__') params.divisionId = selectedDivisionId;
      if (selectedYear) params.academicYear = selectedYear;
      const res = await markApi.getProgressReport(params);
      setData(res.data);
    } catch {
      toast({ title: 'Error', description: 'Failed to load progress report data', variant: 'destructive' });
    }
    setLoading(false);
  };

  const handlePrint = (studentId?: string) => {
    setPrintStudentId(studentId || null);
    setTimeout(() => {
      window.print();
      setTimeout(() => setPrintStudentId(null), 500);
    }, 100);
  };

  // Filter subjects to only selected ones
  const filteredSubjects = data ? data.subjects.filter(s => selectedSubjectNames.includes(s)) : [];
  const filteredExams = data ? data.exams : [];

  const schoolName = selectedBranch ? `${selectedBranch.code}-${selectedBranch.name}` : '';

  const renderStudentCard = (student: ProgressReportData['students'][0], idx: number) => (
    <div
      key={student.studentId}
      className="student-card"
      style={{ pageBreakAfter: 'always', padding: pageSize === 'A5' ? '8mm' : '12mm' }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '12px' }}>
        <div style={{ fontSize: pageSize === 'A5' ? '13px' : '16px', fontWeight: 'bold' }}>{schoolName}</div>
        <div style={{ fontSize: pageSize === 'A5' ? '12px' : '14px', fontWeight: 'bold' }}>
          മൂല്യനിർണയം {data?.academicYear || selectedYear}
        </div>
        <div style={{ fontSize: pageSize === 'A5' ? '12px' : '14px', fontWeight: 'bold' }}>പഠനപുരോഗതിരേഖ</div>
      </div>

      {/* Student Info */}
      <div style={{ marginBottom: '8px', fontSize: pageSize === 'A5' ? '11px' : '13px', fontWeight: 'bold' }}>
        Name of Student: {student.admissionNo}-{student.studentName}
      </div>

      {/* Table */}
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: pageSize === 'A5' ? '10px' : '12px',
        border: '1.5px solid #000'
      }}>
        <thead>
          <tr>
            <th colSpan={2} style={{ border: '1px solid #000', padding: '4px', textAlign: 'center', fontWeight: 'bold' }}>
              STD: {data?.className || ''}{data?.divisionName ? ', ' + data.divisionName : ''}
            </th>
            {filteredExams.map(exam => (
              <th key={exam} style={{ border: '1px solid #000', padding: '4px', textAlign: 'center', fontWeight: 'bold' }}>
                {exam}
              </th>
            ))}
            <th style={{ border: '1px solid #000', padding: '4px', textAlign: 'center', fontWeight: 'bold' }}>
              Attendance:-
            </th>
            <th style={{ border: '1px solid #000', padding: '4px', textAlign: 'center', fontWeight: 'bold' }}>
              Remarks
            </th>
          </tr>
          <tr>
            <th style={{ border: '1px solid #000', padding: '4px', textAlign: 'center', width: '30px' }}>#</th>
            <th style={{ border: '1px solid #000', padding: '4px', textAlign: 'left' }}>Subject</th>
            {filteredExams.map(exam => (
              <th key={exam} style={{ border: '1px solid #000', padding: '4px', textAlign: 'center' }}>Grade</th>
            ))}
            <th style={{ border: '1px solid #000', padding: '4px' }}></th>
            <th style={{ border: '1px solid #000', padding: '4px' }}></th>
          </tr>
        </thead>
        <tbody>
          {filteredSubjects.map((sub, i) => (
            <tr key={sub}>
              <td style={{ border: '1px solid #000', padding: '3px 4px', textAlign: 'center', fontWeight: 'bold' }}>{i + 1}</td>
              <td style={{ border: '1px solid #000', padding: '3px 6px', fontWeight: 'bold' }}>{sub}</td>
              {filteredExams.map(exam => {
                const g = student.grades[exam]?.[sub];
                return (
                  <td key={exam} style={{ border: '1px solid #000', padding: '3px 4px', textAlign: 'center' }}>
                    {g ? (g.grade || (g.mark !== null ? g.mark : '')) : ''}
                  </td>
                );
              })}
              {i === 0 ? (
                <>
                  <td rowSpan={filteredSubjects.length} style={{ border: '1px solid #000', padding: '4px', verticalAlign: 'top' }}></td>
                  <td rowSpan={filteredSubjects.length} style={{ border: '1px solid #000', padding: '4px', verticalAlign: 'top' }}></td>
                </>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Signature row */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: '20px',
        fontSize: pageSize === 'A5' ? '10px' : '12px',
        borderTop: '1.5px solid #000',
        paddingTop: '8px'
      }}>
        <span style={{ fontWeight: 'bold' }}>രക്ഷിതാവിന്റെ ഒപ്പ്:</span>
        <span style={{ fontWeight: 'bold' }}>ക്ലാസ് ടീച്ചറുടെ ഒപ്പ്:</span>
      </div>
    </div>
  );

  const studentsToShow = data
    ? (printStudentId ? data.students.filter(s => s.studentId === printStudentId) : data.students)
    : [];

  return (
    <AppLayout>
      {/* Print Styles */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .print-area, .print-area * { visibility: visible !important; }
          .print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .student-card { page-break-after: always; }
          .student-card:last-child { page-break-after: auto; }
          @page { size: ${pageSize}; margin: 10mm; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="space-y-6 no-print">
        <h1 className="text-2xl font-bold tracking-tight">PROGRESS CARD</h1>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6 space-y-5">
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
                <Label className="text-xs font-semibold">Page Size</Label>
                <Select value={pageSize} onValueChange={v => setPageSize(v as 'A4' | 'A5')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A4">A4</SelectItem>
                    <SelectItem value="A5">A5</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Exam checkboxes */}
            {exams.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Label className="text-xs font-semibold">Select Exams</Label>
                  <div className="flex items-center gap-1.5 ml-4">
                    <Checkbox
                      id="all-exams"
                      checked={selectedExamIds.length === exams.length}
                      onCheckedChange={toggleAllExams}
                    />
                    <label htmlFor="all-exams" className="text-xs text-muted-foreground cursor-pointer">All</label>
                  </div>
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-2">
                  {exams.map(e => (
                    <div key={e._id} className="flex items-center gap-1.5">
                      <Checkbox
                        id={`exam-${e._id}`}
                        checked={selectedExamIds.includes(e._id)}
                        onCheckedChange={() => toggleExam(e._id)}
                      />
                      <label htmlFor={`exam-${e._id}`} className="text-sm cursor-pointer">{e.name}</label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Subject checkboxes */}
            {allSubjects.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Label className="text-xs font-semibold">Select Subjects</Label>
                  <div className="flex items-center gap-1.5 ml-4">
                    <Checkbox
                      id="all-subjects"
                      checked={selectedSubjectNames.length === allSubjects.length}
                      onCheckedChange={toggleAllSubjects}
                    />
                    <label htmlFor="all-subjects" className="text-xs text-muted-foreground cursor-pointer">All</label>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-2">
                  {allSubjects.map(s => (
                    <div key={s._id} className="flex items-center gap-1.5">
                      <Checkbox
                        id={`sub-${s._id}`}
                        checked={selectedSubjectNames.includes(s.name)}
                        onCheckedChange={() => toggleSubject(s.name)}
                      />
                      <label htmlFor={`sub-${s._id}`} className="text-sm cursor-pointer">{s.name}</label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button onClick={handleSubmit} disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Submit
            </Button>
          </CardContent>
        </Card>

        {/* Preview & Print */}
        {data && !loading && (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="outline">{data.className}{data.divisionName ? ' - ' + data.divisionName : ''}</Badge>
              <Badge variant="outline">{data.academicYear}</Badge>
              <Badge className="bg-blue-100 text-blue-800">{data.students.length} Students</Badge>
              <Badge className="bg-green-100 text-green-800">{filteredExams.length} Exams</Badge>
              <Badge className="bg-purple-100 text-purple-800">{filteredSubjects.length} Subjects</Badge>
              <div className="flex-1" />
              <Button variant="default" onClick={() => handlePrint()}>
                <Printer className="w-4 h-4 mr-2" />
                Print All
              </Button>
            </div>

            {/* Per-student preview cards */}
            <div className="space-y-4">
              {data.students.map((student, idx) => (
                <Card key={student.studentId}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <span className="font-semibold">{idx + 1}. {student.admissionNo} - {student.studentName}</span>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => handlePrint(student.studentId)}>
                        <Printer className="w-3.5 h-3.5 mr-1" />
                        Print
                      </Button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border-collapse border border-border">
                        <thead>
                          <tr>
                            <th className="border border-border px-2 py-1 text-left">#</th>
                            <th className="border border-border px-2 py-1 text-left">Subject</th>
                            {filteredExams.map(exam => (
                              <th key={exam} className="border border-border px-2 py-1 text-center">{exam}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {filteredSubjects.map((sub, i) => (
                            <tr key={sub}>
                              <td className="border border-border px-2 py-1">{i + 1}</td>
                              <td className="border border-border px-2 py-1 font-medium">{sub}</td>
                              {filteredExams.map(exam => {
                                const g = student.grades[exam]?.[sub];
                                return (
                                  <td key={exam} className="border border-border px-2 py-1 text-center">
                                    {g ? (g.grade || (g.mark !== null ? g.mark : '-')) : '-'}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}

        {data && data.students.length === 0 && !loading && (
          <p className="text-center py-10 text-muted-foreground">No students with marks found for this selection.</p>
        )}
      </div>

      {/* Hidden Print Area */}
      <div className="print-area" ref={printRef} style={{ display: 'none' }}>
        {/* Shown only during print via CSS */}
      </div>

      {/* Actual Print Content — always in DOM, visible only @media print */}
      <div className="print-area" style={{ position: 'fixed', left: '-9999px', top: 0 }}>
        {data && studentsToShow.map((student, idx) => renderStudentCard(student, idx))}
      </div>
    </AppLayout>
  );
};

export default ProgressCard;
