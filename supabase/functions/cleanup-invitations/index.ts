
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

serve(async () => {
  try {
    // Create Supabase client with service role key for admin access
    const supabase = createClient(
      supabaseUrl,
      supabaseServiceKey
    );
    
    console.log('Running invitation cleanup job...');
    
    // Update pending invites older than 14 days to disabled
    const { data: expiredData, error: expiredError } = await supabase
      .from('company_members')
      .update({ status: 'disabled' })
      .eq('status', 'pending')
      .is('accepted_at', null)
      .lt('invited_at', new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString())
      .select();
      
    if (expiredError) {
      throw expiredError;
    }
    
    console.log(`Expired ${expiredData?.length || 0} pending invitations`);
    
    // Delete disabled invites that are older than 90 days
    const { data: deletedData, error: deletedError } = await supabase
      .from('company_members')
      .delete()
      .eq('status', 'disabled')
      .is('accepted_at', null)
      .lt('invited_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
      .select();
      
    if (deletedError) {
      throw deletedError;
    }
    
    console.log(`Deleted ${deletedData?.length || 0} old disabled invitations`);
    
    return new Response(
      JSON.stringify({
        message: 'Invitation cleanup completed successfully',
        expired: expiredData?.length || 0,
        deleted: deletedData?.length || 0
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in cleanup job:', error);
    
    return new Response(
      JSON.stringify({ error: 'Internal Server Error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
