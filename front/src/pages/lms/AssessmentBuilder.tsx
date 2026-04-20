import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  ArrowLeft, Plus, Trash2, Loader2, Save, GripVertical,
  CheckCircle2, XCircle, ChevronDown, ChevronUp, Database
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { classesApi, Class } from '@/services/classes';
import { subjectApi, Subject } from '@/services/subjectService';
import { chapterApi, Chapter, assessmentApi, LmsAssessment, AssessmentQuestion, AssessmentSettings, questionPoolApi, QuestionPool } from '@/services/lmsService';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

type QuestionType = AssessmentQuestion['questionType'];

const questionTypeLabels: Record<QuestionType, string> = {
  mcq: 'Multiple Choice',
  true_false: 'True / False',
  short_answer: 'Short Answer',
  long_answer: 'Long Answer',
  fill_blank: 'Fill in the Blank',
};

const emptyQuestion = (num: number): AssessmentQuestion => ({
  questionNumber: num,
  questionText: '',
  questionType: 'mcq',
  options: [
    { optionId: 'a', text: '', isCorrect: false },
    { optionId: 'b', text: '', isCorrect: false },
    { optionId: 'c', text: '', isCorrect: false },
    { optionId: 'd', text: '', isCorrect: false },
  ],
  marks: 1,
  correctAnswer: '',
  explanation: '',
});

const defaultSettings: AssessmentSettings = {
  shuffleQuestions: false,
  shuffleOptions: false,
  showResults: 'immediately',
  allowRetake: false,
  maxRetakes: 1,
  showCorrectAnswers: true,
};

