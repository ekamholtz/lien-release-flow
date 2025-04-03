
import React from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ExternalLink, CheckCircle2, AlertCircle } from 'lucide-react';

export const IntegrationsSettings = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>QuickBooks Online</CardTitle>
          <CardDescription>Sync invoices, payments, and expenses with your QuickBooks account.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-10 w-10 rounded bg-blue-100 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="h-6 w-6 text-blue-600">
                  <path fill="currentColor" d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm-3 18v-12l9 6-9 6z" />
                </svg>
              </div>
              <div>
                <p className="font-medium">Connected</p>
                <p className="text-xs text-muted-foreground">Last synced: 2 hours ago</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                Sync Now
              </Button>
              <Button variant="outline" size="sm">
                Settings
                <ExternalLink className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm">Auto-sync invoices</p>
                <p className="text-xs text-muted-foreground">Automatically sync new invoices to QuickBooks</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm">Auto-sync payments</p>
                <p className="text-xs text-muted-foreground">Automatically sync payments to QuickBooks</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm">Auto-sync expenses</p>
                <p className="text-xs text-muted-foreground">Automatically sync expenses to QuickBooks</p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Checkbook.io</CardTitle>
          <CardDescription>Send and receive digital checks for faster payments.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-10 w-10 rounded bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="font-medium">Connected</p>
                <p className="text-xs text-muted-foreground">API Key: ****-****-****-3F7A</p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              Configure
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Finix</CardTitle>
          <CardDescription>Process payments and handle financial transactions.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-10 w-10 rounded bg-amber-100 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="font-medium">Not Connected</p>
                <p className="text-xs text-muted-foreground">Connect your Finix account to enable payments</p>
              </div>
            </div>
            <Button size="sm">
              Connect
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Electronic Signature</CardTitle>
          <CardDescription>Enable secure electronic signature for documents.</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <AlertDescription>
              Connect with SignNow or OpenSign to enable electronic signatures for lien releases and other documents.
            </AlertDescription>
          </Alert>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="p-4">
                <CardTitle className="text-base">SignNow</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-sm text-muted-foreground mb-4">Industry-standard e-signature service.</p>
                <Button variant="outline" size="sm" className="w-full">Connect</Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="p-4">
                <CardTitle className="text-base">OpenSign</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-sm text-muted-foreground mb-4">Open-source e-signature solution.</p>
                <Button variant="outline" size="sm" className="w-full">Connect</Button>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
