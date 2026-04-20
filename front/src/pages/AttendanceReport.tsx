import { useState, useEffect, useRef } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2, Printer } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { classesApi, Class } from '@/services/classes';
import { divisionsApi, Division } from '@/services/divisions';
import { useMonthlyReport } from '@/hooks/useAttendance';
import { useAuth } from '@/contexts/AuthContext';
import { useBranchContext } from '@/contexts/BranchContext';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const AttendanceReport = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { selectedBranch } = useBranchContext();
  const printRef = useRef<HTMLDivElement>(null);

  const now = new Date();
  const [classes, setClasses] = useState<Class[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(String(now.getMonth() + 1));
  const [selectedYear, setSelectedYear] = useState(String(now.getFullYear()));
  const [submitted, setSubmitted] = useState(false);

  // Load report
  const { data: reportData, isLoading } = useMonthlyReport({
    classId: submitted ? selectedClassId : '',
    section: selectedSection === '__all__' ? '' : selectedSection,
    month: Number(selectedMonth),
    year: Number(selectedYear),
  });

  const report = reportData?.data;

  // Load classes
  useEffect(() => {
    (async () => {
      try {
        const res = await classesApi.getClasses({ limit: 100, status: 'active' });
        setClasses(res.data || []);
      } catch {}
    })();
  }, []);

  // Load divisions
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

  const handleSubmit = () => {
    if (!selectedClassId) {
      toast({ title: 'Error', description: 'Select a class', variant: 'destructive' });
      return;
    }
    setSubmitted(true);
  };

  const handlePrint = () => {
    if (!printRef.current) return;
    const printContent = printRef.current.innerHTML;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <html>
        <head>
          <title>Attendance Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; font-size: 11px; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #333; padding: 4px 6px; text-align: center; }
            th { background-color: #f3f4f6; font-weight: 600; }
            .header-row { text-align: left; padding: 8px 0; }
            .school-name { font-weight: bold; font-size: 14px; }
            .meta-row { display: flex; justify-content: space-between; margin-bottom: 12px; }
            .student-name-cell { text-align: left; min-width: 150px; }
            .totals-header { font-weight: bold; }
          </style>
        </head>
        <body>${printContent}</body>
      </html>
    `);
    win.document.close();
    win.print();
  };

  // Get selectedClass name and section for display
  const selectedClassName = classes.find(c => c._id === selectedClassId)?.name || '';
  const sectionDisplay = selectedSection && selectedSection !== '__all__' ? `, ${selectedSection}` : '';

  // Build days array for the month
  const daysInMonth = report?.daysInMonth || new Date(Number(selectedYear), Number(selectedMonth), 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const d = new Date(Number(selectedYear), Number(selectedMonth) - 1, i + 1);
    return { day: i + 1, dayName: DAY_NAMES[d.getDay()], isSunday: d.getDay() === 0 };
  });

  // Year options
  const yearOptions = Array.from({ length: 5 }, (_, i) => String(now.getFullYear() - 2 + i));

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Attendance Report</h1>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
              <div>
                <Label>Month</Label>
                <Select value={selectedMonth} onValueChange={(v) => { setSelectedMonth(v); setSubmitted(false); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((m, i) => (
                      <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Class/Division</Label>
                <div className="flex gap-2">
                  <Select value={selectedClassId} onValueChange={(v) => { setSelectedClassId(v); setSubmitted(false); }}>
                    <SelectTrigger><SelectValue placeholder="Class" /></SelectTrigger>
                    <SelectContent>
                      {classes.map((c) => (
                        <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedSection || '__all__'} onValueChange={(v) => { setSelectedSection(v); setSubmitted(false); }}>
                    <SelectTrigger className="w-28"><SelectValue placeholder="Div" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All</SelectItem>
                      {divisions.map((d) => (
                        <SelectItem key={d._id} value={d.name}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Year</Label>
                <Select value={selectedYear} onValueChange={(v) => { setSelectedYear(v); setSubmitted(false); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {yearOptions.map((y) => (
                      <SelectItem key={y} value={y}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSubmit} disabled={isLoading || !selectedClassId}>
                Submit
              </Button>
              {submitted && report && (
                <Button variant="default" className="bg-green-600 hover:bg-green-700" onClick={handlePrint}>
                  <Printer className="w-4 h-4 mr-2" /> Print
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Loading */}
        {isLoading && submitted && (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {/* Report Table */}
        {submitted && report && !isLoading && (
          <div ref={printRef}>
            {/* Header */}
            <div className="meta-row flex justify-between mb-4">
              <div><strong>SCHOOL:</strong> {selectedBranch?.name || 'School'}</div>
              <div><strong>CLASS:</strong> {selectedClassName}{sectionDisplay}</div>
              <div><strong>MONTH, YEAR:</strong> {MONTHS[Number(selectedMonth) - 1]}, {selectedYear}</div>
            </div>

            {/* Scrollable table */}
            <div className="overflow-x-auto border rounded-lg">
              <table className="min-w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border px-2 py-2 sticky left-0 bg-gray-100 z-10" rowSpan={2}></th>
                    <th className="border px-2 py-2 sticky left-8 bg-gray-100 z-10 text-left min-w-[160px]" rowSpan={2}>
                      STUDENT NAME<br /><span className="text-[10px] text-muted-foreground">(Admn. no)</span>
                    </th>
                    {days.map((d) => (
                      <th
                        key={d.day}
                        className={`border px-1 py-1 text-center min-w-[28px] ${d.isSunday ? 'bg-red-50' : ''}`}
                      >
                        <div className="font-bold">{String(d.day).padStart(2, '0')}</div>
                        <div className="text-[9px] text-muted-foreground">{d.dayName}</div>
                      </th>
                    ))}
                    <th className="border px-2 py-2 text-center" colSpan={2}>STUDENT TOTALS</th>
                  </tr>
                  <tr className="bg-gray-100">
                    {days.map((d) => (
                      <th key={`empty-${d.day}`} className="border" style={{ height: 0, padding: 0 }}></th>
                    ))}
                    <th className="border px-2 py-1 text-center font-bold">P</th>
                    <th className="border px-2 py-1 text-center font-bold">A</th>
                  </tr>
                </thead>
                <tbody>
                  {report.students.map((student: any, idx: number) => (
                    <tr key={student.studentId} className="hover:bg-gray-50">
                      <td className="border px-2 py-2 text-center sticky left-0 bg-white">{idx + 1}</td>
                      <td className="border px-2 py-2 sticky left-8 bg-white text-left">
                        <div className="font-medium text-blue-700">{student.studentName}</div>
                        <div className="text-[10px] text-muted-foreground">({student.admissionNo})</div>
                      </td>
                      {days.map((d) => {
                        const status = student.daily[d.day];
                        let display = '–';
                        let cellClass = '';
                        if (status === 'present') { display = 'P'; cellClass = 'text-green-700 font-bold'; }
                        else if (status === 'absent') { display = 'A'; cellClass = 'text-red-600 font-bold'; }
                        else if (status === 'late') { display = 'L'; cellClass = 'text-yellow-600 font-bold'; }
                        else if (status === 'half_day') { display = 'H'; cellClass = 'text-orange-600 font-bold'; }
                        return (
                          <td
                            key={d.day}
                            className={`border px-1 py-2 text-center ${cellClass} ${d.isSunday ? 'bg-red-50' : ''}`}
                          >
                            {display}
                          </td>
                        );
                      })}
                      <td className="border px-2 py-2 text-center font-bold">{student.presentCount}</td>
                      <td className="border px-2 py-2 text-center font-bold">{student.absentCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {submitted && !isLoading && report && report.students.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No students or attendance data found for the selected criteria.
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

export default AttendanceReport;
