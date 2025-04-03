
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
import { toast } from 'sonner';
import { 
  Bell, 
  Mail, 
  Smartphone, 
  CreditCard, 
  FileText, 
  FileSignature 
} from 'lucide-react';

export const NotificationsSettings = () => {
  const handleSavePreferences = () => {
    toast.success('Notification preferences saved successfully');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Notification Channels</CardTitle>
          </div>
          <CardDescription>Choose how you'd like to receive notifications.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Email</p>
                <p className="text-xs text-muted-foreground">admin@acmeconstruction.com</p>
              </div>
            </div>
            <Switch defaultChecked />
          </div>
          
          <div className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
            <div className="flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">SMS</p>
                <p className="text-xs text-muted-foreground">(415) 555-0123</p>
              </div>
            </div>
            <Switch defaultChecked />
          </div>
          
          <div className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">In-App Notifications</p>
                <p className="text-xs text-muted-foreground">Receive notifications within the dashboard</p>
              </div>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Payment Notifications</CardTitle>
          </div>
          <CardDescription>Configure notifications for payment activity.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">New Payment Received</p>
              <p className="text-xs text-muted-foreground">Get notified when you receive a new payment</p>
            </div>
            <Switch defaultChecked />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Payment Past Due</p>
              <p className="text-xs text-muted-foreground">Get notified when an invoice is past due</p>
            </div>
            <Switch defaultChecked />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Payment Status Updates</p>
              <p className="text-xs text-muted-foreground">Get notified when a payment status changes</p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Document Notifications</CardTitle>
          </div>
          <CardDescription>Configure notifications for document activity.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">New Invoice Created</p>
              <p className="text-xs text-muted-foreground">Get notified when a new invoice is created</p>
            </div>
            <Switch defaultChecked />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Invoice Viewed</p>
              <p className="text-xs text-muted-foreground">Get notified when an invoice is viewed by a client</p>
            </div>
            <Switch defaultChecked />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Lien Release Status</p>
              <p className="text-xs text-muted-foreground">Get notified about lien release updates</p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileSignature className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Signature Notifications</CardTitle>
          </div>
          <CardDescription>Configure notifications for electronic signatures.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Signature Request Sent</p>
              <p className="text-xs text-muted-foreground">Get notified when a signature request is sent</p>
            </div>
            <Switch defaultChecked />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Document Signed</p>
              <p className="text-xs text-muted-foreground">Get notified when a document is signed</p>
            </div>
            <Switch defaultChecked />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Signature Reminder</p>
              <p className="text-xs text-muted-foreground">Get notified when a signature reminder is sent</p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end mb-10">
        <Button onClick={handleSavePreferences}>Save Notification Preferences</Button>
      </div>
    </div>
  );
};
