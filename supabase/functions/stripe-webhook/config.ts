
// Configuration constants and headers for the webhook function
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export const getEnvVars = () => {
  const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  return {
    stripeSecretKey,
    webhookSecret,
    supabaseUrl,
    supabaseServiceKey
  };
};

export const validateConfig = () => {
  const { stripeSecretKey, supabaseUrl, supabaseServiceKey } = getEnvVars();
  
  if (!stripeSecretKey || !supabaseUrl || !supabaseServiceKey) {
    const missingKeys = [];
    if (!stripeSecretKey) missingKeys.push('STRIPE_SECRET_KEY');
    if (!supabaseUrl) missingKeys.push('SUPABASE_URL');
    if (!supabaseServiceKey) missingKeys.push('SUPABASE_SERVICE_ROLE_KEY');
    
    console.error(`Missing required environment variables: ${missingKeys.join(', ')}`);
    return {
      isValid: false,
      error: `Missing required environment variables: ${missingKeys.join(', ')}`
    };
  }
  
  return { isValid: true };
};
