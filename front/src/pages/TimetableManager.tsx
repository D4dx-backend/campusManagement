import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus,
  Copy,
  CheckCircle,
  AlertTriangle,
  Save,
  Trash2,
  Grid3X3,
  User,
  Wand2,
  Sparkles,
  Minus,
  Info,
} from 'lucide-react';
import { TimetableGrid } from '@/components/timetable/TimetableGrid';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  useTimetables,
  useTimetableByClass,
  useCreateTimetable,
  useUpdateTimetable,
  useActivateTimetable,
  useCloneTimetable,
  useDeleteTimetable,
  useCheckConflicts,
  useTimetableConfigs,
  useStaffTimetable,
  useAutoGenerate,
} from '@/hooks/useTimetable';
import { classesApi } from '@/services/classes';
import { divisionsApi } from '@/services/divisions';
import { academicYearApi, AcademicYear } from '@/services/academicYearService';
import { subjectApi, Subject } from '@/services/subjectService';
import { staffService } from '@/services/staffService';
import { useToast } from '@/hooks/use-toast';
import type { TimetableEntry, TimetableConfig, Timetable, TeacherConflict, SubjectTeacherMapping, AutoGenerateResult } from '@/types/timetable';
import { DAY_NAMES, DAY_SHORT } from '@/types/timetable';

