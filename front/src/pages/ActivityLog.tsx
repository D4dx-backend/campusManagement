import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Activity, User, Calendar, Filter, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useActivityLogs } from '@/hooks/useActivityLogs';

const ActivityLog = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterModule, setFilterModule] = useState('all');
  const [filterAction, setFilterAction] = useState('all');

  const { data: response, isLoading, error } = useActivityLogs({
    page: currentPage,
    limit: itemsPerPage,
    search: searchTerm,
    module: filterModule !== 'all' ? filterModule : undefined,
    action: filterAction !== 'all' ? filterAction : undefined,
  });

  const activityLogs = response?.data || [];
  const pagination = response?.pagination;

  // Get unique modules and actions for filters
  const modules = useMemo(() => {
    const uniqueModules = [...new Set(activityLogs.map((log: any) => log.module))];
    return uniqueModules as string[];
  }, [activityLogs]);

  const actions = useMemo(() => {
    const uniqueActions = [...new Set(activityLogs.map((log: any) => log.action))];
    return uniqueActions as string[];
  }, [activityLogs]);

  const filteredLogs = activityLogs;

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'create':
      case 'add':
        return 'bg-green-100 text-green-800';
      case 'update':
      case 'edit':
        return 'bg-blue-100 text-blue-800';
      case 'delete':
      case 'remove':
        return 'bg-red-100 text-red-800';
      case 'login':
        return 'bg-purple-100 text-purple-800';
      case 'logout':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-orange-100 text-orange-800';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'super_admin':
        return 'bg-purple-100 text-purple-800';
      case 'branch_admin':
        return 'bg-red-100 text-red-800';
      case 'admin': // Legacy support
        return 'bg-red-100 text-red-800';
      case 'teacher':
        return 'bg-blue-100 text-blue-800';
      case 'accountant':
        return 'bg-green-100 text-green-800';
      case 'staff':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Activity Log</h1>
            <p className="text-muted-foreground mt-1">Monitor system activities and user actions</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Activities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{pagination?.total || 0}</div>
              <p className="text-xs text-muted-foreground mt-2">All time</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Current Page</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{activityLogs.length}</div>
              <p className="text-xs text-muted-foreground mt-2">Records shown</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {new Set(activityLogs.map((log: any) => log.userId)).size}
              </div>
              <p className="text-xs text-muted-foreground mt-2">On this page</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Most Active Module</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">
                {modules.length > 0 ? 
                  modules.reduce((a: any, b: any) => 
                    activityLogs.filter((log: any) => log.module === a).length > 
                    activityLogs.filter((log: any) => log.module === b).length ? a : b
                  ) : 'N/A'
                }
              </div>
              <p className="text-xs text-muted-foreground mt-2">Most used</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search by user, action, module, or details..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Select value={filterModule} onValueChange={setFilterModule}>
                  <SelectTrigger className="w-40">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Module" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Modules</SelectItem>
                    {modules.map(module => (
                      <SelectItem key={module} value={module}>{module}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={filterAction} onValueChange={setFilterAction}>
                  <SelectTrigger className="w-40">
                    <Activity className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    {actions.map(action => (
                      <SelectItem key={action} value={action}>{action}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <Activity className="w-12 h-12 text-destructive mx-auto mb-4" />
                <p className="text-destructive">Error loading activity logs</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredLogs.length === 0 ? (
                  <div className="text-center py-12">
                    <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No activity logs found</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3">
                      {filteredLogs.map((log: any) => {
                        const { date, time } = formatTimestamp(log.timestamp);
                        return (
                          <Card key={log._id} className="border-l-4 border-l-primary/20">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <User className="w-4 h-4 text-muted-foreground" />
                                    <span className="font-medium">{log.userName}</span>
                                    <Badge className={getRoleColor(log.userRole)}>
                                      {log.userRole}
                                    </Badge>
                                    <Badge className={getActionColor(log.action)}>
                                      {log.action}
                                    </Badge>
                                    <Badge variant="outline">
                                      {log.module}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground mb-2">
                                    {log.details}
                                  </p>
                                  {log.ipAddress && (
                                    <p className="text-xs text-muted-foreground">
                                      IP: {log.ipAddress}
                                    </p>
                                  )}
                                </div>
                                <div className="text-right text-sm text-muted-foreground ml-4">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    <span>{date}</span>
                                  </div>
                                  <div className="mt-1">{time}</div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>

                    {/* Pagination Controls */}
                    {pagination && pagination.pages > 1 && (
                      <div className="flex items-center justify-between pt-4 border-t">
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
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default ActivityLog;