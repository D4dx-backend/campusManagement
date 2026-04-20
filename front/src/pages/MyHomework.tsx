import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, BookOpen, Calendar } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import homeworkService, { HomeworkItem } from '@/services/homeworkService';

const MyHomework = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['my-homework'],
    queryFn: () => homeworkService.getForStudent({}),
  });

  const items: HomeworkItem[] = data?.data || [];

  const formatDate = (d: string) => new Date(d).toLocaleDateString();
  const isOverdue = (dueDate: string) => new Date(dueDate) < new Date();
  const isToday = (d: string) => new Date(d).toDateString() === new Date().toDateString();

  // Group by date
  const grouped: Record<string, HomeworkItem[]> = {};
  items.forEach((hw) => {
    const key = hw.date.split('T')[0];
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(hw);
  });

  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">My Homework</h1>
          <p className="text-muted-foreground text-sm">View assigned homework and daily diary</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : items.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">No homework assigned recently</CardContent></Card>
        ) : (
          <div className="space-y-6">
            {sortedDates.map((dateKey) => (
              <div key={dateKey}>
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <h2 className="text-sm font-semibold text-muted-foreground">
                    {isToday(dateKey) ? 'Today' : formatDate(dateKey)}
                  </h2>
                </div>
                <div className="space-y-3">
                  {grouped[dateKey].map((hw) => (
                    <Card key={hw._id}>
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <BookOpen className="w-4 h-4 text-primary" />
                              <CardTitle className="text-base">{hw.title}</CardTitle>
                            </div>
                            <div className="flex gap-2">
                              <Badge variant="secondary">{hw.className}</Badge>
                              <Badge variant="outline">{hw.subjectName}</Badge>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={`text-xs font-medium ${isOverdue(hw.dueDate) ? 'text-red-600' : 'text-muted-foreground'}`}>
                              Due: {formatDate(hw.dueDate)}
                            </span>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm whitespace-pre-wrap">{hw.description}</p>
                        <p className="text-xs text-muted-foreground mt-2">Assigned by {hw.assignedByName}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default MyHomework;
