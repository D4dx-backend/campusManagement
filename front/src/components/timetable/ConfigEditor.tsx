import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Copy } from 'lucide-react';
import type { DaySchedule, TimetableSlot } from '@/types/timetable';
import { DAY_NAMES } from '@/types/timetable';

interface ConfigEditorProps {
  workingDays: number[];
  daySchedules: DaySchedule[];
  onWorkingDaysChange: (days: number[]) => void;
  onDaySchedulesChange: (schedules: DaySchedule[]) => void;
}

export function ConfigEditor({
  workingDays,
  daySchedules,
  onWorkingDaysChange,
  onDaySchedulesChange,
}: ConfigEditorProps) {
  const toggleDay = (day: number) => {
    let newDays: number[];
    if (workingDays.includes(day)) {
      newDays = workingDays.filter((d) => d !== day);
      // Remove the daySchedule for this day
      onDaySchedulesChange(daySchedules.filter((ds) => ds.dayOfWeek !== day));
    } else {
      newDays = [...workingDays, day].sort((a, b) => a - b);
      // Add a default daySchedule for this day
      onDaySchedulesChange([
        ...daySchedules,
        {
          dayOfWeek: day,
          slots: [
            { slotNumber: 1, type: 'period', label: 'Period 1', startTime: '08:30', endTime: '09:15' },
          ],
        },
      ].sort((a, b) => a.dayOfWeek - b.dayOfWeek));
    }
    onWorkingDaysChange(newDays);
  };

  const updateSlot = (dayOfWeek: number, slotIndex: number, field: keyof TimetableSlot, value: string | number) => {
    const updated = daySchedules.map((ds) => {
      if (ds.dayOfWeek !== dayOfWeek) return ds;
      const newSlots = [...ds.slots];
      newSlots[slotIndex] = { ...newSlots[slotIndex], [field]: value };
      return { ...ds, slots: newSlots };
    });
    onDaySchedulesChange(updated);
  };

  const addSlot = (dayOfWeek: number, type: 'period' | 'break') => {
    const updated = daySchedules.map((ds) => {
      if (ds.dayOfWeek !== dayOfWeek) return ds;
      const lastSlot = ds.slots[ds.slots.length - 1];
      const newSlotNumber = lastSlot ? lastSlot.slotNumber + 1 : 1;
      const label = type === 'break' ? 'Break' : `Period ${ds.slots.filter((s) => s.type === 'period').length + 1}`;
      const startTime = lastSlot ? lastSlot.endTime : '08:30';
      // Default 45 min for period, 15 min for break
      const durationMin = type === 'period' ? 45 : 15;
      const [h, m] = startTime.split(':').map(Number);
      const endMinutes = h * 60 + m + durationMin;
      const endTime = `${String(Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`;
      return {
        ...ds,
        slots: [
          ...ds.slots,
          { slotNumber: newSlotNumber, type, label, startTime, endTime },
        ],
      };
    });
    onDaySchedulesChange(updated);
  };

  const removeSlot = (dayOfWeek: number, slotIndex: number) => {
    const updated = daySchedules.map((ds) => {
      if (ds.dayOfWeek !== dayOfWeek) return ds;
      const newSlots = ds.slots.filter((_, i) => i !== slotIndex);
      // Re-number slot numbers
      return {
        ...ds,
        slots: newSlots.map((slot, i) => ({ ...slot, slotNumber: i + 1 })),
      };
    });
    onDaySchedulesChange(updated);
  };

  const copyFromDay = (sourceDayOfWeek: number, targetDayOfWeek: number) => {
    const source = daySchedules.find((ds) => ds.dayOfWeek === sourceDayOfWeek);
    if (!source) return;
    const updated = daySchedules.map((ds) => {
      if (ds.dayOfWeek !== targetDayOfWeek) return ds;
      return { ...ds, slots: source.slots.map((s) => ({ ...s })) };
    });
    onDaySchedulesChange(updated);
  };

  const sortedWorkingDays = [...workingDays].sort((a, b) => a - b);

  return (
    <div className="space-y-6">
      {/* Working Days Selection */}
      <div>
        <Label className="text-sm font-medium mb-3 block">Working Days</Label>
        <div className="flex flex-wrap gap-4">
          {[0, 1, 2, 3, 4, 5, 6].map((day) => (
            <label key={day} className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={workingDays.includes(day)}
                onCheckedChange={() => toggleDay(day)}
              />
              <span className="text-sm">{DAY_NAMES[day]}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Day Schedules */}
      {sortedWorkingDays.map((dayOfWeek) => {
        const daySchedule = daySchedules.find((ds) => ds.dayOfWeek === dayOfWeek);
        if (!daySchedule) return null;

        return (
          <Card key={dayOfWeek}>
            <CardHeader className="py-3 px-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <CardTitle className="text-sm font-medium">{DAY_NAMES[dayOfWeek]}</CardTitle>
                <div className="flex flex-wrap items-center gap-2 md:justify-end">
                  {/* Copy from another day */}
                  {sortedWorkingDays.length > 1 && (
                    <Select onValueChange={(val) => copyFromDay(Number(val), dayOfWeek)}>
                      <SelectTrigger className="h-8 w-[170px] text-xs">
                        <Copy className="h-3 w-3 mr-1" />
                        <SelectValue placeholder="Copy from..." />
                      </SelectTrigger>
                      <SelectContent>
                        {sortedWorkingDays
                          .filter((d) => d !== dayOfWeek)
                          .map((d) => (
                            <SelectItem key={d} value={String(d)}>
                              {DAY_NAMES[d]}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => addSlot(dayOfWeek, 'period')}
                  >
                    <Plus className="h-3 w-3 mr-1" /> Period
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => addSlot(dayOfWeek, 'break')}
                  >
                    <Plus className="h-3 w-3 mr-1" /> Break
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <div className="space-y-3">
                {daySchedule.slots.map((slot, index) => (
                  <div
                    key={index}
                    className="flex flex-wrap items-center gap-2 rounded-md border bg-background p-2.5 md:flex-nowrap"
                  >
                    <span className="w-8 shrink-0 text-xs text-muted-foreground">#{slot.slotNumber}</span>
                    <Select
                      value={slot.type}
                      onValueChange={(val) => updateSlot(dayOfWeek, index, 'type', val)}
                    >
                      <SelectTrigger className="h-8 w-[108px] shrink-0 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="period">Period</SelectItem>
                        <SelectItem value="break">Break</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      value={slot.label}
                      onChange={(e) => updateSlot(dayOfWeek, index, 'label', e.target.value)}
                      className="h-8 min-w-[160px] flex-1 text-xs"
                      placeholder="Label"
                    />
                    <Input
                      type="time"
                      value={slot.startTime}
                      onChange={(e) => updateSlot(dayOfWeek, index, 'startTime', e.target.value)}
                      className="h-8 w-[132px] shrink-0 text-xs"
                    />
                    <span className="w-5 shrink-0 text-center text-xs text-muted-foreground">to</span>
                    <Input
                      type="time"
                      value={slot.endTime}
                      onChange={(e) => updateSlot(dayOfWeek, index, 'endTime', e.target.value)}
                      className="h-8 w-[132px] shrink-0 text-xs"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 shrink-0 p-0 text-destructive hover:text-destructive"
                      onClick={() => removeSlot(dayOfWeek, index)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                {daySchedule.slots.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    No slots defined. Add periods and breaks above.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {workingDays.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          Select at least one working day to configure the schedule.
        </p>
      )}
    </div>
  );
}
