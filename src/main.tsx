
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'
import { Toaster as ShadcnToaster } from "@/components/ui/toaster"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ThemeProvider } from "next-themes"
import App from './App.tsx'
import './index.css'
import { AuthProvider } from './hooks/useAuth'
import { CompanyProvider } from './contexts/CompanyContext'

// Create a client
const queryClient = new QueryClient()

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <CompanyProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <TooltipProvider>
              <App />
              <Toaster position="top-right" />
              <ShadcnToaster />
            </TooltipProvider>
          </ThemeProvider>
        </CompanyProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);
