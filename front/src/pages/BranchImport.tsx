import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  ArrowLeft, ArrowRight, Download, Loader2, CheckCircle2, GraduationCap,
  BookOpen, LayoutGrid, Plus, Trash2, AlertCircle, GitBranch
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { orgTemplateApi, OrgTemplateClass, ImportStats } from '@/services/orgTemplateService';

interface BranchOption { _id: string; name: string }

const BranchImport = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1: select branch, 2: select classes, 3: divisions, 4: review & import
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);

  // Import mode: 'org' = from Organization templates, 'branch' = from another branch
  const [importMode, setImportMode] = useState<'org' | 'branch'>('org');

  // Step 1: Branch selection
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [sourceBranch, setSourceBranch] = useState('');

  // Step 2: Class selection
  const [orgClasses, setOrgClasses] = useState<OrgTemplateClass[]>([]);
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);

  // Step 3: Division generation
  const [divisions, setDivisions] = useState<Record<string, { name: string; capacity: number }[]>>({});

  // Options
  const [includeSubjects, setIncludeSubjects] = useState(true);
  const [includeChapters, setIncludeChapters] = useState(true);
  const [includeAcademicYears, setIncludeAcademicYears] = useState(true);
  const [includeDepartments, setIncludeDepartments] = useState(true);
  const [includeDesignations, setIncludeDesignations] = useState(true);
  const [includeStaffCategories, setIncludeStaffCategories] = useState(true);
  const [includeExpenseCategories, setIncludeExpenseCategories] = useState(true);
  const [includeIncomeCategories, setIncludeIncomeCategories] = useState(true);
  const [includeFeeTypes, setIncludeFeeTypes] = useState(true);

  // Result
  const [result, setResult] = useState<ImportStats | null>(null);

  // Compare data
  const [compareData, setCompareData] = useState<any>(null);

  useEffect(() => {
    loadBranches();
  }, []);

  const loadBranches = async () => {
    try {
      // Use the branches API
      const { apiClient } = await import('@/lib/api');
      const res = await apiClient.get('/branches');
      setBranches(((res.data as any).data || []).map((b: any) => ({ _id: b._id, name: b.name })));
    } catch {
      toast({ title: 'Something went wrong while loading branches. Please try again.', variant: 'destructive' });
    }
  };

  const loadOrgClasses = async () => {
    setLoading(true);
    try {
      if (importMode === 'branch') {
        // Load data from source branch
        const previewRes = await orgTemplateApi.getBranchPreview(sourceBranch);
        setOrgClasses((previewRes.data?.classes || []).map((c: any) => ({
          _id: c._id, name: c.name, description: c.description,
          academicYear: c.academicYear, status: c.status, organizationId: c.organizationId
        })));
        setCompareData(null);
      } else {
        const [classRes, compareRes] = await Promise.all([
          orgTemplateApi.getClasses({ status: 'active' }),
          selectedBranch ? orgTemplateApi.compare(selectedBranch) : Promise.resolve(null)
        ]);
        setOrgClasses((classRes as any).data || []);
        if (compareRes) setCompareData(compareRes.data);
      }
    } catch {
      toast({ title: 'Something went wrong while loading classes. Please try again.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const goToStep = (s: number) => {
    if (s === 2 && !selectedBranch) {
      toast({ title: 'Select a target branch first', variant: 'destructive' });
      return;
    }
    if (s === 2 && importMode === 'branch' && !sourceBranch) {
      toast({ title: 'Select a source branch first', variant: 'destructive' });
      return;
    }
    if (s === 2 && importMode === 'branch' && sourceBranch === selectedBranch) {
      toast({ title: 'Source and target must be different branches', variant: 'destructive' });
      return;
    }
    if (s === 2) loadOrgClasses();
    if (s === 3 && selectedClassIds.length === 0) {
      // Skip divisions step entirely if no classes selected — go to review
      setStep(4);
      return;
    }
    if (s === 3) {
      // Pre-populate division defaults for newly selected classes
      const newDivs: Record<string, { name: string; capacity: number }[]> = {};
      for (const id of selectedClassIds) {
        newDivs[id] = divisions[id] || [{ name: 'A', capacity: 40 }];
      }
      setDivisions(newDivs);
    }
    setStep(s);
  };

  const toggleClass = (id: string) => {
    setSelectedClassIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const addDivision = (classId: string) => {
    setDivisions(prev => {
      const existing = prev[classId] || [];
      const nextLetter = String.fromCharCode(65 + existing.length); // A, B, C...
      return { ...prev, [classId]: [...existing, { name: nextLetter, capacity: 40 }] };
    });
  };

  const removeDivision = (classId: string, idx: number) => {
    setDivisions(prev => ({
      ...prev,
      [classId]: (prev[classId] || []).filter((_, i) => i !== idx)
    }));
  };

  const updateDivision = (classId: string, idx: number, field: 'name' | 'capacity', value: string | number) => {
    setDivisions(prev => ({
      ...prev,
      [classId]: (prev[classId] || []).map((d, i) => i === idx ? { ...d, [field]: value } : d)
    }));
  };

  const handleImport = async () => {
    setImporting(true);
    try {
      const commonData = {
        classIds: selectedClassIds,
        includeSubjects,
        includeChapters,
        includeAcademicYears,
        includeDepartments,
        includeDesignations,
        includeStaffCategories,
        includeExpenseCategories,
        includeIncomeCategories,
        includeFeeTypes,
        divisions
      };

      let res;
      if (importMode === 'branch') {
        res = await orgTemplateApi.importFromBranch({
          sourceBranchId: sourceBranch,
          targetBranchId: selectedBranch,
          ...commonData
        });
      } else {
        res = await orgTemplateApi.importToBranch({
          branchId: selectedBranch,
          ...commonData
        });
      }
      setResult(res.data);
      setStep(5);
      toast({ title: 'Import completed successfully!' });
    } catch (err: any) {
      toast({ title: err?.response?.data?.message || 'Import failed', variant: 'destructive' });
    } finally {
      setImporting(false);
    }
  };

  const selectedBranchName = branches.find(b => b._id === selectedBranch)?.name || '';
  const sourceBranchName = branches.find(b => b._id === sourceBranch)?.name || '';

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/org-templates')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Download className="w-6 h-6" />
              Import to Branch
            </h1>
            <p className="text-sm text-muted-foreground">Import classes, subjects, and master data into a branch</p>
          </div>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center gap-2">
          {[
            { n: 1, label: 'Branch' },
            { n: 2, label: 'Classes' },
            { n: 3, label: 'Divisions' },
            { n: 4, label: 'Review' }
          ].map(({ n, label }) => (
            <div key={n} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step > n ? 'bg-primary text-primary-foreground' :
                step === n ? 'bg-primary text-primary-foreground ring-2 ring-primary/30' :
                'bg-muted text-muted-foreground'
              }`}>
                {step > n ? <CheckCircle2 className="w-4 h-4" /> : n}
              </div>
              <span className={`text-sm hidden sm:inline ${step === n ? 'font-medium' : 'text-muted-foreground'}`}>{label}</span>
              {n < 4 && <div className="w-4 sm:w-8 h-px bg-border" />}
            </div>
          ))}
        </div>

        {/* ── STEP 1: Select Branch ──────────────── */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Import Source & Target</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Import mode toggle */}
              <div className="space-y-2">
                <Label className="text-muted-foreground text-sm">Import from</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => { setImportMode('org'); setSourceBranch(''); }}
                    className={`flex items-center gap-2 p-3 rounded-lg border text-left text-sm transition-colors ${importMode === 'org' ? 'border-primary bg-primary/5 font-medium' : 'border-border hover:border-primary/30'}`}
                  >
                    <Download className="w-4 h-4" />
                    Organization Templates
                  </button>
                  <button
                    onClick={() => setImportMode('branch')}
                    className={`flex items-center gap-2 p-3 rounded-lg border text-left text-sm transition-colors ${importMode === 'branch' ? 'border-primary bg-primary/5 font-medium' : 'border-border hover:border-primary/30'}`}
                  >
                    <GitBranch className="w-4 h-4" />
                    Another Branch
                  </button>
                </div>
              </div>

              {/* Source branch (only for branch→branch mode) */}
              {importMode === 'branch' && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground text-sm">Source Branch</Label>
                  <Select value={sourceBranch} onValueChange={setSourceBranch}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select source branch..." />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.filter(b => b._id !== selectedBranch).map(b => (
                        <SelectItem key={b._id} value={b._id}>{b.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-muted-foreground text-sm">Target Branch</Label>
                <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select target branch..." />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.filter(b => b._id !== sourceBranch).map(b => (
                      <SelectItem key={b._id} value={b._id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => goToStep(2)} disabled={!selectedBranch || (importMode === 'branch' && !sourceBranch)}>
                  Next <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── STEP 2: Select Classes ─────────────── */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Select Classes to Import</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : orgClasses.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-muted-foreground">No org-level classes found. Create some in Organization Templates first.</p>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    {orgClasses.map(c => {
                      const existsInBranch = compareData?.org?.classes?.find((x: any) => x._id === c._id)?.existsInBranch;
                      return (
                        <button
                          key={c._id}
                          onClick={() => toggleClass(c._id)}
                          className={`flex items-center gap-3 w-full text-left p-3 rounded-lg border transition-colors ${
                            selectedClassIds.includes(c._id)
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/30'
                          }`}
                        >
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                            selectedClassIds.includes(c._id) ? 'border-primary bg-primary' : 'border-muted-foreground/30'
                          }`}>
                            {selectedClassIds.includes(c._id) && <CheckCircle2 className="w-4 h-4 text-white" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <GraduationCap className="w-4 h-4 text-muted-foreground" />
                              <span className="font-medium">{c.name}</span>
                              <Badge variant="outline" className="text-[10px]">{c.academicYear}</Badge>
                            </div>
                            {c.description && <p className="text-xs text-muted-foreground mt-0.5">{c.description}</p>}
                          </div>
                          {existsInBranch && (
                            <Badge variant="secondary" className="text-[10px] flex-shrink-0">Already exists</Badge>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <div className="space-y-3 pt-2 border-t">
                    <Label className="text-sm font-medium">Academic Data</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="flex items-center gap-2">
                        <Switch checked={includeSubjects} onCheckedChange={setIncludeSubjects} />
                        <Label className="text-sm">Include subjects</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={includeChapters} onCheckedChange={setIncludeChapters} disabled={!includeSubjects} />
                        <Label className="text-sm">Include LMS chapters</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={includeAcademicYears} onCheckedChange={setIncludeAcademicYears} />
                        <Label className="text-sm">Academic years</Label>
                      </div>
                    </div>
                    <Label className="text-sm font-medium pt-2">Master Data</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="flex items-center gap-2">
                        <Switch checked={includeDepartments} onCheckedChange={setIncludeDepartments} />
                        <Label className="text-sm">Departments</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={includeDesignations} onCheckedChange={setIncludeDesignations} />
                        <Label className="text-sm">Designations</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={includeStaffCategories} onCheckedChange={setIncludeStaffCategories} />
                        <Label className="text-sm">Staff categories</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={includeExpenseCategories} onCheckedChange={setIncludeExpenseCategories} />
                        <Label className="text-sm">Expense categories</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={includeIncomeCategories} onCheckedChange={setIncludeIncomeCategories} />
                        <Label className="text-sm">Income categories</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={includeFeeTypes} onCheckedChange={setIncludeFeeTypes} />
                        <Label className="text-sm">Fee types</Label>
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)}>
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>
                <Button onClick={() => goToStep(3)}>
                  Next <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── STEP 3: Divisions ──────────────────── */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Generate Divisions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Configure divisions (sections) for each class. You can add more or leave empty.
              </p>

              {selectedClassIds.map(classId => {
                const cls = orgClasses.find(c => c._id === classId);
                if (!cls) return null;
                const classDivs = divisions[classId] || [];
                return (
                  <div key={classId} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium flex items-center gap-2">
                        <GraduationCap className="w-4 h-4" />
                        {cls.name}
                        <Badge variant="outline" className="text-[10px]">{cls.academicYear}</Badge>
                      </h3>
                      <Button size="sm" variant="outline" onClick={() => addDivision(classId)}>
                        <Plus className="w-3 h-3 mr-1" />
                        Add Division
                      </Button>
                    </div>
                    {classDivs.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No divisions — class will be created without sections</p>
                    ) : (
                      <div className="space-y-2">
                        {classDivs.map((div, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <LayoutGrid className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            <Input
                              value={div.name}
                              onChange={e => updateDivision(classId, idx, 'name', e.target.value)}
                              placeholder="Division name"
                              className="w-24"
                            />
                            <Input
                              type="number"
                              value={div.capacity}
                              onChange={e => updateDivision(classId, idx, 'capacity', Number(e.target.value))}
                              placeholder="Capacity"
                              className="w-24"
                              min={1}
                            />
                            <span className="text-xs text-muted-foreground">students</span>
                            <Button size="icon" variant="ghost" onClick={() => removeDivision(classId, idx)} className="ml-auto">
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(2)}>
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>
                <Button onClick={() => goToStep(4)}>
                  Next <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── STEP 4: Review & Import ────────────── */}
        {step === 4 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Review & Import</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {importMode === 'branch' && (
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Source Branch</Label>
                    <p className="font-medium">{sourceBranchName}</p>
                  </div>
                )}
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Target Branch</Label>
                  <p className="font-medium">{selectedBranchName}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Classes to Import</Label>
                  <p className="font-medium">{selectedClassIds.length} classes</p>
                </div>
              </div>

              {selectedClassIds.length > 0 && (
                <div className="border rounded-lg divide-y">
                  {selectedClassIds.map(classId => {
                    const cls = orgClasses.find(c => c._id === classId);
                    const classDivs = divisions[classId] || [];
                    return (
                      <div key={classId} className="p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <GraduationCap className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{cls?.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {classDivs.length > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {classDivs.length} division{classDivs.length !== 1 ? 's' : ''}
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Academic Data</Label>
                <div className="flex flex-wrap gap-2">
                  <Badge variant={includeSubjects ? 'default' : 'secondary'}>
                    <BookOpen className="w-3 h-3 mr-1" />
                    Subjects: {includeSubjects ? 'Yes' : 'No'}
                  </Badge>
                  <Badge variant={includeChapters ? 'default' : 'secondary'}>
                    LMS Chapters: {includeChapters ? 'Yes' : 'No'}
                  </Badge>
                  <Badge variant={includeAcademicYears ? 'default' : 'secondary'}>
                    Academic Years: {includeAcademicYears ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <Label className="text-xs text-muted-foreground">Master Data</Label>
                <div className="flex flex-wrap gap-2">
                  <Badge variant={includeDepartments ? 'default' : 'secondary'}>
                    Departments: {includeDepartments ? 'Yes' : 'No'}
                  </Badge>
                  <Badge variant={includeDesignations ? 'default' : 'secondary'}>
                    Designations: {includeDesignations ? 'Yes' : 'No'}
                  </Badge>
                  <Badge variant={includeStaffCategories ? 'default' : 'secondary'}>
                    Staff Categories: {includeStaffCategories ? 'Yes' : 'No'}
                  </Badge>
                  <Badge variant={includeExpenseCategories ? 'default' : 'secondary'}>
                    Expense Categories: {includeExpenseCategories ? 'Yes' : 'No'}
                  </Badge>
                  <Badge variant={includeIncomeCategories ? 'default' : 'secondary'}>
                    Income Categories: {includeIncomeCategories ? 'Yes' : 'No'}
                  </Badge>
                  <Badge variant={includeFeeTypes ? 'default' : 'secondary'}>
                    Fee Types: {includeFeeTypes ? 'Yes' : 'No'}
                  </Badge>
                </div>
              </div>

              <div className="flex justify-between pt-2">
                <Button variant="outline" onClick={() => setStep(selectedClassIds.length > 0 ? 3 : 2)}>
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>
                <Button onClick={handleImport} disabled={importing}>
                  {importing ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Importing...</>
                  ) : (
                    <><Download className="w-4 h-4 mr-2" /> Import Now</>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── STEP 5: Result ─────────────────────── */}
        {step === 5 && result && (
          <Card>
            <CardContent className="py-8 text-center space-y-4">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
              <h2 className="text-xl font-bold">Import Complete!</h2>
              <p className="text-muted-foreground">
                Data has been imported to <strong>{selectedBranchName}</strong>
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-lg mx-auto pt-4">
                {(result.classesCreated > 0 || result.classesSkipped > 0) && (
                  <div className="border rounded-lg p-3">
                    <p className="text-2xl font-bold text-primary">{result.classesCreated}</p>
                    <p className="text-xs text-muted-foreground">Classes Created</p>
                    {result.classesSkipped > 0 && <p className="text-xs text-yellow-500">{result.classesSkipped} skipped</p>}
                  </div>
                )}
                {result.divisionsCreated > 0 && (
                  <div className="border rounded-lg p-3">
                    <p className="text-2xl font-bold text-primary">{result.divisionsCreated}</p>
                    <p className="text-xs text-muted-foreground">Divisions Created</p>
                  </div>
                )}
                {(result.subjectsCreated > 0 || result.subjectsSkipped > 0) && (
                  <div className="border rounded-lg p-3">
                    <p className="text-2xl font-bold text-primary">{result.subjectsCreated}</p>
                    <p className="text-xs text-muted-foreground">Subjects Created</p>
                    {result.subjectsSkipped > 0 && <p className="text-xs text-yellow-500">{result.subjectsSkipped} skipped</p>}
                  </div>
                )}
                {result.chaptersCreated > 0 && (
                  <div className="border rounded-lg p-3">
                    <p className="text-2xl font-bold text-primary">{result.chaptersCreated}</p>
                    <p className="text-xs text-muted-foreground">Chapters Created</p>
                  </div>
                )}
                {(result.academicYearsCreated ?? 0) > 0 && (
                  <div className="border rounded-lg p-3">
                    <p className="text-2xl font-bold text-primary">{result.academicYearsCreated}</p>
                    <p className="text-xs text-muted-foreground">Academic Years</p>
                    {(result.academicYearsSkipped ?? 0) > 0 && <p className="text-xs text-yellow-500">{result.academicYearsSkipped} skipped</p>}
                  </div>
                )}
                {(result.departmentsCreated ?? 0) > 0 && (
                  <div className="border rounded-lg p-3">
                    <p className="text-2xl font-bold text-primary">{result.departmentsCreated}</p>
                    <p className="text-xs text-muted-foreground">Departments</p>
                    {(result.departmentsSkipped ?? 0) > 0 && <p className="text-xs text-yellow-500">{result.departmentsSkipped} skipped</p>}
                  </div>
                )}
                {(result.designationsCreated ?? 0) > 0 && (
                  <div className="border rounded-lg p-3">
                    <p className="text-2xl font-bold text-primary">{result.designationsCreated}</p>
                    <p className="text-xs text-muted-foreground">Designations</p>
                    {(result.designationsSkipped ?? 0) > 0 && <p className="text-xs text-yellow-500">{result.designationsSkipped} skipped</p>}
                  </div>
                )}
                {(result.staffCategoriesCreated ?? 0) > 0 && (
                  <div className="border rounded-lg p-3">
                    <p className="text-2xl font-bold text-primary">{result.staffCategoriesCreated}</p>
                    <p className="text-xs text-muted-foreground">Staff Categories</p>
                    {(result.staffCategoriesSkipped ?? 0) > 0 && <p className="text-xs text-yellow-500">{result.staffCategoriesSkipped} skipped</p>}
                  </div>
                )}
                {(result.expenseCategoriesCreated ?? 0) > 0 && (
                  <div className="border rounded-lg p-3">
                    <p className="text-2xl font-bold text-primary">{result.expenseCategoriesCreated}</p>
                    <p className="text-xs text-muted-foreground">Expense Categories</p>
                    {(result.expenseCategoriesSkipped ?? 0) > 0 && <p className="text-xs text-yellow-500">{result.expenseCategoriesSkipped} skipped</p>}
                  </div>
                )}
                {(result.incomeCategoriesCreated ?? 0) > 0 && (
                  <div className="border rounded-lg p-3">
                    <p className="text-2xl font-bold text-primary">{result.incomeCategoriesCreated}</p>
                    <p className="text-xs text-muted-foreground">Income Categories</p>
                    {(result.incomeCategoriesSkipped ?? 0) > 0 && <p className="text-xs text-yellow-500">{result.incomeCategoriesSkipped} skipped</p>}
                  </div>
                )}
                {(result.feeTypesCreated ?? 0) > 0 && (
                  <div className="border rounded-lg p-3">
                    <p className="text-2xl font-bold text-primary">{result.feeTypesCreated}</p>
                    <p className="text-xs text-muted-foreground">Fee Types</p>
                    {(result.feeTypesSkipped ?? 0) > 0 && <p className="text-xs text-yellow-500">{result.feeTypesSkipped} skipped</p>}
                  </div>
                )}
              </div>

              <div className="flex justify-center gap-3 pt-4">
                <Button variant="outline" onClick={() => navigate('/org-templates')}>
                  Back to Templates
                </Button>
                <Button onClick={() => { setStep(1); setResult(null); setSelectedClassIds([]); setSourceBranch(''); }}>
                  Import to Another Branch
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

export default BranchImport;
