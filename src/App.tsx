
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import CreateInvoice from "./pages/CreateInvoice";
import CreateBill from "./pages/CreateBill";
import LienRelease from "./pages/LienRelease";
import Integrations from "./pages/Integrations";
import Settings from "./pages/Settings";
import AccountsPayable from "./pages/AccountsPayable";
import AccountsReceivable from "./pages/AccountsReceivable";
import NotFound from "./pages/NotFound";

const App = () => {
  // Create a new QueryClient instance inside the component
  const queryClient = new QueryClient();
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/create-invoice" element={<CreateInvoice />} />
            <Route path="/create-bill" element={<CreateBill />} />
            <Route path="/lien-release" element={<LienRelease />} />
            <Route path="/accounts-payable" element={<AccountsPayable />} />
            <Route path="/accounts-receivable" element={<AccountsReceivable />} />
            <Route path="/integrations" element={<Integrations />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
