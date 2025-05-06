import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useSubscription } from '@/hooks/useSubscription';
import { formatDate } from '@/lib/utils';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'stripe-pricing-table': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        'pricing-table-id': string;
        'publishable-key': string;
        'client-reference-id'?: string;
        'customer-email'?: string;
        'success-url'?: string;
        'cancel-url'?: string;
      }, HTMLElement>;
    }
  }
}

const Subscription = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const scriptRef = useRef<HTMLScriptElement | null>(null);
  const [loading, setLoading] = useState(true);
  const { subscription, isLoading: subscriptionLoading, refetch } = useSubscription();

  // Handle redirects if user is not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  // Process URL parameters and redirect after Stripe checkout
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const isSuccess = params.get('success') === 'true';
    const isCanceled = params.get('canceled') === 'true';
    
    if (isSuccess) {
      toast.success('Subscription Successful', {
        description: 'Your subscription has been processed successfully.',
      });
      refetch();
      navigate('/dashboard', { replace: true });
    }
    
    if (isCanceled) {
      toast.info('Subscription Canceled', {
        description: 'You have canceled the subscription process.',
      });
    }
  }, [location.search, navigate, refetch]);

  // Load Stripe pricing table script
  useEffect(() => {
    if (!scriptRef.current) {
      const script = document.createElement('script');
      script.src = 'https://js.stripe.com/v3/pricing-table.js';
      script.async = true;
      document.body.appendChild(script);
      scriptRef.current = script;
    }
    
    return () => {
      if (scriptRef.current && document.body.contains(scriptRef.current)) {
        document.body.removeChild(scriptRef.current);
      }
    };
  }, []);

  // Check if user already has an active subscription
  useEffect(() => {
    if (!subscriptionLoading && subscription && 
        (subscription.status === 'active' || subscription.status === 'trialing')) {
      navigate('/dashboard');
    } else {
      setLoading(false);
    }
  }, [subscription, subscriptionLoading, navigate]);

  // Function to handle cancellation
  const handleCancelSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      
      if (error || !data?.url) {
        throw new Error(error || 'Failed to get customer portal URL');
      }
      
      window.location.href = data.url;
    } catch (err) {
      console.error('Error opening customer portal:', err);
      toast.error('Failed to open subscription management portal');
    }
  };

  if (loading || subscriptionLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-construction-50 to-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-construction-600"></div>
      </div>
    );
  }

  // If user has active subscription, show details
  if (subscription && (subscription.status === 'active' || subscription.status === 'trialing')) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-construction-50 to-gray-100">
        <div className="py-6 px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-2xl font-bold text-construction-900 mb-2">Subscription Management</h1>
          
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
              <div className="font-medium">{
                subscription.current_period_end ? 
                formatDate(new Date(subscription.current_period_end)) : 'N/A'
              }</div>
            </div>
            
            <div className="mt-6">
              <button
                onClick={handleCancelSubscription}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded transition-colors"
              >
                Manage Subscription
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Otherwise show subscription plans
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-construction-50 to-gray-100">
      <div className="py-6 px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-2xl font-bold text-construction-900 mb-2">Subscription Management</h1>
        
        <p className="text-gray-600 mb-8">
          Select the plan that best fits your business needs
        </p>
        
        <div className="max-w-4xl mx-auto">
          <stripe-pricing-table 
            pricing-table-id="prctbl_1RAHu4Apu80f9E3HscOHoVSP"
            publishable-key="pk_test_51QzjhnApu80f9E3HjlgkmHwM1a4krzjoz0sJlsz41wIhMYIr1sst6sx2mCZ037PiY2UE6xfNA5zzkxCQwOAJ4yoD00gm7TIByL"
            client-reference-id={user?.id}
            customer-email={user?.email}
            success-url={`${window.location.origin}/subscription?success=true`}
            cancel-url={`${window.location.origin}/subscription?canceled=true`}
          />
        </div>
      </div>
    </div>
  );
};

export default Subscription;
