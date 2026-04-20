import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Pencil, Trash2, Clock, Search } from 'lucide-react';
import { ConfigEditor } from '@/components/timetable/ConfigEditor';
import {
  useTimetableConfigs,
  useCreateTimetableConfig,
  useUpdateTimetableConfig,
  useDeleteTimetableConfig,
} from '@/hooks/useTimetable';
import { academicYearApi, AcademicYear } from '@/services/academicYearService';
import type { DaySchedule, CreateTimetableConfigData } from '@/types/timetable';
import { DAY_SHORT } from '@/types/timetable';

const emptyForm: CreateTimetableConfigData = {
  name: '',
  academicYearId: '',
  workingDays: [1, 2, 3, 4, 5], // Mon-Fri default
  daySchedules: [],
  status: 'active',
};

export default function TimetableConfigs() {
  const [search, setSearch] = useState('');
  const [filterAcademicYear, setFilterAcademicYear] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateTimetableConfigData>({ ...emptyForm });
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);

  const { data: configsResponse, isLoading } = useTimetableConfigs({
    search,
    academicYearId: filterAcademicYear,
    limit: 100,
  });
  const createMutation = useCreateTimetableConfig();
  const updateMutation = useUpdateTimetableConfig();
  const deleteMutation = useDeleteTimetableConfig();

  useEffect(() => {
    academicYearApi.getAll({ limit: 50, status: 'active' }).then((res) => {
      if (res.success) setAcademicYears(res.data);
    });
  }, []);

  const configs = configsResponse?.data || [];

  const openCreate = () => {
    setEditId(null);
    // Build default daySchedules for Mon-Fri
    const defaultSlots = [
      { slotNumber: 1, type: 'period' as const, label: 'Period 1', startTime: '08:30', endTime: '09:15' },
      { slotNumber: 2, type: 'period' as const, label: 'Period 2', startTime: '09:15', endTime: '10:00' },
      { slotNumber: 3, type: 'break' as const, label: 'Short Break', startTime: '10:00', endTime: '10:15' },
      { slotNumber: 4, type: 'period' as const, label: 'Period 3', startTime: '10:15', endTime: '11:00' },
      { slotNumber: 5, type: 'period' as const, label: 'Period 4', startTime: '11:00', endTime: '11:45' },
      { slotNumber: 6, type: 'break' as const, label: 'Lunch', startTime: '11:45', endTime: '12:30' },
      { slotNumber: 7, type: 'period' as const, label: 'Period 5', startTime: '12:30', endTime: '13:15' },
      { slotNumber: 8, type: 'period' as const, label: 'Period 6', startTime: '13:15', endTime: '14:00' },
    ];
    const days = [1, 2, 3, 4, 5];
    setFormData({
      ...emptyForm,
      workingDays: days,
      daySchedules: days.map((d) => ({ dayOfWeek: d, slots: defaultSlots.map((s) => ({ ...s })) })),
    });
    setIsDialogOpen(true);
  };

  const openEdit = (config: any) => {
    setEditId(config._id);
    setFormData({
      name: config.name,
      academicYearId: typeof config.academicYearId === 'object' ? config.academicYearId._id : config.academicYearId,
      workingDays: config.workingDays,
      daySchedules: config.daySchedules,
      status: config.status,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editId) {
      await updateMutation.mutateAsync({ id: editId, data: formData });
    } else {
      await createMutation.mutateAsync(formData);
    }
    setIsDialogOpen(false);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteMutation.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const totalPeriods = (daySchedules: DaySchedule[]) => {
    if (!daySchedules || daySchedules.length === 0) return 0;
    // Return max periods per any single day
    return Math.max(...daySchedules.map((ds) => ds.slots.filter((s) => s.type === 'period').length));
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Timetable Configs</h1>
            <p className="text-muted-foreground">Define period structures, working days, and time slots</p>
          </div>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            New Config
          </Button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search configs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterAcademicYear || '__all__'} onValueChange={(v) => setFilterAcademicYear(v === '__all__' ? '' : v)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Academic Years" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Academic Years</SelectItem>
              {academicYears.map((ay) => (
                <SelectItem key={ay._id} value={ay._id}>
                  {ay.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Config List */}
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : configs.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Clock className="mx-auto h-12 w-12 mb-4 opacity-30" />
            <p>No timetable configs yet. Create one to get started.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {(configs as any[]).map((config) => {
              const ayName = typeof config.academicYearId === 'object' ? config.academicYearId.name : '';
              return (
                <Card key={config._id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-medium">{config.name}</h3>
                        {ayName && <p className="text-xs text-muted-foreground">{ayName}</p>}
                      </div>
                      <Badge variant={config.status === 'active' ? 'default' : 'secondary'}>
                        {config.status}
                      </Badge>
                    </div>
                    <div className="space-y-1 text-xs text-muted-foreground mb-3">
                      <div>
                        <span className="font-medium">Days: </span>
                        {config.workingDays.map((d: number) => DAY_SHORT[d]).join(', ')}
                      </div>
                      <div>
                        <span className="font-medium">Max periods/day: </span>
                        {totalPeriods(config.daySchedules)}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(config)}>
                        <Pencil className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteId(config._id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? 'Edit Config' : 'New Timetable Config'}</DialogTitle>
            <DialogDescription>
              Define the period structure for your timetable. Each day can have different periods and timings.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label>Config Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Primary School Schedule"
                  required
                />
              </div>
              <div>
                <Label>Academic Year</Label>
                <Select
                  value={formData.academicYearId}
                  onValueChange={(val) => setFormData({ ...formData, academicYearId: val })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select academic year" />
                  </SelectTrigger>
                  <SelectContent>
                    {academicYears.map((ay) => (
                      <SelectItem key={ay._id} value={ay._id}>
                        {ay.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <ConfigEditor
              workingDays={formData.workingDays}
              daySchedules={formData.daySchedules}
              onWorkingDaysChange={(days) => setFormData({ ...formData, workingDays: days })}
              onDaySchedulesChange={(schedules) => setFormData({ ...formData, daySchedules: schedules })}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending ? 'Saving...' : editId ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Timetable Config?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone. If any timetables use this config, the deletion will be blocked.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
