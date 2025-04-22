
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AppHeader } from '@/components/AppHeader';
import { AppSidebar } from '@/components/AppSidebar';
import { Button } from '@/components/ui/button';
import { AiAssistant } from '@/components/dashboard/AiAssistant';
import { CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';

const IntegrationCard = ({ 
  title, 
  description, 
  icon, 
  isConnected = false, 
  buttonText = "Connect",
  onButtonClick,
}: { 
  title: string; 
  description: string; 
  icon: string; 
  isConnected?: boolean; 
  buttonText?: string;
  onButtonClick?: () => void;
}) => (
  <div className="dashboard-card flex flex-col">
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center space-x-3">
        <div className="h-12 w-12 rounded-md overflow-hidden">
          <img src={icon} alt={title} className="h-full w-full object-cover" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-semibold">{title}</h3>
            {isConnected && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Connected
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>
    </div>
    
    <div className="mt-auto pt-4">
      <Button 
        variant={isConnected ? "outline" : "default"} 
        className={isConnected ? "text-construction-600 border-construction-200" : "bg-construction-600 hover:bg-construction-700"}
        onClick={onButtonClick}
      >
        {isConnected ? "Manage Connection" : buttonText}
        <ExternalLink className="ml-2 h-4 w-4" />
      </Button>
    </div>
  </div>
);

const Integrations = () => {
  const { user, session } = useAuth();
  const [qboConnected, setQboConnected] = useState(false);
  
  useEffect(() => {
    if (!user || !session?.access_token) return;
    
    // Check QBO connection status
    fetch(
      `https://oknofqytitpxmlprvekn.supabase.co/rest/v1/qbo_connections?user_id=eq.${user.id}&select=id`,
      {
        headers: {
          apikey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9rbm9mcXl0aXRweG1scHJ2ZWtuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3MDk0MzcsImV4cCI6MjA1OTI4NTQzN30.NG0oR4m9GCeLfpr11hsZEG5hVXs4uZzJOcFT7elrIAQ",
          Authorization: `Bearer ${session.access_token}`,
        }
      }
    )
      .then((r) => r.ok ? r.json() : [])
      .then((rows) => {
        setQboConnected(Array.isArray(rows) && rows.length > 0);
      })
      .catch((err) => {
        console.error("Error checking QBO connection:", err);
      });
  }, [user, session]);

  const handleConnectQbo = async () => {
    if (!session?.access_token) return;
    
    try {
      const response = await fetch(
        "https://oknofqytitpxmlprvekn.functions.supabase.co/qbo-authorize",
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${session.access_token}`,
            "Content-Type": "application/json"
          }
        }
      );
      
      const data = await response.json();
      
      if (data?.intuit_oauth_url) {
        console.log("Redirecting to Intuit OAuth URL...");
        window.location.href = data.intuit_oauth_url;
      }
    } catch (error) {
      console.error("Error connecting to QBO:", error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <div className="flex flex-1 overflow-hidden">
        <AppSidebar />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          <div className="max-w-6xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-bold">Integrations</h1>
              <p className="text-gray-500 mt-1">Connect your payment and accounting services</p>
            </div>
            
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4">Payment Processing</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <IntegrationCard 
                  title="Checkbook.io" 
                  description="Process outgoing payments and disbursements" 
                  icon="/placeholder.svg" 
                  isConnected={true}
                />
                <IntegrationCard 
                  title="Finix" 
                  description="Accept and process incoming payments" 
                  icon="/placeholder.svg" 
                />
              </div>
            </div>
            
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4">Electronic Signatures</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <IntegrationCard 
                  title="SignNow" 
                  description="Electronic signature solution for lien releases" 
                  icon="/placeholder.svg" 
                />
                <IntegrationCard 
                  title="OpenSign" 
                  description="Open source electronic signature platform" 
                  icon="/placeholder.svg" 
                />
              </div>
            </div>
            
            <div>
              <h2 className="text-lg font-semibold mb-4">Accounting & ERP</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <IntegrationCard 
                  title="QuickBooks Online" 
                  description="Sync invoices and payment data with QuickBooks" 
                  icon="/placeholder.svg" 
                  isConnected={qboConnected}
                  buttonText="Connect"
                  onButtonClick={handleConnectQbo}
                />
                <IntegrationCard 
                  title="Custom ERP" 
                  description="Connect to your enterprise resource planning system" 
                  icon="/placeholder.svg" 
                  buttonText="Configure API"
                />
              </div>
            </div>
          </div>
        </main>
      </div>
      <AiAssistant />
    </div>
  );
};

export default Integrations;
