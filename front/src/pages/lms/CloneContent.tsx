import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, ArrowRight, BookOpen, Plus, Trash2, Loader2, RefreshCw, Download, Building2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { classesApi, Class } from '@/services/classes';
import { subjectApi, Subject } from '@/services/subjectService';
import { chapterApi, Chapter } from '@/services/lmsService';
import { lmsCloneApi, lmsImportApi, SubjectMapping, BranchWithContent } from '@/services/lmsService';

const CloneContent = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const isOrgAdmin = user?.role === 'org_admin' || user?.role === 'platform_admin';
  const [tab, setTab] = useState('clone');
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(false);

  // ── Clone Subject Content State ──
  const [sourceClassId, setSourceClassId] = useState('');
  const [sourceSubjects, setSourceSubjects] = useState<Subject[]>([]);
  const [sourceSubjectId, setSourceSubjectId] = useState('');
  const [sourceChapters, setSourceChapters] = useState<Chapter[]>([]);
  const [targetClassId, setTargetClassId] = useState('');
  const [targetSubjects, setTargetSubjects] = useState<Subject[]>([]);
  const [targetSubjectId, setTargetSubjectId] = useState('');
  const [includeAssessments, setIncludeAssessments] = useState(true);

  // ── Rollover State ──
  const [rollSourceClassId, setRollSourceClassId] = useState('');
  const [rollSourceSubjects, setRollSourceSubjects] = useState<Subject[]>([]);
  const [rollTargetClassId, setRollTargetClassId] = useState('');
  const [rollTargetSubjects, setRollTargetSubjects] = useState<Subject[]>([]);
  const [subjectMappings, setSubjectMappings] = useState<SubjectMapping[]>([]);
  const [rollIncludeAssessments, setRollIncludeAssessments] = useState(true);

  // ── Import State ──
  const [branches, setBranches] = useState<BranchWithContent[]>([]);
  const [importMode, setImportMode] = useState<'org' | 'branch'>('org');
  const [importTargetBranchId, setImportTargetBranchId] = useState('');
  const [importSourceBranchId, setImportSourceBranchId] = useState('');
  const [importClassId, setImportClassId] = useState('');
  const [importSubjects, setImportSubjects] = useState<Subject[]>([]);
  const [importSubjectId, setImportSubjectId] = useState('');
  const [importIncludeAssessments, setImportIncludeAssessments] = useState(true);

  useEffect(() => {
    loadClasses();
    if (isOrgAdmin) loadBranches();
  }, []);

  // Source class → load subjects
  useEffect(() => {
    if (sourceClassId) {
      loadSubjects(sourceClassId, setSourceSubjects);
      setSourceSubjectId('');
      setSourceChapters([]);
    }
  }, [sourceClassId]);

  // Target class → load subjects
  useEffect(() => {
    if (targetClassId) loadSubjects(targetClassId, setTargetSubjects);
  }, [targetClassId]);

  // Source subject → load chapters preview
  useEffect(() => {
    if (sourceClassId && sourceSubjectId) {
      loadSourceChapters();
    } else {
      setSourceChapters([]);
    }
  }, [sourceClassId, sourceSubjectId]);

  // Rollover source/target
  useEffect(() => {
    if (rollSourceClassId) {
      loadSubjects(rollSourceClassId, setRollSourceSubjects);
      setSubjectMappings([]);
    }
  }, [rollSourceClassId]);

  useEffect(() => {
    if (rollTargetClassId) {
      loadSubjects(rollTargetClassId, setRollTargetSubjects);
      setSubjectMappings([]);
    }
  }, [rollTargetClassId]);

  const loadClasses = async () => {
    try {
      const res = await classesApi.getClasses({ limit: 100, status: 'active' });
      setClasses(res.data || []);
    } catch { /* ignore */ }
  };

  const loadSubjects = async (classId: string, setter: (s: Subject[]) => void) => {
    try {
      const res = await subjectApi.getAll({ limit: 100, classId, status: 'active' });
      setter(res.data || []);
    } catch { /* ignore */ }
  };

  const loadSourceChapters = async () => {
    try {
      const res = await chapterApi.getAll({ classId: sourceClassId, subjectId: sourceSubjectId, limit: 100 });
      setSourceChapters(res.data || []);
    } catch { /* ignore */ }
  };

  // ── Clone Handler ──
  const handleClone = async () => {
    if (!sourceClassId || !sourceSubjectId || !targetClassId || !targetSubjectId) {
      toast({ title: 'Error', description: 'Please select source and target class/subject', variant: 'destructive' });
      return;
    }
    if (sourceClassId === targetClassId && sourceSubjectId === targetSubjectId) {
      toast({ title: 'Error', description: 'Source and target cannot be the same', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const res = await lmsCloneApi.cloneSubjectContent({
        sourceClassId, sourceSubjectId, targetClassId, targetSubjectId, includeAssessments
      });
      toast({ title: 'Success', description: res.message });
    } catch (err: any) {
      toast({ title: 'Error', description: err?.response?.data?.message || 'Clone failed', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // ── Rollover Handler ──
  const handleRollover = async () => {
    if (!rollSourceClassId || !rollTargetClassId || subjectMappings.length === 0) {
      toast({ title: 'Error', description: 'Select source class, target class and at least one subject mapping', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const res = await lmsCloneApi.rollover({
        sourceClassId: rollSourceClassId,
        targetClassId: rollTargetClassId,
        subjectMappings,
        includeAssessments: rollIncludeAssessments
      });
      toast({ title: 'Rollover Complete', description: res.message });
    } catch (err: any) {
      toast({ title: 'Error', description: err?.response?.data?.message || 'Rollover failed', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const addSubjectMapping = () => {
    setSubjectMappings(prev => [...prev, { sourceSubjectId: '', targetSubjectId: '' }]);
  };

  const updateMapping = (idx: number, field: keyof SubjectMapping, value: string) => {
    setSubjectMappings(prev => prev.map((m, i) => i === idx ? { ...m, [field]: value } : m));
  };

  const removeMapping = (idx: number) => {
    setSubjectMappings(prev => prev.filter((_, i) => i !== idx));
  };

  // ── Import Handlers ──
  const loadBranches = async () => {
    try {
      const res = await lmsImportApi.getBranches();
      setBranches(res.data || []);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    if (importClassId) {
      loadSubjects(importClassId, setImportSubjects);
      setImportSubjectId('');
    }
  }, [importClassId]);

  const handleImport = async () => {
    if (!importClassId || !importSubjectId) {
      toast({ title: 'Error', description: 'Select class and subject', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      if (importMode === 'org') {
        if (!importTargetBranchId) {
          toast({ title: 'Error', description: 'Select target branch', variant: 'destructive' });
          setLoading(false);
          return;
        }
        const res = await lmsImportApi.importFromOrg({
          targetBranchId: importTargetBranchId,
          classId: importClassId,
          subjectId: importSubjectId,
          includeAssessments: importIncludeAssessments
        });
        toast({ title: 'Import Complete', description: res.message });
      } else {
        if (!importSourceBranchId || !importTargetBranchId) {
          toast({ title: 'Error', description: 'Select source and target branch', variant: 'destructive' });
          setLoading(false);
          return;
        }
        const res = await lmsImportApi.importFromBranch({
          sourceBranchId: importSourceBranchId,
          targetBranchId: importTargetBranchId,
          classId: importClassId,
          subjectId: importSubjectId,
          includeAssessments: importIncludeAssessments
        });
        toast({ title: 'Import Complete', description: res.message });
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err?.response?.data?.message || 'Import failed', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Clone & Rollover Content</h1>
          <p className="text-muted-foreground">Copy content between classes/subjects or roll over to a new academic year</p>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="clone" className="gap-2"><Copy className="w-4 h-4" /> Clone Content</TabsTrigger>
            <TabsTrigger value="rollover" className="gap-2"><RefreshCw className="w-4 h-4" /> Academic Rollover</TabsTrigger>
            {isOrgAdmin && (
              <TabsTrigger value="import" className="gap-2"><Download className="w-4 h-4" /> Branch Import</TabsTrigger>
            )}
          </TabsList>

          {/* ── CLONE TAB ── */}
          <TabsContent value="clone" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Source */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Source</CardTitle>
                  <CardDescription>Select the class and subject to copy from</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label>Class</Label>
                    <Select value={sourceClassId} onValueChange={setSourceClassId}>
                      <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                      <SelectContent>
                        {classes.map(c => (
                          <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Subject</Label>
                    <Select value={sourceSubjectId} onValueChange={setSourceSubjectId} disabled={!sourceClassId}>
                      <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                      <SelectContent>
                        {sourceSubjects.map(s => (
                          <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {sourceChapters.length > 0 && (
                    <div className="mt-2">
                      <Label className="text-sm text-muted-foreground">Preview — {sourceChapters.length} chapters</Label>
                      <div className="space-y-1 mt-1 max-h-40 overflow-y-auto">
                        {sourceChapters.map(ch => (
                          <div key={ch._id} className="flex items-center gap-2 text-sm p-1.5 bg-muted rounded">
                            <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
                            <span>Ch {ch.chapterNumber}: {ch.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Target */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Target</CardTitle>
                  <CardDescription>Select where to clone the content</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label>Class</Label>
                    <Select value={targetClassId} onValueChange={setTargetClassId}>
                      <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                      <SelectContent>
                        {classes.map(c => (
                          <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Subject</Label>
                    <Select value={targetSubjectId} onValueChange={setTargetSubjectId} disabled={!targetClassId}>
                      <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                      <SelectContent>
                        {targetSubjects.map(s => (
                          <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Switch id="include-assess" checked={includeAssessments} onCheckedChange={setIncludeAssessments} />
                    <Label htmlFor="include-assess">Include assessments (quizzes, exams, assignments)</Label>
                  </div>
                  <Button onClick={handleClone} disabled={loading || !sourceSubjectId || !targetSubjectId} className="gap-2">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />}
                    Clone Content
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── ROLLOVER TAB ── */}
          <TabsContent value="rollover" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Academic Year Rollover</CardTitle>
                <CardDescription>
                  Copy all LMS content from one class to another across multiple subjects. Map each source subject to its target in the new class setup.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Source Class</Label>
                    <Select value={rollSourceClassId} onValueChange={setRollSourceClassId}>
                      <SelectTrigger><SelectValue placeholder="Select source class" /></SelectTrigger>
                      <SelectContent>
                        {classes.map(c => (
                          <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Target Class</Label>
                    <Select value={rollTargetClassId} onValueChange={setRollTargetClassId}>
                      <SelectTrigger><SelectValue placeholder="Select target class" /></SelectTrigger>
                      <SelectContent>
                        {classes.map(c => (
                          <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium">Subject Mappings</Label>
                    <Button variant="outline" size="sm" onClick={addSubjectMapping} disabled={!rollSourceClassId || !rollTargetClassId} className="gap-1">
                      <Plus className="w-3.5 h-3.5" /> Add Mapping
                    </Button>
                  </div>
                  {subjectMappings.length === 0 && rollSourceClassId && rollTargetClassId && (
                    <p className="text-sm text-muted-foreground py-4 text-center">No subject mappings yet. Click "Add Mapping" to map source subjects to target subjects.</p>
                  )}
                  {subjectMappings.map((mapping, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Select value={mapping.sourceSubjectId} onValueChange={v => updateMapping(idx, 'sourceSubjectId', v)}>
                        <SelectTrigger className="flex-1"><SelectValue placeholder="Source subject" /></SelectTrigger>
                        <SelectContent>
                          {rollSourceSubjects.map(s => (
                            <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                      <Select value={mapping.targetSubjectId} onValueChange={v => updateMapping(idx, 'targetSubjectId', v)}>
                        <SelectTrigger className="flex-1"><SelectValue placeholder="Target subject" /></SelectTrigger>
                        <SelectContent>
                          {rollTargetSubjects.map(s => (
                            <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button variant="ghost" size="icon" onClick={() => removeMapping(idx)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Switch id="roll-assess" checked={rollIncludeAssessments} onCheckedChange={setRollIncludeAssessments} />
                    <Label htmlFor="roll-assess">Include assessments</Label>
                  </div>
                  <Button onClick={handleRollover} disabled={loading || subjectMappings.length === 0} className="gap-2">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    Start Rollover
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── IMPORT TAB ── */}
          {isOrgAdmin && (
            <TabsContent value="import" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Import Content to Branch</CardTitle>
                  <CardDescription>
                    Import content from the organization master library or from another branch within your organization.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Import Mode Selection */}
                  <div className="flex gap-3">
                    <Button
                      variant={importMode === 'org' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setImportMode('org')}
                      className="gap-2"
                    >
                      <Building2 className="w-4 h-4" /> From Org Library
                    </Button>
                    <Button
                      variant={importMode === 'branch' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setImportMode('branch')}
                      className="gap-2"
                    >
                      <ArrowRight className="w-4 h-4" /> From Another Branch
                    </Button>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Source branch (only for branch mode) */}
                    {importMode === 'branch' && (
                      <div>
                        <Label>Source Branch</Label>
                        <Select value={importSourceBranchId} onValueChange={setImportSourceBranchId}>
                          <SelectTrigger><SelectValue placeholder="Select source branch" /></SelectTrigger>
                          <SelectContent>
                            {branches.map(b => (
                              <SelectItem key={b._id} value={b._id}>
                                {b.name} {b.chapterCount > 0 && <span className="text-muted-foreground ml-1">({b.chapterCount} chapters)</span>}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Target branch */}
                    <div>
                      <Label>Target Branch</Label>
                      <Select value={importTargetBranchId} onValueChange={setImportTargetBranchId}>
                        <SelectTrigger><SelectValue placeholder="Select target branch" /></SelectTrigger>
                        <SelectContent>
                          {branches.filter(b => b._id !== importSourceBranchId).map(b => (
                            <SelectItem key={b._id} value={b._id}>{b.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Class */}
                    <div>
                      <Label>Class</Label>
                      <Select value={importClassId} onValueChange={setImportClassId}>
                        <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                        <SelectContent>
                          {classes.map(c => (
                            <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Subject */}
                    <div>
                      <Label>Subject</Label>
                      <Select value={importSubjectId} onValueChange={setImportSubjectId} disabled={!importClassId}>
                        <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                        <SelectContent>
                          {importSubjects.map(s => (
                            <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Switch id="import-assess" checked={importIncludeAssessments} onCheckedChange={setImportIncludeAssessments} />
                      <Label htmlFor="import-assess">Include assessments</Label>
                    </div>
                    <Button onClick={handleImport} disabled={loading || !importSubjectId || !importTargetBranchId} className="gap-2">
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                      Import Content
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Branch overview */}
              {branches.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Branch Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-2 md:grid-cols-3">
                      {branches.map(b => (
                        <div key={b._id} className="flex items-center justify-between p-3 rounded-lg border">
                          <div>
                            <p className="text-sm font-medium">{b.name}</p>
                            <p className="text-xs text-muted-foreground">{b.code}</p>
                          </div>
                          <Badge variant={b.chapterCount > 0 ? 'default' : 'outline'}>
                            {b.chapterCount} chapters
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          )}
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default CloneContent;
