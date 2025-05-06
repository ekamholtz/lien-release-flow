
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useSubscription } from '@/hooks/useSubscription';
import { formatDate } from '@/lib/utils';

export const AccountSettings = () => {
  const { subscription, isLoading } = useSubscription();
  
  const handleSaveChanges = () => {
    toast.success('Account information updated successfully');
  };

  const handleManageSubscription = async () => {
    try {
      const { data, error } = await fetch('/api/stripe/customer-portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      }).then(res => res.json());
      
      if (error) throw new Error(error);
      
      if (data?.url) {
        window.location.href = data.url;
      } else {
        toast.error('Unable to access subscription management portal');
      }
    } catch (err) {
      console.error('Error accessing customer portal:', err);
      toast.error('Unable to access subscription management portal. Please try again later.');
    }
  };

  const handleUpdatePayment = () => {
    toast.info('Payment method update will be available soon');
  };

  const getSubscriptionDetails = () => {
    if (isLoading) {
      return {
        plan: 'Loading...',
        nextBillingDate: 'Loading...'
      };
    }
    
    if (!subscription || subscription.status === 'inactive') {
      return {
        plan: 'No active subscription',
        nextBillingDate: 'N/A'
      };
    }
    
    return {
      plan: subscription.plan_name || 'Professional Plan',
      nextBillingDate: subscription.current_period_end ? 
        formatDate(new Date(subscription.current_period_end)) : 
        'Not available'
    };
  };

  const { plan, nextBillingDate } = getSubscriptionDetails();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>General Information</CardTitle>
          <CardDescription>Update your account details and company information.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input id="companyName" defaultValue="Acme Construction, Inc." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" defaultValue="123 Builder St, San Francisco, CA 94103" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" defaultValue="admin@acmeconstruction.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" defaultValue="(415) 555-0123" />
            </div>
          </div>
          <Button className="mt-4" onClick={handleSaveChanges}>Save Changes</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Billing Information</CardTitle>
          <CardDescription>Manage your subscription and payment methods.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Current Plan</p>
            <p className="font-medium">{plan}</p>
            <p className="text-sm text-muted-foreground">Next billing date: {nextBillingDate}</p>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            <Button variant="outline" onClick={handleManageSubscription}>Manage Subscription</Button>
            <Button variant="outline" onClick={handleUpdatePayment}>Update Payment Method</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
