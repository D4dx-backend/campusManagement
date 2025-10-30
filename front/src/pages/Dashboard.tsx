import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useDashboardStats } from '@/hooks/useDashboard';
import { Users, UserCog, DollarSign, TrendingUp, BookOpen, Receipt, Search, Clock, Calendar, ArrowRight, Loader2 } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Quick menu items for search - organized by categories
  const quickMenuItems = [
    // Academic Management
    { label: 'Students', path: '/students', icon: Users, description: 'Academic: Manage student records' },
    { label: 'Staff', path: '/staff', icon: UserCog, description: 'Academic: Manage staff information' },
    { label: 'Textbook Indents', path: '/textbook-indents', icon: BookOpen, description: 'Academic: Manage textbook indents' },
    
    // Financial Management
    { label: 'Fee Management', path: '/fees', icon: DollarSign, description: 'Financial: Collect and manage fees' },
    { label: 'Payroll', path: '/payroll', icon: Receipt, description: 'Financial: Staff salary management' },
    { label: 'Expenses', path: '/expenses', icon: Receipt, description: 'Financial: Track school expenses' },
    
    // Reports & Analytics
    { label: 'Reports', path: '/reports', icon: TrendingUp, description: 'Analytics: View reports and insights' },
    { label: 'Activity Log', path: '/activity-log', icon: Clock, description: 'Analytics: View system activities' },
    
    // Master Data items
    { label: 'Classes', path: '/classes', icon: Users, description: 'Master Data: Manage class structures' },
    { label: 'Divisions', path: '/divisions', icon: Users, description: 'Master Data: Manage class divisions' },
    { label: 'Departments', path: '/departments', icon: UserCog, description: 'Master Data: Manage departments' },
    { label: 'Text Books', path: '/textbooks', icon: BookOpen, description: 'Master Data: Manage textbook inventory' },
    { label: 'User Access', path: '/user-access', icon: UserCog, description: 'Master Data: Manage user permissions' },
    
    // Super Admin
    ...(user?.role === 'super_admin' ? [
      { label: 'Branch Management', path: '/branch-management', icon: Users, description: 'Super Admin: Manage multiple branches' },
    ] : []),
  ];

  const filteredMenuItems = quickMenuItems.filter(item =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleQuickNavigation = (path: string) => {
    navigate(path);
    setSearchQuery('');
    setShowQuickMenu(false);
  };

  const formatLastLogin = (lastLogin?: string) => {
    if (!lastLogin) return 'First time login';
    const date = new Date(lastLogin);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    if (diffInHours < 48) return 'Yesterday';
    return date.toLocaleDateString();
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Fetch dashboard data from API
  const { data: dashboardData, isLoading, error } = useDashboardStats();

  const stats = dashboardData ? [
    {
      title: 'Total Students',
      value: dashboardData.data?.students?.total?.toLocaleString() || '0',
      icon: Users,
      trend: `${dashboardData.data?.students?.active || 0} active students`,
      color: 'text-primary',
    },
    {
      title: 'Total Staff',
      value: dashboardData.data?.staff?.total?.toLocaleString() || '0',
      icon: UserCog,
      trend: `${dashboardData.data?.staff?.active || 0} active staff`,
      color: 'text-secondary',
    },
    {
      title: 'Fee Collection',
      value: `₹${(dashboardData.data?.fees?.totalCollection / 100000 || 0).toFixed(1)}L`,
      icon: DollarSign,
      trend: `₹${(dashboardData.data?.fees?.monthlyCollection / 1000 || 0).toFixed(0)}K this month`,
      color: 'text-green-600',
    },
    {
      title: 'Monthly Expenses',
      value: `₹${((dashboardData.data?.expenses?.monthlyExpenses || 0) / 100000).toFixed(1)}L`,
      icon: Receipt,
      trend: `₹${((dashboardData.data?.expenses?.totalExpenses || 0) / 100000).toFixed(1)}L total`,
      color: 'text-orange-600',
    },
    {
      title: 'Text Books',
      value: dashboardData.data?.textbooks?.totalBooks?.toLocaleString() || '0',
      icon: BookOpen,
      trend: `${dashboardData.data?.textbooks?.availableBooks || 0} available`,
      color: 'text-blue-600',
    },
    {
      title: 'Net Income',
      value: `₹${(((dashboardData.data?.fees?.totalCollection || 0) - (dashboardData.data?.expenses?.totalExpenses || 0)) / 100000).toFixed(1)}L`,
      icon: TrendingUp,
      trend: 'Total profit/loss',
      color: 'text-purple-600',
    },
  ] : [];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header with Last Login and Quick Search */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2">
              <p className="text-muted-foreground">{getGreeting()}, {user?.name}!</p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{currentTime.toLocaleDateString()} {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>Last login: {formatLastLogin(user?.lastLogin)}</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  {user?.role}
                </Badge>
              </div>
            </div>
          </div>
          
          {/* Quick Search */}
          <div className="relative w-full lg:w-80">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Quick search menus..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowQuickMenu(e.target.value.length > 0);
                }}
                onFocus={() => setShowQuickMenu(searchQuery.length > 0)}
                onBlur={() => setTimeout(() => setShowQuickMenu(false), 200)}
                className="pl-10"
              />
            </div>
            
            {/* Quick Menu Dropdown */}
            {showQuickMenu && filteredMenuItems.length > 0 && (
              <Card className="absolute top-full left-0 right-0 mt-2 z-50 max-h-80 overflow-y-auto">
                <CardContent className="p-2">
                  {filteredMenuItems.slice(0, 8).map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.path}
                        onClick={() => handleQuickNavigation(item.path)}
                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors text-left"
                      >
                        <Icon className="w-5 h-5 text-primary" />
                        <div className="flex-1">
                          <p className="font-medium text-sm">{item.label}</p>
                          <p className="text-xs text-muted-foreground">{item.description}</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground" />
                      </button>
                    );
                  })}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="ml-2">Loading dashboard data...</span>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-destructive mb-4">Failed to load dashboard data</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.title} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </CardTitle>
                    <Icon className={`w-5 h-5 ${stat.color}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{stat.value}</div>
                    <p className="text-xs text-muted-foreground mt-2">{stat.trend}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dashboardData?.data?.recentActivities?.slice(0, 3).map((activity, index) => (
                  <div key={index} className="flex items-start gap-3 pb-3 border-b last:border-b-0">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      activity.action === 'CREATE' ? 'bg-primary' : 
                      activity.action === 'UPDATE' ? 'bg-secondary' : 
                      activity.action === 'DELETE' ? 'bg-destructive' : 'bg-orange-500'
                    }`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.action} {activity.module}</p>
                      <p className="text-xs text-muted-foreground">{activity.details}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(activity.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                )) || (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">No recent activities</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="p-4 h-auto flex-col items-start gap-2 hover:bg-accent transition-colors"
                  onClick={() => navigate('/students')}
                >
                  <Users className="w-5 h-5 text-primary" />
                  <p className="text-sm font-medium">Add Student</p>
                </Button>
                <Button
                  variant="outline"
                  className="p-4 h-auto flex-col items-start gap-2 hover:bg-accent transition-colors"
                  onClick={() => navigate('/fees')}
                >
                  <DollarSign className="w-5 h-5 text-secondary" />
                  <p className="text-sm font-medium">Collect Fee</p>
                </Button>
                <Button
                  variant="outline"
                  className="p-4 h-auto flex-col items-start gap-2 hover:bg-accent transition-colors"
                  onClick={() => navigate('/expenses')}
                >
                  <Receipt className="w-5 h-5 text-orange-600" />
                  <p className="text-sm font-medium">Add Expense</p>
                </Button>
                <Button
                  variant="outline"
                  className="p-4 h-auto flex-col items-start gap-2 hover:bg-accent transition-colors"
                  onClick={() => navigate('/reports')}
                >
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                  <p className="text-sm font-medium">View Reports</p>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
