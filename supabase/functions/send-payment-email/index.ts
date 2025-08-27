import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@1.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.6";
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
serve(async (req)=>{
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!resendApiKey || !supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error("Missing required environment variables");
    }
    const resend = new Resend(resendApiKey);
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    const { invoiceId } = await req.json();
    if (!invoiceId) {
      throw new Error("Missing invoiceId");
    }
    // Fetch invoice data
    const { data: invoice, error: invoiceError } = await supabase.from("invoices").select("*").eq("id", invoiceId).single();
    if (invoiceError || !invoice) {
      throw new Error("Invoice not found or error fetching invoice");
    }
    const { client_name, client_email, amount, due_date, company_id, invoice_number, payment_link, created_at } = invoice;
    // Optional: Fetch company info if needed
    const { data: company, error: companyError } = await supabase.from("companies").select("name").eq("id", company_id).single();
    const companyName = company?.name || "Your Company";
    const formattedAmount = `USD ${Number(amount).toFixed(2)}`;
    const formattedDueDate = due_date ? new Date(due_date).toLocaleDateString() : "N/A";
    const { data, error } = await resend.emails.send({
      from: 'CNSTRCT <notifications@updates.cnstrctnetwork.com>',
      to: client_email,
      subject: `Invoice #${invoice_number} from ${companyName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Hello ${client_name || 'there'},</h2>
          <p>You have received an invoice <strong>#${invoice_number}</strong> from <strong>${companyName}</strong>.</p>

          <p><strong>Amount:</strong> ${formattedAmount}</p>
          <p><strong>Due Date:</strong> ${formattedDueDate}</p>

          <div style="margin: 30px 0; text-align: center;">
            <a href="${payment_link}" style="background-color: #38A169; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
              Pay Invoice
            </a>
          </div>

          <p>Or copy and paste this URL into your browser:</p>
          <p style="word-break: break-all; color: #4A5568;">${payment_link}</p>

          <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 20px 0;">
          <p style="color: #718096; font-size: 14px;">If you were not expecting this invoice, you can safely ignore this email.</p>
        </div>
      `
    });
    if (error) {
      console.error("Error sending email:", error);
      throw error;
    }
    return new Response(JSON.stringify({
      success: true,
      data
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    console.error("Error in send-payment-email function:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
});
