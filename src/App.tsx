import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Index from './pages/Index';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import NewProject from './pages/NewProject';
import CreateProject from './pages/CreateProject';
import ProjectDashboard from './pages/ProjectDashboard';
import AccountsReceivable from './pages/AccountsReceivable';
import CreateInvoice from './pages/CreateInvoice';
import AccountsPayable from './pages/AccountsPayable';
import CreateBill from './pages/CreateBill';
import Documents from './pages/Documents';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Team from './pages/Team';
import Subscription from './pages/Subscription';
import LienRelease from './pages/LienRelease';
import Integrations from './pages/Integrations';
import NotFound from './pages/NotFound';
import OnboardingPage from './pages/OnboardingPage';

// Auth guard for protected routes
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  return <>{children}</>;
};

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/auth" element={<Auth />} />
      
      {/* Onboarding routes */}
      <Route 
        path="/onboarding/:step" 
        element={
          <ProtectedRoute>
            <OnboardingPage />
          </ProtectedRoute>
        } 
      />
      
      {/* Dashboard and main routes */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/projects" 
        element={
          <ProtectedRoute>
            <Projects />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/projects/new" 
        element={
          <ProtectedRoute>
            <NewProject />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/projects/create" 
        element={
          <ProtectedRoute>
            <CreateProject />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/projects/:projectId" 
        element={
          <ProtectedRoute>
            <ProjectDashboard />
          </ProtectedRoute>
        } 
      />
      
      {/* Finance routes */}
      <Route 
        path="/invoices" 
        element={
          <ProtectedRoute>
            <AccountsReceivable />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/invoices/create" 
        element={
          <ProtectedRoute>
            <CreateInvoice />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/bills" 
        element={
          <ProtectedRoute>
            <AccountsPayable />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/bills/create" 
        element={
          <ProtectedRoute>
            <CreateBill />
          </ProtectedRoute>
        } 
      />
      
      {/* Other routes */}
      <Route 
        path="/documents" 
        element={
          <ProtectedRoute>
            <Documents />
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
        path="/settings" 
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/team" 
        element={
          <ProtectedRoute>
            <Team />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/subscription" 
        element={
          <ProtectedRoute>
            <Subscription />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/lien-release/:id" 
        element={
          <ProtectedRoute>
            <LienRelease />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/integrations" 
        element={
          <ProtectedRoute>
            <Integrations />
          </ProtectedRoute>
        } 
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default App;
