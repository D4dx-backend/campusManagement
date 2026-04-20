import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { classesApi, Class } from '@/services/classes';
import { contentAssignmentApi, ClassContentAssignment } from '@/services/lmsService';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const typeColors: Record<string, string> = {
  lesson: 'bg-blue-500',
  assessment: 'bg-purple-500',
};

const LmsCalendar = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [assignments, setAssignments] = useState<ClassContentAssignment[]>([]);
  const [loading, setLoading] = useState(false);

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  useEffect(() => { loadClasses(); }, []);
  useEffect(() => { loadCalendar(); }, [selectedClassId, month, year]);

  const loadClasses = async () => {
    try {
      const res = await classesApi.getClasses({ limit: 100, status: 'active' });
      setClasses(res.data || []);
    } catch { /* ignore */ }
  };

  const loadCalendar = async () => {
    setLoading(true);
    try {
      const params: any = { month, year };
      if (selectedClassId) params.classId = selectedClassId;
      const res = await contentAssignmentApi.getCalendar(params);
      setAssignments(res.data || []);
    } catch {
      toast({ title: 'Error', description: 'Failed to load calendar', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const goToday = () => {
    setMonth(now.getMonth() + 1);
    setYear(now.getFullYear());
  };

  // Build calendar grid
  const calendarData = useMemo(() => {
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const startDow = firstDay.getDay();
    const totalDays = lastDay.getDate();

    // Map assignments to days
    const dayMap: Record<number, ClassContentAssignment[]> = {};
    assignments.forEach(a => {
      const addToDay = (dateStr: string, type: 'start' | 'due') => {
        const d = new Date(dateStr);
        if (d.getMonth() + 1 === month && d.getFullYear() === year) {
          const day = d.getDate();
          if (!dayMap[day]) dayMap[day] = [];
          // Avoid duplicates
          if (!dayMap[day].find(x => x._id === a._id)) {
            dayMap[day].push(a);
          }
        }
      };
      if (a.availableFrom) addToDay(a.availableFrom, 'start');
      if (a.dueDate) addToDay(a.dueDate, 'due');
    });

    const weeks: (number | null)[][] = [];
    let currentWeek: (number | null)[] = [];

    // Fill leading blanks
    for (let i = 0; i < startDow; i++) currentWeek.push(null);

    for (let day = 1; day <= totalDays; day++) {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }
    // Fill trailing blanks
    while (currentWeek.length > 0 && currentWeek.length < 7) currentWeek.push(null);
    if (currentWeek.length > 0) weeks.push(currentWeek);

    return { weeks, dayMap, totalDays };
  }, [month, year, assignments]);

  const isToday = (day: number) =>
    day === now.getDate() && month === now.getMonth() + 1 && year === now.getFullYear();

  return (
    <AppLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">LMS Calendar</h1>
            <p className="text-sm text-muted-foreground">View scheduled content and assessments</p>
          </div>
          <Button variant="outline" onClick={() => navigate('/lms/schedule')}>
            Back to Schedule
          </Button>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={prevMonth}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h2 className="text-lg font-semibold min-w-[180px] text-center">
              {MONTHS[month - 1]} {year}
            </h2>
            <Button variant="outline" size="icon" onClick={nextMonth}>
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={goToday}>Today</Button>
          </div>
          <Select value={selectedClassId || '__all__'} onValueChange={v => setSelectedClassId(v === '__all__' ? '' : v)}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Classes" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Classes</SelectItem>
              {classes.map(c => <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Calendar Grid */}
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
        ) : (
          <Card>
            <CardContent className="p-0">
              {/* Day headers */}
              <div className="grid grid-cols-7 border-b">
                {DAYS.map(day => (
                  <div key={day} className="px-2 py-2 text-center text-xs font-semibold text-muted-foreground border-r last:border-r-0">
                    {day}
                  </div>
                ))}
              </div>
              {/* Weeks */}
              {calendarData.weeks.map((week, wi) => (
                <div key={wi} className="grid grid-cols-7 border-b last:border-b-0">
                  {week.map((day, di) => (
                    <div
                      key={di}
                      className={`min-h-[90px] p-1.5 border-r last:border-r-0 ${
                        day === null ? 'bg-muted/30' : ''
                      } ${day && isToday(day) ? 'bg-primary/5' : ''}`}
                    >
                      {day !== null && (
                        <>
                          <div className={`text-xs font-medium mb-1 ${isToday(day) ? 'bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center' : 'text-muted-foreground'}`}>
                            {day}
                          </div>
                          <div className="space-y-0.5">
                            {(calendarData.dayMap[day] || []).slice(0, 3).map(a => (
                              <div
                                key={a._id}
                                className={`text-[10px] leading-tight px-1 py-0.5 rounded truncate text-white cursor-pointer ${typeColors[a.contentType] || 'bg-gray-500'}`}
                                title={`${a.title} (${a.contentType})`}
                              >
                                {a.title}
                              </div>
                            ))}
                            {(calendarData.dayMap[day] || []).length > 3 && (
                              <div className="text-[10px] text-muted-foreground px-1">
                                +{(calendarData.dayMap[day]?.length ?? 0) - 3} more
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Legend */}
        <div className="flex gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-blue-500" /> Lesson
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-purple-500" /> Assessment
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default LmsCalendar;
