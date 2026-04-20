import React, { useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { TimetableConfig, TimetableEntry, DaySchedule } from '@/types/timetable';
import { DAY_SHORT } from '@/types/timetable';

// Consistent subject colors for visual clarity
const SUBJECT_COLORS = [
  'bg-blue-50 border-blue-200 text-blue-800',
  'bg-green-50 border-green-200 text-green-800',
  'bg-purple-50 border-purple-200 text-purple-800',
  'bg-orange-50 border-orange-200 text-orange-800',
  'bg-pink-50 border-pink-200 text-pink-800',
  'bg-teal-50 border-teal-200 text-teal-800',
  'bg-indigo-50 border-indigo-200 text-indigo-800',
  'bg-yellow-50 border-yellow-200 text-yellow-800',
  'bg-red-50 border-red-200 text-red-800',
  'bg-cyan-50 border-cyan-200 text-cyan-800',
];

interface SubjectOption {
  _id: string;
  name: string;
  code?: string;
}

interface StaffOption {
  _id: string;
  name: string;
  employeeId?: string;
}

interface TimetableGridProps {
  config: TimetableConfig;
  entries: TimetableEntry[];
  editable?: boolean;
  subjects?: SubjectOption[];
  staffList?: StaffOption[];
  onEntryChange?: (dayOfWeek: number, slotNumber: number, subjectId: string, subjectName: string, staffId: string, staffName: string) => void;
  onEntryRemove?: (dayOfWeek: number, slotNumber: number) => void;
}

export function TimetableGrid({
  config,
  entries,
  editable = false,
  subjects = [],
  staffList = [],
  onEntryChange,
  onEntryRemove,
}: TimetableGridProps) {
  // Build a lookup for entries: "dayOfWeek-slotNumber" → entry
  const entryMap = useMemo(() => {
    const map: Record<string, TimetableEntry> = {};
    for (const entry of entries) {
      map[`${entry.dayOfWeek}-${entry.slotNumber}`] = entry;
    }
    return map;
  }, [entries]);

  // Build color map for subjects
  const subjectColorMap = useMemo(() => {
    const uniqueIds = [...new Set(entries.map((e) => e.subjectId))];
    const map: Record<string, string> = {};
    uniqueIds.forEach((id, i) => {
      map[id] = SUBJECT_COLORS[i % SUBJECT_COLORS.length];
    });
    return map;
  }, [entries]);

  // Find the "master" schedule: union of all slot numbers across days,
  // or just use the first day's slots as a baseline for row headers
  const allSlots = useMemo(() => {
    // Collect all unique slots across all days, ordered by slotNumber
    const slotMap = new Map<number, { type: 'period' | 'break'; label: string; startTime: string; endTime: string }>();
    for (const day of config.daySchedules) {
      for (const slot of day.slots) {
        if (!slotMap.has(slot.slotNumber)) {
          slotMap.set(slot.slotNumber, {
            type: slot.type,
            label: slot.label,
            startTime: slot.startTime,
            endTime: slot.endTime,
          });
        }
      }
    }
    return Array.from(slotMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([num, info]) => ({ slotNumber: num, ...info }));
  }, [config.daySchedules]);

  // Day schedules indexed by dayOfWeek
  const dayScheduleMap = useMemo(() => {
    const map: Record<number, DaySchedule> = {};
    for (const ds of config.daySchedules) {
      map[ds.dayOfWeek] = ds;
    }
    return map;
  }, [config.daySchedules]);

  const sortedWorkingDays = useMemo(() => [...config.workingDays].sort((a, b) => a - b), [config.workingDays]);

  const handleSubjectChange = (dayOfWeek: number, slotNumber: number, subjectId: string) => {
    if (!onEntryChange) return;
    const subject = subjects.find((s) => s._id === subjectId);
    if (!subject) return;
    const existing = entryMap[`${dayOfWeek}-${slotNumber}`];
    onEntryChange(dayOfWeek, slotNumber, subjectId, subject.name, existing?.staffId || '', existing?.staffName || '');
  };

  const handleStaffChange = (dayOfWeek: number, slotNumber: number, staffId: string) => {
    if (!onEntryChange) return;
    const staff = staffList.find((s) => s._id === staffId);
    if (!staff) return;
    const existing = entryMap[`${dayOfWeek}-${slotNumber}`];
    onEntryChange(dayOfWeek, slotNumber, existing?.subjectId || '', existing?.subjectName || '', staffId, staff.name);
  };

  return (
    <div className="overflow-x-auto border rounded-lg">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-muted/60">
            <th className="border p-1.5 sm:p-2 text-left font-medium w-[100px] sm:w-[140px] min-w-[100px] sm:min-w-[140px]">Period / Time</th>
            {sortedWorkingDays.map((day) => (
              <th key={day} className="border p-1.5 sm:p-2 text-center font-medium min-w-[110px] sm:min-w-[160px]">
                {DAY_SHORT[day]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {allSlots.map((slot) => {
            const isBreak = slot.type === 'break';
            return (
              <tr
                key={slot.slotNumber}
                className={cn(isBreak && 'bg-muted/30')}
              >
                <td className="border p-2">
                  <div className="font-medium text-xs">{slot.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {slot.startTime} – {slot.endTime}
                  </div>
                </td>
                {sortedWorkingDays.map((day) => {
                  const daySchedule = dayScheduleMap[day];
                  const daySlot = daySchedule?.slots.find((s) => s.slotNumber === slot.slotNumber);

                  // If this day doesn't have this slot, show empty
                  if (!daySlot) {
                    return <td key={day} className="border p-2 bg-muted/10" />;
                  }

                  // Break row — show break label across the cell
                  if (daySlot.type === 'break') {
                    return (
                      <td key={day} className="border p-2 text-center text-muted-foreground italic text-xs bg-muted/20">
                        {daySlot.label}
                      </td>
                    );
                  }

                  // Period cell
                  const entry = entryMap[`${day}-${slot.slotNumber}`];
                  const colorClass = entry ? subjectColorMap[entry.subjectId] || '' : '';

                  if (!editable) {
                    // Read-only
                    return (
                      <td key={day} className={cn('border p-1.5', entry && `${colorClass} border`)}>
                        {entry ? (
                          <div className="space-y-0.5">
                            <div className="font-medium text-xs truncate">{entry.subjectName}</div>
                            <div className="text-[11px] text-muted-foreground truncate">{entry.staffName}</div>
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground text-center">—</div>
                        )}
                      </td>
                    );
                  }

                  // Editable cell
                  return (
                    <td key={day} className={cn('border p-1', entry && `${colorClass}`)}>
                      <div className="space-y-1">
                        <Select
                          value={entry?.subjectId || ''}
                          onValueChange={(val) => handleSubjectChange(day, slot.slotNumber, val)}
                        >
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue placeholder="Subject" />
                          </SelectTrigger>
                          <SelectContent>
                            {subjects.map((s) => (
                              <SelectItem key={s._id} value={s._id}>
                                {s.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select
                          value={entry?.staffId || ''}
                          onValueChange={(val) => handleStaffChange(day, slot.slotNumber, val)}
                        >
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue placeholder="Teacher" />
                          </SelectTrigger>
                          <SelectContent>
                            {staffList.map((s) => (
                              <SelectItem key={s._id} value={s._id}>
                                {s.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {entry && onEntryRemove && (
                          <button
                            type="button"
                            className="text-[10px] text-destructive hover:underline"
                            onClick={() => onEntryRemove(day, slot.slotNumber)}
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
