import { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useBranchContext } from '@/contexts/BranchContext';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Wallet,
  BarChart3,
  Book,
  BarChart,
  MapPin,
  Tags,
  GitBranch,
  ClipboardList,
  PenLine,
  Calendar,
  ArrowUpCircle,
  BookMarked,
  BarChart2,
  FileCheck,
  CalendarCheck,
  CalendarMinus,
  Globe,
} from 'lucide-react';
import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import type { LucideIcon } from 'lucide-react';
import { useConfirmation } from '@/hooks/useConfirmation';
import { PermissionAction, userHasAccess } from '@/utils/accessControl';
import { UserRole } from '@/types';
import { useOrgBranding } from '@/contexts/OrgBrandingContext';
import { apiClient } from '@/lib/api';

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
  } catch {}
};

// ─── MENU DEFINITIONS ───────────────────────────────────────────────

// Platform Admin menus (god-level)
const platformAdminItems: MenuItem[] = [
  { icon: Building2, label: 'Organizations', path: '/organization-management', permission: { roles: ['platform_admin'] } },
  { icon: GitBranch, label: 'Branch Management', path: '/branch-management', permission: { roles: ['platform_admin'] } },
  { icon: Globe, label: 'Domain Management', path: '/domain-management', permission: { roles: ['platform_admin'] } },
  { icon: UserCog, label: 'User Access', path: '/user-access', permission: { roles: ['platform_admin'] } },
  { icon: Activity, label: 'Activity Log', path: '/activity-log', permission: { roles: ['platform_admin'] } },
];

// Org Admin menus (org-level view)
const orgAdminItems: MenuItem[] = [
  { icon: GitBranch, label: 'Branch Management', path: '/branch-management', permission: { roles: ['org_admin'] } },
  { icon: Globe, label: 'Domain Management', path: '/domain-management', permission: { roles: ['org_admin'] } },
  { icon: UserCog, label: 'User Access', path: '/user-access', permission: { roles: ['org_admin'] } },
];

// ── SCHOOL MANAGEMENT ────────────────────────────────────────────────

const peopleItems: MenuItem[] = [
  { icon: Users, label: 'Students', path: '/students', permission: { module: 'students' } },
  { icon: UserCog, label: 'Staff', path: '/staff', permission: { module: 'staff' } },
];

const academicSetupItems: MenuItem[] = [
  { icon: GraduationCap, label: 'Classes', path: '/classes', permission: { module: 'classes' } },
  { icon: Users, label: 'Divisions', path: '/divisions', permission: { module: 'divisions' } },
  { icon: BookMarked, label: 'Subjects', path: '/subjects', permission: { module: 'classes' } },
  { icon: Calendar, label: 'Academic Years', path: '/academic-years', permission: { module: 'classes' } },
  { icon: BookOpen, label: 'Text Books', path: '/textbooks', permission: { module: 'textbooks' } },
  { icon: BookOpen, label: 'Textbook Indents', path: '/textbook-indents', permission: { module: 'textbooks' } },
];

const examItems: MenuItem[] = [
  { icon: ClipboardList, label: 'Exams', path: '/exams', permission: { module: 'classes' } },
  { icon: PenLine, label: 'Mark Entry', path: '/mark-entry', permission: { module: 'classes' } },
  { icon: BarChart2, label: 'Exam Score', path: '/exam-score', permission: { module: 'classes' } },
  { icon: FileCheck, label: 'Progress Card', path: '/progress-card', permission: { module: 'classes' } },
  { icon: ArrowUpCircle, label: 'Promotion', path: '/student-promotion', permission: { module: 'students' } },
];

const attendanceItems: MenuItem[] = [
  { icon: CalendarCheck, label: 'Mark Attendance', path: '/attendance', permission: { roles: ['branch_admin', 'org_admin', 'platform_admin', 'teacher'] } },
  { icon: BarChart2, label: 'Attendance Report', path: '/attendance-report', permission: { roles: ['branch_admin', 'org_admin', 'platform_admin', 'teacher'] } },
  { icon: CalendarMinus, label: 'Leave Requests', path: '/leave-requests', permission: { roles: ['branch_admin', 'org_admin', 'platform_admin', 'teacher', 'student'] } },
];

