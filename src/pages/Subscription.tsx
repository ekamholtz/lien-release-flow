
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'stripe-pricing-table': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        'pricing-table-id': string;
        'publishable-key': string;
        'client-reference-id'?: string;
        'customer-email'?: string;
      }, HTMLElement>;
    }
  }
}

type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'unpaid' | 'paused' | 'inactive';

interface Subscription {
  id: string;
  status: SubscriptionStatus;
  plan_name: string | null;
  current_period_end: string | null;
}

const Subscription = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const scriptRef = useRef<HTMLScriptElement | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Handle redirects if user is not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  // Load user's subscription data and redirect if they already have an active subscription
  useEffect(() => {
    async function fetchSubscription() {
      if (!user) return;
      
      try {
        // Call the edge function to get subscription details
        const { data: functionData, error: functionError } = await supabase.functions.invoke('get-subscription', {
          body: { userId: user.id }
        });
        
        if (functionError) {
          console.error('Error fetching subscription:', functionError);
          toast({
            title: 'Error',
            description: 'Failed to load subscription information',
            variant: 'destructive',
          });
          return;
        }
        
        if (functionData?.data) {
          setSubscription({
            id: functionData.data.id,
            status: functionData.data.status as SubscriptionStatus,
            plan_name: functionData.data.plan_name,
            current_period_end: functionData.data.current_period_end,
          });
          
          // If user has an active subscription and we're not processing a checkout result,
          // redirect them to dashboard
          const params = new URLSearchParams(location.search);
          const isSuccess = params.get('success') === 'true';
          const isCanceled = params.get('canceled') === 'true';
          
          if ((functionData.data.status === 'active' || functionData.data.status === 'trialing') && 
              !isSuccess && !isCanceled) {
            navigate('/dashboard');
          }
        }
      } catch (err) {
        console.error('Error in subscription fetch:', err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchSubscription();
  }, [user, toast, navigate, location.search]);

  // Load Stripe pricing table script and handle success redirects
  useEffect(() => {
    if (!scriptRef.current) {
      const script = document.createElement('script');
      script.src = 'https://js.stripe.com/v3/pricing-table.js';
      script.async = true;
      document.body.appendChild(script);
      scriptRef.current = script;
    }

    // Handle success redirect from URL parameters
    const params = new URLSearchParams(location.search);
    if (params.get('success') === 'true') {
      toast({
        title: 'Subscription Successful',
        description: 'Your subscription has been processed successfully.',
      });
      
      // Add a small delay before redirecting to ensure the toast is shown
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    }
    
    if (params.get('canceled') === 'true') {
      toast({
        title: 'Subscription Canceled',
        description: 'You have canceled the subscription process.',
      });
    }

    return () => {
      if (scriptRef.current && document.body.contains(scriptRef.current)) {
        document.body.removeChild(scriptRef.current);
      }
    };
  }, [location.search, navigate, toast]);

  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  // Function to handle cancellation (would require additional implementation)
  const handleCancelSubscription = async () => {
    toast({
      title: 'Feature Coming Soon',
      description: 'Subscription cancellation will be available shortly.',
    });
    // In a real implementation, this would call an endpoint to cancel the subscription
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-construction-50 to-gray-100">
      <div className="py-6 px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-2xl font-bold text-construction-900 mb-2">Subscription Management</h1>
        
        {loading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-construction-600"></div>
          </div>
        ) : subscription && (subscription.status === 'active' || subscription.status === 'trialing') ? (
          <div className="max-w-lg mx-auto mt-8 bg-white p-6 rounded-lg shadow-md">
            <div className="text-lg font-semibold text-construction-700 mb-4">
              Current Subscription
            </div>
            <div className="grid grid-cols-2 gap-4 text-left">
              <div className="text-gray-600">Plan:</div>
              <div className="font-medium">{subscription.plan_name || 'Premium Plan'}</div>
              
              <div className="text-gray-600">Status:</div>
              <div className="font-medium capitalize">{subscription.status}</div>
              
              <div className="text-gray-600">Renewal Date:</div>
              <div className="font-medium">{formatDate(subscription.current_period_end)}</div>
            </div>
            
            <div className="mt-6">
              <button
                onClick={handleCancelSubscription}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded transition-colors"
              >
                Cancel Subscription
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-gray-600 mb-8">
              Select the plan that best fits your business needs
            </p>
            
            <div className="max-w-4xl mx-auto">
              <stripe-pricing-table 
                pricing-table-id="prctbl_1RAHu4Apu80f9E3HscOHoVSP"
                publishable-key="pk_test_51QzjhnApu80f9E3HjlgkmHwM1a4krzjoz0sJlsz41wIhMYIr1sst6sx2mCZ037PiY2UE6xfNA5zzkxCQwOAJ4yoD00gm7TIByL"
                client-reference-id={user?.id}
                customer-email={user?.email}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Subscription;
