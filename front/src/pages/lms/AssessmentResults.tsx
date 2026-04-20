import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Loader2, Users, Target, TrendingUp, Award } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { submissionApi, AssessmentSummary } from '@/services/lmsService';

const AssessmentResults = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [summary, setSummary] = useState<AssessmentSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) loadSummary();
  }, [id]);

  const loadSummary = async () => {
    setLoading(true);
    try {
      const res = await submissionApi.getAssessmentSummary(id!);
      setSummary(res.data);
    } catch (err: any) {
      toast({ title: 'Error', description: err.response?.data?.message || 'Something went wrong while loading. Please try again results', variant: 'destructive' });
    } finally {
      setLoading(false);
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

  if (!summary) {
    return (
      <AppLayout>
        <div className="text-center py-20 text-muted-foreground">
          <p>No results found</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </AppLayout>
    );
  }

  const { assessment, summary: stats, questionAnalysis, submissions } = summary;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">{assessment.title} — Results</h1>
            <p className="text-sm text-muted-foreground">Total Marks: {assessment.totalMarks} • Passing: {assessment.passingMarks}</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="py-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalSubmissions}</p>
                <p className="text-xs text-muted-foreground">Submissions</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Award className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.passRate.toFixed(0)}%</p>
                <p className="text-xs text-muted-foreground">Pass Rate</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.avgScore.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">Avg Score</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <Target className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.highestScore}/{stats.lowestScore}</p>
                <p className="text-xs text-muted-foreground">High / Low</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Question Analysis */}
        {questionAnalysis.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Question-wise Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {questionAnalysis.map(qa => (
                <div key={qa.questionNumber} className="flex items-center gap-4">
                  <div className="w-8 text-sm font-medium text-center">Q{qa.questionNumber}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{qa.questionText}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Progress value={qa.accuracy} className="flex-1 h-2" />
                      <span className="text-xs font-medium w-10 text-right">{qa.accuracy.toFixed(0)}%</span>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground whitespace-nowrap">
                    {qa.correct}/{qa.attempted}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Student-wise Results */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Student Results</CardTitle>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Adm No</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>%</TableHead>
                <TableHead>Result</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissions.map(sub => (
                <TableRow key={sub._id}>
                  <TableCell className="font-medium">{sub.student.name}</TableCell>
                  <TableCell>{sub.student.admissionNo}</TableCell>
                  <TableCell>{sub.totalMarksAwarded !== undefined ? `${sub.totalMarksAwarded}/${assessment.totalMarks}` : '-'}</TableCell>
                  <TableCell>{sub.percentage !== undefined ? `${sub.percentage}%` : '-'}</TableCell>
                  <TableCell>
                    {sub.isPassed !== undefined && (
                      <Badge className={sub.isPassed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                        {sub.isPassed ? 'Pass' : 'Fail'}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{sub.status.replace('_', ' ')}</Badge>
                  </TableCell>
                </TableRow>
              ))}
              {submissions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">No submissions yet</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </AppLayout>
  );
};

export default AssessmentResults;
