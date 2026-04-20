import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Clock, CheckCircle2, Send, Loader2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { assessmentApi, submissionApi, LmsAssessment, SubmissionAnswer } from '@/services/lmsService';

const AttemptQuiz = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [assessment, setAssessment] = useState<LmsAssessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<any>(null);

  const [answers, setAnswers] = useState<Record<number, SubmissionAnswer>>({});
  const [currentQ, setCurrentQ] = useState(0);
  const [startedAt] = useState(new Date().toISOString());
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (id) loadAssessment();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [id]);

  const loadAssessment = async () => {
    setLoading(true);
    try {
      const res = await assessmentApi.getForStudent(id!);
      setAssessment(res.data);
      // Start timer if duration set
      if (res.data.duration) {
        setTimeLeft(res.data.duration * 60); // convert to seconds
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.response?.data?.message || 'Failed to load', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Timer
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || submitted) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null || prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          // Auto-submit when time is up
          handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timeLeft, submitted]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const selectAnswer = (questionNumber: number, selectedOption: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionNumber]: { questionNumber, selectedOption }
    }));
  };

  const setTextAnswer = (questionNumber: number, textAnswer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionNumber]: { questionNumber, textAnswer }
    }));
  };

  const handleSubmit = useCallback(async (autoSubmit = false) => {
    if (submitted || submitting) return;
    if (!autoSubmit && !confirm('Are you sure you want to submit? You cannot change your answers after submitting.')) return;

    setSubmitting(true);
    try {
      const ansArray = Object.values(answers);
      const timeSpent = assessment?.duration
        ? (assessment.duration * 60) - (timeLeft || 0)
        : Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);

      const res = await submissionApi.submit({
        assessmentId: id!,
        studentId: user?.studentId || user?._id || '',
        answers: ansArray,
        submissionType: (() => {
          const types = new Set(questions.map(q => q.questionType));
          if (types.size === 1 && (types.has('mcq') || types.has('true_false'))) return 'mcq_answers';
          if (types.size === 1 && (types.has('short_answer') || types.has('long_answer') || types.has('fill_blank'))) return 'text_answers';
          return 'mixed';
        })(),
        startedAt,
        timeSpent
      });

      setResult(res.data);
      setSubmitted(true);
      if (timerRef.current) clearInterval(timerRef.current);
      toast({ title: autoSubmit ? 'Time\'s up!' : 'Submitted', description: res.message });
    } catch (err: any) {
      toast({ title: 'Error', description: err.response?.data?.message || 'Failed to submit', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  }, [submitted, submitting, answers, assessment, timeLeft, startedAt, id, user]);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  if (!assessment) {
    return (
      <AppLayout>
        <div className="text-center py-20">
          <AlertTriangle className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
          <h2 className="text-lg font-medium">Assessment not found</h2>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/lms/assessments')}>Go Back</Button>
        </div>
      </AppLayout>
    );
  }

  // Result view
  if (submitted && result) {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto space-y-6 py-8">
          <Card>
            <CardContent className="py-8 text-center">
              <CheckCircle2 className={`w-16 h-16 mx-auto mb-4 ${result.isPassed ? 'text-green-500' : 'text-orange-500'}`} />
              <h2 className="text-2xl font-bold mb-2">
                {result.status === 'graded' ? (result.isPassed ? 'Passed!' : 'Not Passed') : 'Submitted'}
              </h2>
              <p className="text-muted-foreground mb-4">{assessment.title}</p>
              {result.status === 'graded' && (
                <div className="grid grid-cols-3 gap-2 sm:gap-4 max-w-sm mx-auto mt-6">
                  <div>
                    <p className="text-2xl font-bold">{result.totalMarksAwarded}</p>
                    <p className="text-xs text-muted-foreground">Score</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{assessment.totalMarks}</p>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{result.percentage}%</p>
                    <p className="text-xs text-muted-foreground">Percentage</p>
                  </div>
                </div>
              )}
              {result.status === 'submitted' && (
                <p className="text-sm text-muted-foreground mt-4">Your answers have been submitted. The teacher will grade them soon.</p>
              )}
              <Button className="mt-6" onClick={() => navigate('/lms/assessments')}>Back to Assessments</Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  const questions = assessment.questions || [];
  const currentQuestion = questions[currentQ];
  const answeredCount = Object.keys(answers).length;

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold truncate">{assessment.title}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {questions.length} questions • {assessment.totalMarks} marks
              {assessment.passingMarks > 0 && ` • Pass: ${assessment.passingMarks}`}
            </p>
          </div>
          {timeLeft !== null && (
            <Badge variant={timeLeft < 60 ? 'destructive' : timeLeft < 300 ? 'secondary' : 'outline'} className="text-base px-3 py-1.5">
              <Clock className="w-4 h-4 mr-1.5" />
              {formatTime(timeLeft)}
            </Badge>
          )}
        </div>

        {/* Instructions */}
        {assessment.instructions && (
          <Card>
            <CardContent className="py-3">
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{assessment.instructions}</p>
            </CardContent>
          </Card>
        )}

        {/* Question navigation bubbles */}
        <Card>
          <CardContent className="py-3">
            <div className="flex flex-wrap gap-2">
              {questions.map((q, idx) => {
                const isAnswered = !!answers[q.questionNumber];
                const isCurrent = idx === currentQ;
                return (
                  <button
                    key={idx}
                    onClick={() => setCurrentQ(idx)}
                    className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                      isCurrent
                        ? 'bg-primary text-primary-foreground'
                        : isAnswered
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-2">{answeredCount}/{questions.length} answered</p>
          </CardContent>
        </Card>

        {/* Current Question */}
        {currentQuestion && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Question {currentQuestion.questionNumber}</CardTitle>
                <Badge variant="outline">{currentQuestion.marks} marks</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm whitespace-pre-wrap">{currentQuestion.questionText}</p>

              {currentQuestion.imageUrl && (
                <img src={currentQuestion.imageUrl} alt="Question" className="max-w-full max-h-64 rounded-lg border object-contain" />
              )}

              {/* MCQ / True-False options */}
              {(currentQuestion.questionType === 'mcq' || currentQuestion.questionType === 'true_false') && (
                <div className="space-y-2">
                  {currentQuestion.options.map(opt => {
                    const isSelected = answers[currentQuestion.questionNumber]?.selectedOption === opt.optionId;
                    return (
                      <button
                        key={opt.optionId}
                        onClick={() => selectAnswer(currentQuestion.questionNumber, opt.optionId)}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 text-left transition-colors ${
                          isSelected
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/30'
                        }`}
                      >
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 border-2 text-xs font-bold ${
                          isSelected
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-gray-300'
                        }`}>
                          {opt.optionId.toUpperCase()}
                        </div>
                        <span className="text-sm">{opt.text}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Short answer / Fill blank */}
              {(currentQuestion.questionType === 'short_answer' || currentQuestion.questionType === 'fill_blank') && (
                <div>
                  <Label>Your Answer</Label>
                  <Input
                    value={answers[currentQuestion.questionNumber]?.textAnswer || ''}
                    onChange={e => setTextAnswer(currentQuestion.questionNumber, e.target.value)}
                    placeholder="Type your answer..."
                    className="mt-1"
                  />
                </div>
              )}

              {/* Long answer */}
              {currentQuestion.questionType === 'long_answer' && (
                <div>
                  <Label>Your Answer</Label>
                  <Textarea
                    value={answers[currentQuestion.questionNumber]?.textAnswer || ''}
                    onChange={e => setTextAnswer(currentQuestion.questionNumber, e.target.value)}
                    placeholder="Write your answer..."
                    rows={6}
                    className="mt-1"
                  />
                </div>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between pt-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentQ(prev => Math.max(0, prev - 1))}
                  disabled={currentQ === 0}
                >
                  Previous
                </Button>
                {currentQ < questions.length - 1 ? (
                  <Button onClick={() => setCurrentQ(prev => Math.min(questions.length - 1, prev + 1))}>
                    Next
                  </Button>
                ) : (
                  <Button onClick={() => handleSubmit(false)} disabled={submitting}>
                    {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    <Send className="w-4 h-4 mr-2" />
                    Submit
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submit button (always visible) */}
        <div className="flex justify-end pb-6">
          <Button onClick={() => handleSubmit(false)} disabled={submitting} variant="default">
            {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            <Send className="w-4 h-4 mr-2" />
            Submit Quiz ({answeredCount}/{questions.length} answered)
          </Button>
        </div>
      </div>
    </AppLayout>
  );
};

export default AttemptQuiz;
