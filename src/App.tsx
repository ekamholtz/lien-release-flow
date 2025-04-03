
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
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
import Team from "./pages/Team";
import Reports from "./pages/Reports";
import NotFound from "./pages/NotFound";

const App = () => {
  const [session, setSession] = useState<Session | null>(null);
  // Create a new QueryClient instance inside the component
  const queryClient = new QueryClient();
  
  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Auth state changed:", event);
        setSession(session);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Protected route component
  const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
    if (!session) {
      return <Navigate to="/auth" replace />;
    }
    return children;
  };
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            
            {/* Protected routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/create-invoice" element={
              <ProtectedRoute>
                <CreateInvoice />
              </ProtectedRoute>
            } />
            <Route path="/create-bill" element={
              <ProtectedRoute>
                <CreateBill />
              </ProtectedRoute>
            } />
            <Route path="/lien-release" element={
              <ProtectedRoute>
                <LienRelease />
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
            <Route path="/integrations" element={
              <ProtectedRoute>
                <Integrations />
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
