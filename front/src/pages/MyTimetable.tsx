import React, { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarDays, Grid3X3 } from 'lucide-react';
import { TimetableGrid } from '@/components/timetable/TimetableGrid';
import { useMyTimetable } from '@/hooks/useTimetable';
import type { TimetableConfig, DaySchedule } from '@/types/timetable';
import { DAY_NAMES, DAY_SHORT } from '@/types/timetable';

export default function MyTimetable() {
  const { data: response, isLoading, isError } = useMyTimetable();
  const [viewTab, setViewTab] = useState<'weekly' | 'daily'>('weekly');
  const [selectedDay, setSelectedDay] = useState<number>(() => new Date().getDay());

  const timetable = response?.data;
  const config = timetable ? (typeof timetable.configId === 'object' ? timetable.configId as TimetableConfig : null) : null;

  const className = timetable && typeof timetable.classId === 'object' ? (timetable.classId as any).name : '';
  const divisionName = timetable && typeof timetable.divisionId === 'object' ? (timetable.divisionId as any).name : '';
  const academicYear = timetable && typeof timetable.academicYearId === 'object' ? (timetable.academicYearId as any).name : '';

  const workingDays = useMemo(() => config ? [...config.workingDays].sort((a, b) => a - b) : [], [config]);

  // Today's entries for the daily view
  const dayEntries = useMemo(() => {
    if (!timetable || !config) return [];
    return timetable.entries
      .filter((e) => e.dayOfWeek === selectedDay)
      .sort((a, b) => a.slotNumber - b.slotNumber);
  }, [timetable, config, selectedDay]);

  // Get time info from config
  const getSlotTime = (dayOfWeek: number, slotNumber: number) => {
    if (!config) return '';
    const daySchedule = config.daySchedules.find((d) => d.dayOfWeek === dayOfWeek);
    if (!daySchedule) return '';
    const slot = daySchedule.slots.find((s) => s.slotNumber === slotNumber);
    if (!slot) return `${slot}`;
    return `${slot.startTime} – ${slot.endTime}`;
  };

  const isToday = (day: number) => new Date().getDay() === day;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Timetable</h1>
          <p className="text-muted-foreground">Your class schedule</p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-[400px] w-full" />
          </div>
        ) : isError || !timetable || !config ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <CalendarDays className="mx-auto h-12 w-12 mb-4 opacity-30" />
              <p>No timetable has been set for your class yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-4 text-sm">
              {className && (
                <span>
                  <span className="text-muted-foreground">Class:</span>{' '}
                  <strong>{className}</strong>
                </span>
              )}
              {divisionName && (
                <span>
                  <span className="text-muted-foreground">Division:</span>{' '}
                  <strong>{divisionName}</strong>
                </span>
              )}
              {academicYear && (
                <span>
                  <span className="text-muted-foreground">Year:</span>{' '}
                  <strong>{academicYear}</strong>
                </span>
              )}
            </div>

            <Tabs value={viewTab} onValueChange={(v) => setViewTab(v as any)}>
              <TabsList>
                <TabsTrigger value="weekly">
                  <Grid3X3 className="h-4 w-4 mr-1.5" />
                  Full Week
                </TabsTrigger>
                <TabsTrigger value="daily">
                  <CalendarDays className="h-4 w-4 mr-1.5" />
                  Day View
                </TabsTrigger>
              </TabsList>

              {/* Weekly — the full grid */}
              <TabsContent value="weekly" className="mt-4">
                <TimetableGrid config={config} entries={timetable.entries} />
              </TabsContent>

              {/* Daily — list for one day */}
              <TabsContent value="daily" className="mt-4 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Day:</span>
                  <div className="flex gap-1">
                    {workingDays.map((day) => (
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
                  {dayEntries.length} period{dayEntries.length !== 1 ? 's' : ''}
                </h3>

                {dayEntries.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                      No classes on {DAY_NAMES[selectedDay]}.
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-2">
                    {dayEntries.map((entry, i) => {
                      const time = getSlotTime(entry.dayOfWeek, entry.slotNumber);
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
                              <div className="text-xs text-muted-foreground">{entry.staffName}</div>
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
            </Tabs>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
