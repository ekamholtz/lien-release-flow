
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type SubscriptionStatus = 
  | 'active' 
  | 'trialing' 
  | 'past_due' 
  | 'canceled' 
  | 'incomplete' 
  | 'incomplete_expired' 
  | 'unpaid' 
  | 'paused' 
  | 'inactive';

export interface Subscription {
  id: string;
  status: SubscriptionStatus;
  plan_name: string | null;
  plan_id: string | null;
  current_period_end: string | null;
  current_period_start: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  cancel_at_period_end: boolean;
}

export function useSubscription() {
  const { user } = useAuth();
  
  const { 
    data: subscription, 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async (): Promise<Subscription | null> => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching subscription data:', error);
        throw error;
      }
      
      return data as Subscription | null;
    },
    enabled: !!user?.id
  });
  
  return {
    subscription,
    isLoading,
    error,
    refetch
  };
}