// ── FINANCE & ACCOUNTING ─────────────────────────────────────────────

const financeItems: MenuItem[] = [
  { icon: DollarSign, label: 'Fee Management', path: '/fees', permission: { module: 'fees' } },
  { icon: Settings, label: 'Fee Structures', path: '/fee-structures', permission: { module: 'fees' } },
  { icon: Tags, label: 'Fee Types', path: '/fee-type-configs', permission: { module: 'fees' } },
  { icon: Receipt, label: 'Payroll', path: '/payroll', permission: { module: 'payroll' } },
  { icon: FileText, label: 'Expenses', path: '/expenses', permission: { module: 'expenses' } },
  { icon: Receipt, label: 'Expense Categories', path: '/expense-categories', permission: { module: 'expenses' } },
  { icon: TrendingUp, label: 'Income Categories', path: '/income-categories', permission: { module: 'fees' } },
];

const accountingItems: MenuItem[] = [
  { icon: Book, label: 'Day Book', path: '/accounting/daybook', permission: { module: 'accounting' } },
  { icon: FileText, label: 'Ledger', path: '/accounting/ledger', permission: { module: 'accounting' } },
  { icon: Receipt, label: 'Fee Details', path: '/accounting/fee-details', permission: { module: 'accounting' } },
  { icon: BarChart, label: 'Balance Sheet', path: '/accounting/balance-sheet', permission: { module: 'accounting' } },
  { icon: TrendingUp, label: 'Annual Report', path: '/accounting/annual-report', permission: { module: 'accounting' } },
];

// ── SYSTEM ───────────────────────────────────────────────────────────

const reportsItems: MenuItem[] = [
  { icon: TrendingUp, label: 'Reports', path: '/reports', permission: { module: 'reports' } },
  { icon: Activity, label: 'Activity Log', path: '/activity-log', permission: { module: 'activity_logs' } },
];

const adminItems: MenuItem[] = [
  { icon: Building2, label: 'Departments', path: '/departments', permission: { module: 'departments' } },
  { icon: Briefcase, label: 'Designations', path: '/designations', permission: { module: 'designations' } },
  { icon: Tags, label: 'Staff Categories', path: '/staff-categories', permission: { module: 'staff' } },
  { icon: MapPin, label: 'Transport Routes', path: '/transport-routes', permission: { module: 'classes' } },
];

// ─── COMPONENT ──────────────────────────────────────────────────────

