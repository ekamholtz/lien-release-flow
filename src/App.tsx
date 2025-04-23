import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { Toaster } from '@/components/ui/toaster';

// Pages
import Index from '@/pages/Index';
import Dashboard from '@/pages/Dashboard';
import AccountsPayable from '@/pages/AccountsPayable';
import AccountsReceivable from '@/pages/AccountsReceivable';
import CreateBill from '@/pages/CreateBill';
import CreateInvoice from '@/pages/CreateInvoice';
import LienRelease from '@/pages/LienRelease';
import Settings from '@/pages/Settings';
import Integrations from '@/pages/Integrations';
import NotFound from '@/pages/NotFound';
import Auth from '@/pages/Auth';
import Team from '@/pages/Team';
import Reports from '@/pages/Reports';
import Subscription from '@/pages/Subscription';
import Documents from '@/pages/Documents';
import ProjectDashboard from '@/pages/ProjectDashboard';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!user) {
    // Redirect to auth page, but save the location the user was trying to access
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  
  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  // If user is authenticated, redirect to dashboard 
  if (user) {
    // Always redirect to dashboard if user is authenticated
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={
            <PublicOnlyRoute>
              <Auth />
            </PublicOnlyRoute>
          } />

          {/* Subscription route (requires auth) */}
          <Route path="/subscription" element={
            <ProtectedRoute>
              <Subscription />
            </ProtectedRoute>
          } />

          {/* Protected routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/accounts-payable" element={
            <ProtectedRoute>
              <AccountsPayable />
            </ProtectedRoute>
          } />
          <Route path="/accounts-receivable" element={
            <ProtectedRoute>
              <AccountsReceivable />
            </ProtectedRoute>
          } />
          <Route path="/create-bill" element={
            <ProtectedRoute>
              <CreateBill />
            </ProtectedRoute>
          } />
          <Route path="/create-invoice" element={
            <ProtectedRoute>
              <CreateInvoice />
            </ProtectedRoute>
          } />
          <Route path="/lien-release" element={
            <ProtectedRoute>
              <LienRelease />
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } />
          <Route path="/integrations" element={
            <ProtectedRoute>
              <Integrations />
            </ProtectedRoute>
          } />
          <Route path="/team" element={
            <ProtectedRoute>
              <Team />
            </ProtectedRoute>
          } />
          <Route path="/reports" element={
            <ProtectedRoute>
              <Reports />
            </ProtectedRoute>
          } />
          <Route path="/documents" element={
            <ProtectedRoute>
              <Documents />
            </ProtectedRoute>
          } />
          <Route path="/projects/:projectId" element={
            <ProtectedRoute>
              <ProjectDashboard />
            </ProtectedRoute>
          } />

          {/* Catch-all route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
      </AuthProvider>
    </Router>
  );
}

export default App;
