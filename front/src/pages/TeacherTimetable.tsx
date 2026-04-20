import React, { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarDays, Clock, Grid3X3 } from 'lucide-react';
import { TimetableGrid } from '@/components/timetable/TimetableGrid';
import { useMySchedule } from '@/hooks/useTimetable';
import type { TimetableConfig, Timetable, TeacherScheduleEntry } from '@/types/timetable';
import { DAY_NAMES, DAY_SHORT } from '@/types/timetable';

export default function TeacherTimetable() {
  const { data: response, isLoading, isError } = useMySchedule();
  const [viewTab, setViewTab] = useState<'weekly' | 'daily' | 'class'>('weekly');
  const [selectedDay, setSelectedDay] = useState<number>(() => new Date().getDay());
  const [selectedTimetableId, setSelectedTimetableId] = useState('');

  const scheduleData = response?.data;
  const timetables = (scheduleData?.timetables || []) as Timetable[];
  const flatSchedule = (scheduleData?.schedule || []) as TeacherScheduleEntry[];

  // Get all working days from all configs
  const allWorkingDays = useMemo(() => {
    const days = new Set<number>();
    for (const tt of timetables) {
      const cfg = typeof tt.configId === 'object' ? (tt.configId as TimetableConfig) : null;
      if (cfg) {
        cfg.workingDays.forEach((d) => days.add(d));
      }
    }
    return Array.from(days).sort((a, b) => a - b);
  }, [timetables]);

  // Today's entries
  const todaySchedule = useMemo(() => {
    return flatSchedule
      .filter((e) => e.dayOfWeek === selectedDay)
      .sort((a, b) => a.slotNumber - b.slotNumber);
  }, [flatSchedule, selectedDay]);

  // Get time info for a schedule entry from its config
  const getTimeForEntry = (entry: TeacherScheduleEntry) => {
    const cfg = entry.config as TimetableConfig;
    if (!cfg?.daySchedules) return '';
    const daySchedule = cfg.daySchedules.find((d) => d.dayOfWeek === entry.dayOfWeek);
    if (!daySchedule) return '';
    const slot = daySchedule.slots.find((s) => s.slotNumber === entry.slotNumber);
    if (!slot) return '';
    return `${slot.startTime} – ${slot.endTime}`;
  };

  // Build a unified weekly grid for the teacher
  // Rows = period slots (union of all configs), Columns = working days
  // Each cell = what class/subject the teacher has
  const weeklyGrid = useMemo(() => {
    // Collect all slot times across all configs
    const slotMap = new Map<string, { slotNumber: number; label: string; startTime: string; endTime: string; type: 'period' | 'break' }>();

    for (const tt of timetables) {
      const cfg = typeof tt.configId === 'object' ? (tt.configId as TimetableConfig) : null;
      if (!cfg) continue;
      for (const day of cfg.daySchedules) {
        for (const slot of day.slots) {
          const key = `${slot.startTime}-${slot.endTime}`;
          if (!slotMap.has(key)) {
            slotMap.set(key, { ...slot });
          }
        }
      }
    }

    return Array.from(slotMap.values()).sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [timetables]);

  // Map: "dayOfWeek-startTime-endTime" → entry data
  const weeklyEntryMap = useMemo(() => {
    const map: Record<string, TeacherScheduleEntry> = {};
    for (const entry of flatSchedule) {
      const time = getTimeForEntry(entry);
      if (time) {
        const [start, end] = time.split(' – ');
        map[`${entry.dayOfWeek}-${start}-${end}`] = entry;
      }
    }
    return map;
  }, [flatSchedule]);

  // Selected class timetable for class view
  const selectedTimetable = useMemo(
    () => timetables.find((tt) => tt._id === selectedTimetableId),
    [timetables, selectedTimetableId]
  );

  const selectedConfig = useMemo(() => {
    if (!selectedTimetable) return null;
    return typeof selectedTimetable.configId === 'object'
      ? (selectedTimetable.configId as TimetableConfig)
      : null;
  }, [selectedTimetable]);

  const isToday = (day: number) => new Date().getDay() === day;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Schedule</h1>
          <p className="text-muted-foreground">
            {scheduleData?.staffName ? `${scheduleData.staffName} — ` : ''}
            Your teaching schedule across all classes
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-[400px] w-full" />
          </div>
        ) : isError || !scheduleData || flatSchedule.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <CalendarDays className="mx-auto h-12 w-12 mb-4 opacity-30" />
              <p>No timetable entries assigned to you yet.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Summary */}
            <div className="flex flex-wrap gap-3">
              <Badge variant="outline" className="text-sm py-1 px-3">
                {timetables.length} class{timetables.length !== 1 ? 'es' : ''}
              </Badge>
              <Badge variant="outline" className="text-sm py-1 px-3">
                {flatSchedule.length} period{flatSchedule.length !== 1 ? 's' : ''} / week
              </Badge>
              <Badge variant="outline" className="text-sm py-1 px-3">
                {todaySchedule.length} period{todaySchedule.length !== 1 ? 's' : ''} today
              </Badge>
            </div>

            {/* Tabs */}
            <Tabs value={viewTab} onValueChange={(v) => setViewTab(v as any)}>
              <TabsList>
                <TabsTrigger value="weekly">
                  <Grid3X3 className="h-4 w-4 mr-1.5" />
                  Weekly
                </TabsTrigger>
                <TabsTrigger value="daily">
                  <CalendarDays className="h-4 w-4 mr-1.5" />
                  Daily
                </TabsTrigger>
                <TabsTrigger value="class">
                  <Clock className="h-4 w-4 mr-1.5" />
                  By Class
                </TabsTrigger>
              </TabsList>

              {/* ── Weekly View ── */}
              <TabsContent value="weekly" className="mt-4">
                <div className="overflow-x-auto border rounded-lg">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-muted/60">
                        <th className="border p-2 text-left font-medium w-[120px]">Time</th>
                        {allWorkingDays.map((day) => (
                          <th
                            key={day}
                            className={`border p-2 text-center font-medium min-w-[140px] ${
                              isToday(day) ? 'bg-primary/10 text-primary' : ''
                            }`}
                          >
                            {DAY_SHORT[day]}
                            {isToday(day) && (
                              <span className="ml-1 text-[10px] font-normal">(Today)</span>
                            )}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {weeklyGrid.map((slot) => {
                        if (slot.type === 'break') {
                          return (
                            <tr key={`${slot.startTime}-${slot.endTime}`} className="bg-muted/20">
                              <td className="border p-2 text-xs text-muted-foreground">
                                <div>{slot.label}</div>
                                <div className="text-[10px]">{slot.startTime} – {slot.endTime}</div>
                              </td>
                              {allWorkingDays.map((day) => (
                                <td key={day} className="border p-2 text-center text-xs text-muted-foreground italic">
                                  {slot.label}
                                </td>
                              ))}
                            </tr>
                          );
                        }
                        return (
                          <tr key={`${slot.startTime}-${slot.endTime}`}>
                            <td className="border p-2">
                              <div className="font-medium text-xs">{slot.label}</div>
                              <div className="text-[10px] text-muted-foreground">
                                {slot.startTime} – {slot.endTime}
                              </div>
                            </td>
                            {allWorkingDays.map((day) => {
                              const entry = weeklyEntryMap[`${day}-${slot.startTime}-${slot.endTime}`];
                              return (
                                <td
                                  key={day}
                                  className={`border p-1.5 ${
                                    isToday(day) ? 'bg-primary/5' : ''
                                  } ${entry ? 'bg-blue-50' : ''}`}
                                >
                                  {entry ? (
                                    <div className="space-y-0.5">
                                      <div className="font-medium text-xs">{entry.subjectName}</div>
                                      <div className="text-[11px] text-muted-foreground">
                                        {entry.className} {entry.divisionName}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="text-xs text-muted-foreground text-center">—</div>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </TabsContent>

              {/* ── Daily View ── */}
              <TabsContent value="daily" className="mt-4 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Day:</span>
                  <div className="flex gap-1">
                    {allWorkingDays.map((day) => (
                      <Button
                        key={day}
                        variant={selectedDay === day ? 'default' : 'outline'}
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => setSelectedDay(day)}
                      >
                        {DAY_SHORT[day]}
                        {isToday(day) && ' •'}
                      </Button>
                    ))}
                  </div>
                </div>

                <h3 className="text-sm font-semibold">
                  {DAY_NAMES[selectedDay]}
                  {isToday(selectedDay) && ' (Today)'}
                  {' — '}
                  {todaySchedule.length} period{todaySchedule.length !== 1 ? 's' : ''}
                </h3>

                {todaySchedule.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                      No classes scheduled for {DAY_NAMES[selectedDay]}.
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-2">
                    {todaySchedule.map((entry, i) => {
                      const time = getTimeForEntry(entry);
                      return (
                        <Card key={i}>
                          <CardContent className="p-4 flex items-center gap-4">
                            <div className="text-center min-w-[80px]">
                              <div className="text-sm font-mono font-medium">
                                {time.split(' – ')[0]}
                              </div>
                              <div className="text-[10px] text-muted-foreground">
                                to {time.split(' – ')[1]}
                              </div>
                            </div>
                            <div className="h-10 w-px bg-border" />
                            <div className="flex-1">
                              <div className="font-medium text-sm">{entry.subjectName}</div>
                              <div className="text-xs text-muted-foreground">
                                {entry.className} — {entry.divisionName}
                              </div>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              Period {entry.slotNumber}
                            </Badge>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              {/* ── Class View ── */}
              <TabsContent value="class" className="mt-4 space-y-4">
                <div>
                  <span className="text-sm font-medium mr-2">Class:</span>
                  <Select value={selectedTimetableId} onValueChange={setSelectedTimetableId}>
                    <SelectTrigger className="w-[280px] inline-flex">
                      <SelectValue placeholder="Select a class" />
                    </SelectTrigger>
                    <SelectContent>
                      {timetables.map((tt) => {
                        const cls = typeof tt.classId === 'object' ? (tt.classId as any).name : '';
                        const div = typeof tt.divisionId === 'object' ? (tt.divisionId as any).name : '';
                        return (
                          <SelectItem key={tt._id} value={tt._id}>
                            {cls} — {div}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {selectedTimetable && selectedConfig ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 text-sm">
                      <span>
                        <span className="text-muted-foreground">Class:</span>{' '}
                        <strong>{(selectedTimetable.classId as any)?.name}</strong>
                      </span>
                      <span>
                        <span className="text-muted-foreground">Division:</span>{' '}
                        <strong>{(selectedTimetable.divisionId as any)?.name}</strong>
                      </span>
                    </div>
                    <TimetableGrid config={selectedConfig} entries={selectedTimetable.entries} />
                  </div>
                ) : (
                  <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                      Select a class to view its full timetable.
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </AppLayout>
  );
}
