import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, ArrowUpCircle, ArrowRight, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { academicYearApi, AcademicYear } from '@/services/academicYearService';
import { classesApi, Class } from '@/services/classes';
import { divisionsApi, Division } from '@/services/divisions';
import { promotionApi } from '@/services/promotionService';
import api from '@/lib/api';

interface StudentItem {
  _id: string;
  name: string;
  admissionNo: string;
  class: string;
  section: string;
  selected: boolean;
  status: 'promoted' | 'detained' | 'tc_issued';
}

/**
 * Assigns a numeric order to a class name for proper sequencing.
 * Handles patterns like: PLAY GROUP, NURSERY, LOWER/LKG, HIGHER/UKG, STD 1..10, PLUS ONE/PLUS TWO, etc.
 */
const getClassOrder = (name: string): number => {
  const n = name.trim().toUpperCase();
  // Pre-primary
  if (n.includes('PLAY') || n.includes('PG')) return 1;
  if (n.includes('NURSERY') || n.includes('NUR')) return 2;
  if (n === 'LOWER' || n === 'LKG' || n.includes('LOWER KG') || n.includes('LK')) return 3;
  if (n === 'HIGHER' || n === 'UKG' || n.includes('UPPER KG') || n.includes('UK')) return 4;
  // STD / Class 1-12
  const stdMatch = n.match(/(?:STD|CLASS|GRADE)\s*(\d+)/i);
  if (stdMatch) return 10 + parseInt(stdMatch[1], 10); // STD 1=11, STD 2=12, ... STD 10=20
  // Pure number
  const numMatch = n.match(/^(\d+)$/);
  if (numMatch) return 10 + parseInt(numMatch[1], 10);
  // Plus one / Plus two
  if (n.includes('PLUS ONE') || n.includes('PLUS 1') || n === '+1') return 21;
  if (n.includes('PLUS TWO') || n.includes('PLUS 2') || n === '+2') return 22;
  // Fallback: alphabetical large number
  return 100;
};