const AssessmentBuilder = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = id && id !== 'new';

  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [assessmentType, setAssessmentType] = useState<'quiz' | 'assignment' | 'online_exam'>('quiz');
  const [classId, setClassId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [chapterId, setChapterId] = useState('');
  const [instructions, setInstructions] = useState('');
  const [passingMarks, setPassingMarks] = useState(0);
  const [duration, setDuration] = useState<number | ''>('');
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([emptyQuestion(1)]);
  const [settings, setSettings] = useState<AssessmentSettings>(defaultSettings);
  const [expandedQ, setExpandedQ] = useState<number | null>(0);

  // Import from Pool state
  const [poolDialogOpen, setPoolDialogOpen] = useState(false);
  const [pools, setPools] = useState<QuestionPool[]>([]);
  const [selectedPoolId, setSelectedPoolId] = useState('');
  const [poolImportCount, setPoolImportCount] = useState(5);
  const [poolImportDifficulty, setPoolImportDifficulty] = useState<string>('');
  const [poolLoading, setPoolLoading] = useState(false);

  useEffect(() => { loadClasses(); }, []);

  useEffect(() => {
    if (classId) {
      loadSubjects();
    } else {
      setSubjects([]);
      setSubjectId('');
    }
  }, [classId]);

  useEffect(() => {
    if (classId && subjectId) {
      loadChapters();
    } else {
      setChapters([]);
      setChapterId('');
    }
  }, [classId, subjectId]);

  useEffect(() => {
    if (isEditing) loadAssessment();
  }, [id]);

  const loadClasses = async () => {
    try {
      const res = await classesApi.getClasses({ limit: 100, status: 'active' });
      setClasses(res.data || []);
    } catch { /* ignore */ }
  };

  const loadSubjects = async () => {
    try {
      const res = await subjectApi.getAll({ limit: 100, classId, status: 'active' });
      setSubjects(res.data || []);
    } catch { /* ignore */ }
  };

  const loadChapters = async () => {
    try {
      const res = await chapterApi.getAll({ classId, subjectId, limit: 100, status: 'active' });
      setChapters(res.data || []);
    } catch { /* ignore */ }
  };

  const loadAssessment = async () => {
    setLoading(true);
    try {
      const res = await assessmentApi.getById(id!);
      const a = res.data;
      setTitle(a.title);
      setAssessmentType(a.assessmentType);
      setClassId(typeof a.classId === 'string' ? a.classId : a.classId._id);
      setSubjectId(typeof a.subjectId === 'string' ? a.subjectId : a.subjectId._id);
      setChapterId(a.chapterId ? (typeof a.chapterId === 'string' ? a.chapterId : a.chapterId._id) : '');
      setInstructions(a.instructions || '');
      setPassingMarks(a.passingMarks);
      setDuration(a.duration || '');
      setQuestions(a.questions.length > 0 ? a.questions : [emptyQuestion(1)]);
      setSettings(a.settings || defaultSettings);
    } catch {
      toast({ title: 'Error', description: 'Failed to load assessment', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const totalMarks = questions.reduce((sum, q) => sum + (q.marks || 0), 0);

  const addQuestion = () => {
    const newQ = emptyQuestion(questions.length + 1);
    setQuestions(prev => [...prev, newQ]);
    setExpandedQ(questions.length);
  };

  const openPoolImport = async () => {
    setPoolDialogOpen(true);
    setSelectedPoolId('');
    setPoolImportCount(5);
    setPoolImportDifficulty('');
    try {
      const params: Record<string, string> = {};
      if (subjectId) params.subjectId = subjectId;
      if (classId) params.classId = classId;
      const res = await questionPoolApi.getAll(params);
      setPools(res.data || []);
    } catch {
      toast({ title: 'Failed to load pools', variant: 'destructive' });
    }
  };

  const importFromPool = async () => {
    if (!selectedPoolId) return;
    setPoolLoading(true);
    try {
      const opts: { count: number; difficulty?: string } = { count: poolImportCount };
      if (poolImportDifficulty) opts.difficulty = poolImportDifficulty;
      const res = await questionPoolApi.generate(selectedPoolId, opts);
      const generated: AssessmentQuestion[] = (res.data?.questions || []).map((gq: any, i: number) => ({
        questionNumber: questions.length + i + 1,
        questionText: gq.questionText,
        questionType: gq.questionType,
        options: gq.options || [],
        correctAnswer: gq.correctAnswer,
        marks: gq.marks || 1,
        explanation: gq.explanation,
        imageUrl: gq.imageUrl,
      }));
      if (generated.length === 0) {
        toast({ title: 'No matching questions found', variant: 'destructive' });
        return;
      }
      // If current questions is just a single empty one, replace it
      const hasOnlyEmpty = questions.length === 1 && !questions[0].questionText;
      const base = hasOnlyEmpty ? [] : questions;
      const merged = [...base, ...generated].map((q, i) => ({ ...q, questionNumber: i + 1 }));
      setQuestions(merged);
      setPoolDialogOpen(false);
      toast({ title: `Imported ${generated.length} questions from pool` });
    } catch {
      toast({ title: 'Failed to generate questions', variant: 'destructive' });
    } finally {
      setPoolLoading(false);
    }
  };

  const removeQuestion = (idx: number) => {
    if (questions.length <= 1) return;
    setQuestions(prev => prev.filter((_, i) => i !== idx).map((q, i) => ({ ...q, questionNumber: i + 1 })));
    setExpandedQ(null);
  };

  const updateQuestion = (idx: number, updates: Partial<AssessmentQuestion>) => {
    setQuestions(prev => prev.map((q, i) => i === idx ? { ...q, ...updates } : q));
  };

  const updateOption = (qIdx: number, optIdx: number, updates: Partial<{ text: string; isCorrect: boolean }>) => {
    setQuestions(prev => prev.map((q, qi) => {
      if (qi !== qIdx) return q;
      const newOpts = q.options.map((o, oi) => {
        if (oi !== optIdx) {
          // For MCQ/true_false, only one correct answer
          if (updates.isCorrect && (q.questionType === 'mcq' || q.questionType === 'true_false')) {
            return { ...o, isCorrect: false };
          }
          return o;
        }
        return { ...o, ...updates };
      });
      return { ...q, options: newOpts };
    }));
  };

  const addOption = (qIdx: number) => {
    setQuestions(prev => prev.map((q, i) => {
      if (i !== qIdx) return q;
      const nextId = String.fromCharCode(97 + q.options.length); // a, b, c, d, e...
      return { ...q, options: [...q.options, { optionId: nextId, text: '', isCorrect: false }] };
    }));
  };

  const removeOption = (qIdx: number, optIdx: number) => {
    setQuestions(prev => prev.map((q, i) => {
      if (i !== qIdx || q.options.length <= 2) return q;
      return { ...q, options: q.options.filter((_, oi) => oi !== optIdx) };
    }));
  };

  const changeQuestionType = (qIdx: number, type: QuestionType) => {
    setQuestions(prev => prev.map((q, i) => {
      if (i !== qIdx) return q;
      if (type === 'true_false') {
        return {
          ...q,
          questionType: type,
          options: [
            { optionId: 'true', text: 'True', isCorrect: false },
            { optionId: 'false', text: 'False', isCorrect: false },
          ]
        };
      }
      if (type === 'mcq') {
        return {
          ...q,
          questionType: type,
          options: q.options.length >= 2 ? q.options : [
            { optionId: 'a', text: '', isCorrect: false },
            { optionId: 'b', text: '', isCorrect: false },
            { optionId: 'c', text: '', isCorrect: false },
            { optionId: 'd', text: '', isCorrect: false },
          ]
        };
      }
      // short_answer, long_answer, fill_blank - no options needed
      return { ...q, questionType: type, options: [] };
    }));
  };

  const handleSave = async (publish = false) => {
    if (!title) { toast({ title: 'Validation', description: 'Title is required', variant: 'destructive' }); return; }
    if (!classId) { toast({ title: 'Validation', description: 'Class is required', variant: 'destructive' }); return; }
    if (!subjectId) { toast({ title: 'Validation', description: 'Subject is required', variant: 'destructive' }); return; }

    // Validate questions have content
    if (assessmentType !== 'assignment') {
      for (const q of questions) {
        if (!q.questionText.trim()) {
          toast({ title: 'Validation', description: `Question ${q.questionNumber} text is empty`, variant: 'destructive' });
          return;
        }
        if ((q.questionType === 'mcq' || q.questionType === 'true_false') && !q.options.some(o => o.isCorrect)) {
          toast({ title: 'Validation', description: `Question ${q.questionNumber}: Mark a correct answer`, variant: 'destructive' });
          return;
        }
      }
    }

    setSaving(true);
    try {
      const payload: any = {
        title,
        assessmentType,
        classId,
        subjectId,
        chapterId: chapterId || undefined,
        instructions,
        passingMarks,
        duration: duration || undefined,
        questions: assessmentType === 'assignment' ? [] : questions,
        settings,
        status: publish ? 'published' : 'draft',
      };

      if (isEditing) {
        await assessmentApi.update(id!, payload);
        toast({ title: 'Saved', description: publish ? 'Assessment published' : 'Assessment updated' });
      } else {
        const res = await assessmentApi.create(payload);
        toast({ title: 'Created', description: publish ? 'Assessment published' : 'Assessment created' });
        navigate(`/lms/assessments/${res.data._id}`, { replace: true });
        return;
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.response?.data?.message || 'Failed to save', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  const showQuestionBuilder = assessmentType !== 'assignment';

  return (
    <AppLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/lms/assessments')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{isEditing ? 'Edit Assessment' : 'Create Assessment'}</h1>
              {totalMarks > 0 && (
                <p className="text-muted-foreground text-sm">Total: {totalMarks} marks • {questions.length} questions</p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleSave(false)} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <Save className="w-4 h-4 mr-2" />
              Save Draft
            </Button>
            <Button onClick={() => handleSave(true)} disabled={saving}>
              Save & Publish
            </Button>
          </div>
        </div>

        {/* Basic Info */}
        <Card>
          <CardHeader><CardTitle className="text-base">Assessment Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label>Title *</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Chapter 3 Quiz" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label>Type</Label>
                <Select value={assessmentType} onValueChange={v => setAssessmentType(v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quiz">Quiz</SelectItem>
                    <SelectItem value="assignment">Assignment</SelectItem>
                    <SelectItem value="online_exam">Online Exam</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Class *</Label>
                <Select value={classId} onValueChange={setClassId}>
                  <SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger>
                  <SelectContent>
                    {classes.map(c => <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Subject *</Label>
                <Select value={subjectId} onValueChange={setSubjectId} disabled={!classId}>
                  <SelectTrigger><SelectValue placeholder="Select Subject" /></SelectTrigger>
                  <SelectContent>
                    {subjects.map(s => <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label>Chapter (optional)</Label>
                <Select value={chapterId || '__none__'} onValueChange={v => setChapterId(v === '__none__' ? '' : v)} disabled={!subjectId}>
                  <SelectTrigger><SelectValue placeholder="No chapter" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">No specific chapter</SelectItem>
                    {chapters.map(ch => <SelectItem key={ch._id} value={ch._id}>Ch.{ch.chapterNumber}: {ch.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Passing Marks</Label>
                <Input type="number" min={0} value={passingMarks} onChange={e => setPassingMarks(parseInt(e.target.value) || 0)} />
              </div>
              <div className="grid gap-2">
                <Label>Duration (minutes)</Label>
                <Input type="number" min={0} value={duration} onChange={e => setDuration(e.target.value ? parseInt(e.target.value) : '')} placeholder="No limit" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Instructions</Label>
              <Textarea value={instructions} onChange={e => setInstructions(e.target.value)} placeholder="Instructions for students..." rows={3} />
            </div>
          </CardContent>
        </Card>

        {/* Settings */}
        <Card>
          <CardHeader><CardTitle className="text-base">Settings</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <Label>Shuffle Questions</Label>
                <Switch checked={settings.shuffleQuestions} onCheckedChange={v => setSettings(s => ({ ...s, shuffleQuestions: v }))} />
              </div>
              <div className="flex items-center justify-between">
                <Label>Shuffle Options</Label>
                <Switch checked={settings.shuffleOptions} onCheckedChange={v => setSettings(s => ({ ...s, shuffleOptions: v }))} />
              </div>
              <div className="flex items-center justify-between">
                <Label>Show Correct Answers</Label>
                <Switch checked={settings.showCorrectAnswers} onCheckedChange={v => setSettings(s => ({ ...s, showCorrectAnswers: v }))} />
              </div>
              <div className="flex items-center justify-between">
                <Label>Allow Retake</Label>
                <Switch checked={settings.allowRetake} onCheckedChange={v => setSettings(s => ({ ...s, allowRetake: v }))} />
              </div>
              {settings.allowRetake && (
                <div className="grid gap-2">
                  <Label>Max Retakes</Label>
                  <Input type="number" min={1} max={10} value={settings.maxRetakes} onChange={e => setSettings(s => ({ ...s, maxRetakes: parseInt(e.target.value) || 1 }))} />
                </div>
              )}
              <div className="grid gap-2">
                <Label>Show Results</Label>
                <Select value={settings.showResults} onValueChange={v => setSettings(s => ({ ...s, showResults: v as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediately">Immediately after submission</SelectItem>
                    <SelectItem value="after_due_date">After due date</SelectItem>
                    <SelectItem value="manual">Manual release only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Question Builder */}
        {showQuestionBuilder && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Questions ({questions.length})</h2>
              <div className="flex gap-2">
                <Button onClick={openPoolImport} variant="outline" size="sm">
                  <Database className="w-4 h-4 mr-2" />
                  Import from Pool
                </Button>
                <Button onClick={addQuestion} variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Question
                </Button>
              </div>
            </div>

            {questions.map((q, qIdx) => {
              const isExpanded = expandedQ === qIdx;
              const showOptions = q.questionType === 'mcq' || q.questionType === 'true_false';
              const showCorrectAnswer = q.questionType === 'fill_blank';

              return (
                <Card key={qIdx} className={isExpanded ? 'ring-1 ring-primary/30' : ''}>
                  <CardContent className="py-3">
                    {/* Question header — always visible */}
                    <div
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => setExpandedQ(isExpanded ? null : qIdx)}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Badge variant="outline" className="flex-shrink-0">Q{q.questionNumber}</Badge>
                        <span className="text-sm truncate flex-1">
                          {q.questionText || <span className="text-muted-foreground italic">Empty question</span>}
                        </span>
                        <Badge variant="secondary" className="text-[10px] flex-shrink-0">{questionTypeLabels[q.questionType]}</Badge>
                        <span className="text-xs text-muted-foreground flex-shrink-0">{q.marks} marks</span>
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        {questions.length > 1 && (
                          <Button size="icon" variant="ghost" onClick={e => { e.stopPropagation(); removeQuestion(qIdx); }}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        )}
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>

                    {/* Expanded question editor */}
                    {isExpanded && (
                      <div className="mt-4 space-y-4 border-t pt-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="sm:col-span-2 grid gap-2">
                            <Label>Question Text *</Label>
                            <Textarea
                              value={q.questionText}
                              onChange={e => updateQuestion(qIdx, { questionText: e.target.value })}
                              placeholder="Enter the question..."
                              rows={2}
                            />
                          </div>
                          <div className="space-y-4">
                            <div className="grid gap-2">
                              <Label>Type</Label>
                              <Select value={q.questionType} onValueChange={v => changeQuestionType(qIdx, v as QuestionType)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {Object.entries(questionTypeLabels).map(([k, v]) => (
                                    <SelectItem key={k} value={k}>{v}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="grid gap-2">
                              <Label>Marks</Label>
                              <Input type="number" min={0} value={q.marks} onChange={e => updateQuestion(qIdx, { marks: parseInt(e.target.value) || 0 })} />
                            </div>
                          </div>
                        </div>

                        {/* Options (MCQ / True-False) */}
                        {showOptions && (
                          <div className="space-y-2">
                            <Label>Options (click ✓ to mark correct)</Label>
                            {q.options.map((opt, oIdx) => (
                              <div key={opt.optionId} className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => updateOption(qIdx, oIdx, { isCorrect: true })}
                                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                                    opt.isCorrect
                                      ? 'border-green-500 bg-green-50 text-green-600 dark:bg-green-900/30'
                                      : 'border-gray-300 hover:border-gray-400 text-gray-400'
                                  }`}
                                >
                                  {opt.isCorrect ? <CheckCircle2 className="w-4 h-4" /> : <span className="text-xs font-bold uppercase">{opt.optionId}</span>}
                                </button>
                                <Input
                                  value={opt.text}
                                  onChange={e => updateOption(qIdx, oIdx, { text: e.target.value })}
                                  placeholder={`Option ${opt.optionId.toUpperCase()}`}
                                  className="flex-1"
                                  disabled={q.questionType === 'true_false'}
                                />
                                {q.questionType === 'mcq' && q.options.length > 2 && (
                                  <Button size="icon" variant="ghost" onClick={() => removeOption(qIdx, oIdx)}>
                                    <XCircle className="w-4 h-4 text-muted-foreground" />
                                  </Button>
                                )}
                              </div>
                            ))}
                            {q.questionType === 'mcq' && q.options.length < 8 && (
                              <Button size="sm" variant="ghost" onClick={() => addOption(qIdx)} className="text-xs">
                                <Plus className="w-3 h-3 mr-1" />
                                Add Option
                              </Button>
                            )}
                          </div>
                        )}

                        {/* Correct answer for fill_blank */}
                        {showCorrectAnswer && (
                          <div className="grid gap-2">
                            <Label>Correct Answer (for auto-grading)</Label>
                            <Input
                              value={q.correctAnswer || ''}
                              onChange={e => updateQuestion(qIdx, { correctAnswer: e.target.value })}
                              placeholder="Exact answer text"
                            />
                          </div>
                        )}

                        {/* Explanation */}
                        <div className="grid gap-2">
                          <Label>Explanation (shown after submission)</Label>
                          <Input
                            value={q.explanation || ''}
                            onChange={e => updateQuestion(qIdx, { explanation: e.target.value })}
                            placeholder="Optional explanation for the correct answer"
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}

            <Button onClick={addQuestion} variant="outline" className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Add Question
            </Button>
          </div>
        )}

        {/* Assignment type — no question builder, just instructions */}
        {assessmentType === 'assignment' && (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">
                Assignments don't have questions. Students will submit files or text responses.
                <br />
                Use the instructions field above to describe the assignment.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Import from Pool Dialog */}
        <Dialog open={poolDialogOpen} onOpenChange={setPoolDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Import Questions from Pool</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Question Pool</Label>
                <Select value={selectedPoolId} onValueChange={setSelectedPoolId}>
                  <SelectTrigger><SelectValue placeholder="Select a pool" /></SelectTrigger>
                  <SelectContent>
                    {pools.map(p => (
                      <SelectItem key={p._id} value={p._id}>
                        {p.name} ({p.questionCount || p.questions?.length || 0} questions)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {pools.length === 0 && <p className="text-xs text-muted-foreground mt-1">No pools found{classId || subjectId ? ' for selected class/subject' : ''}. Create one in Question Pools.</p>}
              </div>
              <div>
                <Label>Number of Questions</Label>
                <Input type="number" min={1} max={50} value={poolImportCount} onChange={e => setPoolImportCount(Number(e.target.value) || 1)} />
              </div>
              <div>
                <Label>Difficulty (optional)</Label>
                <Select value={poolImportDifficulty} onValueChange={setPoolImportDifficulty}>
                  <SelectTrigger><SelectValue placeholder="Any difficulty" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any</SelectItem>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPoolDialogOpen(false)}>Cancel</Button>
              <Button onClick={importFromPool} disabled={!selectedPoolId || poolLoading}>
                {poolLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Import
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Bottom save bar */}
        <div className="flex justify-end gap-2 pb-8">
          <Button variant="outline" onClick={() => navigate('/lms/assessments')}>Cancel</Button>
          <Button variant="outline" onClick={() => handleSave(false)} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Draft
          </Button>
          <Button onClick={() => handleSave(true)} disabled={saving}>
            Save & Publish
          </Button>
        </div>
      </div>
    </AppLayout>
  );
};

export default AssessmentBuilder;
