
import { Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import CreateProject from "./pages/CreateProject";
import NewProject from "./pages/NewProject";
import CreateInvoice from "./pages/CreateInvoice";
import CreateBill from "./pages/CreateBill";
import ProjectDashboard from "./pages/ProjectDashboard";
import AccountsReceivable from "./pages/AccountsReceivable";
import AccountsPayable from "./pages/AccountsPayable";
import Integrations from "./pages/Integrations";
import UnsyncedTransactions from "./pages/UnsyncedTransactions";
import Settings from "./pages/Settings";
import Team from "./pages/Team";
import Clients from "./pages/Clients";
import Vendors from "./pages/Vendors";
import Documents from "./pages/Documents";
import Reports from "./pages/Reports";
import Contact from "./pages/Contact";
import OnboardingPage from "./pages/OnboardingPage";
import CreateContract from "./pages/CreateContract";
import Contract from "./pages/Contract";
import ResetPassword from "./pages/ResetPassword";
import ReviewPdfPage from "./pages/ReviewPdfPage";
import DocxFillPage from "./pages/DocxFillPage";
import LienRelease from "./pages/LienRelease";
import Subscription from "./pages/Subscription";
import NotFound from "./pages/NotFound";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/projects" element={<Projects />} />
      <Route path="/projects/create" element={<CreateProject />} />
      <Route path="/projects/new" element={<NewProject />} />
      <Route path="/projects/:projectId" element={<ProjectDashboard />} />
      <Route path="/invoices/create" element={<CreateInvoice />} />
      <Route path="/bills/create" element={<CreateBill />} />
      <Route path="/accounts-receivable" element={<AccountsReceivable />} />
      <Route path="/accounts-payable" element={<AccountsPayable />} />
      <Route path="/integrations" element={<Integrations />} />
      <Route path="/unsynced-transactions" element={<UnsyncedTransactions />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/team" element={<Team />} />
      <Route path="/clients" element={<Clients />} />
      <Route path="/vendors" element={<Vendors />} />
      <Route path="/documents" element={<Documents />} />
      <Route path="/reports" element={<Reports />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/contracts/create" element={<CreateContract />} />
      <Route path="/contracts/:contractId" element={<Contract />} />
      <Route path="/review-pdf" element={<ReviewPdfPage />} />
      <Route path="/docx-fill" element={<DocxFillPage />} />
      <Route path="/lien-release" element={<LienRelease />} />
      <Route path="/subscription" element={<Subscription />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
