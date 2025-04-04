
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

// Retrieve the Stripe secret key from the environment variables
const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
// Get the webhook signing secret from the environment variables
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
// Supabase URL and anon key
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// Set up CORS headers for the function
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle preflight CORS requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Verify that we have our required secrets
    if (!stripeSecretKey || !supabaseUrl || !supabaseServiceKey) {
      const missingKeys = [];
      if (!stripeSecretKey) missingKeys.push('STRIPE_SECRET_KEY');
      if (!supabaseUrl) missingKeys.push('SUPABASE_URL');
      if (!supabaseServiceKey) missingKeys.push('SUPABASE_SERVICE_ROLE_KEY');
      
      console.error(`Missing required environment variables: ${missingKeys.join(', ')}`);
      return new Response(
        JSON.stringify({ error: `Missing required environment variables: ${missingKeys.join(', ')}` }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the request body as text for signature verification
    const payload = await req.text();
    let event;

    // Verify webhook signature if the secret is available
    if (webhookSecret) {
      const signature = req.headers.get('stripe-signature');
      
      if (!signature) {
        return new Response(
          JSON.stringify({ error: 'Stripe signature missing' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      try {
        event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
      } catch (err) {
        console.error(`⚠️ Webhook signature verification failed: ${err.message}`);
        return new Response(
          JSON.stringify({ error: `Webhook signature verification failed: ${err.message}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      // If no webhook secret is configured, parse the payload directly
      // Note: This is less secure and should only be used for testing
      try {
        event = JSON.parse(payload);
      } catch (err) {
        console.error(`⚠️ Error parsing webhook payload: ${err.message}`);
        return new Response(
          JSON.stringify({ error: 'Invalid payload' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    console.log(`🔔 Processing Stripe webhook event: ${event.type}`);

    // Handle specific Stripe event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const checkoutSession = event.data.object;
        console.log(`🔔 Checkout completed for session ${checkoutSession.id}`);
        
        // Get customer and subscription details from the session
        const customerId = checkoutSession.customer;
        const subscriptionId = checkoutSession.subscription;
        const userId = checkoutSession.client_reference_id; // This should be set during checkout creation
        
        if (userId && subscriptionId) {
          // Get subscription details from Stripe
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const planId = subscription.items.data[0].price.id;
          const planName = subscription.items.data[0].price.nickname || 'Default Plan';
          
          // Update the subscriptions table
          const { error } = await supabase
            .from('subscriptions')
            .upsert({
              user_id: userId,
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              status: subscription.status,
              plan_id: planId,
              plan_name: planName,
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              cancel_at_period_end: subscription.cancel_at_period_end,
            }, {
              onConflict: 'user_id'
            });
            
          if (error) {
            console.error('Error updating subscription record:', error);
          } else {
            console.log(`✅ Successfully created/updated subscription for user ${userId}`);
          }
        } else {
          console.warn('⚠️ Missing user_id or subscription_id in checkout session');
        }
        break;
      }
        
      case 'customer.subscription.created': {
        const subscription = event.data.object;
        console.log(`🔔 Subscription created: ${subscription.id}`);
        
        // Since this might be a subscription created outside of our checkout flow,
        // we need to find the user associated with this customer
        const customerId = subscription.customer;
        const { data: userData, error: userError } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single();
          
        if (userError || !userData) {
          console.warn(`⚠️ No user found for customer ${customerId}`);
          break;
        }
        
        const userId = userData.user_id;
        const planId = subscription.items.data[0].price.id;
        const planName = subscription.items.data[0].price.nickname || 'Default Plan';
        
        // Update subscription record
        const { error } = await supabase
          .from('subscriptions')
          .upsert({
            user_id: userId,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscription.id,
            status: subscription.status,
            plan_id: planId,
            plan_name: planName,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
          });
          
        if (error) {
          console.error('Error updating subscription record:', error);
        }
        break;
      }
        
      case 'customer.subscription.updated': {
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
        break;
      }
        
      case 'customer.subscription.deleted': {
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
        break;
      }
        
      case 'invoice.payment_succeeded': {
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
        break;
      }
        
      case 'invoice.payment_failed': {
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
          
          // You might want to notify the user about the failed payment
          // This would require additional implementation
        }
        break;
      }
        
      default:
        console.log(`🔔 Unhandled event type: ${event.type}`);
    }

    // Return a successful response to Stripe
    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error(`❌ Error processing webhook: ${error.message}`);
    
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
