// App entry point
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PublicRoute } from "@/components/auth/PublicRoute";

// Auth pages
import LoginPage from "@/pages/auth/Login";
import RegisterPage from "@/pages/auth/Register";
import RecoverPage from "@/pages/auth/Recover";
import PendingPage from "@/pages/auth/Pending";

// Dashboard pages
import DashboardRedirect from "@/pages/dashboard/DashboardRedirect";
import SuperadminDashboard from "@/pages/dashboard/SuperadminDashboard";
import AdminDashboard from "@/pages/dashboard/AdminDashboard";
import SupervisorDashboard from "@/pages/dashboard/SupervisorDashboard";
import AcreditadorDashboard from "@/pages/dashboard/AcreditadorDashboard";

// App pages
import UsersPage from "@/pages/app/Users";
import EventsPage from "@/pages/app/Events";
import InvoicesPage from "@/pages/app/Invoices";
import ReimbursementsPage from "@/pages/app/Reimbursements";
import SupportPage from "@/pages/app/Support";
import RankingPage from "@/pages/app/Ranking";
import QuotesPage from "@/pages/app/Quotes";
import SettingsPage from "@/pages/app/Settings";
import ProfilePage from "@/pages/app/Profile";

import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Navigate to="/auth/login" replace />} />
            
            <Route path="/auth/login" element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            } />
            
            <Route path="/auth/register" element={
              <PublicRoute>
                <RegisterPage />
              </PublicRoute>
            } />
            
            <Route path="/auth/recover" element={
              <PublicRoute>
                <RecoverPage />
              </PublicRoute>
            } />
            
            <Route path="/auth/pending" element={<PendingPage />} />

            {/* Protected routes */}
            <Route path="/app/dashboard" element={
              <ProtectedRoute>
                <DashboardRedirect />
              </ProtectedRoute>
            } />

            <Route path="/app/dashboard/superadmin" element={
              <ProtectedRoute requiredRoles={['superadmin']}>
                <SuperadminDashboard />
              </ProtectedRoute>
            } />

            <Route path="/app/dashboard/admin" element={
              <ProtectedRoute requiredRoles={['superadmin', 'administracion']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />

            <Route path="/app/dashboard/supervisor" element={
              <ProtectedRoute requiredRoles={['superadmin', 'administracion', 'supervisor']}>
                <SupervisorDashboard />
              </ProtectedRoute>
            } />

            <Route path="/app/dashboard/acreditador" element={
              <ProtectedRoute>
                <AcreditadorDashboard />
              </ProtectedRoute>
            } />

            <Route path="/app/users" element={
              <ProtectedRoute>
                <UsersPage />
              </ProtectedRoute>
            } />

            <Route path="/app/events" element={
              <ProtectedRoute>
                <EventsPage />
              </ProtectedRoute>
            } />

            <Route path="/app/invoices" element={
              <ProtectedRoute>
                <InvoicesPage />
              </ProtectedRoute>
            } />

            <Route path="/app/reimbursements" element={
              <ProtectedRoute>
                <ReimbursementsPage />
              </ProtectedRoute>
            } />

            <Route path="/app/support" element={
              <ProtectedRoute>
                <SupportPage />
              </ProtectedRoute>
            } />

            <Route path="/app/ranking" element={
              <ProtectedRoute>
                <RankingPage />
              </ProtectedRoute>
            } />

            <Route path="/app/quotes" element={
              <ProtectedRoute requiredRoles={['superadmin', 'administracion']}>
                <QuotesPage />
              </ProtectedRoute>
            } />

            <Route path="/app/settings" element={
              <ProtectedRoute requiredRoles={['superadmin']}>
                <SettingsPage />
              </ProtectedRoute>
            } />

            <Route path="/app/profile" element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
