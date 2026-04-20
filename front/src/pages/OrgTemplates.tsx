import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Plus, Pencil, Trash2, Loader2, BookOpen, GraduationCap,
  Search, School, CheckCircle, Calendar, Building2, Briefcase,
  Users, Receipt, Wallet, CreditCard,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  orgTemplateApi,
  OrgTemplateClass,
  OrgTemplateSubject,
  OrgTemplateAcademicYear,
  OrgTemplateMasterItem,
} from '@/services/orgTemplateService';

type TabType = 'classes' | 'subjects' | 'academicYears' | 'masterData';
type MasterDataType = 'departments' | 'designations' | 'staff-categories' | 'expense-categories' | 'income-categories' | 'fee-types';

const MASTER_DATA_CONFIG: Record<MasterDataType, { label: string; icon: React.ComponentType<any>; hasCode?: boolean; hasFeeFields?: boolean }> = {
  'departments': { label: 'Departments', icon: Building2, hasCode: true },
  'designations': { label: 'Designations', icon: Briefcase },
  'staff-categories': { label: 'Staff Categories', icon: Users },
  'expense-categories': { label: 'Expense Categories', icon: Wallet },
  'income-categories': { label: 'Income Categories', icon: Receipt },
  'fee-types': { label: 'Fee Types', icon: CreditCard, hasFeeFields: true },
};

