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
  Book,
  BarChart,
  MapPin,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import type { LucideIcon } from 'lucide-react';
import { useConfirmation } from '@/hooks/useConfirmation';
import { PermissionAction, userHasAccess } from '@/utils/accessControl';
import { UserRole } from '@/types';

interface AppLayoutProps {
  children: ReactNode;
}

type MenuItem = {
  icon: LucideIcon;
  label: string;
  path: string;
  permission?: {
    module?: string;
    action?: PermissionAction;
    roles?: UserRole[];
  };
};

// Helpers to persist sidebar open/collapsed state across page loads
const getStoredBoolean = (key: string, defaultValue: boolean) => {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const stored = window.localStorage.getItem(key);
    if (stored === null) return defaultValue;
    return stored === 'true';
  } catch {
    return defaultValue;
  }
};

const setStoredBoolean = (key: string, value: boolean) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, value ? 'true' : 'false');
  } catch {
    // Ignore storage errors – do not break UI
  }
};

// Main dashboard item (always visible)
const dashboardItem: MenuItem = { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' };

// Academic Management Section
const academicManagementItems: MenuItem[] = [
  { icon: Users, label: 'Students', path: '/students', permission: { module: 'students' } },
  { icon: UserCog, label: 'Staff', path: '/staff', permission: { module: 'staff' } },
  { icon: BookOpen, label: 'Textbook Indents', path: '/textbook-indents', permission: { module: 'textbooks' } },
];

// Financial Management Section
const financialManagementItems: MenuItem[] = [
  { icon: DollarSign, label: 'Fee Management', path: '/fees', permission: { module: 'fees' } },
  { icon: Settings, label: 'Fee Structures', path: '/fee-structures', permission: { module: 'fees' } },
  { icon: Receipt, label: 'Payroll', path: '/payroll', permission: { module: 'payroll' } },
  { icon: FileText, label: 'Expenses', path: '/expenses', permission: { module: 'expenses' } },
];

// Accounting Section
const accountingItems: MenuItem[] = [
  { icon: Book, label: 'Day Book', path: '/accounting/daybook', permission: { module: 'accounting' } },
  { icon: FileText, label: 'Ledger', path: '/accounting/ledger', permission: { module: 'accounting' } },
  { icon: Receipt, label: 'Fee Details', path: '/accounting/fee-details', permission: { module: 'accounting' } },
  { icon: BarChart, label: 'Balance Sheet', path: '/accounting/balance-sheet', permission: { module: 'accounting' } },
  { icon: TrendingUp, label: 'Annual Report', path: '/accounting/annual-report', permission: { module: 'accounting' } },
];

// Reports & Analytics Section
const reportsAnalyticsItems: MenuItem[] = [
  { icon: TrendingUp, label: 'Reports', path: '/reports', permission: { module: 'reports' } },
  { icon: Activity, label: 'Activity Log', path: '/activity-log', permission: { module: 'activity_logs' } },
];

// Super Admin Section
const superAdminItems: MenuItem[] = [
  { icon: Building2, label: 'Branch Management', path: '/branch-management', permission: { roles: ['super_admin'] } },
];

// Master Data Section
const masterDataItems: MenuItem[] = [
  { icon: GraduationCap, label: 'Classes', path: '/classes', permission: { module: 'classes' } },
  { icon: Users, label: 'Divisions', path: '/divisions', permission: { module: 'divisions' } },
  { icon: Building2, label: 'Departments', path: '/departments', permission: { module: 'departments' } },
  { icon: Briefcase, label: 'Designations', path: '/designations', permission: { module: 'designations' } },
  { icon: BookOpen, label: 'Text Books', path: '/textbooks', permission: { module: 'textbooks' } },
  { icon: MapPin, label: 'Transport Routes', path: '/transport-routes', permission: { module: 'classes' } },
  { icon: Receipt, label: 'Expense Categories', path: '/expense-categories', permission: { module: 'expenses' } },
  { icon: TrendingUp, label: 'Income Categories', path: '/income-categories', permission: { module: 'fees' } },
  { icon: FileText, label: 'Receipt Config', path: '/receipt-config', permission: { roles: ['super_admin', 'branch_admin'] } },
  { icon: UserCog, label: 'User Access', path: '/user-access', permission: { roles: ['super_admin'] } },
];

export const AppLayout = ({ children }: AppLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { confirm, ConfirmationComponent } = useConfirmation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(() =>
    getStoredBoolean('sidebar:isOpen', false)
  );
  const [isAcademicOpen, setIsAcademicOpen] = useState(() =>
    getStoredBoolean('sidebar:academic', false)
  );
  const [isFinancialOpen, setIsFinancialOpen] = useState(() =>
    getStoredBoolean('sidebar:financial', false)
  );
  const [isAccountingOpen, setIsAccountingOpen] = useState(() =>
    getStoredBoolean('sidebar:accounting', false)
  );
  const [isReportsOpen, setIsReportsOpen] = useState(() =>
    getStoredBoolean('sidebar:reports', false)
  );
  const [isMasterDataOpen, setIsMasterDataOpen] = useState(() =>
    getStoredBoolean('sidebar:masterData', false)
  );
  const [menuSearchTerm, setMenuSearchTerm] = useState('');

  const handleLogout = () => {
    confirm(
      {
        title: 'Log out',
        description: 'Are you sure you want to log out?',
        confirmText: 'Logout',
        variant: 'destructive',
      },
      async () => {
        await logout();
        navigate('/login');
      }
    );
  };

  const filterMenuItems = (items: MenuItem[]) => {
    const accessibleItems = items.filter((item) => userHasAccess(user, item.permission));
    if (!menuSearchTerm) return accessibleItems;
    return accessibleItems.filter((item) =>
      item.label.toLowerCase().includes(menuSearchTerm.toLowerCase())
    );
  };

  // Filter menu items based on search term and access
  const filteredAcademicItems = useMemo(() => filterMenuItems(academicManagementItems), [menuSearchTerm, user]);

  const filteredFinancialItems = useMemo(() => filterMenuItems(financialManagementItems), [menuSearchTerm, user]);

  const filteredAccountingItems = useMemo(() => filterMenuItems(accountingItems), [menuSearchTerm, user]);

  const filteredReportsItems = useMemo(() => filterMenuItems(reportsAnalyticsItems), [menuSearchTerm, user]);

  const filteredSuperAdminItems = useMemo(() => filterMenuItems(superAdminItems), [menuSearchTerm, user]);

  const filteredMasterDataItems = useMemo(() => filterMenuItems(masterDataItems), [menuSearchTerm, user]);

  // Auto-expand sections if search matches any items
  const shouldExpandAcademic = useMemo(() => {
    if (!menuSearchTerm) return isAcademicOpen;
    return filteredAcademicItems.length > 0;
  }, [menuSearchTerm, filteredAcademicItems.length, isAcademicOpen]);

  const shouldExpandFinancial = useMemo(() => {
    if (!menuSearchTerm) return isFinancialOpen;
    return filteredFinancialItems.length > 0;
  }, [menuSearchTerm, filteredFinancialItems.length, isFinancialOpen]);

  const shouldExpandAccounting = useMemo(() => {
    if (!menuSearchTerm) return isAccountingOpen;
    return filteredAccountingItems.length > 0;
  }, [menuSearchTerm, filteredAccountingItems.length, isAccountingOpen]);

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
        onClick={() => {
          setIsSidebarOpen((prev) => {
            const next = !prev;
            setStoredBoolean('sidebar:isOpen', next);
            return next;
          });
        }}
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
          <div className="px-4 py-4 border-b border-sidebar-border flex items-center justify-center">
            <img src="/logoo.png" alt="Friends Academy" className="h-14 w-full max-w-[240px] object-contain object-center" />
          </div>

          {/* Menu Search */}
          <div className="px-4 py-2 border-b border-sidebar-border/20">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sidebar-foreground/50 w-4 h-4" />
              <Input
                placeholder="Search menu..."
                value={menuSearchTerm}
                onChange={(e) => setMenuSearchTerm(e.target.value)}
                className="h-9 pl-10 bg-sidebar-accent/20 border-sidebar-border/30 text-sidebar-foreground placeholder:text-sidebar-foreground/50 text-sm"
              />
            </div>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 px-3 py-3">
            <nav className="space-y-0.5">
              {/* Dashboard - Always visible */}
              <button
                onClick={() => {
                  navigate(dashboardItem.path);
                  // Keep sidebar state sticky; do not auto-close on navigation
                  setMenuSearchTerm('');
                }}
                className={`w-full flex items-center justify-start gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium transition-colors text-left ${
                  location.pathname === dashboardItem.path
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                }`}
              >
                <LayoutDashboard className="w-[18px] h-[18px] flex-shrink-0" />
                <span className="flex-1 text-left">{dashboardItem.label}</span>
              </button>

              {/* Academic Management Section */}
              {filteredAcademicItems.length > 0 && (
                <div className="pt-3">
                  <button
                    onClick={() =>
                      setIsAcademicOpen((prev) => {
                        const next = !prev;
                        setStoredBoolean('sidebar:academic', next);
                        return next;
                      })
                    }
                    className="w-full flex items-center justify-start gap-2.5 px-3 py-2 rounded-md text-[13px] font-semibold text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors text-left"
                  >
                    <School className="w-[18px] h-[18px] flex-shrink-0" />
                    <span className="flex-1 text-left">Academic Management</span>
                    {shouldExpandAcademic ? (
                      <ChevronDown className="w-4 h-4 flex-shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 flex-shrink-0" />
                    )}
                  </button>
                  
                  {shouldExpandAcademic && (
                    <div className="ml-4 mt-1 space-y-0.5">
                      {filteredAcademicItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                          <button
                            key={item.path}
                            onClick={() => {
                              navigate(item.path);
                              // Keep sidebar state sticky; do not auto-close on navigation
                              setMenuSearchTerm('');
                            }}
                            className={`w-full flex items-center justify-start gap-2.5 px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors text-left ${
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
                <div className="pt-3">
                  <button
                    onClick={() =>
                      setIsFinancialOpen((prev) => {
                        const next = !prev;
                        setStoredBoolean('sidebar:financial', next);
                        return next;
                      })
                    }
                    className="w-full flex items-center justify-start gap-2.5 px-3 py-2 rounded-md text-[13px] font-semibold text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors text-left"
                  >
                    <Wallet className="w-[18px] h-[18px] flex-shrink-0" />
                    <span className="flex-1 text-left">Financial Management</span>
                    {shouldExpandFinancial ? (
                      <ChevronDown className="w-4 h-4 flex-shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 flex-shrink-0" />
                    )}
                  </button>
                  
                  {shouldExpandFinancial && (
                    <div className="ml-4 mt-1 space-y-0.5">
                      {filteredFinancialItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                          <button
                            key={item.path}
                            onClick={() => {
                              navigate(item.path);
                              // Keep sidebar state sticky; do not auto-close on navigation
                              setMenuSearchTerm('');
                            }}
                            className={`w-full flex items-center justify-start gap-2.5 px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors text-left ${
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

              {/* Accounting Section */}
              {filteredAccountingItems.length > 0 && (
                <div className="pt-3">
                  <button
                    onClick={() =>
                      setIsAccountingOpen((prev) => {
                        const next = !prev;
                        setStoredBoolean('sidebar:accounting', next);
                        return next;
                      })
                    }
                    className="w-full flex items-center justify-start gap-2.5 px-3 py-2 rounded-md text-[13px] font-semibold text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors text-left"
                  >
                    <BarChart3 className="w-[18px] h-[18px] flex-shrink-0" />
                    <span className="flex-1 text-left">Accounting</span>
                    {shouldExpandAccounting ? (
                      <ChevronDown className="w-4 h-4 flex-shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 flex-shrink-0" />
                    )}
                  </button>
                  
                  {shouldExpandAccounting && (
                    <div className="ml-4 mt-1 space-y-0.5">
                      {filteredAccountingItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                          <button
                            key={item.path}
                            onClick={() => {
                              navigate(item.path);
                              // Keep sidebar state sticky; do not auto-close on navigation
                              setMenuSearchTerm('');
                            }}
                            className={`w-full flex items-center justify-start gap-2.5 px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors text-left ${
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
                <div className="pt-3">
                  <button
                    onClick={() =>
                      setIsReportsOpen((prev) => {
                        const next = !prev;
                        setStoredBoolean('sidebar:reports', next);
                        return next;
                      })
                    }
                    className="w-full flex items-center justify-start gap-2.5 px-3 py-2 rounded-md text-[13px] font-semibold text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors text-left"
                  >
                    <BarChart3 className="w-[18px] h-[18px] flex-shrink-0" />
                    <span className="flex-1 text-left">Reports & Analytics</span>
                    {shouldExpandReports ? (
                      <ChevronDown className="w-4 h-4 flex-shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 flex-shrink-0" />
                    )}
                  </button>
                  
                  {shouldExpandReports && (
                    <div className="ml-4 mt-1 space-y-0.5">
                      {filteredReportsItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                          <button
                            key={item.path}
                            onClick={() => {
                              navigate(item.path);
                            // Keep sidebar state sticky; do not auto-close on navigation
                              setMenuSearchTerm('');
                            }}
                            className={`w-full flex items-center justify-start gap-2.5 px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors text-left ${
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
              {filteredSuperAdminItems.length > 0 && (
                <div className="pt-3 border-t border-sidebar-border/20">
                  <p className="px-3 text-[11px] font-semibold tracking-wide text-sidebar-foreground/70 mb-2">SUPER ADMIN</p>
                  {filteredSuperAdminItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                      <button
                        key={item.path}
                        onClick={() => {
                          navigate(item.path);
                          // Keep sidebar state sticky; do not auto-close on navigation
                          setMenuSearchTerm('');
                        }}
                        className={`w-full flex items-center justify-start gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium transition-colors text-left ${
                          isActive
                            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                            : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                        }`}
                      >
                        <Icon className="w-[18px] h-[18px] flex-shrink-0" />
                        <span className="flex-1 text-left">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
              
              {/* Master Data Section */}
              {filteredMasterDataItems.length > 0 && (
                <div className="pt-3">
                  <button
                    onClick={() =>
                      setIsMasterDataOpen((prev) => {
                        const next = !prev;
                        setStoredBoolean('sidebar:masterData', next);
                        return next;
                      })
                    }
                    className="w-full flex items-center justify-start gap-2.5 px-3 py-2 rounded-md text-[13px] font-semibold text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors text-left"
                  >
                    <Settings className="w-[18px] h-[18px] flex-shrink-0" />
                    <span className="flex-1 text-left">Master Data</span>
                    {shouldExpandMasterData ? (
                      <ChevronDown className="w-4 h-4 flex-shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 flex-shrink-0" />
                    )}
                  </button>
                  
                  {shouldExpandMasterData && (
                    <div className="ml-4 mt-1 space-y-0.5">
                      {filteredMasterDataItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                          <button
                            key={item.path}
                            onClick={() => {
                              navigate(item.path);
                            // Keep sidebar state sticky; do not auto-close on navigation
                              setMenuSearchTerm('');
                            }}
                            className={`w-full flex items-center justify-start gap-2.5 px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors text-left ${
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
          <div className="px-4 py-3 border-t border-sidebar-border">
            <div className="mb-2 px-3">
              <p className="text-sm font-semibold text-sidebar-foreground">{user?.name}</p>
              <p className="text-xs text-sidebar-foreground/80">{user?.email}</p>
              <p className="text-[11px] text-sidebar-foreground/90 mt-0.5 capitalize font-medium">{user?.role}</p>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full justify-start gap-2 border-sidebar-border/60 text-sidebar-foreground bg-sidebar-accent/30 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground transition-colors"
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
      <ConfirmationComponent />
    </div>
  );
};
