
import React from 'react';
import { Routes, Route } from 'react-router-dom';
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

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/auth" element={<Auth />} />
      
      {/* Dashboard and main routes */}
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/projects" element={<Projects />} />
      <Route path="/projects/new" element={<NewProject />} />
      <Route path="/projects/create" element={<CreateProject />} />
      <Route path="/projects/:projectId" element={<ProjectDashboard />} />
      
      {/* Finance routes */}
      <Route path="/invoices" element={<AccountsReceivable />} />
      <Route path="/invoices/create" element={<CreateInvoice />} />
      <Route path="/bills" element={<AccountsPayable />} />
      <Route path="/bills/create" element={<CreateBill />} />
      
      {/* Other routes */}
      <Route path="/documents" element={<Documents />} />
      <Route path="/reports" element={<Reports />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/team" element={<Team />} />
      <Route path="/subscription" element={<Subscription />} />
      <Route path="/lien-release/:id" element={<LienRelease />} />
      
      <Route path="/integrations" element={<Integrations />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default App;
