import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import {
  Plus, Search, Trash2, Edit, BookOpen, Loader2, Database, BarChart2,
  ChevronDown, ChevronUp, Copy, Shuffle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { classesApi, Class } from '@/services/classes';
import { subjectApi, Subject } from '@/services/subjectService';
import { chapterApi, Chapter, questionPoolApi, QuestionPool, QuestionPoolItem } from '@/services/lmsService';

const difficultyColors: Record<string, string> = {
  easy: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  hard: 'bg-red-100 text-red-700',
};

const questionTypeLabels: Record<string, string> = {
  mcq: 'MCQ',
  true_false: 'True/False',
  short_answer: 'Short Answer',
  long_answer: 'Long Answer',
  fill_blank: 'Fill Blank',
};

const QuestionPools = () => {
  const { toast } = useToast();
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [pools, setPools] = useState<QuestionPool[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPool, setEditingPool] = useState<QuestionPool | null>(null);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formClassId, setFormClassId] = useState('');
  const [formSubjectId, setFormSubjectId] = useState('');
  const [formChapterId, setFormChapterId] = useState('');
  const [formSubjects, setFormSubjects] = useState<Subject[]>([]);
  const [formChapters, setFormChapters] = useState<Chapter[]>([]);
  const [saving, setSaving] = useState(false);

  // Question editor state
  const [questionDialogOpen, setQuestionDialogOpen] = useState(false);
  const [selectedPoolId, setSelectedPoolId] = useState('');
  const [editQuestions, setEditQuestions] = useState<QuestionPoolItem[]>([]);
  const [expandedQ, setExpandedQ] = useState<number | null>(null);

  // Generate dialog
  const [generateOpen, setGenerateOpen] = useState(false);
  const [generatePoolId, setGeneratePoolId] = useState('');
  const [generateCount, setGenerateCount] = useState(10);
  const [generateDifficulty, setGenerateDifficulty] = useState('mixed');
  const [generatedQuestions, setGeneratedQuestions] = useState<any[] | null>(null);

  useEffect(() => { loadClasses(); }, []);
  useEffect(() => {
    if (selectedClassId) {
      loadSubjects(selectedClassId, setSubjects);
      setSelectedSubjectId('');
    }
  }, [selectedClassId]);
  useEffect(() => {
    loadPools();
  }, [selectedClassId, selectedSubjectId, search]);

  const loadClasses = async () => {
    try { setClasses((await classesApi.getClasses({ limit: 100, status: 'active' })).data || []); } catch {}
  };
  const loadSubjects = async (classId: string, setter: (s: Subject[]) => void) => {
    try { setter((await subjectApi.getAll({ limit: 100, classId, status: 'active' })).data || []); } catch {}
  };
  const loadChapters = async (classId: string, subjectId: string, setter: (c: Chapter[]) => void) => {
    try { setter((await chapterApi.getAll({ limit: 100, classId, subjectId })).data || []); } catch {}
  };
  const loadPools = async () => {
    setLoading(true);
    try {
      const params: any = { limit: 100 };
      if (selectedClassId) params.classId = selectedClassId;
      if (selectedSubjectId) params.subjectId = selectedSubjectId;
      if (search) params.search = search;
      const res = await questionPoolApi.getAll(params);
      setPools(res.data || []);
    } catch {} finally { setLoading(false); }
  };

  // ── Pool CRUD ──
  const openCreateDialog = () => {
    setEditingPool(null);
    setFormName(''); setFormDescription(''); setFormClassId(''); setFormSubjectId(''); setFormChapterId('');
    setFormSubjects([]); setFormChapters([]);
    setDialogOpen(true);
  };
  const openEditDialog = (pool: QuestionPool) => {
    setEditingPool(pool);
    setFormName(pool.name);
    setFormDescription(pool.description || '');
    const cId = typeof pool.classId === 'object' ? pool.classId._id : pool.classId;
    const sId = typeof pool.subjectId === 'object' ? pool.subjectId._id : pool.subjectId;
    const chId = pool.chapterId ? (typeof pool.chapterId === 'object' ? pool.chapterId._id : pool.chapterId) : '';
    setFormClassId(cId); setFormSubjectId(sId); setFormChapterId(chId);
    loadSubjects(cId, setFormSubjects);
    if (sId) loadChapters(cId, sId, setFormChapters);
    setDialogOpen(true);
  };

  useEffect(() => {
    if (formClassId && dialogOpen) loadSubjects(formClassId, setFormSubjects);
  }, [formClassId]);
  useEffect(() => {
    if (formClassId && formSubjectId && dialogOpen) loadChapters(formClassId, formSubjectId, setFormChapters);
  }, [formSubjectId]);

  const handleSavePool = async () => {
    if (!formName || !formClassId || !formSubjectId) {
      toast({ title: 'Error', description: 'Name, class and subject required', variant: 'destructive' }); return;
    }
    setSaving(true);
    try {
      const payload: any = { name: formName, description: formDescription, classId: formClassId, subjectId: formSubjectId, chapterId: formChapterId || null };
      if (editingPool) {
        await questionPoolApi.update(editingPool._id, payload);
        toast({ title: 'Updated' });
      } else {
        await questionPoolApi.create(payload);
        toast({ title: 'Created' });
      }
      setDialogOpen(false);
      loadPools();
    } catch (err: any) {
      toast({ title: 'Error', description: err?.response?.data?.message || 'Failed', variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const handleDeletePool = async (id: string) => {
    if (!confirm('Delete this question pool?')) return;
    try {
      await questionPoolApi.delete(id);
      toast({ title: 'Deleted' });
      loadPools();
    } catch (err: any) {
      toast({ title: 'Error', description: err?.response?.data?.message || 'Failed', variant: 'destructive' });
    }
  };

  // ── Question Editor ──
  const openQuestionEditor = async (poolId: string) => {
    setSelectedPoolId(poolId);
    try {
      const res = await questionPoolApi.getById(poolId);
      setEditQuestions(res.data?.questions || []);
      setExpandedQ(null);
      setQuestionDialogOpen(true);
    } catch {
      toast({ title: 'Error', description: 'Something went wrong while loading questions. Please try again.', variant: 'destructive' });
    }
  };

  const addQuestion = () => {
    const q: QuestionPoolItem = {
      questionText: '', questionType: 'mcq',
      options: [{ optionId: 'a', text: '', isCorrect: false }, { optionId: 'b', text: '', isCorrect: false }],
      correctAnswer: '', marks: 1, explanation: '', imageUrl: '',
      difficulty: 'medium', tags: []
    };
    setEditQuestions(prev => [...prev, q]);
    setExpandedQ(editQuestions.length);
  };

  const updateQuestion = (idx: number, field: string, value: any) => {
    setEditQuestions(prev => prev.map((q, i) => i === idx ? { ...q, [field]: value } : q));
  };

  const removeQuestion = (idx: number) => {
    setEditQuestions(prev => prev.filter((_, i) => i !== idx));
  };

  const addOption = (qIdx: number) => {
    setEditQuestions(prev => prev.map((q, i) => {
      if (i !== qIdx) return q;
      const nextId = String.fromCharCode(97 + q.options.length); // a, b, c, ...
      return { ...q, options: [...q.options, { optionId: nextId, text: '', isCorrect: false }] };
    }));
  };

  const updateOption = (qIdx: number, oIdx: number, field: string, value: any) => {
    setEditQuestions(prev => prev.map((q, i) => {
      if (i !== qIdx) return q;
      const opts = q.options.map((o, j) => {
        if (j !== oIdx) return field === 'isCorrect' && value === true && q.questionType !== 'mcq' ? { ...o, isCorrect: false } : o;
        return { ...o, [field]: value };
      });
      return { ...q, options: opts };
    }));
  };

  const removeOption = (qIdx: number, oIdx: number) => {
    setEditQuestions(prev => prev.map((q, i) => {
      if (i !== qIdx) return q;
      return { ...q, options: q.options.filter((_, j) => j !== oIdx) };
    }));
  };

  const saveQuestions = async () => {
    setSaving(true);
    try {
      await questionPoolApi.update(selectedPoolId, { questions: editQuestions } as any);
      toast({ title: 'Questions saved' });
      setQuestionDialogOpen(false);
      loadPools();
    } catch (err: any) {
      toast({ title: 'Error', description: err?.response?.data?.message || 'Save failed', variant: 'destructive' });
    } finally { setSaving(false); }
  };

  // ── Generate ──
  const handleGenerate = async () => {
    setSaving(true);
    try {
      const res = await questionPoolApi.generate(generatePoolId, { count: generateCount, difficulty: generateDifficulty });
      setGeneratedQuestions(res.data?.questions || []);
      toast({ title: `${res.data?.questions?.length || 0} questions generated (${res.data?.totalMarks} marks total)` });
    } catch (err: any) {
      toast({ title: 'Error', description: err?.response?.data?.message || 'Generate failed', variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const copyGeneratedToClipboard = () => {
    if (generatedQuestions) {
      navigator.clipboard.writeText(JSON.stringify(generatedQuestions, null, 2));
      toast({ title: 'Copied to clipboard' });
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Question Pools</h1>
            <p className="text-sm text-muted-foreground">Manage question banks for assessments</p>
          </div>
          <Button onClick={openCreateDialog} className="gap-2 w-full sm:w-auto">
            <Plus className="w-4 h-4" /> New Pool
          </Button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Select value={selectedClassId} onValueChange={setSelectedClassId}>
            <SelectTrigger><SelectValue placeholder="Filter by class" /></SelectTrigger>
            <SelectContent>
              {classes.map(c => <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId} disabled={!selectedClassId}>
            <SelectTrigger><SelectValue placeholder="Filter by subject" /></SelectTrigger>
            <SelectContent>
              {subjects.map(s => <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search pools..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
        </div>

        {/* Pool List */}
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
        ) : pools.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">
            <Database className="w-12 h-12 mx-auto mb-3 opacity-30" />
            No question pools found. Create one to get started.
          </CardContent></Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {pools.map(pool => {
              const subj = typeof pool.subjectId === 'object' ? pool.subjectId.name : '';
              const cls = typeof pool.classId === 'object' ? pool.classId.name : '';
              const ch = pool.chapterId && typeof pool.chapterId === 'object' ? pool.chapterId.name : '';
              const bd = pool.difficultyBreakdown;
              return (
                <Card key={pool._id} className="hover:shadow-md transition-shadow">
                  <CardContent className="py-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">{pool.name}</p>
                        <p className="text-xs text-muted-foreground">{cls} • {subj}{ch ? ` • ${ch}` : ''}</p>
                      </div>
                      <Badge variant="secondary">{pool.questionCount || 0} Q</Badge>
                    </div>
                    {bd && (
                      <div className="flex gap-1.5 text-xs">
                        <span className={`px-1.5 py-0.5 rounded ${difficultyColors.easy}`}>{bd.easy} Easy</span>
                        <span className={`px-1.5 py-0.5 rounded ${difficultyColors.medium}`}>{bd.medium} Med</span>
                        <span className={`px-1.5 py-0.5 rounded ${difficultyColors.hard}`}>{bd.hard} Hard</span>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-1.5">
                      <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => openQuestionEditor(pool._id)}>
                        <Edit className="w-3 h-3" /> Questions
                      </Button>
                      <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => { setGeneratePoolId(pool._id); setGeneratedQuestions(null); setGenerateOpen(true); }}>
                        <Shuffle className="w-3 h-3" /> Generate
                      </Button>
                      <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => openEditDialog(pool)}>
                        <Edit className="w-3 h-3" /> Edit
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive text-xs" onClick={() => handleDeletePool(pool._id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Create/Edit Pool Dialog ── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="w-[95vw] max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingPool ? 'Edit Pool' : 'New Question Pool'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div><Label>Pool Name</Label><Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="e.g. Chapter 1 — MCQ Bank" /></div>
            <div><Label>Description</Label><Textarea value={formDescription} onChange={e => setFormDescription(e.target.value)} rows={2} /></div>
            {!editingPool && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div><Label>Class</Label>
                    <Select value={formClassId} onValueChange={setFormClassId}>
                      <SelectTrigger><SelectValue placeholder="Class" /></SelectTrigger>
                      <SelectContent>{classes.map(c => <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Subject</Label>
                    <Select value={formSubjectId} onValueChange={setFormSubjectId} disabled={!formClassId}>
                      <SelectTrigger><SelectValue placeholder="Subject" /></SelectTrigger>
                      <SelectContent>{formSubjects.map(s => <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div><Label>Chapter (optional)</Label>
                  <Select value={formChapterId} onValueChange={setFormChapterId}>
                    <SelectTrigger><SelectValue placeholder="All chapters" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">All chapters</SelectItem>
                      {formChapters.map(c => <SelectItem key={c._id} value={c._id}>Ch {c.chapterNumber}: {c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSavePool} disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}{editingPool ? 'Update' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Question Editor Dialog ── */}
      <Dialog open={questionDialogOpen} onOpenChange={setQuestionDialogOpen}>
        <DialogContent className="w-[95vw] max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle>Manage Questions ({editQuestions.length})</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {editQuestions.map((q, idx) => (
              <Card key={idx}>
                <CardContent className="py-3">
                  <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpandedQ(expandedQ === idx ? null : idx)}>
                    <div className="flex items-center gap-2 min-w-0">
                      <Badge variant="outline" className="shrink-0">Q{idx + 1}</Badge>
                      <span className="text-sm truncate">{q.questionText || '(untitled)'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`text-xs ${difficultyColors[q.difficulty]}`}>{q.difficulty}</Badge>
                      {expandedQ === idx ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                  {expandedQ === idx && (
                    <div className="mt-3 space-y-3 border-t pt-3">
                      <Textarea value={q.questionText} onChange={e => updateQuestion(idx, 'questionText', e.target.value)} placeholder="Question text" rows={2} />
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        <div><Label className="text-xs">Type</Label>
                          <Select value={q.questionType} onValueChange={v => updateQuestion(idx, 'questionType', v)}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>{Object.entries(questionTypeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div><Label className="text-xs">Difficulty</Label>
                          <Select value={q.difficulty} onValueChange={v => updateQuestion(idx, 'difficulty', v)}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="easy">Easy</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="hard">Hard</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div><Label className="text-xs">Marks</Label>
                          <Input type="number" min={0} value={q.marks} onChange={e => updateQuestion(idx, 'marks', Number(e.target.value))} className="h-8 text-xs" />
                        </div>
                      </div>
                      {['mcq', 'true_false'].includes(q.questionType) && (
                        <div className="space-y-1.5">
                          <Label className="text-xs">Options</Label>
                          {q.options.map((o, oIdx) => (
                            <div key={oIdx} className="flex items-center gap-2">
                              <Switch checked={o.isCorrect} onCheckedChange={v => updateOption(idx, oIdx, 'isCorrect', v)} />
                              <Input value={o.text} onChange={e => updateOption(idx, oIdx, 'text', e.target.value)} placeholder={`Option ${o.optionId}`} className="h-8 text-xs flex-1" />
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeOption(idx, oIdx)}><Trash2 className="w-3 h-3 text-destructive" /></Button>
                            </div>
                          ))}
                          <Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => addOption(idx)}><Plus className="w-3 h-3" /> Option</Button>
                        </div>
                      )}
                      {['short_answer', 'long_answer', 'fill_blank'].includes(q.questionType) && (
                        <div><Label className="text-xs">Correct Answer</Label><Input value={q.correctAnswer || ''} onChange={e => updateQuestion(idx, 'correctAnswer', e.target.value)} className="h-8 text-xs" /></div>
                      )}
                      <div><Label className="text-xs">Explanation</Label><Input value={q.explanation || ''} onChange={e => updateQuestion(idx, 'explanation', e.target.value)} className="h-8 text-xs" placeholder="Optional explanation" /></div>
                      <Button variant="ghost" size="sm" className="text-destructive text-xs" onClick={() => removeQuestion(idx)}>
                        <Trash2 className="w-3 h-3 mr-1" /> Remove Question
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            <Button variant="outline" className="w-full gap-2" onClick={addQuestion}>
              <Plus className="w-4 h-4" /> Add Question
            </Button>
          </div>
          <DialogFooter className="shrink-0 border-t pt-3">
            <Button variant="outline" onClick={() => setQuestionDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveQuestions} disabled={saving}>{saving && <Loader2 className="w-4 h-4 animate-spin mr-1" />}Save Questions</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Generate Dialog ── */}
      <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
        <DialogContent className="w-[95vw] max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Generate Questions from Pool</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div><Label>Number of Questions</Label>
              <Input type="number" min={1} value={generateCount} onChange={e => setGenerateCount(Number(e.target.value))} />
            </div>
            <div><Label>Difficulty Filter</Label>
              <Select value={generateDifficulty} onValueChange={setGenerateDifficulty}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="mixed">Mixed</SelectItem>
                  <SelectItem value="easy">Easy only</SelectItem>
                  <SelectItem value="medium">Medium only</SelectItem>
                  <SelectItem value="hard">Hard only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleGenerate} disabled={saving} className="w-full gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shuffle className="w-4 h-4" />}
              Generate
            </Button>
            {generatedQuestions && (
              <div className="border rounded-lg p-3 space-y-2 max-h-60 overflow-y-auto">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{generatedQuestions.length} questions generated</p>
                  <Button variant="outline" size="sm" onClick={copyGeneratedToClipboard} className="gap-1 text-xs"><Copy className="w-3 h-3" /> Copy JSON</Button>
                </div>
                {generatedQuestions.map((q, i) => (
                  <div key={i} className="text-xs p-2 bg-muted rounded">
                    <span className="font-medium">Q{q.questionNumber}.</span> {q.questionText} <span className="text-muted-foreground">({q.marks}m)</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default QuestionPools;
