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
import OrgTemplates from "./pages/OrgTemplates";
import BranchImport from "./pages/BranchImport";
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
import TimetableConfigs from './pages/TimetableConfigs';
import TimetableManager from './pages/TimetableManager';
import MyTimetable from './pages/MyTimetable';
import TeacherTimetable from './pages/TeacherTimetable';
import Help from './pages/Help';
import NotFound from './pages/NotFound';
import { OrgBrandingProvider } from '@/contexts/OrgBrandingContext';
import { FeatureProvider } from '@/contexts/FeatureContext';
// LMS pages
import ChapterManagement from './pages/lms/ChapterManagement';
import ChapterContent from './pages/lms/ChapterContent';
import ContentLibrary from './pages/lms/ContentLibrary';
import ContentSchedule from './pages/lms/ContentSchedule';
import LmsCalendar from './pages/lms/LmsCalendar';
import Assessments from './pages/lms/Assessments';
import AssessmentBuilder from './pages/lms/AssessmentBuilder';
import AssessmentResults from './pages/lms/AssessmentResults';
import QuestionPools from './pages/lms/QuestionPools';
import Submissions from './pages/lms/Submissions';
import LmsReports from './pages/lms/LmsReports';
import ProgressDashboard from './pages/lms/ProgressDashboard';
import CloneContent from './pages/lms/CloneContent';
import StudentLms from './pages/lms/StudentLms';
import AttemptQuiz from './pages/lms/AttemptQuiz';
// Student self-service pages
import MyAttendance from './pages/MyAttendance';
import MyMarks from './pages/MyMarks';
import MyFees from './pages/MyFees';
import StaffLeaveRequests from './pages/StaffLeaveRequests';
import Announcements from './pages/Announcements';
import HomeworkManagement from './pages/HomeworkManagement';
import MyHomework from './pages/MyHomework';
import TeacherAllocations from './pages/TeacherAllocations';

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
          <FeatureProvider>
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
                <ProtectedRoute access={{ module: 'students' }}>
                  <Students />
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff"
              element={
                <ProtectedRoute access={{ module: 'staff' }}>
                  <Staff />
                </ProtectedRoute>
              }
            />
            <Route
              path="/fees"
              element={
                <ProtectedRoute access={{ module: 'fees' }}>
                  <Fees />
                </ProtectedRoute>
              }
            />
            <Route
              path="/fee-structures"
              element={
                <ProtectedRoute access={{ module: 'fees' }}>
                  <FeeStructures />
                </ProtectedRoute>
              }
            />
            <Route
              path="/fee-type-configs"
              element={
                <ProtectedRoute access={{ module: 'fees' }}>
                  <FeeTypeConfigs />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payroll"
              element={
                <ProtectedRoute access={{ module: 'payroll' }}>
                  <Payroll />
                </ProtectedRoute>
              }
            />
            <Route
              path="/expenses"
              element={
                <ProtectedRoute access={{ module: 'expenses' }}>
                  <Expenses />
                </ProtectedRoute>
              }
            />
            <Route
              path="/textbooks"
              element={
                <ProtectedRoute access={{ module: 'textbooks' }}>
                  <TextBooks />
                </ProtectedRoute>
              }
            />
            <Route
              path="/textbook-indents"
              element={
                <ProtectedRoute access={{ module: 'textbooks' }}>
                  <TextbookIndents />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute access={{ module: 'reports' }}>
                  <Reports />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/fee-dues"
              element={
                <ProtectedRoute access={{ module: 'reports' }}>
                  <FeeDues />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/transport"
              element={
                <ProtectedRoute access={{ module: 'reports' }}>
                  <TransportReport />
                </ProtectedRoute>
              }
            />
            <Route
              path="/classes"
              element={
                <ProtectedRoute access={{ module: 'classes' }}>
                  <Classes />
                </ProtectedRoute>
              }
            />
            <Route
              path="/divisions"
              element={
                <ProtectedRoute access={{ module: 'divisions' }}>
                  <Divisions />
                </ProtectedRoute>
              }
            />
            <Route
              path="/expense-categories"
              element={
                <ProtectedRoute access={{ module: 'expenses' }}>
                  <ExpenseCategories />
                </ProtectedRoute>
              }
            />
            <Route
              path="/income-categories"
              element={
                <ProtectedRoute access={{ module: 'fees' }}>
                  <IncomeCategories />
                </ProtectedRoute>
              }
            />
            <Route
              path="/departments"
              element={
                <ProtectedRoute access={{ module: 'departments' }}>
                  <Departments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/designations"
              element={
                <ProtectedRoute access={{ module: 'staff' }}>
                  <Designations />
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff-categories"
              element={
                <ProtectedRoute access={{ module: 'staff' }}>
                  <StaffCategories />
                </ProtectedRoute>
              }
            />
            <Route
              path="/transport-routes"
              element={
                <ProtectedRoute access={{ module: 'classes' }}>
                  <TransportRoutes />
                </ProtectedRoute>
              }
            />
            <Route
              path="/activity-log"
              element={
                <ProtectedRoute access={{ module: 'activity_logs' }}>
                  <ActivityLog />
                </ProtectedRoute>
              }
            />
            <Route
              path="/user-access"
              element={
                <ProtectedRoute access={{ roles: ['platform_admin', 'org_admin', 'branch_admin'] }}>
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
              path="/org-templates"
              element={
                <ProtectedRoute access={{ roles: ['platform_admin', 'org_admin'] }}>
                  <OrgTemplates />
                </ProtectedRoute>
              }
            />
            <Route
              path="/branch-import"
              element={
                <ProtectedRoute access={{ roles: ['platform_admin', 'org_admin'] }}>
                  <BranchImport />
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
                <ProtectedRoute access={{ module: 'accounting' }}>
                  <DayBook />
                </ProtectedRoute>
              }
            />
            <Route
              path="/accounting/ledger"
              element={
                <ProtectedRoute access={{ module: 'accounting' }}>
                  <Ledger />
                </ProtectedRoute>
              }
            />
            <Route
              path="/accounting/fee-details"
              element={
                <ProtectedRoute access={{ module: 'accounting' }}>
                  <FeeDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/accounting/balance-sheet"
              element={
                <ProtectedRoute access={{ module: 'accounting' }}>
                  <BalanceSheet />
                </ProtectedRoute>
              }
            />
            <Route
              path="/accounting/annual-report"
              element={
                <ProtectedRoute access={{ module: 'accounting' }}>
                  <AnnualReport />
                </ProtectedRoute>
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route
              path="/exams"
              element={
                <ProtectedRoute access={{ module: 'classes' }}>
                  <ExamManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/subjects"
              element={
                <ProtectedRoute access={{ module: 'classes' }}>
                  <SubjectManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/academic-years"
              element={
                <ProtectedRoute access={{ module: 'classes' }}>
                  <AcademicYearManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/mark-entry"
              element={
                <ProtectedRoute access={{ module: 'classes' }}>
                  <MarkEntryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student-promotion"
              element={
                <ProtectedRoute access={{ module: 'students' }}>
                  <StudentPromotion />
                </ProtectedRoute>
              }
            />
            <Route
              path="/exam-score"
              element={
                <ProtectedRoute access={{ module: 'classes' }}>
                  <ExamScore />
                </ProtectedRoute>
              }
            />
            <Route
              path="/progress-card"
              element={
                <ProtectedRoute access={{ module: 'classes' }}>
                  <ProgressCard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/attendance"
              element={
                <ProtectedRoute access={{ roles: ['platform_admin', 'org_admin', 'branch_admin', 'teacher'] }}>
                  <AttendanceMarking />
                </ProtectedRoute>
              }
            />
            <Route
              path="/attendance-report"
              element={
                <ProtectedRoute access={{ roles: ['platform_admin', 'org_admin', 'branch_admin', 'teacher'] }}>
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
            <Route
              path="/staff-leave-requests"
              element={
                <ProtectedRoute access={{ roles: ['platform_admin', 'org_admin', 'branch_admin', 'teacher', 'staff'] }}>
                  <StaffLeaveRequests />
                </ProtectedRoute>
              }
            />
            <Route
              path="/announcements"
              element={
                <ProtectedRoute>
                  <Announcements />
                </ProtectedRoute>
              }
            />
            <Route
              path="/homework"
              element={
                <ProtectedRoute access={{ roles: ['platform_admin', 'org_admin', 'branch_admin', 'teacher'] }}>
                  <HomeworkManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-homework"
              element={
                <ProtectedRoute access={{ roles: ['student'] }}>
                  <MyHomework />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher-allocations"
              element={
                <ProtectedRoute access={{ roles: ['platform_admin', 'org_admin', 'branch_admin'] }}>
                  <TeacherAllocations />
                </ProtectedRoute>
              }
            />
            <Route
              path="/timetable-configs"
              element={
                <ProtectedRoute access={{ roles: ['platform_admin', 'org_admin', 'branch_admin'] }}>
                  <TimetableConfigs />
                </ProtectedRoute>
              }
            />
            <Route
              path="/timetable"
              element={
                <ProtectedRoute access={{ roles: ['platform_admin', 'org_admin', 'branch_admin'] }}>
                  <TimetableManager />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-timetable"
              element={
                <ProtectedRoute access={{ roles: ['student'] }}>
                  <MyTimetable />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-schedule"
              element={
                <ProtectedRoute access={{ roles: ['teacher'] }}>
                  <TeacherTimetable />
                </ProtectedRoute>
              }
            />
            <Route
              path="/help"
              element={
                <ProtectedRoute>
                  <Help />
                </ProtectedRoute>
              }
            />
            {/* LMS Teacher/Admin Routes */}
            <Route
              path="/lms/chapters"
              element={
                <ProtectedRoute access={{ module: 'classes' }}>
                  <ChapterManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/lms/chapters/:chapterId/content"
              element={
                <ProtectedRoute access={{ module: 'classes' }}>
                  <ChapterContent />
                </ProtectedRoute>
              }
            />
            <Route
              path="/lms/content-library"
              element={
                <ProtectedRoute access={{ module: 'classes' }}>
                  <ContentLibrary />
                </ProtectedRoute>
              }
            />
            <Route
              path="/lms/schedule"
              element={
                <ProtectedRoute access={{ module: 'classes' }}>
                  <ContentSchedule />
                </ProtectedRoute>
              }
            />
            <Route
              path="/lms/calendar"
              element={
                <ProtectedRoute access={{ module: 'classes' }}>
                  <LmsCalendar />
                </ProtectedRoute>
              }
            />
            <Route
              path="/lms/assessments"
              element={
                <ProtectedRoute access={{ module: 'classes' }}>
                  <Assessments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/lms/assessments/builder"
              element={
                <ProtectedRoute access={{ module: 'classes' }}>
                  <AssessmentBuilder />
                </ProtectedRoute>
              }
            />
            <Route
              path="/lms/assessments/builder/:id"
              element={
                <ProtectedRoute access={{ module: 'classes' }}>
                  <AssessmentBuilder />
                </ProtectedRoute>
              }
            />
            <Route
              path="/lms/assessments/:id/results"
              element={
                <ProtectedRoute access={{ module: 'classes' }}>
                  <AssessmentResults />
                </ProtectedRoute>
              }
            />
            <Route
              path="/lms/question-pools"
              element={
                <ProtectedRoute access={{ module: 'classes' }}>
                  <QuestionPools />
                </ProtectedRoute>
              }
            />
            <Route
              path="/lms/submissions"
              element={
                <ProtectedRoute access={{ module: 'classes' }}>
                  <Submissions />
                </ProtectedRoute>
              }
            />
            <Route
              path="/lms/reports"
              element={
                <ProtectedRoute access={{ module: 'classes' }}>
                  <LmsReports />
                </ProtectedRoute>
              }
            />
            <Route
              path="/lms/progress"
              element={
                <ProtectedRoute access={{ module: 'classes' }}>
                  <ProgressDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/lms/clone"
              element={
                <ProtectedRoute access={{ roles: ['platform_admin', 'org_admin', 'branch_admin'] }}>
                  <CloneContent />
                </ProtectedRoute>
              }
            />
            {/* LMS Student Routes */}
            <Route
              path="/lms/my-learning"
              element={
                <ProtectedRoute access={{ roles: ['student'] }}>
                  <StudentLms />
                </ProtectedRoute>
              }
            />
            <Route
              path="/lms/quiz/:id"
              element={
                <ProtectedRoute access={{ roles: ['student'] }}>
                  <AttemptQuiz />
                </ProtectedRoute>
              }
            />
            {/* Student Self-Service Routes */}
            <Route
              path="/my-attendance"
              element={
                <ProtectedRoute access={{ roles: ['student'] }}>
                  <MyAttendance />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-marks"
              element={
                <ProtectedRoute access={{ roles: ['student'] }}>
                  <MyMarks />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-fees"
              element={
                <ProtectedRoute access={{ roles: ['student'] }}>
                  <MyFees />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </FeatureProvider>
          </BranchProvider>
        </AuthProvider>
      </BrowserRouter>
      </OrgBrandingProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
