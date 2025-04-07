
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { getEnvVars } from "./config.ts";

// Handle checkout session completed event
export async function handleCheckoutSessionCompleted(event: any, stripe: Stripe, supabase: any) {
  const checkoutSession = event.data.object;
  console.log(`🔔 Checkout completed for session ${checkoutSession.id}`);
  
  // Get customer and subscription details from the session
  const customerId = checkoutSession.customer;
  const subscriptionId = checkoutSession.subscription;
  let userId = checkoutSession.client_reference_id; // This should be set during checkout creation
  
  // If userId is missing, try to find it from customer data or customer metadata
  if (!userId && customerId) {
    console.log(`⚠️ Missing user_id in checkout session, attempting to find from customer: ${customerId}`);
    
    try {
      // First, check if we already have this customer mapped to a user in our subscriptions table
      const { data: existingCustomer } = await supabase
        .from('subscriptions')
        .select('user_id')
        .eq('stripe_customer_id', customerId)
        .maybeSingle();
        
      if (existingCustomer?.user_id) {
        console.log(`✅ Found user_id ${existingCustomer.user_id} from existing customer record`);
        userId = existingCustomer.user_id;
      } else if (checkoutSession.customer_details?.email) {
        // If we don't have a mapping, try to find the user by email
        const { data: userByEmail } = await supabase
          .from('auth')
          .select('users.id')
          .eq('users.email', checkoutSession.customer_details.email)
          .maybeSingle();
          
        if (userByEmail?.id) {
          console.log(`✅ Found user_id ${userByEmail.id} by email lookup`);
          userId = userByEmail.id;
        }
      }
    } catch (err) {
      console.error('Error looking up user from customer:', err);
    }
  }
  
  if (!userId) {
    console.warn('⚠️ Missing user_id in checkout session and could not find via customer');
    // We'll still proceed to record the subscription, but without a user association
    // The user will need to be associated later
  }
  
  if (subscriptionId) {
    // Get subscription details from Stripe
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const planId = subscription.items.data[0].price.id;
    const planName = subscription.items.data[0].price.nickname || 'Default Plan';
    
    if (userId) {
      // Check if a subscription record exists for this user
      const { data: existingSubscription } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
        
      if (existingSubscription) {
        // Update existing subscription
        const { error } = await supabase
          .from('subscriptions')
          .update({
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            status: subscription.status,
            plan_id: planId,
            plan_name: planName,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);
          
        if (error) {
          console.error('Error updating subscription record:', error);
        } else {
          console.log(`✅ Successfully updated subscription for user ${userId}`);
        }
      } else {
        // Create new subscription
        const { error } = await supabase
          .from('subscriptions')
          .insert({
            user_id: userId,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            status: subscription.status,
            plan_id: planId,
            plan_name: planName,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end
          });
            
        if (error) {
          console.error('Error creating subscription record:', error);
        } else {
          console.log(`✅ Successfully created subscription for user ${userId}`);
        }
      }
    } else if (customerId) {
      // Store the subscription with customer ID only for now
      // We'll associate it with a user later when they log in
      const { error } = await supabase
        .from('subscriptions')
        .insert({
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          status: subscription.status,
          plan_id: planId,
          plan_name: planName,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end
        });
          
      if (error) {
        console.error('Error creating orphaned subscription record:', error);
      } else {
        console.log(`✅ Created subscription without user association for customer ${customerId}`);
      }
    }
  } else {
    console.warn('⚠️ Missing subscription_id in checkout session');
  }
}

// Handle subscription created event
export async function handleSubscriptionCreated(event: any, stripe: Stripe, supabase: any) {
  const subscription = event.data.object;
  console.log(`🔔 Subscription created: ${subscription.id}`);
  
  // Since this might be a subscription created outside of our checkout flow,
  // we need to find the user associated with this customer
  const customerId = subscription.customer;
  
  if (!customerId) {
    console.warn('⚠️ Missing customer ID in subscription event');
    return;
  }
  
  // First check if we already have this customer ID in our system
  const { data: userData, error: userError } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .maybeSingle();
    
  if (userError) {
    console.error('Error looking up user:', userError);
    return;
  }
  
  if (!userData?.user_id) {
    console.log(`⚠️ No user found for customer ${customerId}, will be linked when customer completes checkout`);
    return;
  }
  
  const userId = userData.user_id;
  const planId = subscription.items.data[0].price.id;
  const planName = subscription.items.data[0].price.nickname || 'Default Plan';
  
  // Update subscription record
  const { error } = await supabase
    .from('subscriptions')
    .update({
      stripe_subscription_id: subscription.id,
      status: subscription.status,
      plan_id: planId,
      plan_name: planName,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId);
    
  if (error) {
    console.error('Error updating subscription record:', error);
  }
}

// Handle subscription updated event
export async function handleSubscriptionUpdated(event: any, supabase: any) {
  const subscription = event.data.object;
  console.log(`🔔 Subscription updated: ${subscription.id}`);
  
  // Update subscription record in database
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscription.id);
    
  if (error) {
    console.error('Error updating subscription record:', error);
  }
}

// Handle subscription deleted event
export async function handleSubscriptionDeleted(event: any, supabase: any) {
  const subscription = event.data.object;
  console.log(`🔔 Subscription canceled: ${subscription.id}`);
  
  // Mark subscription as canceled in database
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscription.id);
    
  if (error) {
    console.error('Error updating subscription record:', error);
  }
}

// Handle invoice payment succeeded event
export async function handleInvoicePaymentSucceeded(event: any, stripe: Stripe, supabase: any) {
  const invoice = event.data.object;
  console.log(`🔔 Payment succeeded for invoice ${invoice.id}`);
  
  // If this is for a subscription, update the subscription record
  if (invoice.subscription) {
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
    
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', invoice.subscription);
      
    if (error) {
      console.error('Error updating subscription record:', error);
    }
  }
}

// Handle invoice payment failed event
export async function handleInvoicePaymentFailed(event: any, supabase: any) {
  const invoice = event.data.object;
  console.log(`🔔 Payment failed for invoice ${invoice.id}`);
  
  if (invoice.subscription) {
    // Update subscription status to reflect payment failure
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: 'past_due',
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', invoice.subscription);
      
    if (error) {
      console.error('Error updating subscription record:', error);
    }
  }
}