const StudentPromotion = () => {
  const { toast } = useToast();

  // Master data
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [fromDivisions, setFromDivisions] = useState<Division[]>([]);
  const [toDivisions, setToDivisions] = useState<Division[]>([]);

  // Selections
  const [fromYear, setFromYear] = useState('');
  const [toYear, setToYear] = useState('');
  const [fromClassId, setFromClassId] = useState('');
  const [fromDivisionId, setFromDivisionId] = useState('__all__');
  const [toClassId, setToClassId] = useState('');
  const [toDivisionId, setToDivisionId] = useState('__none__');

  // Students
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Load academic years and classes on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await academicYearApi.getAll({ limit: 50, sortBy: 'name', sortOrder: 'desc' });
        setAcademicYears(res.data || []);
      } catch { /* ignore */ }
      try {
        const res = await classesApi.getClasses({ limit: 100, status: 'active' });
        setClasses(res.data || []);
      } catch { /* ignore */ }
    })();
  }, []);

  // Load FROM divisions when from class changes
  useEffect(() => {
    if (!fromClassId) { setFromDivisions([]); return; }
    (async () => {
      try {
        const res = await divisionsApi.getDivisionsByClass(fromClassId);
        setFromDivisions(res.data || []);
      } catch { setFromDivisions([]); }
    })();
    setFromDivisionId('__all__');
    setLoaded(false);
    setStudents([]);
  }, [fromClassId]);

  // Load TO divisions when to class changes
  useEffect(() => {
    if (!toClassId) { setToDivisions([]); return; }
    (async () => {
      try {
        const res = await divisionsApi.getDivisionsByClass(toClassId);
        setToDivisions(res.data || []);
      } catch { setToDivisions([]); }
    })();
    setToDivisionId('__none__');
  }, [toClassId]);

  // Auto-suggest next class when from class changes
  useEffect(() => {
    if (!fromClassId) { setToClassId(''); return; }
    const sorted = [...classes].sort((a, b) => getClassOrder(a.name) - getClassOrder(b.name));
    const fromOrder = getClassOrder(classes.find(c => c._id === fromClassId)?.name || '');
    const next = sorted.find(c => getClassOrder(c.name) > fromOrder);
    setToClassId(next ? next._id : '');
  }, [fromClassId, classes]);

  // Classes eligible for "To" — only those with higher order than "From"
  const fromOrder = fromClassId ? getClassOrder(classes.find(c => c._id === fromClassId)?.name || '') : -1;
  const toClassOptions = classes
    .filter(c => getClassOrder(c.name) > fromOrder)
    .sort((a, b) => getClassOrder(a.name) - getClassOrder(b.name));

  // Fetch students from selected class/division
  const handleFetchStudents = async () => {
    if (!fromClassId) {
      toast({ title: 'Required', description: 'Select the from class', variant: 'destructive' });
      return;
    }
    setLoading(true);
    setLoaded(false);
    try {
      const params: Record<string, string> = {};
      if (fromDivisionId && fromDivisionId !== '__all__') {
        const div = fromDivisions.find(d => d._id === fromDivisionId);
        if (div) params.section = div.name;
      }
      const className = classes.find(c => c._id === fromClassId)?.name;
      const res = await api.get('/students', {
        params: { ...params, class: className, classId: fromClassId, status: 'active', limit: '500', sortBy: 'name', sortOrder: 'asc' }
      });
      const data = res.data?.data || [];
      setStudents(data.map((s: any) => ({
        _id: s._id,
        name: s.name,
        admissionNo: s.admissionNo,
        class: s.class || className || '',
        section: s.section || '',
        selected: true,
        status: 'promoted' as const
      })));
      setLoaded(true);
    } catch (err: any) {
      // Show friendly message — don't scare the user with "Failed"
      const msg = err?.response?.data?.message || 'Could not load students. Please try again.';
      toast({ title: 'Info', description: msg });
      setStudents([]);
      setLoaded(true);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (idx: number) => {
    setStudents(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], selected: !updated[idx].selected };
      return updated;
    });
  };

  const toggleSelectAll = (checked: boolean) => {
    setStudents(prev => prev.map(s => ({ ...s, selected: checked })));
  };

  const setStudentStatus = (idx: number, status: StudentItem['status']) => {
    setStudents(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], status };
      return updated;
    });
  };

  const handlePromote = async () => {
    if (!fromYear || !toYear) {
      toast({ title: 'Required', description: 'Select both academic years', variant: 'destructive' });
      return;
    }
    if (!toClassId) {
      toast({ title: 'Required', description: 'Select the target class', variant: 'destructive' });
      return;
    }

    const selected = students.filter(s => s.selected);
    if (selected.length === 0) {
      toast({ title: 'No students', description: 'Select at least one student', variant: 'destructive' });
      return;
    }

    const promoted = selected.filter(s => s.status === 'promoted').length;
    const detained = selected.filter(s => s.status === 'detained').length;
    const tc = selected.filter(s => s.status === 'tc_issued').length;
    const fromCls = classes.find(c => c._id === fromClassId);
    const toCls = classes.find(c => c._id === toClassId);
    const toDiv = toDivisions.find(d => d._id === toDivisionId);

    const msg = `Promote ${promoted} students from ${fromCls?.name || ''} → ${toCls?.name || ''}${toDiv ? ' - ' + toDiv.name : ''}${detained ? '\nDetained: ' + detained : ''}${tc ? '\nTC Issued: ' + tc : ''}\n\nContinue?`;
    if (!confirm(msg)) return;

    setPromoting(true);
    try {
      const effectiveToDivId = toDivisionId !== '__none__' ? toDivisionId : undefined;
      const payload = {
        fromAcademicYear: fromYear,
        toAcademicYear: toYear,
        promotions: selected.map(s => ({
          studentId: s._id,
          toClassId: s.status === 'promoted' ? toClassId : fromClassId,
          toDivisionId: s.status === 'promoted' ? effectiveToDivId : undefined,
          status: s.status
        }))
      };
      const res = await promotionApi.promote(payload);
      toast({ title: 'Success', description: res.message });
      handleFetchStudents();
    } catch (err: any) {
      toast({ title: 'Error', description: err.response?.data?.message || 'Promotion failed', variant: 'destructive' });
    } finally {
      setPromoting(false);
    }
  };

  const selectedCount = students.filter(s => s.selected).length;
  const promotedCount = students.filter(s => s.selected && s.status === 'promoted').length;
  const detainedCount = students.filter(s => s.selected && s.status === 'detained').length;
  const tcCount = students.filter(s => s.selected && s.status === 'tc_issued').length;
  const allSelected = students.length > 0 && students.every(s => s.selected);
  const fromCls = classes.find(c => c._id === fromClassId);
  const toCls = classes.find(c => c._id === toClassId);
  const toDiv = toDivisions.find(d => d._id === toDivisionId);

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">STUDENT PROMOTION</h1>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6 space-y-5">
            {/* Academic Year Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-xs font-semibold">From Academic Year</Label>
                <Select value={fromYear} onValueChange={setFromYear}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {academicYears.map(y => <SelectItem key={y._id} value={y.name}>{y.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold">To Academic Year</Label>
                <Select value={toYear} onValueChange={setToYear}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {academicYears.map(y => <SelectItem key={y._id} value={y.name}>{y.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* From → To Class/Division Row */}
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-[220px]">
                <Label className="text-xs font-semibold">From Class / Division</Label>
                <div className="flex gap-2">
                  <Select value={fromClassId} onValueChange={setFromClassId}>
                    <SelectTrigger className="flex-1"><SelectValue placeholder="Class" /></SelectTrigger>
                    <SelectContent>
                      {[...classes].sort((a, b) => getClassOrder(a.name) - getClassOrder(b.name)).map(c => <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {fromDivisions.length > 0 && (
                    <Select value={fromDivisionId} onValueChange={setFromDivisionId}>
                      <SelectTrigger className="w-[90px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">All</SelectItem>
                        {fromDivisions.map(d => <SelectItem key={d._id} value={d._id}>{d.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>

              <ArrowRight className="w-5 h-5 text-muted-foreground mb-2 flex-shrink-0" />

              <div className="flex-1 min-w-[220px]">
                <Label className="text-xs font-semibold">To Class / Division</Label>
                <div className="flex gap-2">
                  <Select value={toClassId} onValueChange={setToClassId}>
                    <SelectTrigger className="flex-1"><SelectValue placeholder="Class" /></SelectTrigger>
                    <SelectContent>
                      {toClassOptions.map(c => <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {toDivisions.length > 0 && (
                    <Select value={toDivisionId} onValueChange={setToDivisionId}>
                      <SelectTrigger className="w-[90px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">--</SelectItem>
                        {toDivisions.map(d => <SelectItem key={d._id} value={d._id}>{d.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>

              <Button onClick={handleFetchStudents} disabled={loading || !fromClassId}>
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Users className="w-4 h-4 mr-2" />}
                Load Students
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Student List */}
        {loaded && (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="outline" className="text-sm">
                {fromCls?.name}{fromDivisionId !== '__all__' ? ' - ' + (fromDivisions.find(d => d._id === fromDivisionId)?.name || '') : ''}
                {' → '}
                {toCls?.name || '?'}{toDiv ? ' - ' + toDiv.name : ''}
              </Badge>
              <Badge variant="outline">{students.length} students</Badge>
              <Badge className="bg-blue-100 text-blue-800">Selected: {selectedCount}</Badge>
              {promotedCount > 0 && <Badge className="bg-green-100 text-green-800">Promote: {promotedCount}</Badge>}
              {detainedCount > 0 && <Badge className="bg-red-100 text-red-800">Detained: {detainedCount}</Badge>}
              {tcCount > 0 && <Badge className="bg-yellow-100 text-yellow-800">TC: {tcCount}</Badge>}
              <div className="flex-1" />
              <Button onClick={handlePromote} disabled={promoting || !toYear || !toClassId || selectedCount === 0}>
                {promoting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ArrowUpCircle className="w-4 h-4 mr-2" />}
                Execute Promotion ({promotedCount})
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                {students.length === 0 ? (
                  <p className="text-center py-10 text-muted-foreground">No active students found in this class/division.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-10">
                            <Checkbox checked={allSelected} onCheckedChange={toggleSelectAll} />
                          </TableHead>
                          <TableHead className="w-10">#</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Admission No</TableHead>
                          <TableHead>Current Class</TableHead>
                          <TableHead>Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {students.map((s, idx) => (
                          <TableRow
                            key={s._id}
                            className={
                              !s.selected ? 'opacity-50' :
                              s.status === 'detained' ? 'bg-red-50' :
                              s.status === 'tc_issued' ? 'bg-yellow-50' : ''
                            }
                          >
                            <TableCell>
                              <Checkbox checked={s.selected} onCheckedChange={() => toggleSelect(idx)} />
                            </TableCell>
                            <TableCell>{idx + 1}</TableCell>
                            <TableCell className="font-medium">{s.name}</TableCell>
                            <TableCell>{s.admissionNo}</TableCell>
                            <TableCell>{s.class}{s.section ? ' - ' + s.section : ''}</TableCell>
                            <TableCell>
                              <Select value={s.status} onValueChange={v => setStudentStatus(idx, v as StudentItem['status'])}>
                                <SelectTrigger className="w-[130px] h-8"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="promoted">Promote</SelectItem>
                                  <SelectItem value="detained">Detained</SelectItem>
                                  <SelectItem value="tc_issued">TC Issued</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                          </TableRow>
                        ))}
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

export default StudentPromotion;
