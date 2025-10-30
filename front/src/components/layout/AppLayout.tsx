import { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  LayoutDashboard,
  Users,
  UserCog,
  DollarSign,
  Receipt,
  FileText,
  BookOpen,
  TrendingUp,
  LogOut,
  Menu,
  X,
  GraduationCap,
  Settings,
  ChevronDown,
  ChevronRight,
  Building2,
  Activity,
  Briefcase,
  Search,
  School,
  Wallet,
  BarChart3,
} from 'lucide-react';
import { useState, useMemo } from 'react';

interface AppLayoutProps {
  children: ReactNode;
}

// Main dashboard item (always visible)
const dashboardItem = { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' };

// Academic Management Section
const academicManagementItems = [
  { icon: Users, label: 'Students', path: '/students' },
  { icon: UserCog, label: 'Staff', path: '/staff' },
  { icon: BookOpen, label: 'Textbook Indents', path: '/textbook-indents' },
];

// Financial Management Section
const financialManagementItems = [
  { icon: DollarSign, label: 'Fee Management', path: '/fees' },
  { icon: Receipt, label: 'Payroll', path: '/payroll' },
  { icon: FileText, label: 'Expenses', path: '/expenses' },
];

// Reports & Analytics Section
const reportsAnalyticsItems = [
  { icon: TrendingUp, label: 'Reports', path: '/reports' },
  { icon: Activity, label: 'Activity Log', path: '/activity-log' },
];

// Super Admin Section
const superAdminItems = [
  { icon: Building2, label: 'Branch Management', path: '/branch-management' },
];

// Master Data Section
const masterDataItems = [
  { icon: GraduationCap, label: 'Classes', path: '/classes' },
  { icon: Users, label: 'Divisions', path: '/divisions' },
  { icon: Building2, label: 'Departments', path: '/departments' },
  { icon: Briefcase, label: 'Designations', path: '/designations' },
  { icon: BookOpen, label: 'Text Books', path: '/textbooks' },
  { icon: Receipt, label: 'Expense Categories', path: '/expense-categories' },
  { icon: TrendingUp, label: 'Income Categories', path: '/income-categories' },
  { icon: FileText, label: 'Receipt Config', path: '/receipt-config' },
  { icon: UserCog, label: 'User Access', path: '/user-access' },
];

export const AppLayout = ({ children }: AppLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAcademicOpen, setIsAcademicOpen] = useState(false);
  const [isFinancialOpen, setIsFinancialOpen] = useState(false);
  const [isReportsOpen, setIsReportsOpen] = useState(false);
  const [isMasterDataOpen, setIsMasterDataOpen] = useState(false);
  const [menuSearchTerm, setMenuSearchTerm] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Filter menu items based on search term
  const filteredAcademicItems = useMemo(() => {
    if (!menuSearchTerm) return academicManagementItems;
    return academicManagementItems.filter(item => 
      item.label.toLowerCase().includes(menuSearchTerm.toLowerCase())
    );
  }, [menuSearchTerm]);

  const filteredFinancialItems = useMemo(() => {
    if (!menuSearchTerm) return financialManagementItems;
    return financialManagementItems.filter(item => 
      item.label.toLowerCase().includes(menuSearchTerm.toLowerCase())
    );
  }, [menuSearchTerm]);

  const filteredReportsItems = useMemo(() => {
    if (!menuSearchTerm) return reportsAnalyticsItems;
    return reportsAnalyticsItems.filter(item => 
      item.label.toLowerCase().includes(menuSearchTerm.toLowerCase())
    );
  }, [menuSearchTerm]);

  const filteredSuperAdminItems = useMemo(() => {
    if (!menuSearchTerm) return superAdminItems;
    return superAdminItems.filter(item => 
      item.label.toLowerCase().includes(menuSearchTerm.toLowerCase())
    );
  }, [menuSearchTerm]);

  const filteredMasterDataItems = useMemo(() => {
    if (!menuSearchTerm) return masterDataItems;
    return masterDataItems.filter(item => 
      item.label.toLowerCase().includes(menuSearchTerm.toLowerCase())
    );
  }, [menuSearchTerm]);

  // Auto-expand sections if search matches any items
  const shouldExpandAcademic = useMemo(() => {
    if (!menuSearchTerm) return isAcademicOpen;
    return filteredAcademicItems.length > 0;
  }, [menuSearchTerm, filteredAcademicItems.length, isAcademicOpen]);

  const shouldExpandFinancial = useMemo(() => {
    if (!menuSearchTerm) return isFinancialOpen;
    return filteredFinancialItems.length > 0;
  }, [menuSearchTerm, filteredFinancialItems.length, isFinancialOpen]);

  const shouldExpandReports = useMemo(() => {
    if (!menuSearchTerm) return isReportsOpen;
    return filteredReportsItems.length > 0;
  }, [menuSearchTerm, filteredReportsItems.length, isReportsOpen]);

  const shouldExpandMasterData = useMemo(() => {
    if (!menuSearchTerm) return isMasterDataOpen;
    return filteredMasterDataItems.length > 0;
  }, [menuSearchTerm, filteredMasterDataItems.length, isMasterDataOpen]);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-lg bg-card border border-border"
      >
        {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-sidebar border-r border-sidebar-border transform transition-transform duration-200 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-sidebar-border">
            <h1 className="text-2xl font-bold text-sidebar-primary">CampusWise</h1>
            <p className="text-sm text-sidebar-foreground/70 mt-1">D4Media Institution</p>
          </div>

          {/* Menu Search */}
          <div className="px-3 py-2 border-b border-sidebar-border/20">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sidebar-foreground/50 w-4 h-4" />
              <Input
                placeholder="Search menu..."
                value={menuSearchTerm}
                onChange={(e) => setMenuSearchTerm(e.target.value)}
                className="pl-10 bg-sidebar-accent/20 border-sidebar-border/30 text-sidebar-foreground placeholder:text-sidebar-foreground/50"
              />
            </div>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 px-3 py-4">
            <nav className="space-y-1">
              {/* Dashboard - Always visible */}
              <button
                onClick={() => {
                  navigate(dashboardItem.path);
                  setIsSidebarOpen(false);
                  setMenuSearchTerm('');
                }}
                className={`w-full flex items-center justify-start gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                  location.pathname === dashboardItem.path
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                }`}
              >
                <LayoutDashboard className="w-5 h-5 flex-shrink-0" />
                <span className="flex-1 text-left">{dashboardItem.label}</span>
              </button>

              {/* Academic Management Section */}
              {filteredAcademicItems.length > 0 && (
                <div className="pt-4">
                  <button
                    onClick={() => setIsAcademicOpen(!isAcademicOpen)}
                    className="w-full flex items-center justify-start gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors text-left"
                  >
                    <School className="w-5 h-5 flex-shrink-0" />
                    <span className="flex-1 text-left">Academic Management</span>
                    {shouldExpandAcademic ? (
                      <ChevronDown className="w-4 h-4 flex-shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 flex-shrink-0" />
                    )}
                  </button>
                  
                  {shouldExpandAcademic && (
                    <div className="ml-6 mt-1 space-y-1">
                      {filteredAcademicItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                          <button
                            key={item.path}
                            onClick={() => {
                              navigate(item.path);
                              setIsSidebarOpen(false);
                              setMenuSearchTerm('');
                            }}
                            className={`w-full flex items-center justify-start gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
                              isActive
                                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                                : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                            }`}
                          >
                            <Icon className="w-4 h-4 flex-shrink-0" />
                            <span className="flex-1 text-left">{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Financial Management Section */}
              {filteredFinancialItems.length > 0 && (
                <div className="pt-4">
                  <button
                    onClick={() => setIsFinancialOpen(!isFinancialOpen)}
                    className="w-full flex items-center justify-start gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors text-left"
                  >
                    <Wallet className="w-5 h-5 flex-shrink-0" />
                    <span className="flex-1 text-left">Financial Management</span>
                    {shouldExpandFinancial ? (
                      <ChevronDown className="w-4 h-4 flex-shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 flex-shrink-0" />
                    )}
                  </button>
                  
                  {shouldExpandFinancial && (
                    <div className="ml-6 mt-1 space-y-1">
                      {filteredFinancialItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                          <button
                            key={item.path}
                            onClick={() => {
                              navigate(item.path);
                              setIsSidebarOpen(false);
                              setMenuSearchTerm('');
                            }}
                            className={`w-full flex items-center justify-start gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
                              isActive
                                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                                : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                            }`}
                          >
                            <Icon className="w-4 h-4 flex-shrink-0" />
                            <span className="flex-1 text-left">{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Reports & Analytics Section */}
              {filteredReportsItems.length > 0 && (
                <div className="pt-4">
                  <button
                    onClick={() => setIsReportsOpen(!isReportsOpen)}
                    className="w-full flex items-center justify-start gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors text-left"
                  >
                    <BarChart3 className="w-5 h-5 flex-shrink-0" />
                    <span className="flex-1 text-left">Reports & Analytics</span>
                    {shouldExpandReports ? (
                      <ChevronDown className="w-4 h-4 flex-shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 flex-shrink-0" />
                    )}
                  </button>
                  
                  {shouldExpandReports && (
                    <div className="ml-6 mt-1 space-y-1">
                      {filteredReportsItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                          <button
                            key={item.path}
                            onClick={() => {
                              navigate(item.path);
                              setIsSidebarOpen(false);
                              setMenuSearchTerm('');
                            }}
                            className={`w-full flex items-center justify-start gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
                              isActive
                                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                                : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                            }`}
                          >
                            <Icon className="w-4 h-4 flex-shrink-0" />
                            <span className="flex-1 text-left">{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
              
              {/* Super Admin Only Items */}
              {user?.role === 'super_admin' && filteredSuperAdminItems.length > 0 && (
                <div className="pt-4 border-t border-sidebar-border/20">
                  <p className="px-3 text-xs font-medium text-sidebar-foreground/70 mb-2">SUPER ADMIN</p>
                  {filteredSuperAdminItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                      <button
                        key={item.path}
                        onClick={() => {
                          navigate(item.path);
                          setIsSidebarOpen(false);
                          setMenuSearchTerm('');
                        }}
                        className={`w-full flex items-center justify-start gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                          isActive
                            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                            : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                        }`}
                      >
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        <span className="flex-1 text-left">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
              
              {/* Master Data Section */}
              {filteredMasterDataItems.length > 0 && (
                <div className="pt-4">
                  <button
                    onClick={() => setIsMasterDataOpen(!isMasterDataOpen)}
                    className="w-full flex items-center justify-start gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors text-left"
                  >
                    <Settings className="w-5 h-5 flex-shrink-0" />
                    <span className="flex-1 text-left">Master Data</span>
                    {shouldExpandMasterData ? (
                      <ChevronDown className="w-4 h-4 flex-shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 flex-shrink-0" />
                    )}
                  </button>
                  
                  {shouldExpandMasterData && (
                    <div className="ml-6 mt-1 space-y-1">
                      {filteredMasterDataItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                          <button
                            key={item.path}
                            onClick={() => {
                              navigate(item.path);
                              setIsSidebarOpen(false);
                              setMenuSearchTerm('');
                            }}
                            className={`w-full flex items-center justify-start gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
                              isActive
                                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                                : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                            }`}
                          >
                            <Icon className="w-4 h-4 flex-shrink-0" />
                            <span className="flex-1 text-left">{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </nav>
          </ScrollArea>

          {/* User Info & Logout */}
          <div className="p-4 border-t border-sidebar-border">
            <div className="mb-3 px-3">
              <p className="text-sm font-medium text-white">{user?.name}</p>
              <p className="text-xs text-white/80">{user?.email}</p>
              <p className="text-xs text-white/90 mt-1 capitalize font-medium">{user?.role}</p>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full justify-start gap-2 border-white/20 text-white bg-white/10 hover:bg-white/20 hover:text-white hover:border-white/30 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto p-6 lg:p-8 max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  );
};
