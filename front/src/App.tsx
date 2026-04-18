import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { BranchProvider } from "@/contexts/BranchContext";
import { PermissionAction, userHasAccess } from "@/utils/accessControl";
import { UserRole } from "@/types";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import Staff from "./pages/Staff";
import Fees from "./pages/Fees";
import FeeStructures from "./pages/FeeStructures";
import FeeTypeConfigs from "./pages/FeeTypeConfigs";
import Payroll from "./pages/Payroll";
import Expenses from "./pages/Expenses";
import TextBooks from "./pages/TextBooks";
import TextbookIndents from "./pages/TextbookIndents";
import Reports from "./pages/Reports";
import FeeDues from "./pages/FeeDues";
import TransportReport from "./pages/TransportReport";
import Classes from "./pages/Classes";
import Divisions from "./pages/Divisions";
import ExpenseCategories from "./pages/ExpenseCategories";
import IncomeCategories from "./pages/IncomeCategories";
import Departments from "./pages/Departments";
import Designations from "./pages/Designations";
import StaffCategories from "./pages/StaffCategories";
import TransportRoutes from "./pages/TransportRoutes";
import ActivityLog from "./pages/ActivityLog";
import UserAccess from "./pages/UserAccess";
import BranchManagement from "./pages/BranchManagement";
import OrganizationManagement from "./pages/OrganizationManagement";
import { DayBook } from "./pages/accounting/DayBook";
import { Ledger } from "./pages/accounting/Ledger";
import { FeeDetails } from "./pages/accounting/FeeDetails";
import { BalanceSheet } from "./pages/accounting/BalanceSheet";
import { AnnualReport } from "./pages/accounting/AnnualReport";
import ExamManagement from "./pages/ExamManagement";
import SubjectManagement from "./pages/SubjectManagement";
import AcademicYearManagement from "./pages/AcademicYearManagement";
import MarkEntryPage from "./pages/MarkEntry";
import StudentPromotion from "./pages/StudentPromotion";
import ExamScore from "./pages/ExamScore";
import ProgressCard from "./pages/ProgressCard";
import AttendanceMarking from "./pages/AttendanceMarking";
import AttendanceReport from "./pages/AttendanceReport";
import LeaveRequests from "./pages/LeaveRequests";
import DomainManagement from './pages/DomainManagement';
import NotFound from './pages/NotFound';
import { OrgBrandingProvider } from '@/contexts/OrgBrandingContext';

const queryClient = new QueryClient();

type RouteAccess = {
  module?: string;
  action?: PermissionAction;
  roles?: UserRole[];
};