const OrgTemplates = () => {
  const { toast } = useToast();
  const [tab, setTab] = useState<TabType>('classes');
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  // Classes
  const [classes, setClasses] = useState<OrgTemplateClass[]>([]);
  const [classDialog, setClassDialog] = useState(false);
  const [editingClass, setEditingClass] = useState<OrgTemplateClass | null>(null);
  const [className, setClassName] = useState('');
  const [classDescription, setClassDescription] = useState('');
  const [classAcademicYear, setClassAcademicYear] = useState(new Date().getFullYear().toString());

  // Subjects
  const [subjects, setSubjects] = useState<OrgTemplateSubject[]>([]);
  const [subjectDialog, setSubjectDialog] = useState(false);
  const [editingSubject, setEditingSubject] = useState<OrgTemplateSubject | null>(null);
  const [subjectName, setSubjectName] = useState('');
  const [subjectCode, setSubjectCode] = useState('');
  const [subjectClassIds, setSubjectClassIds] = useState<string[]>([]);
  const [subjectMaxMark, setSubjectMaxMark] = useState(100);
  const [subjectPassMark, setSubjectPassMark] = useState(33);
  const [subjectIsOptional, setSubjectIsOptional] = useState(false);

  // Academic Years
  const [academicYears, setAcademicYears] = useState<OrgTemplateAcademicYear[]>([]);
  const [ayDialog, setAyDialog] = useState(false);
  const [editingAY, setEditingAY] = useState<OrgTemplateAcademicYear | null>(null);
  const [ayName, setAyName] = useState('');
  const [ayStartDate, setAyStartDate] = useState('');
  const [ayEndDate, setAyEndDate] = useState('');

  // Master Data
  const [masterType, setMasterType] = useState<MasterDataType>('departments');
  const [masterItems, setMasterItems] = useState<OrgTemplateMasterItem[]>([]);
  const [masterDialog, setMasterDialog] = useState(false);
  const [editingMaster, setEditingMaster] = useState<OrgTemplateMasterItem | null>(null);
  const [mdName, setMdName] = useState('');
  const [mdDescription, setMdDescription] = useState('');
  const [mdCode, setMdCode] = useState('');
  const [mdIsCommon, setMdIsCommon] = useState(false);

  useEffect(() => {
    loadData();
  }, [tab, masterType]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (tab === 'classes') {
        const res = await orgTemplateApi.getClasses({ status: 'active' });
        setClasses((res as any).data || []);
      } else if (tab === 'subjects') {
        const [subjRes, clsRes] = await Promise.all([
          orgTemplateApi.getSubjects({ status: 'active' }),
          orgTemplateApi.getClasses({ status: 'active' })
        ]);
        setSubjects((subjRes as any).data || []);
        setClasses((clsRes as any).data || []);
      } else if (tab === 'academicYears') {
        const res = await orgTemplateApi.getAcademicYears();
        setAcademicYears((res as any).data || []);
      } else if (tab === 'masterData') {
        const res = await orgTemplateApi.getMasterData(masterType);
        setMasterItems((res as any).data || []);
      }
    } catch {
      toast({ title: 'Failed to load data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // ── CLASS HANDLERS
  const openCreateClass = () => { setEditingClass(null); setClassName(''); setClassDescription(''); setClassAcademicYear(new Date().getFullYear().toString()); setClassDialog(true); };
  const openEditClass = (c: OrgTemplateClass) => { setEditingClass(c); setClassName(c.name); setClassDescription(c.description || ''); setClassAcademicYear(c.academicYear); setClassDialog(true); };
  const saveClass = async () => {
    if (!className.trim()) return toast({ title: 'Name is required', variant: 'destructive' });
    if (!classAcademicYear.trim()) return toast({ title: 'Academic year is required', variant: 'destructive' });
    setSaving(true);
    try {
      const data = { name: className, description: classDescription, academicYear: classAcademicYear };
      if (editingClass) { await orgTemplateApi.updateClass(editingClass._id, data); toast({ title: 'Class updated' }); }
      else { await orgTemplateApi.createClass(data); toast({ title: 'Class created' }); }
      setClassDialog(false); loadData();
    } catch (err: any) { toast({ title: err?.response?.data?.message || 'Failed to save', variant: 'destructive' }); }
    finally { setSaving(false); }
  };
  const deleteClass = async (c: OrgTemplateClass) => {
    if (!confirm(`Delete class "${c.name}"?`)) return;
    try { await orgTemplateApi.deleteClass(c._id); toast({ title: 'Deleted' }); loadData(); }
    catch { toast({ title: 'Failed to delete', variant: 'destructive' }); }
  };

  // ── SUBJECT HANDLERS
  const openCreateSubject = () => { setEditingSubject(null); setSubjectName(''); setSubjectCode(''); setSubjectClassIds([]); setSubjectMaxMark(100); setSubjectPassMark(33); setSubjectIsOptional(false); setSubjectDialog(true); };
  const openEditSubject = (s: OrgTemplateSubject) => { setEditingSubject(s); setSubjectName(s.name); setSubjectCode(s.code); setSubjectClassIds((s.classIds || []).map(c => typeof c === 'string' ? c : c._id)); setSubjectMaxMark(s.maxMark); setSubjectPassMark(s.passMark); setSubjectIsOptional(s.isOptional); setSubjectDialog(true); };
  const saveSubject = async () => {
    if (!subjectName.trim() || !subjectCode.trim()) return toast({ title: 'Name and code required', variant: 'destructive' });
    setSaving(true);
    try {
      const data = { name: subjectName, code: subjectCode.toUpperCase(), classIds: subjectClassIds, maxMark: subjectMaxMark, passMark: subjectPassMark, isOptional: subjectIsOptional };
      if (editingSubject) { await orgTemplateApi.updateSubject(editingSubject._id, data); toast({ title: 'Subject updated' }); }
      else { await orgTemplateApi.createSubject(data); toast({ title: 'Subject created' }); }
      setSubjectDialog(false); loadData();
    } catch (err: any) { toast({ title: err?.response?.data?.message || 'Failed to save', variant: 'destructive' }); }
    finally { setSaving(false); }
  };
  const deleteSubject = async (s: OrgTemplateSubject) => {
    if (!confirm(`Delete subject "${s.name}" (${s.code})?`)) return;
    try { await orgTemplateApi.deleteSubject(s._id); toast({ title: 'Deleted' }); loadData(); }
    catch { toast({ title: 'Failed to delete', variant: 'destructive' }); }
  };
  const toggleClassForSubject = (classId: string) => {
    setSubjectClassIds(prev => prev.includes(classId) ? prev.filter(id => id !== classId) : [...prev, classId]);
  };

  // ── ACADEMIC YEAR HANDLERS
  const openCreateAY = () => { setEditingAY(null); setAyName(''); setAyStartDate(''); setAyEndDate(''); setAyDialog(true); };
  const openEditAY = (ay: OrgTemplateAcademicYear) => { setEditingAY(ay); setAyName(ay.name); setAyStartDate(ay.startDate?.slice(0, 10) || ''); setAyEndDate(ay.endDate?.slice(0, 10) || ''); setAyDialog(true); };
  const saveAY = async () => {
    if (!ayName.trim() || !ayStartDate || !ayEndDate) return toast({ title: 'All fields are required', variant: 'destructive' });
    setSaving(true);
    try {
      const data = { name: ayName, startDate: ayStartDate, endDate: ayEndDate };
      if (editingAY) { await orgTemplateApi.updateAcademicYear(editingAY._id, data); toast({ title: 'Academic year updated' }); }
      else { await orgTemplateApi.createAcademicYear(data); toast({ title: 'Academic year created' }); }
      setAyDialog(false); loadData();
    } catch (err: any) { toast({ title: err?.response?.data?.message || 'Failed to save', variant: 'destructive' }); }
    finally { setSaving(false); }
  };
  const deleteAY = async (ay: OrgTemplateAcademicYear) => {
    if (!confirm(`Delete academic year "${ay.name}"?`)) return;
    try { await orgTemplateApi.deleteAcademicYear(ay._id); toast({ title: 'Deleted' }); loadData(); }
    catch { toast({ title: 'Failed to delete', variant: 'destructive' }); }
  };

  // ── MASTER DATA HANDLERS
  const mdConfig = MASTER_DATA_CONFIG[masterType];
  const openCreateMaster = () => { setEditingMaster(null); setMdName(''); setMdDescription(''); setMdCode(''); setMdIsCommon(false); setMasterDialog(true); };
  const openEditMaster = (item: OrgTemplateMasterItem) => { setEditingMaster(item); setMdName(item.name); setMdDescription(item.description || ''); setMdCode(item.code || ''); setMdIsCommon(item.isCommon || false); setMasterDialog(true); };
  const saveMaster = async () => {
    if (!mdName.trim()) return toast({ title: 'Name is required', variant: 'destructive' });
    if (mdConfig.hasCode && !mdCode.trim()) return toast({ title: 'Code is required', variant: 'destructive' });
    setSaving(true);
    try {
      const data: Record<string, any> = { name: mdName };
      if (mdConfig.hasCode) data.code = mdCode.toUpperCase();
      if (mdConfig.hasFeeFields) data.isCommon = mdIsCommon;
      else data.description = mdDescription;
      if (editingMaster) { await orgTemplateApi.updateMasterData(masterType, editingMaster._id, data); toast({ title: 'Updated' }); }
      else { await orgTemplateApi.createMasterData(masterType, data); toast({ title: 'Created' }); }
      setMasterDialog(false); loadData();
    } catch (err: any) { toast({ title: err?.response?.data?.message || 'Failed to save', variant: 'destructive' }); }
    finally { setSaving(false); }
  };
  const deleteMaster = async (item: OrgTemplateMasterItem) => {
    if (!confirm(`Delete "${item.name}"?`)) return;
    try { await orgTemplateApi.deleteMasterData(masterType, item._id); toast({ title: 'Deleted' }); loadData(); }
    catch { toast({ title: 'Failed to delete', variant: 'destructive' }); }
  };

  // Filters
  const filteredClasses = classes.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()));
  const filteredSubjects = subjects.filter(s => !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.code.toLowerCase().includes(search.toLowerCase()));
  const filteredAYs = academicYears.filter(a => !search || a.name.toLowerCase().includes(search.toLowerCase()));
  const filteredMasterItems = masterItems.filter(m => !search || m.name.toLowerCase().includes(search.toLowerCase()) || (m.code && m.code.toLowerCase().includes(search.toLowerCase())));

  const addButtonLabel = tab === 'classes' ? 'Add Class' : tab === 'subjects' ? 'Add Subject' : tab === 'academicYears' ? 'Add Academic Year' : `Add ${mdConfig.label.replace(/s$/, '')}`;
  const handleAdd = () => { if (tab === 'classes') openCreateClass(); else if (tab === 'subjects') openCreateSubject(); else if (tab === 'academicYears') openCreateAY(); else openCreateMaster(); };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><School className="w-6 h-6" />Organization Templates</h1>
          <p className="text-muted-foreground text-sm mt-1">Define master data at the organization level. Branches can import these templates.</p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-1 bg-muted rounded-lg p-1">
          {([
            { key: 'classes' as const, label: 'Classes', icon: GraduationCap },
            { key: 'subjects' as const, label: 'Subjects', icon: BookOpen },
            { key: 'academicYears' as const, label: 'Academic Years', icon: Calendar },
            { key: 'masterData' as const, label: 'Master Data', icon: Building2 },
          ]).map(t => (
            <button key={t.key} onClick={() => { setTab(t.key); setSearch(''); }}
              className={`px-3 py-2 text-sm rounded-md font-medium transition-colors ${tab === t.key ? 'bg-background shadow-sm' : 'hover:bg-background/50'}`}>
              <t.icon className="w-4 h-4 inline mr-1.5" />{t.label}
            </button>
          ))}
        </div>

        {/* Master data sub-tabs */}
        {tab === 'masterData' && (
          <div className="flex flex-wrap gap-2">
            {(Object.entries(MASTER_DATA_CONFIG) as [MasterDataType, typeof MASTER_DATA_CONFIG[MasterDataType]][]).map(([key, cfg]) => (
              <Button key={key} variant={masterType === key ? 'default' : 'outline'} size="sm" onClick={() => { setMasterType(key); setSearch(''); }}>
                <cfg.icon className="w-3.5 h-3.5 mr-1.5" />{cfg.label}
              </Button>
            ))}
          </div>
        )}

        {/* Search + Add */}
        <div className="flex gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="pl-9" />
          </div>
          <Button onClick={handleAdd}><Plus className="w-4 h-4 mr-2" />{addButtonLabel}</Button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : tab === 'classes' ? (
          filteredClasses.length === 0 ? (
            <Card><CardContent className="py-12 text-center"><GraduationCap className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" /><p className="text-muted-foreground">No org-level classes yet.</p></CardContent></Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredClasses.map(c => (
                <Card key={c._id} className="group"><CardContent className="py-4">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold truncate">{c.name}</h3>
                      <Badge variant="outline" className="text-xs mt-1">{c.academicYear}</Badge>
                      {c.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{c.description}</p>}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="icon" variant="ghost" onClick={() => openEditClass(c)}><Pencil className="w-4 h-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => deleteClass(c)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    </div>
                  </div>
                </CardContent></Card>
              ))}
            </div>
          )
        ) : tab === 'subjects' ? (
          filteredSubjects.length === 0 ? (
            <Card><CardContent className="py-12 text-center"><BookOpen className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" /><p className="text-muted-foreground">No org-level subjects yet.</p></CardContent></Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredSubjects.map(s => {
                const linkedClasses = (s.classIds || []).map(c => typeof c === 'string' ? c : c.name).filter(n => typeof n === 'string' && n.length > 3);
                return (
                  <Card key={s._id} className="group"><CardContent className="py-4">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2"><h3 className="font-semibold truncate">{s.name}</h3><Badge variant="secondary" className="text-[10px]">{s.code}</Badge></div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <span>Max: {s.maxMark}</span><span>Pass: {s.passMark}</span>
                          {s.isOptional && <Badge variant="outline" className="text-[10px]">Optional</Badge>}
                        </div>
                        {linkedClasses.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {linkedClasses.slice(0, 3).map((n, i) => <Badge key={i} variant="outline" className="text-[10px]">{n}</Badge>)}
                            {linkedClasses.length > 3 && <Badge variant="outline" className="text-[10px]">+{linkedClasses.length - 3}</Badge>}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="icon" variant="ghost" onClick={() => openEditSubject(s)}><Pencil className="w-4 h-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => deleteSubject(s)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                      </div>
                    </div>
                  </CardContent></Card>
                );
              })}
            </div>
          )
        ) : tab === 'academicYears' ? (
          filteredAYs.length === 0 ? (
            <Card><CardContent className="py-12 text-center"><Calendar className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" /><p className="text-muted-foreground">No org-level academic years yet. Define them here so branches can import.</p></CardContent></Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredAYs.map(ay => (
                <Card key={ay._id} className="group"><CardContent className="py-4">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold">{ay.name}</h3>
                      <div className="text-xs text-muted-foreground mt-1">
                        {ay.startDate ? new Date(ay.startDate).toLocaleDateString() : '—'} → {ay.endDate ? new Date(ay.endDate).toLocaleDateString() : '—'}
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="icon" variant="ghost" onClick={() => openEditAY(ay)}><Pencil className="w-4 h-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => deleteAY(ay)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    </div>
                  </div>
                </CardContent></Card>
              ))}
            </div>
          )
        ) : (
          filteredMasterItems.length === 0 ? (
            <Card><CardContent className="py-12 text-center"><mdConfig.icon className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" /><p className="text-muted-foreground">No org-level {mdConfig.label.toLowerCase()} yet.</p></CardContent></Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredMasterItems.map(item => (
                <Card key={item._id} className="group"><CardContent className="py-4">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold truncate">{item.name}</h3>
                        {item.code && <Badge variant="secondary" className="text-[10px]">{item.code}</Badge>}
                        {item.isCommon && <Badge variant="outline" className="text-[10px]">Common</Badge>}
                      </div>
                      {item.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="icon" variant="ghost" onClick={() => openEditMaster(item)}><Pencil className="w-4 h-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => deleteMaster(item)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    </div>
                  </div>
                </CardContent></Card>
              ))}
            </div>
          )
        )}

        {/* ── CLASS DIALOG ── */}
        <Dialog open={classDialog} onOpenChange={setClassDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>{editingClass ? 'Edit' : 'Add'} Organization Class</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Class Name</Label><Input value={className} onChange={e => setClassName(e.target.value)} placeholder="e.g. Class 1, LKG, Grade 10" /></div>
              <div><Label>Academic Year</Label><Input value={classAcademicYear} onChange={e => setClassAcademicYear(e.target.value)} placeholder="e.g. 2025-2026" /></div>
              <div><Label>Description (optional)</Label><Textarea value={classDescription} onChange={e => setClassDescription(e.target.value)} rows={2} placeholder="Brief description..." /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setClassDialog(false)}>Cancel</Button>
              <Button onClick={saveClass} disabled={saving}>{saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}{editingClass ? 'Update' : 'Create'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── SUBJECT DIALOG ── */}
        <Dialog open={subjectDialog} onOpenChange={setSubjectDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>{editingSubject ? 'Edit' : 'Add'} Organization Subject</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><Label>Subject Name</Label><Input value={subjectName} onChange={e => setSubjectName(e.target.value)} placeholder="e.g. Mathematics" /></div>
                <div><Label>Code</Label><Input value={subjectCode} onChange={e => setSubjectCode(e.target.value.toUpperCase())} placeholder="e.g. MATH" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Max Mark</Label><Input type="number" value={subjectMaxMark} onChange={e => setSubjectMaxMark(Number(e.target.value))} /></div>
                <div><Label>Pass Mark</Label><Input type="number" value={subjectPassMark} onChange={e => setSubjectPassMark(Number(e.target.value))} /></div>
              </div>
              <div className="flex items-center gap-3"><Switch checked={subjectIsOptional} onCheckedChange={setSubjectIsOptional} /><Label>Optional subject</Label></div>
              {classes.length > 0 && (
                <div>
                  <Label className="mb-2 block">Link to Classes</Label>
                  <div className="border rounded-lg p-3 max-h-40 overflow-y-auto space-y-2">
                    {classes.map(c => (
                      <button key={c._id} onClick={() => toggleClassForSubject(c._id)}
                        className={`flex items-center gap-2 w-full text-left p-2 rounded-md text-sm transition-colors ${subjectClassIds.includes(c._id) ? 'bg-primary/10 text-primary border border-primary/20' : 'hover:bg-muted border border-transparent'}`}>
                        {subjectClassIds.includes(c._id) && <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />}
                        <span className="truncate">{c.name}</span>
                        <Badge variant="outline" className="text-[10px] ml-auto flex-shrink-0">{c.academicYear}</Badge>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSubjectDialog(false)}>Cancel</Button>
              <Button onClick={saveSubject} disabled={saving}>{saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}{editingSubject ? 'Update' : 'Create'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── ACADEMIC YEAR DIALOG ── */}
        <Dialog open={ayDialog} onOpenChange={setAyDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>{editingAY ? 'Edit' : 'Add'} Academic Year</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Name</Label><Input value={ayName} onChange={e => setAyName(e.target.value)} placeholder="e.g. 2025-2026" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Start Date</Label><Input type="date" value={ayStartDate} onChange={e => setAyStartDate(e.target.value)} /></div>
                <div><Label>End Date</Label><Input type="date" value={ayEndDate} onChange={e => setAyEndDate(e.target.value)} /></div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAyDialog(false)}>Cancel</Button>
              <Button onClick={saveAY} disabled={saving}>{saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}{editingAY ? 'Update' : 'Create'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── MASTER DATA DIALOG ── */}
        <Dialog open={masterDialog} onOpenChange={setMasterDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>{editingMaster ? 'Edit' : 'Add'} {mdConfig.label.replace(/s$/, '')}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Name</Label><Input value={mdName} onChange={e => setMdName(e.target.value)} placeholder="Name" /></div>
              {mdConfig.hasCode && <div><Label>Code</Label><Input value={mdCode} onChange={e => setMdCode(e.target.value.toUpperCase())} placeholder="Unique code" /></div>}
              {mdConfig.hasFeeFields ? (
                <div className="flex items-center gap-3"><Switch checked={mdIsCommon} onCheckedChange={setMdIsCommon} /><Label>Common fee (applies to all students)</Label></div>
              ) : (
                <div><Label>Description (optional)</Label><Textarea value={mdDescription} onChange={e => setMdDescription(e.target.value)} rows={2} /></div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setMasterDialog(false)}>Cancel</Button>
              <Button onClick={saveMaster} disabled={saving}>{saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}{editingMaster ? 'Update' : 'Create'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default OrgTemplates;
