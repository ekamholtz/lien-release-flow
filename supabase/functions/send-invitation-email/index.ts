
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@1.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InvitationEmailRequest {
  firstName: string;
  lastName: string;
  email: string;
  companyName: string;
  invitationId: string;
  invitedBy: string;
  role: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY is not set');
    }

    const resend = new Resend(resendApiKey);

    // Get the request body
    const { firstName, lastName, email, companyName, invitationId, invitedBy, role } = await req.json() as InvitationEmailRequest;
    
    // Create the invitation URL
    const appUrl = Deno.env.get('APP_URL') || 'https://app.cnstrct.com';
    const invitationUrl = `${appUrl}/auth?invitation=${invitationId}&email=${encodeURIComponent(email)}`;

    // Format the role for display
    const formattedRole = role
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    // Send the email
    const { data, error } = await resend.emails.send({
      from: 'CNSTRCT <notifications@cnstrct.com>',
      to: email,
      subject: `You've been invited to join ${companyName} on CNSTRCT`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Hello ${firstName || 'there'}!</h2>
          <p>You've been invited by <strong>${invitedBy}</strong> to join <strong>${companyName}</strong> on CNSTRCT as a <strong>${formattedRole}</strong>.</p>
          
          <p>CNSTRCT is a modern accounting platform designed for general contractors, subcontractors, and service professionals to streamline your financial operations.</p>
          
          <div style="margin: 30px 0; text-align: center;">
            <a href="${invitationUrl}" style="background-color: #FF5A1F; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Accept Invitation</a>
          </div>
          
          <p>Or copy and paste this URL into your browser:</p>
          <p style="word-break: break-all; color: #4A5568;">${invitationUrl}</p>
          
          <p>This invitation will expire in 7 days.</p>
          
          <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 20px 0;">
          
          <p style="color: #718096; font-size: 14px;">If you didn't expect this invitation, you can safely ignore this email.</p>
        </div>
      `,
    });

    if (error) {
      console.error("Error sending email:", error);
      throw error;
    }

    console.log("Email sent successfully:", data);
    
    return new Response(
      JSON.stringify({ success: true, data }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error("Error in send-invitation-email function:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