export default function TimetableManager() {
  const { toast } = useToast();

  // Selection state
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedDivisionId, setSelectedDivisionId] = useState('');
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState('');

  // Data lists
  const [classes, setClasses] = useState<any[]>([]);
  const [divisions, setDivisions] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);

  // Top-level view mode
  const [viewMode, setViewMode] = useState<'class' | 'teacher'>('class');
  const [selectedStaffId, setSelectedStaffId] = useState('');

  // UI state
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedConfigId, setSelectedConfigId] = useState('');
  const [editEntries, setEditEntries] = useState<TimetableEntry[]>([]);
  const [cloneDialogOpen, setCloneDialogOpen] = useState(false);
  const [cloneSourceId, setCloneSourceId] = useState('');
  const [cloneTargetClassId, setCloneTargetClassId] = useState('');
  const [cloneTargetDivisionId, setCloneTargetDivisionId] = useState('');
  const [cloneDivisions, setCloneDivisions] = useState<any[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<TeacherConflict[]>([]);

  // Auto-generate state
  const [autoGenDialogOpen, setAutoGenDialogOpen] = useState(false);
  const [autoGenConfigId, setAutoGenConfigId] = useState('');
  const [autoGenMappings, setAutoGenMappings] = useState<SubjectTeacherMapping[]>([]);
  const [autoGenUseAI, setAutoGenUseAI] = useState(false);
  const [autoGenResult, setAutoGenResult] = useState<AutoGenerateResult | null>(null);

  // Queries
  const { data: configsResponse } = useTimetableConfigs({
    academicYearId: selectedAcademicYearId,
    status: 'active',
    limit: 100,
  });
  const configs = (configsResponse?.data || []) as TimetableConfig[];

  const { data: timetableByClassRes, isLoading: loadingByClass } = useTimetableByClass(
    selectedClassId,
    selectedDivisionId
  );
  const activeTimetable = timetableByClassRes?.data as Timetable | undefined;

  const { data: allTimetablesRes } = useTimetables({
    classId: selectedClassId,
    divisionId: selectedDivisionId,
    academicYearId: selectedAcademicYearId,
    limit: 50,
  });
  const allTimetables = (allTimetablesRes?.data || []) as Timetable[];

  // Mutations
  const createMutation = useCreateTimetable();
  const updateMutation = useUpdateTimetable();
  const activateMutation = useActivateTimetable();
  const cloneMutation = useCloneTimetable();
  const deleteMutation = useDeleteTimetable();
  const checkConflictsMutation = useCheckConflicts();
  const autoGenerateMutation = useAutoGenerate();

  // Load reference data
  useEffect(() => {
    academicYearApi.getAll({ limit: 50, status: 'active' }).then((res) => {
      if (res.success) {
        setAcademicYears(res.data);
        const current = res.data.find((ay) => ay.isCurrent);
        if (current) setSelectedAcademicYearId(current._id);
      }
    }).catch((err) => {
      console.error('Something went wrong while loading. Please try again academic years:', err);
      toast({ title: 'Something went wrong while loading academic years', description: err?.response?.data?.message || err.message, variant: 'destructive' });
    });
    staffService.getStaff({ limit: 500, status: 'active' }).then((res) => {
      if (res.data) setStaffList(res.data);
    }).catch((err) => {
      console.error('Something went wrong while loading. Please try again teachers:', err);
      toast({ title: 'Something went wrong while loading teachers', description: err?.response?.data?.message || err.message, variant: 'destructive' });
    });
  }, []);

  useEffect(() => {
    classesApi.getClasses({ limit: 100, status: 'active' }).then((res) => {
      if (res.success) setClasses(res.data);
    }).catch((err) => {
      console.error('Something went wrong while loading. Please try again classes:', err);
      toast({ title: 'Something went wrong while loading classes. Please try again.', description: err?.response?.data?.message || err.message, variant: 'destructive' });
    });
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      divisionsApi.getDivisionsByClass(selectedClassId).then((res) => {
        if (res.success) setDivisions(res.data);
      }).catch((err) => {
        console.error('Something went wrong while loading. Please try again divisions:', err);
      });
      subjectApi.getAll({ classId: selectedClassId, status: 'active', limit: 100 }).then((res) => {
        if (res.success) setSubjects(res.data);
      }).catch((err) => {
        console.error('Something went wrong while loading. Please try again subjects:', err);
      });
    } else {
      setDivisions([]);
      setSubjects([]);
    }
    setSelectedDivisionId('');
  }, [selectedClassId]);

  // Clone Division loader
  useEffect(() => {
    if (cloneTargetClassId) {
      divisionsApi.getDivisionsByClass(cloneTargetClassId).then((res) => {
        if (res.success) setCloneDivisions(res.data);
      });
    } else {
      setCloneDivisions([]);
    }
    setCloneTargetDivisionId('');
  }, [cloneTargetClassId]);

  const selectedConfig = useMemo(
    () => configs.find((c) => c._id === selectedConfigId),
    [configs, selectedConfigId]
  );

  // Get the config for the active timetable (could be populated)
  const activeConfig = useMemo(() => {
    if (!activeTimetable) return null;
    if (typeof activeTimetable.configId === 'object') return activeTimetable.configId as TimetableConfig;
    return configs.find((c) => c._id === activeTimetable.configId) || null;
  }, [activeTimetable, configs]);

  const handleEntryChange = useCallback(
    (dayOfWeek: number, slotNumber: number, subjectId: string, subjectName: string, staffId: string, staffName: string) => {
      setEditEntries((prev) => {
        const filtered = prev.filter((e) => !(e.dayOfWeek === dayOfWeek && e.slotNumber === slotNumber));
        if (subjectId && staffId) {
          return [...filtered, { dayOfWeek, slotNumber, subjectId, subjectName, staffId, staffName }];
        }
        // Keep partial assignments (just subject or just staff)
        if (subjectId || staffId) {
          return [...filtered, { dayOfWeek, slotNumber, subjectId, subjectName, staffId, staffName }];
        }
        return filtered;
      });
    },
    []
  );

  const handleEntryRemove = useCallback((dayOfWeek: number, slotNumber: number) => {
    setEditEntries((prev) => prev.filter((e) => !(e.dayOfWeek === dayOfWeek && e.slotNumber === slotNumber)));
  }, []);

  const startCreate = () => {
    setIsCreating(true);
    setIsEditing(false);
    setEditEntries([]);
    setSelectedConfigId('');
    setConflicts([]);
  };

  const startEdit = (timetable: Timetable) => {
    setIsEditing(true);
    setIsCreating(false);
    const cfgId = typeof timetable.configId === 'object' ? (timetable.configId as TimetableConfig)._id : timetable.configId;
    setSelectedConfigId(cfgId);
    setEditEntries([...timetable.entries]);
    setConflicts([]);
  };

  const cancelEdit = () => {
    setIsCreating(false);
    setIsEditing(false);
    setEditEntries([]);
    setConflicts([]);
  };

  const handleSave = async () => {
    if (isCreating && selectedConfigId) {
      await createMutation.mutateAsync({
        classId: selectedClassId,
        divisionId: selectedDivisionId,
        academicYearId: selectedAcademicYearId,
        configId: selectedConfigId,
        entries: editEntries,
        status: 'draft',
      });
    } else if (isEditing && activeTimetable) {
      await updateMutation.mutateAsync({
        id: activeTimetable._id,
        data: { entries: editEntries },
      });
    }
    cancelEdit();
  };

  const handleActivate = async (timetableId: string) => {
    await activateMutation.mutateAsync(timetableId);
  };

  const handleCheckConflicts = async () => {
    if (!selectedConfigId || editEntries.length === 0) return;
    const res = await checkConflictsMutation.mutateAsync({
      configId: selectedConfigId,
      academicYearId: selectedAcademicYearId,
      entries: editEntries,
      excludeTimetableId: activeTimetable?._id,
    });
    if (res.data) {
      setConflicts(res.data.conflicts || []);
    }
  };

  const handleClone = async () => {
    if (!cloneSourceId || !cloneTargetClassId || !cloneTargetDivisionId) return;
    await cloneMutation.mutateAsync({
      id: cloneSourceId,
      data: { targetClassId: cloneTargetClassId, targetDivisionId: cloneTargetDivisionId },
    });
    setCloneDialogOpen(false);
    setCloneSourceId('');
    setCloneTargetClassId('');
    setCloneTargetDivisionId('');
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteMutation.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  // ── Auto-generate handlers ──
  const openAutoGenDialog = () => {
    // Pre-populate mappings from subjects assigned to this class
    const classSubjects = subjects.filter((s) => s.classIds?.includes(selectedClassId) || true);
    const initialMappings: SubjectTeacherMapping[] = classSubjects.map((s) => ({
      subjectId: s._id,
      subjectName: s.name,
      staffId: '',
      staffName: '',
      periodsPerWeek: 5,
    }));
    setAutoGenMappings(initialMappings);
    setAutoGenConfigId(configs.length > 0 ? configs[0]._id : '');
    setAutoGenResult(null);
    setAutoGenUseAI(false);
    setAutoGenDialogOpen(true);
  };

  const updateMapping = (index: number, field: keyof SubjectTeacherMapping, value: string | number) => {
    setAutoGenMappings((prev) => {
      const updated = [...prev];
      if (field === 'staffId') {
        const staff = staffList.find((s: any) => (s._id || s.id) === value);
        updated[index] = { ...updated[index], staffId: value as string, staffName: staff?.name || '' };
      } else if (field === 'periodsPerWeek') {
        updated[index] = { ...updated[index], periodsPerWeek: value as number };
      } else {
        updated[index] = { ...updated[index], [field]: value };
      }
      return updated;
    });
  };

  const removeMapping = (index: number) => {
    setAutoGenMappings((prev) => prev.filter((_, i) => i !== index));
  };

  const addMapping = () => {
    setAutoGenMappings((prev) => [
      ...prev,
      { subjectId: '', subjectName: '', staffId: '', staffName: '', periodsPerWeek: 5 },
    ]);
  };

  const handleAutoGenerate = async () => {
    const validMappings = autoGenMappings.filter((m) => m.subjectId && m.staffId && m.periodsPerWeek > 0);
    if (validMappings.length === 0 || !autoGenConfigId) return;

    const res = await autoGenerateMutation.mutateAsync({
      classId: selectedClassId,
      divisionId: selectedDivisionId,
      academicYearId: selectedAcademicYearId,
      configId: autoGenConfigId,
      subjectTeacherMappings: validMappings,
      useAI: autoGenUseAI,
    });

    if (res.data) {
      setAutoGenResult(res.data as AutoGenerateResult);
    }
  };

  const editMode = isCreating || isEditing;
  const currentConfig = isCreating ? selectedConfig : activeConfig;

  // Teacher view query
  const { data: staffScheduleRes, isLoading: loadingStaffSchedule } = useStaffTimetable(selectedStaffId);
  const staffTimetables = (staffScheduleRes?.data || []) as Timetable[];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Timetable Management</h1>
          <p className="text-muted-foreground">Assign subjects and teachers to class timetables</p>
        </div>

        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
          <TabsList>
            <TabsTrigger value="class">
              <Grid3X3 className="h-4 w-4 mr-1.5" />
              Class View
            </TabsTrigger>
            <TabsTrigger value="teacher">
              <User className="h-4 w-4 mr-1.5" />
              Teacher View
            </TabsTrigger>
          </TabsList>

        {/* ════════ CLASS VIEW ════════ */}
        <TabsContent value="class" className="mt-4 space-y-6">

        {/* Selection Controls */}
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <Label className="text-xs mb-1 block">Academic Year</Label>
            <Select value={selectedAcademicYearId} onValueChange={setSelectedAcademicYearId}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Select year" />
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
          <div>
            <Label className="text-xs mb-1 block">Class</Label>
            <Select value={selectedClassId} onValueChange={setSelectedClassId}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Select class" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((c) => (
                  <SelectItem key={c._id || c.id} value={c._id || c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs mb-1 block">Division</Label>
            <Select value={selectedDivisionId} onValueChange={setSelectedDivisionId} disabled={!selectedClassId}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Select division" />
              </SelectTrigger>
              <SelectContent>
                {divisions.map((d) => (
                  <SelectItem key={d._id} value={d._id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Main Content */}
        {!selectedClassId || !selectedDivisionId ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Grid3X3 className="mx-auto h-12 w-12 mb-4 opacity-30" />
              <p>Select a class and division to view or manage the timetable.</p>
            </CardContent>
          </Card>
        ) : loadingByClass ? (
          <div className="text-center py-8 text-muted-foreground">Loading timetable...</div>
        ) : editMode ? (
          /* ── Edit / Create Mode ── */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {isCreating ? 'Create New Timetable' : 'Edit Timetable'}
              </h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCheckConflicts} disabled={editEntries.length === 0}>
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  Check Conflicts
                </Button>
                <Button variant="outline" size="sm" onClick={cancelEdit}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  <Save className="h-4 w-4 mr-1" />
                  {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>

            {/* Config selector (for create only) */}
            {isCreating && (
              <div>
                <Label className="text-xs mb-1 block">Schedule Config</Label>
                <Select value={selectedConfigId} onValueChange={setSelectedConfigId}>
                  <SelectTrigger className="w-[300px]">
                    <SelectValue placeholder="Select a timetable config" />
                  </SelectTrigger>
                  <SelectContent>
                    {configs.map((c) => (
                      <SelectItem key={c._id} value={c._id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Conflicts */}
            {conflicts.length > 0 && (
              <Card className="border-destructive">
                <CardContent className="p-4">
                  <h3 className="text-sm font-semibold text-destructive mb-2">
                    <AlertTriangle className="h-4 w-4 inline mr-1" />
                    {conflicts.length} Teacher Conflict(s)
                  </h3>
                  <ul className="text-xs space-y-1">
                    {conflicts.map((c, i) => (
                      <li key={i} className="text-muted-foreground">
                        <strong>{c.staffName}</strong> — {c.time} — already assigned to {c.conflictWith.className}{' '}
                        {c.conflictWith.divisionName}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Grid */}
            {currentConfig ? (
              <TimetableGrid
                config={currentConfig}
                entries={editEntries}
                editable
                subjects={subjects.map((s) => ({ _id: s._id, name: s.name, code: s.code }))}
                staffList={staffList.map((s: any) => ({ _id: s._id || s.id, name: s.name, employeeId: s.employeeId }))}
                onEntryChange={handleEntryChange}
                onEntryRemove={handleEntryRemove}
              />
            ) : (
              <p className="text-muted-foreground text-sm">Select a schedule config to begin.</p>
            )}
          </div>
        ) : activeTimetable && activeConfig ? (
          /* ── View Active Timetable ── */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold">Active Timetable</h2>
                <Badge>Active</Badge>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCloneSourceId(activeTimetable._id);
                    setCloneDialogOpen(true);
                  }}
                >
                  <Copy className="h-4 w-4 mr-1" />
                  Clone
                </Button>
                <Button variant="outline" size="sm" onClick={() => startEdit(activeTimetable)}>
                  Edit
                </Button>
                <Button variant="outline" size="sm" onClick={openAutoGenDialog}>
                  <Wand2 className="h-4 w-4 mr-1" />
                  Auto Generate
                </Button>
              </div>
            </div>
            <TimetableGrid config={activeConfig} entries={activeTimetable.entries} />
          </div>
        ) : (
          /* ── No Timetable ── */
          <Card>
            <CardContent className="py-12 text-center space-y-4">
              <p className="text-muted-foreground">No active timetable for this class/division.</p>
              <div className="flex justify-center gap-3">
                <Button onClick={startCreate}>
                  <Plus className="h-4 w-4 mr-1" />
                  Create Manually
                </Button>
                <Button variant="outline" onClick={openAutoGenDialog}>
                  <Wand2 className="h-4 w-4 mr-1" />
                  Auto Generate
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* All drafts/archived listing */}
        {selectedClassId && selectedDivisionId && !editMode && allTimetables.length > 0 && (
          <>
            <Separator />
            <div>
              <h3 className="text-sm font-semibold mb-3">All Timetables for this Class/Division</h3>
              <div className="space-y-2">
                {allTimetables.map((tt) => {
                  const cfgName =
                    typeof tt.configId === 'object' ? (tt.configId as TimetableConfig).name : '';
                  return (
                    <div key={tt._id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge
                          variant={
                            tt.status === 'active' ? 'default' : tt.status === 'draft' ? 'outline' : 'secondary'
                          }
                        >
                          {tt.status}
                        </Badge>
                        <span className="text-sm">{cfgName || 'Config'}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(tt.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        {tt.status === 'draft' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleActivate(tt._id)}
                              disabled={activateMutation.isPending}
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Activate
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => startEdit(tt)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive"
                              onClick={() => setDeleteId(tt._id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                        {tt.status === 'active' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setCloneSourceId(tt._id);
                              setCloneDialogOpen(true);
                            }}
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            Clone
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        </TabsContent>

        {/* ════════ TEACHER VIEW ════════ */}
        <TabsContent value="teacher" className="mt-4 space-y-6">
          <div className="flex items-end gap-4">
            <div>
              <Label className="text-xs mb-1 block">Select Teacher</Label>
              <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
                <SelectTrigger className="w-[260px]">
                  <SelectValue placeholder="Choose a teacher" />
                </SelectTrigger>
                <SelectContent>
                  {staffList.map((s: any) => (
                    <SelectItem key={s._id || s.id} value={s._id || s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {!selectedStaffId ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <User className="mx-auto h-12 w-12 mb-4 opacity-30" />
                <p>Select a teacher to view their schedule across all classes.</p>
              </CardContent>
            </Card>
          ) : loadingStaffSchedule ? (
            <div className="text-center py-8 text-muted-foreground">Loading teacher schedule...</div>
          ) : staffTimetables.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <p>No active timetable entries found for this teacher.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {staffTimetables.map((tt) => {
                const cfg =
                  typeof tt.configId === 'object'
                    ? (tt.configId as TimetableConfig)
                    : null;
                const clsName =
                  typeof tt.classId === 'object' ? (tt.classId as any).name : '';
                const divName =
                  typeof tt.divisionId === 'object'
                    ? (tt.divisionId as any).name
                    : '';
                const teacherEntries = tt.entries.filter(
                  (e) => e.staffId === selectedStaffId
                );
                if (teacherEntries.length === 0) return null;
                return (
                  <Card key={tt._id}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        {clsName} {divName}
                        <Badge variant="outline" className="text-xs font-normal">
                          {teacherEntries.length} period{teacherEntries.length !== 1 ? 's' : ''}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {cfg ? (
                        <TimetableGrid config={cfg} entries={teacherEntries} />
                      ) : (
                        <p className="text-sm text-muted-foreground">Config not available.</p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
        </Tabs>
      </div>

      {/* Clone Dialog */}
      <Dialog open={cloneDialogOpen} onOpenChange={setCloneDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clone Timetable</DialogTitle>
            <DialogDescription>
              Copy this timetable to another class/division. It will be saved as a draft.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Target Class</Label>
              <Select value={cloneTargetClassId} onValueChange={setCloneTargetClassId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select target class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((c) => (
                    <SelectItem key={c._id || c.id} value={c._id || c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Target Division</Label>
              <Select
                value={cloneTargetDivisionId}
                onValueChange={setCloneTargetDivisionId}
                disabled={!cloneTargetClassId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select target division" />
                </SelectTrigger>
                <SelectContent>
                  {cloneDivisions.map((d: any) => (
                    <SelectItem key={d._id} value={d._id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCloneDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleClone}
                disabled={!cloneTargetClassId || !cloneTargetDivisionId || cloneMutation.isPending}
              >
                {cloneMutation.isPending ? 'Cloning...' : 'Clone'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Auto Generate Dialog */}
      <Dialog open={autoGenDialogOpen} onOpenChange={setAutoGenDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5" />
              Auto Generate Timetable
            </DialogTitle>
            <DialogDescription>
              Map subjects to teachers and set weekly periods. The system will distribute them optimally across the week.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Config selector */}
            <div>
              <Label className="text-xs mb-1 block">Schedule Config</Label>
              <Select value={autoGenConfigId} onValueChange={setAutoGenConfigId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select period schedule" />
                </SelectTrigger>
                <SelectContent>
                  {configs.map((c) => (
                    <SelectItem key={c._id} value={c._id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Subject-Teacher Mappings */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-xs">Subject — Teacher — Periods/Week</Label>
                <Button variant="ghost" size="sm" onClick={addMapping}>
                  <Plus className="h-3 w-3 mr-1" />
                  Add Row
                </Button>
              </div>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {autoGenMappings.map((m, i) => (
                  <div key={i} className="flex items-center gap-2">
                    {/* Subject */}
                    <Select
                      value={m.subjectId}
                      onValueChange={(v) => {
                        const sub = subjects.find((s) => s._id === v);
                        setAutoGenMappings((prev) => {
                          const updated = [...prev];
                          updated[i] = { ...updated[i], subjectId: v, subjectName: sub?.name || '' };
                          return updated;
                        });
                      }}
                    >
                      <SelectTrigger className="flex-1 min-w-[140px]">
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

                    {/* Teacher */}
                    <Select
                      value={m.staffId}
                      onValueChange={(v) => updateMapping(i, 'staffId', v)}
                    >
                      <SelectTrigger className="flex-1 min-w-[140px]">
                        <SelectValue placeholder="Teacher" />
                      </SelectTrigger>
                      <SelectContent>
                        {staffList.map((s: any) => (
                          <SelectItem key={s._id || s.id} value={s._id || s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Periods per week */}
                    <Input
                      type="number"
                      min={1}
                      max={30}
                      value={m.periodsPerWeek}
                      onChange={(e) => updateMapping(i, 'periodsPerWeek', parseInt(e.target.value) || 1)}
                      className="w-16 text-center"
                    />

                    <Button variant="ghost" size="sm" onClick={() => removeMapping(i)} className="text-muted-foreground hover:text-destructive h-8 w-8 p-0">
                      <Minus className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Toggle */}
            <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <div>
                  <p className="text-sm font-medium">Use AI (Gemini)</p>
                  <p className="text-xs text-muted-foreground">Smarter distribution with conflict awareness</p>
                </div>
              </div>
              <Switch checked={autoGenUseAI} onCheckedChange={setAutoGenUseAI} />
            </div>

            {/* Result */}
            {autoGenResult && (
              <Card className={autoGenResult.stats.unplaced.length > 0 ? 'border-amber-500' : 'border-green-500'}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    {autoGenResult.stats.unplaced.length > 0 ? (
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                    ) : (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                    {autoGenResult.stats.totalPlaced} periods placed
                    {autoGenResult.method === 'ai' && <Badge variant="outline" className="text-xs">AI</Badge>}
                  </div>
                  {autoGenResult.stats.unplaced.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      <p className="font-medium text-amber-600">Could not place:</p>
                      {autoGenResult.stats.unplaced.map((u, i) => (
                        <p key={i}>• {u.subjectName} ({u.staffName}) — {u.remaining} period(s)</p>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    Created as draft. Review in the grid and activate when ready.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setAutoGenDialogOpen(false)}>
                {autoGenResult ? 'Close' : 'Cancel'}
              </Button>
              {!autoGenResult && (
                <Button
                  onClick={handleAutoGenerate}
                  disabled={autoGenerateMutation.isPending || !autoGenConfigId || autoGenMappings.filter((m) => m.subjectId && m.staffId).length === 0}
                >
                  {autoGenerateMutation.isPending ? (
                    <>Generating...</>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4 mr-1" />
                      Generate
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Timetable?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this draft timetable. This action cannot be undone.
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
