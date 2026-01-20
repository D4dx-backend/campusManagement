import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState, useEffect } from 'react';
import { Bus, Users, MapPin, Download, Phone, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface RouteData {
  routeId: string;
  routeName: string;
  vehicleNumber: string;
  driverName: string;
  students: Array<{
    admissionNo: string;
    name: string;
    class: string;
    division: string;
    guardianContact: string;
  }>;
  count: number;
}

interface ClassBreakdown {
  class: string;
  total: number;
  schoolTransport: number;
  ownTransport: number;
  noTransport: number;
}

interface TransportData {
  statistics: {
    total: number;
    schoolTransport: number;
    ownTransport: number;
    noTransport: number;
  };
  routeWiseBreakdown: RouteData[];
  classWiseBreakdown: ClassBreakdown[];
  students: {
    schoolTransport: Array<{
      admissionNo: string;
      name: string;
      class: string;
      division: string;
      route: string;
      guardianContact: string;
    }>;
    ownTransport: Array<{
      admissionNo: string;
      name: string;
      class: string;
      division: string;
      guardianContact: string;
    }>;
  };
}

const TransportReport = () => {
  const [data, setData] = useState<TransportData | null>(null);
  const [pagination, setPagination] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  const [activeTab, setActiveTab] = useState('overview');
  const [transportFilter, setTransportFilter] = useState<string>('all');
  const { toast } = useToast();

  const fetchTransportReport = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: currentPage,
        limit: itemsPerPage,
      };
      if (transportFilter !== 'all') {
        params.transportType = transportFilter;
      }
      const response = await api.get('/reports/transport', { params });
      if (response.data.success) {
        setData(response.data.data);
        setPagination(response.data.pagination);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to fetch transport report',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransportReport();
  }, [currentPage, transportFilter]);

  const exportToCSV = (type: 'all' | 'routes' | 'students') => {
    if (!data) return;

    let csv = '';
    let filename = '';

    switch (type) {
      case 'routes':
        csv = [
          ['Route Name', 'Vehicle Number', 'Driver Name', 'Student Count'].join(','),
          ...data.routeWiseBreakdown.map(route => [
            route.routeName,
            route.vehicleNumber,
            route.driverName,
            route.count
          ].join(','))
        ].join('\n');
        filename = 'transport-routes.csv';
        break;

      case 'students':
        csv = [
          ['Admission No', 'Name', 'Class', 'Division', 'Route', 'Contact'].join(','),
          ...data.students.schoolTransport.map(s => [
            s.admissionNo,
            s.name,
            s.class,
            s.division,
            s.route,
            s.guardianContact
          ].join(','))
        ].join('\n');
        filename = 'transport-students.csv';
        break;

      default:
        csv = [
          ['Class', 'Total', 'School Transport', 'Own Transport', 'No Transport'].join(','),
          ...data.classWiseBreakdown.map(c => [
            c.class,
            c.total,
            c.schoolTransport,
            c.ownTransport,
            c.noTransport
          ].join(','))
        ].join('\n');
        filename = 'transport-overview.csv';
    }

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
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
            <h1 className="text-3xl font-bold">Transport Report</h1>
            <p className="text-muted-foreground">Student transport statistics and route details</p>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.statistics.total}</div>
              <p className="text-xs text-muted-foreground mt-1">Active students</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">School Transport</CardTitle>
              <Bus className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{data?.statistics.schoolTransport}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {data?.statistics.total ? ((data.statistics.schoolTransport / data.statistics.total) * 100).toFixed(1) : 0}% of total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Own Transport</CardTitle>
              <MapPin className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{data?.statistics.ownTransport}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {data?.statistics.total ? ((data.statistics.ownTransport / data.statistics.total) * 100).toFixed(1) : 0}% of total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">No Transport</CardTitle>
              <Users className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">{data?.statistics.noTransport}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {data?.statistics.total ? ((data.statistics.noTransport / data.statistics.total) * 100).toFixed(1) : 0}% of total
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for different views */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="routes">Routes</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="own-transport">Own Transport</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Class-wise Transport Breakdown</CardTitle>
                <Button onClick={() => exportToCSV('all')} variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Class</TableHead>
                        <TableHead>Total Students</TableHead>
                        <TableHead>School Transport</TableHead>
                        <TableHead>Own Transport</TableHead>
                        <TableHead>No Transport</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data?.classWiseBreakdown.map((classData) => (
                        <TableRow key={classData.class}>
                          <TableCell className="font-medium">{classData.class}</TableCell>
                          <TableCell>{classData.total}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-blue-50 text-blue-700">
                              {classData.schoolTransport}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-green-50 text-green-700">
                              {classData.ownTransport}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-gray-50 text-gray-700">
                              {classData.noTransport}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Routes Tab */}
          <TabsContent value="routes" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Route-wise Student Distribution</CardTitle>
                <Button onClick={() => exportToCSV('routes')} variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {data?.routeWiseBreakdown.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No transport routes configured
                  </div>
                ) : (
                  data?.routeWiseBreakdown.map((route) => (
                    <Card key={route.routeId}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">{route.routeName}</CardTitle>
                            <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Bus className="w-4 h-4" />
                                {route.vehicleNumber}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                Driver: {route.driverName}
                              </span>
                            </div>
                          </div>
                          <Badge className="text-lg px-3 py-1">{route.count} Students</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="rounded-md border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Admission No</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Class</TableHead>
                                <TableHead>Contact</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {route.students.map((student) => (
                                <TableRow key={student.admissionNo}>
                                  <TableCell className="font-medium">{student.admissionNo}</TableCell>
                                  <TableCell>{student.name}</TableCell>
                                  <TableCell>{student.class} - {student.division}</TableCell>
                                  <TableCell>
                                    {student.guardianContact && (
                                      <span className="flex items-center gap-1 text-sm">
                                        <Phone className="w-3 h-3" />
                                        {student.guardianContact}
                                      </span>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* School Transport Students Tab */}
          <TabsContent value="students" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>All Students Transport Details</CardTitle>
                <Button onClick={() => exportToCSV('students')} variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Admission No</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead>Transport</TableHead>
                        <TableHead>Route</TableHead>
                        <TableHead>Contact</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {!data?.students?.schoolTransport || data.students.schoolTransport.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            No students found
                          </TableCell>
                        </TableRow>
                      ) : (
                        data.students.schoolTransport.map((student) => (
                          <TableRow key={student.admissionNo}>
                            <TableCell className="font-medium">{student.admissionNo}</TableCell>
                            <TableCell>{student.name}</TableCell>
                            <TableCell>{student.class} - {student.division}</TableCell>
                            <TableCell>
                              <Badge variant="default">School</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{student.route}</Badge>
                            </TableCell>
                            <TableCell>
                              {student.guardianContact && (
                                <span className="flex items-center gap-1 text-sm">
                                  <Phone className="w-3 h-3" />
                                  {student.guardianContact}
                                </span>
                              )}
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
                      Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, pagination.total)} of {pagination.total} students
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
          </TabsContent>

          {/* Own Transport Students Tab */}
          <TabsContent value="own-transport" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Students Using Own Transport</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Admission No</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead>Contact</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {!data?.students?.ownTransport || data.students.ownTransport.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                            No students using own transport
                          </TableCell>
                        </TableRow>
                      ) : (
                        data.students.ownTransport.map((student: any) => (
                          <TableRow key={student.admissionNo}>
                            <TableCell className="font-medium">{student.admissionNo}</TableCell>
                            <TableCell>{student.name}</TableCell>
                            <TableCell>{student.class} - {student.division}</TableCell>
                            <TableCell>
                              {student.guardianContact && (
                                <span className="flex items-center gap-1 text-sm">
                                  <Phone className="w-3 h-3" />
                                  {student.guardianContact}
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default TransportReport;
