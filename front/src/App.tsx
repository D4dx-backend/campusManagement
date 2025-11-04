import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import Staff from "./pages/Staff";
import Fees from "./pages/Fees";
import Payroll from "./pages/Payroll";
import Expenses from "./pages/Expenses";
import TextBooks from "./pages/TextBooks";
import TextbookIndents from "./pages/TextbookIndents";
import Reports from "./pages/Reports";
import Classes from "./pages/Classes";
import Divisions from "./pages/Divisions";
import ExpenseCategories from "./pages/ExpenseCategories";
import IncomeCategories from "./pages/IncomeCategories";
import Departments from "./pages/Departments";
import Designations from "./pages/Designations";
import ActivityLog from "./pages/ActivityLog";
import UserAccess from "./pages/UserAccess";
import BranchManagement from "./pages/BranchManagement";
import ReceiptConfig from "./pages/ReceiptConfig";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
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
  
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <AuthProvider>
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
                <ProtectedRoute>
                  <UserAccess />
                </ProtectedRoute>
              }
            />
            <Route
              path="/branch-management"
              element={
                <ProtectedRoute>
                  <BranchManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/receipt-config"
              element={
                <ProtectedRoute>
                  <ReceiptConfig />
                </ProtectedRoute>
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
