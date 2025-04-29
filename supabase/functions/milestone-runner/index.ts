
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Helper to ensure consistent types for notifications
import { sendProjectNotification } from "../helpers/notifications.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Utility to create Supabase client with admin rights
function createServiceClient() {
  return createClient(
    // Use direct URLs, not environment variables
    "https://oknofqytitpxmlprvekn.supabase.co",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
    { auth: { persistSession: false } }
  );
}

// QBO token validation and refresh function
async function ensureQboTokens(supabase: any, userId: string) {
  try {
    console.log(`Checking QBO tokens for user: ${userId}`);
    
    // Get current QBO connection
    const { data: connection, error: connError } = await supabase
      .from('qbo_connections')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
      
    if (connError || !connection) {
      console.log(`No QBO connection found for user ${userId}`);
      return false;
    }
    
    // Check if token is expired
    const now = new Date();
    const expiresAt = new Date(connection.expires_at);
    
    if (now > expiresAt) {
      console.log(`Token expired for user ${userId}, refreshing...`);
      
      // In a real implementation, this would refresh the token using the QBO API
      // For now, just log it as this requires implementation details
      
      await supabase.from('qbo_logs').insert({
        function_name: 'milestone-runner',
        user_id: userId,
        payload: { action: 'refresh_token', connection_id: connection.id }
      });
      
      // Return false as we couldn't refresh the token in this simplified example
      return false;
    }
    
    return true;
  } catch (error) {
    console.error(`Error ensuring QBO tokens: ${error}`);
    return false;
  }
}

// Function to process due milestones
async function processDueMilestones(supabase: any, dryRun: boolean) {
  console.log(`Starting milestone processing, dry run: ${dryRun}`);
  
  // Get milestones that should be completed based on criteria
  const { data: dueMilestones, error: milestonesError } = await supabase
    .from('milestones')
    .select(`
      *,
      projects(*)
    `)
    .eq('is_completed', false)
    .or(`due_type.eq.time,and(due_date.lte.${new Date().toISOString().split('T')[0]}),due_type.eq.event,and(status.eq.completed)`)
    .order('due_date', { ascending: true });
  
  if (milestonesError) {
    console.error(`Error fetching due milestones: ${milestonesError.message}`);
    return {
      processed: 0,
      errors: [milestonesError.message]
    };
  }
  
  console.log(`Found ${dueMilestones?.length || 0} milestones to process`);
  
  let processed = 0;
  let errors: string[] = [];
  
  if (!dueMilestones || dueMilestones.length === 0) {
    return { processed, errors };
  }
  
  // Process each milestone
  for (const milestone of dueMilestones) {
    try {
      console.log(`Processing milestone: ${milestone.id} - ${milestone.name}`);
      
      if (dryRun) {
        console.log(`[DRY RUN] Would create invoice for milestone: ${milestone.id}`);
        processed++;
        continue;
      }
      
      // 1. Create invoice row
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          invoice_number: `INV-${Math.floor(1000 + Math.random() * 9000)}-MS`,
          client_name: milestone.projects?.client || 'Client',
          client_email: milestone.projects?.contact_email || '',
          project_id: milestone.project_id,
          amount: milestone.amount,
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
          status: 'draft',
          payment_method: 'regular',
          source_milestone_id: milestone.id
        })
        .select()
        .single();
        
      if (invoiceError) {
        throw new Error(`Failed to create invoice: ${invoiceError.message}`);
      }
      
      // 2. Try to sync with QBO if possible
      if (milestone.projects?.user_id) {
        const hasValidTokens = await ensureQboTokens(supabase, milestone.projects.user_id);
        
        if (hasValidTokens) {
          console.log(`Would push to QBO for user: ${milestone.projects.user_id}`);
          // In a real implementation, this would push to QBO using the tokens
          // For now, just log it
        } else {
          console.log(`Skipping QBO sync for milestone ${milestone.id}, invalid tokens`);
        }
      }
      
      // 3. Update milestone as completed
      const { error: updateError } = await supabase
        .from('milestones')
        .update({
          is_completed: true,
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', milestone.id);
        
      if (updateError) {
        throw new Error(`Failed to update milestone: ${updateError.message}`);
      }
      
      // 4. Insert milestone log
      const { error: logError } = await supabase
        .from('milestone_logs')
        .insert({
          milestone_id: milestone.id,
          action: 'auto_complete',
          metadata: {
            invoice_id: invoice?.id,
            auto_reason: milestone.due_type === 'time' ? 'due_date_reached' : 'status_completed'
          },
          system_generated: true
        });
        
      if (logError) {
        console.error(`Warning: Failed to create milestone log: ${logError.message}`);
      }
      
      // 5. Send notification
      await sendProjectNotification(
        supabase,
        {
          title: `Milestone '${milestone.name}' Completed`,
          message: `A milestone for project '${milestone.projects?.name || 'Unknown Project'}' has been automatically completed and an invoice has been created.`,
          type: 'milestone',
          user_id: milestone.projects?.user_id,
          project_id: milestone.project_id,
          metadata: {
            milestone_id: milestone.id,
            invoice_id: invoice?.id
          }
        }
      );
      
      processed++;
      console.log(`Successfully processed milestone: ${milestone.id}`);
      
    } catch (error) {
      const errorMessage = `Error processing milestone ${milestone.id}: ${error instanceof Error ? error.message : String(error)}`;
      console.error(errorMessage);
      errors.push(errorMessage);
    }
  }
  
  return { processed, errors };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }
  
  try {
    // Parse query parameters
    const url = new URL(req.url);
    const dryRun = url.searchParams.get('dry_run') === 'true';
    
    const supabase = createServiceClient();
    const result = await processDueMilestones(supabase, dryRun);
    
    console.log(`Processing complete. Processed: ${result.processed}, Errors: ${result.errors.length}`);
    
    return new Response(JSON.stringify({
      success: true,
      message: dryRun 
        ? `Dry run completed. Would create ${result.processed} invoices.` 
        : `Successfully processed ${result.processed} milestones.`,
      errors: result.errors,
      timestamp: new Date().toISOString()
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
      status: 200,
    });
  } catch (error) {
    console.error(`Fatal error: ${error}`);
    
    return new Response(JSON.stringify({
      success: false,
      message: `Error: ${error instanceof Error ? error.message : String(error)}`,
      timestamp: new Date().toISOString()
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
      status: 500,
    });
  }
});
