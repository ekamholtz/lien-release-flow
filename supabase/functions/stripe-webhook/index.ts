
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";

// Retrieve the Stripe secret key from the environment variables
const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
// Get the webhook signing secret from the environment variables
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

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
    if (!stripeSecretKey) {
      return new Response(
        JSON.stringify({ error: 'Stripe secret key not configured' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

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

    // Handle specific Stripe event types
    switch (event.type) {
      case 'checkout.session.completed':
        const checkoutSession = event.data.object;
        console.log(`🔔 Checkout completed for session ${checkoutSession.id}`);
        
        // Here you would update your database to mark the user as subscribed
        // For example, you could create a 'subscriptions' table in Supabase
        // and update the user's subscription status
        
        break;
        
      case 'customer.subscription.created':
        const subscription = event.data.object;
        console.log(`🔔 Subscription created: ${subscription.id}`);
        
        // Process new subscription creation
        // Update user subscription status in database
        
        break;
        
      case 'customer.subscription.updated':
        const updatedSubscription = event.data.object;
        console.log(`🔔 Subscription updated: ${updatedSubscription.id}`);
        
        // Handle subscription updates
        // e.g., plan changes, billing cycle changes
        
        break;
        
      case 'customer.subscription.deleted':
        const canceledSubscription = event.data.object;
        console.log(`🔔 Subscription canceled: ${canceledSubscription.id}`);
        
        // Handle subscription cancellations
        // Update user subscription status in database
        
        break;
        
      case 'invoice.payment_succeeded':
        const invoice = event.data.object;
        console.log(`🔔 Payment succeeded for invoice ${invoice.id}`);
        
        // Handle successful recurring payments
        // Update subscription payment history
        
        break;
        
      case 'invoice.payment_failed':
        const failedInvoice = event.data.object;
        console.log(`🔔 Payment failed for invoice ${failedInvoice.id}`);
        
        // Handle failed payments
        // Update status and potentially notify the user
        
        break;
        
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