const ProtectedRoute = ({
  children,
  access,
}: {
  children: React.ReactNode;
  access?: RouteAccess;
}) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (access && !userHasAccess(user, access)) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <OrgBrandingProvider>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <AuthProvider>
          <BranchProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/students"
              element={
                <ProtectedRoute>
                  <Students />
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff"
              element={
                <ProtectedRoute>
                  <Staff />
                </ProtectedRoute>
              }
            />
            <Route
              path="/fees"
              element={
                <ProtectedRoute>
                  <Fees />
                </ProtectedRoute>
              }
            />
            <Route
              path="/fee-structures"
              element={
                <ProtectedRoute>
                  <FeeStructures />
                </ProtectedRoute>
              }
            />
            <Route
              path="/fee-type-configs"
              element={
                <ProtectedRoute>
                  <FeeTypeConfigs />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payroll"
              element={
                <ProtectedRoute>
                  <Payroll />
                </ProtectedRoute>
              }
            />
            <Route
              path="/expenses"
              element={
                <ProtectedRoute>
                  <Expenses />
                </ProtectedRoute>
              }
            />
            <Route
              path="/textbooks"
              element={
                <ProtectedRoute>
                  <TextBooks />
                </ProtectedRoute>
              }
            />
            <Route
              path="/textbook-indents"
              element={
                <ProtectedRoute>
                  <TextbookIndents />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute>
                  <Reports />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/fee-dues"
              element={
                <ProtectedRoute>
                  <FeeDues />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/transport"
              element={
                <ProtectedRoute>
                  <TransportReport />
                </ProtectedRoute>
              }
            />
            <Route
              path="/classes"
              element={
                <ProtectedRoute>
                  <Classes />
                </ProtectedRoute>
              }
            />
            <Route
              path="/divisions"
              element={
                <ProtectedRoute>
                  <Divisions />
                </ProtectedRoute>
              }
            />
            <Route
              path="/expense-categories"
              element={
                <ProtectedRoute>
                  <ExpenseCategories />
                </ProtectedRoute>
              }
            />
            <Route
              path="/income-categories"
              element={
                <ProtectedRoute>
                  <IncomeCategories />
                </ProtectedRoute>
              }
            />
            <Route
              path="/departments"
              element={
                <ProtectedRoute>
                  <Departments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/designations"
              element={
                <ProtectedRoute>
                  <Designations />
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff-categories"
              element={
                <ProtectedRoute>
                  <StaffCategories />
                </ProtectedRoute>
              }
            />
            <Route
              path="/transport-routes"
              element={
                <ProtectedRoute>
                  <TransportRoutes />
                </ProtectedRoute>
              }
            />
            <Route
              path="/activity-log"
              element={
                <ProtectedRoute>
                  <ActivityLog />
                </ProtectedRoute>
              }
            />
            <Route
              path="/user-access"
              element={
                <ProtectedRoute access={{ roles: ['platform_admin', 'org_admin'] }}>
                  <UserAccess />
                </ProtectedRoute>
              }
            />
            <Route
              path="/organization-management"
              element={
                <ProtectedRoute access={{ roles: ['platform_admin'] }}>
                  <OrganizationManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/branch-management"
              element={
                <ProtectedRoute access={{ roles: ['platform_admin', 'org_admin'] }}>
                  <BranchManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/domain-management"
              element={
                <ProtectedRoute access={{ roles: ['platform_admin', 'org_admin'] }}>
                  <DomainManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/accounting/daybook"
              element={
                <ProtectedRoute>
                  <DayBook />
                </ProtectedRoute>
              }
            />
            <Route
              path="/accounting/ledger"
              element={
                <ProtectedRoute>
                  <Ledger />
                </ProtectedRoute>
              }
            />
            <Route
              path="/accounting/fee-details"
              element={
                <ProtectedRoute>
                  <FeeDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/accounting/balance-sheet"
              element={
                <ProtectedRoute>
                  <BalanceSheet />
                </ProtectedRoute>
              }
            />
            <Route
              path="/accounting/annual-report"
              element={
                <ProtectedRoute>
                  <AnnualReport />
                </ProtectedRoute>
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route
              path="/exams"
              element={
                <ProtectedRoute>
                  <ExamManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/subjects"
              element={
                <ProtectedRoute>
                  <SubjectManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/academic-years"
              element={
                <ProtectedRoute>
                  <AcademicYearManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/mark-entry"
              element={
                <ProtectedRoute>
                  <MarkEntryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student-promotion"
              element={
                <ProtectedRoute>
                  <StudentPromotion />
                </ProtectedRoute>
              }
            />
            <Route
              path="/exam-score"
              element={
                <ProtectedRoute>
                  <ExamScore />
                </ProtectedRoute>
              }
            />
            <Route
              path="/progress-card"
              element={
                <ProtectedRoute>
                  <ProgressCard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/attendance"
              element={
                <ProtectedRoute access={{ module: 'attendance' }}>
                  <AttendanceMarking />
                </ProtectedRoute>
              }
            />
            <Route
              path="/attendance-report"
              element={
                <ProtectedRoute access={{ module: 'attendance' }}>
                  <AttendanceReport />
                </ProtectedRoute>
              }
            />
            <Route
              path="/leave-requests"
              element={
                <ProtectedRoute>
                  <LeaveRequests />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </BranchProvider>
        </AuthProvider>
      </BrowserRouter>
      </OrgBrandingProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
