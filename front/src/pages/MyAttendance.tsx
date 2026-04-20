import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarCheck, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { studentPortalApi } from '@/services/studentPortalService';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const statusColor: Record<string, string> = {
  present: 'bg-green-500',
  absent: 'bg-red-500',
  late: 'bg-yellow-500',
  half_day: 'bg-orange-500',
};

const statusBadge: Record<string, string> = {
  present: 'default',
  absent: 'destructive',
  late: 'secondary',
  half_day: 'outline',
};

const MyAttendance = () => {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const { data, isLoading } = useQuery({
    queryKey: ['my-attendance', month, year],
    queryFn: () => studentPortalApi.getMyAttendance(month, year),
  });

  const att = data?.data;

  const goPrev = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const goNext = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const attendanceRate = att?.summary
    ? Math.round(((att.summary.present + att.summary.late + att.summary.halfDay) / (att.summary.total || 1)) * 100)
    : 0;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">My Attendance</h1>
          <p className="text-muted-foreground mt-1">
            {att?.className}{att?.section ? ` - ${att.section}` : ''}
          </p>
        </div>

        {/* Month Navigator */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={goPrev}><ChevronLeft className="w-4 h-4" /></Button>
          <span className="text-lg font-semibold min-w-[180px] text-center">{MONTHS[month - 1]} {year}</span>
          <Button variant="outline" size="icon" onClick={goNext}><ChevronRight className="w-4 h-4" /></Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : !att ? (
          <Card><CardContent className="py-8 text-center text-muted-foreground">No attendance data found.</CardContent></Card>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Card>
                <CardContent className="pt-4 pb-4 text-center">
                  <p className="text-2xl font-bold">{att.summary.total}</p>
                  <p className="text-xs text-muted-foreground">Total Days</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-4 text-center">
                  <p className="text-2xl font-bold text-green-600">{att.summary.present}</p>
                  <p className="text-xs text-muted-foreground">Present</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-4 text-center">
                  <p className="text-2xl font-bold text-red-600">{att.summary.absent}</p>
                  <p className="text-xs text-muted-foreground">Absent</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-4 text-center">
                  <p className="text-2xl font-bold text-yellow-600">{att.summary.late}</p>
                  <p className="text-xs text-muted-foreground">Late</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-4 text-center">
                  <p className="text-2xl font-bold text-blue-600">{attendanceRate}%</p>
                  <p className="text-xs text-muted-foreground">Rate</p>
                </CardContent>
              </Card>
            </div>

            {/* Daily Grid */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Daily Attendance</CardTitle>
              </CardHeader>
              <CardContent>
                {att.daily.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No records for this month</p>
                ) : (
                  <div className="grid grid-cols-7 gap-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                      <div key={d} className="text-center text-xs font-semibold text-muted-foreground pb-1">{d}</div>
                    ))}
                    {/* Leading empty cells */}
                    {Array.from({ length: new Date(year, month - 1, 1).getDay() }).map((_, i) => (
                      <div key={`e-${i}`} />
                    ))}
                    {/* Days of month */}
                    {Array.from({ length: new Date(year, month, 0).getDate() }).map((_, i) => {
                      const day = i + 1;
                      const record = att.daily.find((d: any) => new Date(d.date).getDate() === day);
                      return (
                        <div key={day} className="flex flex-col items-center gap-1">
                          <span className="text-xs">{day}</span>
                          {record ? (
                            <div className={`w-3 h-3 rounded-full ${statusColor[record.status] || 'bg-gray-300'}`} title={record.status} />
                          ) : (
                            <div className="w-3 h-3 rounded-full bg-gray-200" title="No record" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Legend */}
                <div className="flex flex-wrap gap-4 mt-4 pt-3 border-t">
                  <div className="flex items-center gap-1.5 text-xs"><div className="w-3 h-3 rounded-full bg-green-500" /> Present</div>
                  <div className="flex items-center gap-1.5 text-xs"><div className="w-3 h-3 rounded-full bg-red-500" /> Absent</div>
                  <div className="flex items-center gap-1.5 text-xs"><div className="w-3 h-3 rounded-full bg-yellow-500" /> Late</div>
                  <div className="flex items-center gap-1.5 text-xs"><div className="w-3 h-3 rounded-full bg-orange-500" /> Half Day</div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default MyAttendance;
