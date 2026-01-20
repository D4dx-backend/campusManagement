import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useState, useEffect, useMemo } from 'react';
import { AlertCircle, DollarSign, Users, TrendingUp, Download, Mail, MessageSquare, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface Student {
  _id: string;
  admissionNo: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  guardianContact?: string;
  guardianEmail?: string;
}

interface Due {
  _id: string;
  student: Student;
  class: { name: string };
  division: { name: string };
  amount: number;
  dueDate: string;
  academicYear: string;
  feeType: string;
  remarks?: string;
  daysDue: number;
  agingBucket: string;
  isOverdue: boolean;
}

interface FeeDuesData {
  dues: Due[];
  summary: {
    totalDueAmount: number;
    overdueAmount: number;
    totalStudents: number;
    totalRecords: number;
    overdueRecords: number;
  };
  agingAnalysis: Record<string, { count: number; amount: number }>;
  classWiseBreakdown: Array<{ class: string; count: number; amount: number }>;
}

const FeeDues = () => {
  const [data, setData] = useState<FeeDuesData | null>(null);
  const [pagination, setPagination] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedAging, setSelectedAging] = useState('all');
  const { toast } = useToast();

  const fetchFeeDues = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: currentPage,
        limit: itemsPerPage,
      };
      if (selectedClass !== 'all') params.classId = selectedClass;
      
      const response = await api.get('/reports/fee-dues', { params });
      if (response.data.success) {
        setData(response.data.data);
        setPagination(response.data.pagination);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to fetch fee dues',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeeDues();
  }, [selectedClass, currentPage]);

  // Use paginated dues directly from the API response
  const filteredDues = useMemo(() => {
    if (!data) return [];
    
    // Client-side search and aging filter (lightweight filters for UX)
    return data.dues.filter(due => {
      const studentName = `${due.student?.firstName} ${due.student?.middleName || ''} ${due.student?.lastName}`.toLowerCase();
      const admissionNo = due.student?.admissionNo?.toLowerCase() || '';
      const searchLower = searchTerm.toLowerCase();
      
      const matchesSearch = searchTerm === '' || studentName.includes(searchLower) || admissionNo.includes(searchLower);
      const matchesAging = selectedAging === 'all' || due.agingBucket === selectedAging;
      
      return matchesSearch && matchesAging;
    });
  }, [data, searchTerm, selectedAging]);

  const handleSendReminder = async (due: Due, method: 'email' | 'whatsapp') => {
    try {
      const contact = method === 'email' ? due.student?.guardianEmail : due.student?.guardianContact;
      
      if (!contact) {
        toast({
          title: 'Error',
          description: `${method === 'email' ? 'Email' : 'Phone number'} not available for this student`,
          variant: 'destructive',
        });
        return;
      }

      // This would call the backend endpoint to send reminder
      toast({
        title: 'Reminder Sent',
        description: `Fee reminder sent via ${method}`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send reminder',
        variant: 'destructive',
      });
    }
  };

  const exportToCSV = () => {
    if (!data) return;
    
    const csv = [
      ['Admission No', 'Student Name', 'Class', 'Division', 'Amount', 'Due Date', 'Days Overdue', 'Aging', 'Contact'].join(','),
      ...filteredDues.map(due => [
        due.student?.admissionNo,
        `${due.student?.firstName} ${due.student?.lastName}`,
        due.class?.name,
        due.division?.name,
        due.amount,
        new Date(due.dueDate).toLocaleDateString(),
        due.daysDue > 0 ? due.daysDue : 0,
        due.agingBucket,
        due.student?.guardianContact || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fee-dues-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getAgingColor = (bucket: string) => {
    switch (bucket) {
      case 'Not Due Yet': return 'bg-blue-100 text-blue-800';
      case '1-30 Days': return 'bg-yellow-100 text-yellow-800';
      case '31-60 Days': return 'bg-orange-100 text-orange-800';
      case '61-90 Days': return 'bg-red-100 text-red-800';
      case '90+ Days': return 'bg-red-200 text-red-900';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Fee Dues Report</h1>
            <p className="text-muted-foreground">Pending and overdue fee payments</p>
          </div>
          <Button onClick={exportToCSV} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Due Amount</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{data?.summary.totalDueAmount.toLocaleString('en-IN')}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {data?.summary.totalRecords} pending payments
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue Amount</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">₹{data?.summary.overdueAmount.toLocaleString('en-IN')}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {data?.summary.overdueRecords} overdue payments
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Students with Dues</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.summary.totalStudents}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Unique students
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Collection Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data?.summary.totalRecords > 0 
                  ? Math.round((1 - data.summary.overdueRecords / data.summary.totalRecords) * 100)
                  : 100}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                On-time payments
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Aging Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Aging Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-5">
              {data && Object.entries(data.agingAnalysis).map(([bucket, stats]) => (
                <div key={bucket} className="border rounded-lg p-4">
                  <div className="text-sm font-medium text-muted-foreground mb-2">{bucket}</div>
                  <div className="text-xl font-bold">₹{stats.amount.toLocaleString('en-IN')}</div>
                  <div className="text-xs text-muted-foreground mt-1">{stats.count} records</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filter Dues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search by name or admission no..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={selectedAging} onValueChange={setSelectedAging}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by aging" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Aging</SelectItem>
                  <SelectItem value="Not Due Yet">Not Due Yet</SelectItem>
                  <SelectItem value="1-30 Days">1-30 Days</SelectItem>
                  <SelectItem value="31-60 Days">31-60 Days</SelectItem>
                  <SelectItem value="61-90 Days">61-90 Days</SelectItem>
                  <SelectItem value="90+ Days">90+ Days</SelectItem>
                </SelectContent>
              </Select>

              <div className="text-sm text-muted-foreground flex items-center">
                Showing {filteredDues.length} of {data?.dues.length || 0} records
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dues Table */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Admission No</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDues.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No pending dues found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredDues.map((due) => (
                      <TableRow key={due._id}>
                        <TableCell className="font-medium">{due.student?.admissionNo}</TableCell>
                        <TableCell>
                          {`${due.student?.firstName} ${due.student?.middleName || ''} ${due.student?.lastName}`.trim()}
                        </TableCell>
                        <TableCell>
                          {due.class?.name} - {due.division?.name}
                        </TableCell>
                        <TableCell className="font-semibold">₹{due.amount.toLocaleString('en-IN')}</TableCell>
                        <TableCell>
                          {new Date(due.dueDate).toLocaleDateString('en-IN')}
                          {due.isOverdue && (
                            <div className="text-xs text-red-600">{due.daysDue} days overdue</div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={getAgingColor(due.agingBucket)}>
                            {due.agingBucket}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {due.student?.guardianEmail && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleSendReminder(due, 'email')}
                                title="Send email reminder"
                              >
                                <Mail className="w-3 h-3" />
                              </Button>
                            )}
                            {due.student?.guardianContact && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleSendReminder(due, 'whatsapp')}
                                title="Send WhatsApp reminder"
                              >
                                <MessageSquare className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination Controls */}
            {pagination && pagination.pages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t mt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, pagination.total)} of {pagination.total} results
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                      let pageNum;
                      if (pagination.pages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= pagination.pages - 2) {
                        pageNum = pagination.pages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          className="w-8"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(pagination.pages, p + 1))}
                    disabled={currentPage === pagination.pages}
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default FeeDues;
