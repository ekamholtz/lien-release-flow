
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AppHeader } from '@/components/AppHeader';
import { AppSidebar } from '@/components/AppSidebar';
import { Button } from '@/components/ui/button';
import { CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';
import { useQboConnection } from '@/hooks/useQboConnection';
import { useCompany } from '@/contexts/CompanyContext';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
  const { user } = useAuth();
  const { currentCompany } = useCompany();
  const { 
    qboStatus, 
    error, 
    debugInfo, 
    handleConnectQbo 
  } = useQboConnection();

  const isQboConnected = qboStatus === "connected";

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader toggleSidebar={() => {}} />
      <div className="flex flex-1 overflow-hidden">
        <AppSidebar />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          <div className="max-w-6xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-bold">Integrations</h1>
              <p className="text-gray-500 mt-1">Connect your payment and accounting services</p>
            </div>
            
            {/* Payment Processing section */}
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
            
            {/* Electronic Signatures section */}
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
            
            {/* Accounting & ERP section */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Accounting & ERP</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <IntegrationCard 
                  title="QuickBooks Online" 
                  description="Sync invoices and payment data with QuickBooks" 
                  icon="/placeholder.svg" 
                  isConnected={isQboConnected}
                  buttonText={isQboConnected ? "Manage Connection" : "Connect"}
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
            
            {/* Error and debug info */}
            {error && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-start gap-2 text-red-600">
                  <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <span>{String(error)}</span>
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
