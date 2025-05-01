
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    console.log('Starting cleanup of expired invitations');
    
    // Auto-expire pending invites older than 14 days
    const { error: updateError, data: updatedRows } = await supabaseAdmin
      .from('company_members')
      .update({ status: 'disabled' })
      .eq('status', 'pending')
      .is('accepted_at', null)
      .lt('invited_at', new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString());
    
    if (updateError) {
      console.error('Error updating expired invitations:', updateError);
      throw updateError;
    }
    
    // Delete disabled invites after 90 days
    const { error: deleteError, data: deletedRows } = await supabaseAdmin
      .from('company_members')
      .delete()
      .eq('status', 'disabled')
      .is('accepted_at', null)
      .lt('invited_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString());
    
    if (deleteError) {
      console.error('Error deleting old invitations:', deleteError);
      throw deleteError;
    }
    
    console.log(`Completed cleanup: ${updatedRows?.length || 0} invitations expired, ${deletedRows?.length || 0} invitations deleted`);
    
    return new Response(
      JSON.stringify({ 
        message: 'Cleanup completed successfully',
        expired: updatedRows?.length || 0,
        deleted: deletedRows?.length || 0
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in cleanup process:', error);
    
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
