
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

import { corsHeaders, getEnvVars, validateConfig } from "./config.ts";
import {
  handleCheckoutSessionCompleted,
  handleSubscriptionCreated,
  handleSubscriptionUpdated,
  handleSubscriptionDeleted,
  handleInvoicePaymentSucceeded,
  handleInvoicePaymentFailed
} from "./handlers.ts";

// Create a crypto provider for Stripe webhook verification
const cryptoProvider = Stripe.createSubtleCryptoProvider();

serve(async (req) => {
  // Handle preflight CORS requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Verify that we have our required secrets
    const { isValid, error } = validateConfig();
    if (!isValid) {
      return new Response(
        JSON.stringify({ error }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { stripeSecretKey, webhookSecret, supabaseUrl, supabaseServiceKey } = getEnvVars();

    // Initialize Stripe
    const stripe = new Stripe(stripeSecretKey!, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

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
        // Use constructEventAsync instead of constructEvent for Deno environment
        event = await stripe.webhooks.constructEventAsync(
          payload,
          signature,
          webhookSecret,
          undefined,
          cryptoProvider
        );
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
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event, stripe, supabase);
        break;
        
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event, stripe, supabase);
        break;
        
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event, supabase);
        break;
        
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event, supabase);
        break;
        
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event, stripe, supabase);
        break;
        
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event, supabase);
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
