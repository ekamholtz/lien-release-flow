import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AppHeader } from '@/components/AppHeader';
import { AppSidebar } from '@/components/AppSidebar';
import { Button } from '@/components/ui/button';
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
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
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
    if (!session?.access_token) {
      setError("No active session found. Please sign in again.");
      return;
    }
    
    try {
      setError(null);
      setDebugInfo(null);
      
      // Call the qbo-authorize edge function with proper Authorization header
      const res = await fetch(
        "https://oknofqytitpxmlprvekn.functions.supabase.co/qbo-authorize",
        { 
          headers: { 
            Authorization: `Bearer ${session.access_token}`,
            apikey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9rbm9mcXl0aXRweG1scHJ2ZWtuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3MDk0MzcsImV4cCI6MjA1OTI4NTQzN30.NG0oR4m9GCeLfpr11hsZEG5hVXs4uZzJOcFT7elrIAQ"
          } 
        }
      );
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error("QBO authorize error:", errorText);
        
        // Try to parse the error response
        try {
          const errorJson = JSON.parse(errorText);
          setDebugInfo(errorJson.debug || {});
        } catch (e) {
          // If it's not JSON, just use the text
        }
        
        setError(`Connection failed: ${errorText || res.statusText}`);
        return;
      }
      
      // Get the Intuit OAuth URL from the response
      const responseData = await res.json();
      console.log("QBO response data:", responseData);
      
      if (responseData.debug) {
        setDebugInfo(responseData.debug);
      }
      
      if (!responseData.intuit_oauth_url) {
        setError("No OAuth URL received from server");
        return;
      }
      
      // Redirect to Intuit OAuth URL
      window.location.href = responseData.intuit_oauth_url;
    } catch (err: any) {
      console.error("Error connecting to QBO:", err);
      setError(err.message || "Failed to connect to QuickBooks");
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
            
            {error && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-start gap-2 text-red-600">
                  <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              </div>
            )}
            
            {debugInfo && (
              <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-md">
                <h3 className="text-md font-medium mb-2">Debug Information</h3>
                <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-64">
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Integrations;