export const AppLayout = ({ children }: AppLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { branches, selectedBranch, selectedBranchId, switchBranch } = useBranchContext();
  const { branding } = useOrgBranding();
  const { confirm, ConfirmationComponent } = useConfirmation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => getStoredBoolean('sidebar:isOpen', false));
  const [isPeopleOpen, setIsPeopleOpen] = useState(() => getStoredBoolean('sidebar:people', false));
  const [isAcademicSetupOpen, setIsAcademicSetupOpen] = useState(() => getStoredBoolean('sidebar:academicSetup', false));
  const [isExamOpen, setIsExamOpen] = useState(() => getStoredBoolean('sidebar:exam', false));
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(() => getStoredBoolean('sidebar:attendance', false));
  const [isFinanceOpen, setIsFinanceOpen] = useState(() => getStoredBoolean('sidebar:finance', false));
  const [isAccountingOpen, setIsAccountingOpen] = useState(() => getStoredBoolean('sidebar:accounting', false));
  const [isReportsOpen, setIsReportsOpen] = useState(() => getStoredBoolean('sidebar:reports', false));
  const [isAdminOpen, setIsAdminOpen] = useState(() => getStoredBoolean('sidebar:admin', false));
  const [commandOpen, setCommandOpen] = useState(false);
  const sidebarScrollRef = useRef<HTMLDivElement>(null);

  // Fetch the user's organization info (for logo) when logged in
  const [orgLogo, setOrgLogo] = useState<string | null>(null);
  const [orgName, setOrgName] = useState<string | null>(null);
  useEffect(() => {
    if (user?.organizationId) {
      apiClient.get<{ name: string; logo?: string }>('/organizations/my-organization').then((res) => {
        if (res.data?.data) {
          setOrgLogo(res.data.data.logo || null);
          setOrgName(res.data.data.name || null);
        }
      }).catch(() => {});
    }
  }, [user?.organizationId]);

  // Determine which logo/name to show: 1) domain branding, 2) user's org, 3) default
  const displayLogo = branding.organizationLogo || orgLogo || null;
  const displayName = branding.resolved ? branding.organizationName : (orgName || 'CampusWise');

  // Cmd+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Save sidebar scroll position before navigation
  const navigatePreservingScroll = useCallback((path: string) => {
    const viewport = sidebarScrollRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (viewport) {
      sessionStorage.setItem('sidebar:scrollTop', String(viewport.scrollTop));
    }
    navigate(path);
  }, [navigate]);

  const commandNavigate = useCallback((path: string) => {
    setCommandOpen(false);
    navigatePreservingScroll(path);
  }, [navigatePreservingScroll]);

  // Restore sidebar scroll position after render
  useEffect(() => {
    const savedScroll = sessionStorage.getItem('sidebar:scrollTop');
    if (savedScroll) {
      requestAnimationFrame(() => {
        const viewport = sidebarScrollRef.current?.querySelector('[data-radix-scroll-area-viewport]');
        if (viewport) {
          viewport.scrollTop = Number(savedScroll);
        }
      });
    }
  }, [location.pathname]);

  // Auto-expand the section that contains the current route
  useEffect(() => {
    const path = location.pathname;
    if (peopleItems.some((i) => i.path === path) && !isPeopleOpen) {
      setIsPeopleOpen(true); setStoredBoolean('sidebar:people', true);
    }
    if (academicSetupItems.some((i) => i.path === path) && !isAcademicSetupOpen) {
      setIsAcademicSetupOpen(true); setStoredBoolean('sidebar:academicSetup', true);
    }
    if (examItems.some((i) => i.path === path) && !isExamOpen) {
      setIsExamOpen(true); setStoredBoolean('sidebar:exam', true);
    }
    if (attendanceItems.some((i) => i.path === path) && !isAttendanceOpen) {
      setIsAttendanceOpen(true); setStoredBoolean('sidebar:attendance', true);
    }
    if (financeItems.some((i) => i.path === path) && !isFinanceOpen) {
      setIsFinanceOpen(true); setStoredBoolean('sidebar:finance', true);
    }
    if (accountingItems.some((i) => i.path === path) && !isAccountingOpen) {
      setIsAccountingOpen(true); setStoredBoolean('sidebar:accounting', true);
    }
    if (reportsItems.some((i) => i.path === path) && !isReportsOpen) {
      setIsReportsOpen(true); setStoredBoolean('sidebar:reports', true);
    }
    if (adminItems.some((i) => i.path === path) && !isAdminOpen) {
      setIsAdminOpen(true); setStoredBoolean('sidebar:admin', true);
    }
  }, [location.pathname]);

  const isPlatformAdmin = user?.role === 'platform_admin';
  const isOrgAdmin = user?.role === 'org_admin';
  const isInBranchContext = isOrgAdmin && !!selectedBranchId;
  const showBranchMenus = !isPlatformAdmin && (isInBranchContext || !isOrgAdmin);

  const handleLogout = () => {
    confirm(
      { title: 'Log out', description: 'Are you sure you want to log out?', confirmText: 'Logout', variant: 'destructive' },
      async () => { await logout(); navigate('/login'); }
    );
  };

  const filterMenuItems = (items: MenuItem[]) =>
    items.filter((item) => userHasAccess(user, item.permission));

  const filteredPlatformAdminItems = useMemo(() => filterMenuItems(platformAdminItems), [user]);
  const filteredOrgAdminItems = useMemo(() => filterMenuItems(orgAdminItems), [user]);
  const filteredPeopleItems = useMemo(() => filterMenuItems(peopleItems), [user]);
  const filteredAcademicSetupItems = useMemo(() => filterMenuItems(academicSetupItems), [user]);
  const filteredExamItems = useMemo(() => filterMenuItems(examItems), [user]);
  const filteredAttendanceItems = useMemo(() => filterMenuItems(attendanceItems), [user]);
  const filteredFinanceItems = useMemo(() => filterMenuItems(financeItems), [user]);
  const filteredAccountingItems = useMemo(() => filterMenuItems(accountingItems), [user]);
  const filteredReportsItems = useMemo(() => filterMenuItems(reportsItems), [user]);
  const filteredAdminItems = useMemo(() => filterMenuItems(adminItems), [user]);

  // All accessible items for Command dialog
  const allCommandItems = useMemo(() => {
    const groups: { heading: string; items: MenuItem[] }[] = [
      { heading: 'Dashboard', items: [{ icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' }] },
    ];
    if (isPlatformAdmin && filteredPlatformAdminItems.length > 0) {
      groups.push({ heading: 'Platform Management', items: filteredPlatformAdminItems });
    }
    if (isOrgAdmin && !isInBranchContext && filteredOrgAdminItems.length > 0) {
      groups.push({ heading: 'Organization', items: filteredOrgAdminItems });
    }
    if (showBranchMenus) {
      if (filteredPeopleItems.length > 0) groups.push({ heading: 'People', items: filteredPeopleItems });
      if (filteredAcademicSetupItems.length > 0) groups.push({ heading: 'Academics', items: filteredAcademicSetupItems });
      if (filteredExamItems.length > 0) groups.push({ heading: 'Exam & Assessment', items: filteredExamItems });
      if (filteredAttendanceItems.length > 0) groups.push({ heading: 'Attendance', items: filteredAttendanceItems });
      if (filteredFinanceItems.length > 0) groups.push({ heading: 'Finance', items: filteredFinanceItems });
      if (filteredAccountingItems.length > 0) groups.push({ heading: 'Accounting', items: filteredAccountingItems });
      if (filteredReportsItems.length > 0) groups.push({ heading: 'Reports & Analytics', items: filteredReportsItems });
      if (filteredAdminItems.length > 0) groups.push({ heading: 'Administration', items: filteredAdminItems });
    }
    return groups;
  }, [user, isPlatformAdmin, isOrgAdmin, isInBranchContext, showBranchMenus, filteredPlatformAdminItems, filteredOrgAdminItems, filteredPeopleItems, filteredAcademicSetupItems, filteredExamItems, filteredAttendanceItems, filteredFinanceItems, filteredAccountingItems, filteredReportsItems, filteredAdminItems]);

  const renderNavButton = (item: MenuItem) => {
    const Icon = item.icon;
    const isActive = location.pathname === item.path;
    return (
      <button
        key={item.path}
        onClick={() => navigatePreservingScroll(item.path)}
        className={`w-full flex items-center justify-start gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium transition-colors text-left ${
          isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
        }`}
      >
        <Icon className="w-[18px] h-[18px] flex-shrink-0" />
        <span className="flex-1 text-left">{item.label}</span>
      </button>
    );
  };

  const renderSubNavButton = (item: MenuItem) => {
    const Icon = item.icon;
    const isActive = location.pathname === item.path;
    return (
      <button
        key={item.path}
        onClick={() => navigatePreservingScroll(item.path)}
        className={`w-full flex items-center justify-start gap-2.5 px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors text-left ${
          isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
        }`}
      >
        <Icon className="w-4 h-4 flex-shrink-0" />
        <span className="flex-1 text-left">{item.label}</span>
      </button>
    );
  };

  const renderSection = (
    label: string,
    icon: LucideIcon,
    items: MenuItem[],
    isOpen: boolean,
    setOpen: React.Dispatch<React.SetStateAction<boolean>>,
    storageKey: string,
    shouldExpand: boolean
  ) => {
    if (items.length === 0) return null;
    const SectionIcon = icon;
    return (
      <div className="pt-3">
        <button
          onClick={() => setOpen((prev) => { const next = !prev; setStoredBoolean(storageKey, next); return next; })}
          className="w-full flex items-center justify-start gap-2.5 px-3 py-2 rounded-md text-[13px] font-semibold text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors text-left"
        >
          <SectionIcon className="w-[18px] h-[18px] flex-shrink-0" />
          <span className="flex-1 text-left">{label}</span>
          {shouldExpand ? <ChevronDown className="w-4 h-4 flex-shrink-0" /> : <ChevronRight className="w-4 h-4 flex-shrink-0" />}
        </button>
        {shouldExpand && (
          <div className="ml-4 mt-1 space-y-0.5">
            {items.map(renderSubNavButton)}
          </div>
        )}
      </div>
    );
  };

  const effectiveRoleLabel = isPlatformAdmin
    ? 'Platform Admin'
    : isOrgAdmin
      ? isInBranchContext
        ? `Org Admin → ${selectedBranch?.name || 'Branch'}`
        : 'Organization Admin'
      : (user?.role || '').replace('_', ' ');

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile Menu Button */}
      <button
        onClick={() => { setIsSidebarOpen((prev) => { const next = !prev; setStoredBoolean('sidebar:isOpen', next); return next; }); }}
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
            {displayLogo ? (
              <img src={displayLogo} alt={displayName} className="h-14 w-full max-w-[240px] object-contain object-center" />
            ) : (
              <img src="/logoo.png" alt={displayName} className="h-14 w-full max-w-[240px] object-contain object-center" />
            )}
          </div>

          {/* Branch Switcher — only for org_admin */}
          {isOrgAdmin && branches.length > 0 && (
            <div className="px-4 py-2 border-b border-sidebar-border/40 bg-sidebar-accent/10">
              <label className="text-[11px] font-semibold tracking-wide text-sidebar-foreground/70 mb-1 block">
                SWITCH BRANCH
              </label>
              <Select
                value={selectedBranchId || '__all__'}
                onValueChange={(val) => { switchBranch(val === '__all__' ? null : val); navigate('/dashboard'); }}
              >
                <SelectTrigger className="h-8 text-xs bg-sidebar border-sidebar-border/50">
                  <SelectValue placeholder="All Branches" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">
                    <span className="font-semibold">All Branches (Org Level)</span>
                  </SelectItem>
                  {branches.map((b) => (
                    <SelectItem key={b._id || b.id} value={b._id || b.id || ''}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Command Menu Trigger */}
          <div className="px-4 py-2 border-b border-sidebar-border/20">
            <button
              onClick={() => setCommandOpen(true)}
              className="w-full flex items-center gap-2 h-9 px-3 rounded-md bg-sidebar-accent/20 border border-sidebar-border/30 text-sidebar-foreground/50 text-sm hover:bg-sidebar-accent/40 transition-colors"
            >
              <Search className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1 text-left">Search menu...</span>
              <kbd className="pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-0.5 rounded border border-sidebar-border/50 bg-sidebar-accent/30 px-1.5 font-mono text-[10px] font-medium text-sidebar-foreground/60">
                <span className="text-xs">⌘</span>K
              </kbd>
            </button>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 px-3 py-3" ref={sidebarScrollRef}>
            <nav className="space-y-0.5">
              {/* Dashboard */}
              <button
                onClick={() => navigatePreservingScroll('/dashboard')}
                className={`w-full flex items-center justify-start gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium transition-colors text-left ${
                  location.pathname === '/dashboard'
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                }`}
              >
                <LayoutDashboard className="w-[18px] h-[18px] flex-shrink-0" />
                <span className="flex-1 text-left">Dashboard</span>
              </button>

              {/* PLATFORM ADMIN */}
              {isPlatformAdmin && (
                <div className="pt-3 border-t border-sidebar-border/20">
                  <p className="px-3 text-[11px] font-semibold tracking-wide text-sidebar-foreground/70 mb-2">PLATFORM MANAGEMENT</p>
                  {filteredPlatformAdminItems.map(renderNavButton)}
                </div>
              )}

              {/* ORG ADMIN (org-level) */}
              {isOrgAdmin && !isInBranchContext && (
                <div className="pt-3 border-t border-sidebar-border/20">
                  <p className="px-3 text-[11px] font-semibold tracking-wide text-sidebar-foreground/70 mb-2">ORGANIZATION</p>
                  {filteredOrgAdminItems.map(renderNavButton)}
                </div>
              )}

              {/* BRANCH-LEVEL MENUS */}
              {showBranchMenus && (
                <>
                  {isInBranchContext && (
                    <div className="pt-2 pb-1">
                      <div className="px-3 py-1.5 rounded-md bg-blue-500/10 border border-blue-500/20">
                        <p className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                          Branch: {selectedBranch?.name}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* ── SCHOOL MANAGEMENT ── */}
                  {(filteredPeopleItems.length > 0 || filteredAcademicSetupItems.length > 0 || filteredExamItems.length > 0) && (
                    <div className="pt-3 border-t border-sidebar-border/20">
                      <p className="px-3 text-[10px] font-semibold tracking-widest text-sidebar-foreground/50 mb-1">SCHOOL MANAGEMENT</p>
                    </div>
                  )}
                  {renderSection('People', Users, filteredPeopleItems, isPeopleOpen, setIsPeopleOpen, 'sidebar:people', isPeopleOpen)}
                  {renderSection('Academics', GraduationCap, filteredAcademicSetupItems, isAcademicSetupOpen, setIsAcademicSetupOpen, 'sidebar:academicSetup', isAcademicSetupOpen)}
                  {renderSection('Exam & Assessment', ClipboardList, filteredExamItems, isExamOpen, setIsExamOpen, 'sidebar:exam', isExamOpen)}
                  {renderSection('Attendance', CalendarCheck, filteredAttendanceItems, isAttendanceOpen, setIsAttendanceOpen, 'sidebar:attendance', isAttendanceOpen)}

                  {/* ── FINANCE & ACCOUNTING ── */}
                  {(filteredFinanceItems.length > 0 || filteredAccountingItems.length > 0) && (
                    <div className="pt-3 border-t border-sidebar-border/20">
                      <p className="px-3 text-[10px] font-semibold tracking-widest text-sidebar-foreground/50 mb-1">FINANCE & ACCOUNTING</p>
                    </div>
                  )}
                  {renderSection('Finance', Wallet, filteredFinanceItems, isFinanceOpen, setIsFinanceOpen, 'sidebar:finance', isFinanceOpen)}
                  {renderSection('Accounting', BarChart3, filteredAccountingItems, isAccountingOpen, setIsAccountingOpen, 'sidebar:accounting', isAccountingOpen)}

                  {/* ── SYSTEM ── */}
                  {(filteredReportsItems.length > 0 || filteredAdminItems.length > 0) && (
                    <div className="pt-3 border-t border-sidebar-border/20">
                      <p className="px-3 text-[10px] font-semibold tracking-widest text-sidebar-foreground/50 mb-1">SYSTEM</p>
                    </div>
                  )}
                  {renderSection('Reports & Analytics', BarChart3, filteredReportsItems, isReportsOpen, setIsReportsOpen, 'sidebar:reports', isReportsOpen)}
                  {renderSection('Administration', Settings, filteredAdminItems, isAdminOpen, setIsAdminOpen, 'sidebar:admin', isAdminOpen)}
                </>
              )}
            </nav>
          </ScrollArea>

          {/* User Info & Logout */}
          <div className="px-4 py-3 border-t border-sidebar-border">
            <div className="mb-2 px-3">
              <p className="text-sm font-semibold text-sidebar-foreground">{user?.name}</p>
              <p className="text-xs text-sidebar-foreground/80">{user?.email}</p>
              <p className="text-[11px] text-sidebar-foreground/90 mt-0.5 capitalize font-medium">{effectiveRoleLabel}</p>
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
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto p-6 lg:p-8 max-w-7xl">
          {children}
        </div>
      </main>
      <ConfirmationComponent />

      {/* Command Menu (⌘K) */}
      <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
        <CommandInput placeholder="Search all pages..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {allCommandItems.map((group, idx) => (
            <CommandGroup key={group.heading} heading={group.heading}>
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <CommandItem
                    key={item.path}
                    value={item.label}
                    onSelect={() => commandNavigate(item.path)}
                    className="cursor-pointer"
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    <span>{item.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </div>
  );
};
