
// @ts-ignore: Deno standard library
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendProjectNotification } from "../helpers/notifications.ts";

// Connection handling
const connectionRetries = 3;
const backoffFactor = 1.5;

interface MilestoneRow {
  id: string;
  name: string;
  project_id: string;
  amount: number;
  due_date: string;
  due_type: string;
  status?: string;
  is_completed: boolean;
}

interface ProjectRow {
  id: string;
  name: string;
  client: string;
}

// Helper function to ensure QBO tokens are valid
async function ensureQboTokens() {
  // This would typically handle token refresh logic
  console.log("Ensuring QBO tokens are valid");
  return true; // Placeholder - actual implementation would check/refresh tokens
}

// Retry logic for API calls
async function retryOperation(operation: () => Promise<any>, maxRetries = 3) {
  let lastError;
  let waitTime = 1000; // Start with 1 second

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      console.error(`Attempt ${attempt + 1} failed:`, error);
      lastError = error;
      
      // For 429 (rate limiting) or 401 (auth) errors, we retry
      if (error.status === 429 || error.status === 401) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
        waitTime *= backoffFactor; // Exponential backoff
      } else {
        break; // Don't retry other errors
      }
    }
  }
  
  throw lastError;
}

// Main function
serve(async (req) => {
  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "https://oknofqytitpxmlprvekn.supabase.co";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
    
    // Parse URL for dry_run parameter
    const url = new URL(req.url);
    const isDryRun = url.searchParams.get("dry_run") === "true";
    
    // Log run start
    console.log(`Starting milestone-runner${isDryRun ? " (DRY RUN)" : ""} at ${new Date().toISOString()}`);
    
    // Get all milestones that meet our criteria
    const today = new Date().toISOString().split('T')[0];
    
    const { data: milestones, error: milestonesError } = await supabase
      .from("milestones")
      .select(`
        id,
        name,
        project_id,
        amount,
        due_date,
        due_type,
        status,
        is_completed
      `)
      .eq("is_completed", false)
      .or(`and(due_type.eq.time,due_date.lte.${today}),and(due_type.eq.event,status.eq.completed)`);
      
    if (milestonesError) {
      throw new Error(`Error fetching milestones: ${milestonesError.message}`);
    }
    
    console.log(`Found ${milestones?.length || 0} milestones to process`);
    
    // Process each milestone
    for (const milestone of milestones || []) {
      try {
        console.log(`Processing milestone: ${milestone.name} (${milestone.id})`);
        
        // Get project info
        const { data: project } = await supabase
          .from("projects")
          .select("id, name, client")
          .eq("id", milestone.project_id)
          .single();
          
        if (!project) {
          console.error(`Project not found for milestone ${milestone.id}`);
          continue;
        }
        
        // In dry run mode, we just log what would happen
        if (isDryRun) {
          console.log(`DRY RUN: Would create invoice for milestone "${milestone.name}" in project "${project.name}" for amount $${milestone.amount}`);
          continue;
        }
        
        // 1. Create invoice
        const { data: invoice, error: invoiceError } = await supabase
          .from("invoices")
          .insert({
            invoice_number: `INV-${Date.now().toString().slice(-6)}`,
            client_name: project.client,
            client_email: "", // Would need to get from project or client table
            project_id: project.id,
            amount: milestone.amount,
            due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
            status: "draft",
            source_milestone_id: milestone.id
          })
          .select()
          .single();
          
        if (invoiceError) {
          throw new Error(`Error creating invoice: ${invoiceError.message}`);
        }
        
        // 2. Push to QBO if tokens are valid
        let qboSyncSuccess = false;
        try {
          const tokensValid = await ensureQboTokens();
          
          if (tokensValid) {
            // This would typically call your QBO integration
            // For now, we'll just log that it would happen
            console.log(`Would push invoice ${invoice.id} to QBO`);
            qboSyncSuccess = true;
          }
        } catch (error) {
          console.error(`QBO sync failed: ${error.message}`);
          // We continue despite QBO sync failure
        }
        
        // 3. Update milestone
        await supabase
          .from("milestones")
          .update({
            is_completed: true,
            status: "completed",
            completed_at: new Date().toISOString()
          })
          .eq("id", milestone.id);
          
        // 4. Insert into milestone_logs
        await supabase
          .from("milestone_logs")
          .insert({
            milestone_id: milestone.id,
            action: "auto_completed",
            system_generated: true,
            metadata: {
              invoice_id: invoice.id,
              qbo_sync: qboSyncSuccess
            }
          });
          
        // 5. Send notification
        await sendProjectNotification(supabase, {
          title: "Milestone Completed",
          message: `Milestone "${milestone.name}" for project "${project.name}" has been automatically completed and an invoice created.`,
          type: "milestone",
          project_id: project.id,
          metadata: {
            milestone_id: milestone.id,
            invoice_id: invoice.id
          }
        });
        
        console.log(`Successfully processed milestone ${milestone.id}`);
      } catch (error) {
        console.error(`Error processing milestone ${milestone.id}: ${error.message}`);
        // Continue with next milestone
      }
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${milestones?.length || 0} milestones${isDryRun ? " (DRY RUN)" : ""}`,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error(`milestone-runner failed: ${error.message}`);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
