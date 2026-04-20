import { useQuery } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Award, BookOpen } from 'lucide-react';
import { studentPortalApi, ExamResult } from '@/services/studentPortalService';

const MyMarks = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['my-marks'],
    queryFn: () => studentPortalApi.getMyMarks(),
  });

  const exams: ExamResult[] = data?.data || [];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">My Marks & Grades</h1>
          <p className="text-muted-foreground mt-1">View your exam results</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : exams.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No exam results available yet.</p>
            </CardContent>
          </Card>
        ) : (
          exams.map((exam, idx) => {
            const percentage = exam.totalMax > 0
              ? Math.round((exam.total / exam.totalMax) * 100)
              : 0;

            return (
              <Card key={idx}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-primary" />
                      <CardTitle className="text-base">{exam.examName}</CardTitle>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{exam.academicYear}</Badge>
                      <Badge variant={percentage >= 60 ? 'default' : percentage >= 35 ? 'secondary' : 'destructive'}>
                        {exam.total}/{exam.totalMax} ({percentage}%)
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 font-medium">Subject</th>
                          <th className="text-center py-2 font-medium">Marks</th>
                          <th className="text-center py-2 font-medium">Max</th>
                          <th className="text-center py-2 font-medium">Pass</th>
                          <th className="text-center py-2 font-medium">Grade</th>
                          <th className="text-center py-2 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {exam.subjects.map((sub, si) => {
                          const passed = sub.mark !== null && sub.mark >= sub.passMark;
                          return (
                            <tr key={si} className="border-b last:border-b-0">
                              <td className="py-2">{sub.subjectName}</td>
                              <td className="text-center py-2 font-medium">{sub.mark ?? '-'}</td>
                              <td className="text-center py-2 text-muted-foreground">{sub.maxMark}</td>
                              <td className="text-center py-2 text-muted-foreground">{sub.passMark}</td>
                              <td className="text-center py-2">
                                {sub.grade ? <Badge variant="outline">{sub.grade}</Badge> : '-'}
                              </td>
                              <td className="text-center py-2">
                                {sub.mark !== null ? (
                                  <Badge variant={passed ? 'default' : 'destructive'} className="text-xs">
                                    {passed ? 'Pass' : 'Fail'}
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </AppLayout>
  );
};

export default MyMarks;
