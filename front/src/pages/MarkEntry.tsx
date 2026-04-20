import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Save, FileDown, Printer, ClipboardPaste, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { academicYearApi, AcademicYear } from '@/services/academicYearService';
import { examApi, Exam } from '@/services/examService';
import { subjectApi, Subject } from '@/services/subjectService';
import { classesApi, Class } from '@/services/classes';
import { divisionsApi, Division } from '@/services/divisions';
import { markApi, MarkSheet, MarkEntry } from '@/services/markService';

interface StudentRow {
  studentId: string;
  studentName: string;
  admissionNo: string;
  marks: Record<string, { mark: number | null; grade: string }>;
}

const MarkEntryPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  // Filters
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  const [selectedYear, setSelectedYear] = useState('');
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedDivisionId, setSelectedDivisionId] = useState('__all__');
  const [orderBy, setOrderBy] = useState<'name' | 'admissionNo'>('name');

  // Mark Entry data
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [existingSheets, setExistingSheets] = useState<MarkSheet[]>([]);

  // Load academic years on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await academicYearApi.getAll({ limit: 50, sortBy: 'name', sortOrder: 'desc' });
        setAcademicYears(res.data || []);
        const current = res.data?.find((y: AcademicYear) => y.isCurrent);
        if (current) setSelectedYear(current.name);
      } catch { /* ignore */ }
    })();
  }, []);

  // Load exams when year changes
  useEffect(() => {
    if (!selectedYear) { setExams([]); return; }
    (async () => {
      try {
        const res = await examApi.getAll({ academicYear: selectedYear, limit: 50 });
        setExams(res.data || []);
      } catch { /* ignore */ }
    })();
    setSelectedExamId('');
  }, [selectedYear]);

  // Load classes
  useEffect(() => {
    (async () => {
      try {
        const res = await classesApi.getClasses({ limit: 100, status: 'active' });
        setClasses(res.data || []);
      } catch { /* ignore */ }
    })();
  }, []);

  // Load divisions when class changes
  useEffect(() => {
    if (!selectedClassId) { setDivisions([]); return; }
    (async () => {
      try {
        const res = await divisionsApi.getDivisionsByClass(selectedClassId);
        setDivisions(res.data || []);
      } catch { /* ignore */ }
    })();
    setSelectedDivisionId('__all__');
  }, [selectedClassId]);

  // Load subjects when class changes
  useEffect(() => {
    if (!selectedClassId) { setSubjects([]); return; }
    (async () => {
      try {
        const res = await subjectApi.getAll({ classId: selectedClassId, status: 'active', limit: 100 });
        // Also include subjects with no classIds (applies to all)
        const allRes = await subjectApi.getAll({ status: 'active', limit: 100 });
        const classSubjects = res.data || [];
        const globalSubjects = (allRes.data || []).filter((s: Subject) => !s.classIds?.length);
        // Merge without duplicates
        const merged = [...classSubjects];
        for (const gs of globalSubjects) {
          if (!merged.find(s => s._id === gs._id)) merged.push(gs);
        }
        merged.sort((a, b) => a.name.localeCompare(b.name));
        setSubjects(merged);
      } catch { /* ignore */ }
    })();
  }, [selectedClassId]);

  // Load students and existing marks
  const handleGo = async () => {
    if (!selectedExamId || !selectedClassId) {
      toast({ title: 'Required', description: 'Please select exam and class', variant: 'destructive' });
      return;
    }
    const effectiveDivisionId = selectedDivisionId === '__all__' ? undefined : selectedDivisionId;
    setLoading(true);
    setLoaded(false);
    try {
      // Load students
      const studentRes = await markApi.getStudents({
        classId: selectedClassId,
        divisionId: effectiveDivisionId
      });
      const studentList = studentRes.data || [];

      // Load existing mark sheets
      const sheetRes = await markApi.getSheet({
        examId: selectedExamId,
        classId: selectedClassId,
        divisionId: effectiveDivisionId
      });
      const sheets = sheetRes.data || [];
      setExistingSheets(sheets);

      // Build student rows with marks from existing sheets
      const rows: StudentRow[] = studentList.map((s: any) => {
        const marks: Record<string, { mark: number | null; grade: string }> = {};
        for (const sub of subjects) {
          const sheet = sheets.find((sh: MarkSheet) => sh.subjectId === sub._id);
          const entry = sheet?.entries.find((e: MarkEntry) => e.studentId === s._id);
          marks[sub._id] = {
            mark: entry?.mark ?? null,
            grade: entry?.grade || ''
          };
        }
        return {
          studentId: s._id,
          studentName: s.name,
          admissionNo: s.admissionNo,
          marks
        };
      });

      // Sort
      if (orderBy === 'name') {
        rows.sort((a, b) => a.studentName.localeCompare(b.studentName));
      } else {
        rows.sort((a, b) => a.admissionNo.localeCompare(b.admissionNo));
      }

      setStudents(rows);
      setLoaded(true);
    } catch (err: any) {
      toast({ title: 'Error', description: 'Failed to load data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Update mark for a student/subject
  const updateMark = (studentId: string, subjectId: string, value: string) => {
    setStudents(prev => prev.map(s => {
      if (s.studentId !== studentId) return s;
      const mark = value === '' ? null : Number(value);
      return {
        ...s,
        marks: {
          ...s.marks,
          [subjectId]: { ...s.marks[subjectId], mark: isNaN(mark as number) ? null : mark }
        }
      };
    }));
  };

  // Update grade for a student/subject
  const updateGrade = (studentId: string, subjectId: string, grade: string) => {
    setStudents(prev => prev.map(s => {
      if (s.studentId !== studentId) return s;
      return {
        ...s,
        marks: {
          ...s.marks,
          [subjectId]: { ...s.marks[subjectId], grade }
        }
      };
    }));
  };

  // Paste marks from spreadsheet for a subject column
  const handlePaste = (subjectId: string) => {
    navigator.clipboard.readText().then(text => {
      const values = text.split(/[\n\r]+/).map(v => v.trim()).filter(Boolean);
      setStudents(prev => {
        const updated = [...prev];
        values.forEach((val, idx) => {
          if (idx < updated.length) {
            const mark = Number(val);
            updated[idx] = {
              ...updated[idx],
              marks: {
                ...updated[idx].marks,
                [subjectId]: {
                  ...updated[idx].marks[subjectId],
                  mark: isNaN(mark) ? null : mark
                }
              }
            };
          }
        });
        return updated;
      });
      toast({ title: 'Pasted', description: `Pasted ${values.length} values` });
    }).catch(() => {
      toast({ title: 'Error', description: 'Failed to read clipboard', variant: 'destructive' });
    });
  };

  // Save all marks
  const handleSave = async (finalize = false) => {
    if (!selectedExamId || !selectedClassId || subjects.length === 0) return;
    setSaving(true);
    try {
      const subjectsData = subjects.map(sub => ({
        subjectId: sub._id,
        entries: students.map(s => ({
          studentId: s.studentId,
          mark: s.marks[sub._id]?.mark ?? null,
          grade: s.marks[sub._id]?.grade || ''
        }))
      }));

      await markApi.bulkSave({
        examId: selectedExamId,
        classId: selectedClassId,
        divisionId: selectedDivisionId === '__all__' ? undefined : selectedDivisionId || undefined,
        subjects: subjectsData,
        isFinalized: finalize
      });

      toast({
        title: finalize ? 'Finalized' : 'Saved',
        description: finalize ? 'Marks finalized successfully' : 'Marks saved successfully'
      });
    } catch (err: any) {
      toast({ title: 'Error', description: err.response?.data?.message || 'Failed to save', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (students.length === 0) return;
    const exam = exams.find(e => e._id === selectedExamId);
    const cls = classes.find(c => c._id === selectedClassId);
    const div = divisions.find(d => d._id === selectedDivisionId);

    const headers = ['#', 'Name', 'Admission No', ...subjects.map(s => s.name), 'Total', 'Percentage'];
    const rows = students.map((s, i) => {
      let total = 0;
      let maxTotal = 0;
      const marks = subjects.map(sub => {
        const m = s.marks[sub._id]?.mark;
        if (m != null) { total += m; maxTotal += sub.maxMark; }
        return m != null ? m.toString() : '';
      });
      const pct = maxTotal > 0 ? ((total / maxTotal) * 100).toFixed(2) : '';
      return [i + 1, s.studentName, s.admissionNo, ...marks, total, pct].join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `marks_${exam?.name || 'exam'}_${cls?.name || ''}${div ? '_' + div.name : ''}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Print
  const handlePrint = () => {
    window.print();
  };

  const selectedExam = exams.find(e => e._id === selectedExamId);
  const selectedClass = classes.find(c => c._id === selectedClassId);
  const selectedDivision = divisions.find(d => d._id === selectedDivisionId) || null;

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">MARK ENTRY</h1>

        {/* Filters */}
        <Card className="print:hidden">
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-end gap-4">
              <div>
                <Label className="text-xs font-semibold">Academic Year</Label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="w-[140px]"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {academicYears.map(y => <SelectItem key={y._id} value={y.name}>{y.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold">Select Exam</Label>
                <Select value={selectedExamId} onValueChange={setSelectedExamId}>
                  <SelectTrigger className="w-[200px]"><SelectValue placeholder="Please Select" /></SelectTrigger>
                  <SelectContent>
                    {exams.map(e => <SelectItem key={e._id} value={e._id}>{e.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold">Class/Division</Label>
                <div className="flex gap-2">
                  <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                    <SelectTrigger className="w-[140px]"><SelectValue placeholder="Class" /></SelectTrigger>
                    <SelectContent>
                      {classes.map(c => <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {divisions.length > 0 && (
                    <Select value={selectedDivisionId} onValueChange={setSelectedDivisionId}>
                      <SelectTrigger className="w-[100px]"><SelectValue placeholder="Division" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">All</SelectItem>
                        {divisions.map(d => <SelectItem key={d._id} value={d._id}>{d.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
              <div>
                <Label className="text-xs font-semibold">Order By</Label>
                <Select value={orderBy} onValueChange={v => setOrderBy(v as 'name' | 'admissionNo')}>
                  <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="admissionNo">Admission No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleGo} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Go
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* No subjects warning */}
        {selectedClassId && subjects.length === 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center gap-2">
              No subjects configured for this class. Please create subjects first.
              <Button variant="link" className="h-auto p-0 text-destructive underline" onClick={() => navigate('/subjects')}>Go to Subjects</Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Mark Entry Table */}
        {loaded && (
          <>
            {/* Print header */}
            <div className="hidden print:block mb-4">
              <h2 className="text-xl font-bold text-center">
                {selectedExam?.name}, {selectedClass?.name}{selectedDivision ? ' - ' + selectedDivision.name : ''}
              </h2>
              <p className="text-center text-sm text-muted-foreground">{selectedYear}</p>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 print:hidden">
              <Button onClick={() => handleSave(false)} disabled={saving}>
                <Save className="w-4 h-4 mr-2" />{saving ? 'Saving...' : 'Save'}
              </Button>
              <Button variant="outline" onClick={() => handleSave(true)} disabled={saving}>
                <CheckCircle className="w-4 h-4 mr-2" />Finalize
              </Button>
              <Button variant="outline" onClick={handleExportCSV}>
                <FileDown className="w-4 h-4 mr-2" />Export CSV
              </Button>
              <Button variant="outline" onClick={handlePrint}>
                <Printer className="w-4 h-4 mr-2" />Print
              </Button>
            </div>

            <Card>
              <CardHeader className="print:hidden">
                <CardTitle className="text-base">
                  {selectedExam?.name} &mdash; {selectedClass?.name}{selectedDivision ? ' - ' + selectedDivision.name : ''}
                  <span className="ml-4 text-sm font-normal text-muted-foreground">{students.length} students, {subjects.length} subjects</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {students.length === 0 ? (
                  <p className="text-center py-10 text-muted-foreground">No students found for this selection.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-10 sticky left-0 bg-background z-10">#</TableHead>
                          <TableHead className="min-w-[200px] sticky left-10 bg-background z-10">Name & Admn No.</TableHead>
                          {subjects.map(sub => (
                            <TableHead key={sub._id} className="text-center min-w-[120px]">
                              <div className="space-y-1">
                                <div className="font-medium">{sub.name}</div>
                                <div className="text-xs text-muted-foreground">Max: {sub.maxMark}</div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-6 text-xs print:hidden"
                                  onClick={() => handlePaste(sub._id)}
                                >
                                  <ClipboardPaste className="w-3 h-3 mr-1" />Paste
                                </Button>
                              </div>
                            </TableHead>
                          ))}
                          <TableHead className="text-center min-w-[80px]">Total</TableHead>
                          <TableHead className="text-center min-w-[80px]">%</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {students.map((student, idx) => {
                          let total = 0;
                          let maxTotal = 0;
                          subjects.forEach(sub => {
                            const m = student.marks[sub._id]?.mark;
                            if (m != null) { total += m; maxTotal += sub.maxMark; }
                          });
                          const pct = maxTotal > 0 ? ((total / maxTotal) * 100).toFixed(1) : '-';

                          return (
                            <TableRow key={student.studentId}>
                              <TableCell className="sticky left-0 bg-background z-10">{idx + 1}</TableCell>
                              <TableCell className="sticky left-10 bg-background z-10">
                                <div className="font-medium text-primary">{student.studentName}</div>
                                <div className="text-xs text-muted-foreground">{student.admissionNo}</div>
                              </TableCell>
                              {subjects.map(sub => (
                                <TableCell key={sub._id} className="text-center p-1">
                                  <Input
                                    type="text"
                                    inputMode="numeric"
                                    className="w-20 mx-auto text-center h-8 print:border-0 print:shadow-none [appearance:textfield]"
                                    value={student.marks[sub._id]?.mark ?? ''}
                                    onChange={e => {
                                      const v = e.target.value;
                                      if (v === '' || /^\d*$/.test(v)) updateMark(student.studentId, sub._id, v);
                                    }}
                                    placeholder="-"
                                  />
                                </TableCell>
                              ))}
                              <TableCell className="text-center font-semibold">{total || '-'}</TableCell>
                              <TableCell className="text-center">{pct}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default MarkEntryPage;
