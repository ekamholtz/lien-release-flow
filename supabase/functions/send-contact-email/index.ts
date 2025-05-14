
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@1.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ContactEmailRequest {
  name: string;
  email: string;
  company?: string;
  companySize?: string;
  message: string;
  interests?: string[];
  isDemo: boolean;
  source?: string;
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
    const ownerEmail = Deno.env.get('OWNER_EMAIL') || 'your-email@example.com';

    // Get the request body
    const requestData = await req.json() as ContactEmailRequest;
    
    // Format the interests if they exist
    let interestsHtml = '';
    if (requestData.isDemo && requestData.interests && requestData.interests.length > 0) {
      interestsHtml = `
        <h3>Features of Interest:</h3>
        <ul>
          ${requestData.interests.map(interest => {
            // Convert camelCase to readable format
            const readableInterest = interest
              .replace(/([A-Z])/g, ' $1')
              .replace(/^./, str => str.toUpperCase());
              
            return `<li>${readableInterest}</li>`;
          }).join('')}
        </ul>
      `;
    }

    // Determine email subject and intro based on request type
    const subject = requestData.isDemo 
      ? `New Demo Request from ${requestData.name} at ${requestData.company || 'Unknown Company'}`
      : `New Support Request from ${requestData.name}`;
    
    const intro = requestData.isDemo
      ? `<p>You've received a new demo request with the following details:</p>`
      : `<p>You've received a new support request with the following details:</p>`;

    // Create company info section for demo requests
    const companyInfo = requestData.isDemo ? `
      <h3>Company Information:</h3>
      <p><strong>Company Name:</strong> ${requestData.company || 'Not provided'}</p>
      <p><strong>Company Size:</strong> ${requestData.companySize || 'Not provided'}</p>
    ` : '';

    // Create source tracking section if source data exists
    const sourceInfo = requestData.source ? `
      <p><strong>Source:</strong> ${requestData.source}</p>
    ` : '';

    // Send the email to the owner
    const { data, error } = await resend.emails.send({
      from: 'CNSTRCT Notifications <notifications@cnstrct.com>',
      to: ownerEmail,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>${subject}</h2>
          ${intro}
          
          <h3>Contact Information:</h3>
          <p><strong>Name:</strong> ${requestData.name}</p>
          <p><strong>Email:</strong> ${requestData.email}</p>
          ${companyInfo}
          ${interestsHtml}
          
          <h3>Message:</h3>
          <p style="white-space: pre-line;">${requestData.message}</p>
          
          <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 20px 0;">
          
          <p style="color: #718096; font-size: 14px;">
            This is an automated message from your CNSTRCT platform.
            ${sourceInfo}
          </p>
        </div>
      `,
    });

    if (error) {
      console.error("Error sending email:", error);
      throw error;
    }

    console.log(`${requestData.isDemo ? "Demo" : "Support"} request email sent successfully:`, data);
    
    // Also send an auto-reply to the user
    const autoReplySubject = requestData.isDemo 
      ? "Thank you for your demo request - CNSTRCT"
      : "Thank you for contacting us - CNSTRCT";
      
    const autoReplyContent = requestData.isDemo 
      ? `<p>Thank you for your interest in a demo of CNSTRCT. We've received your request and our team will be in touch shortly to schedule your personalized demonstration.</p>`
      : `<p>Thank you for contacting CNSTRCT support. We've received your message and will get back to you as soon as possible.</p>`;
    
    const { data: autoReplyData, error: autoReplyError } = await resend.emails.send({
      from: 'CNSTRCT Support <support@cnstrct.com>',
      to: requestData.email,
      subject: autoReplySubject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Hello ${requestData.name},</h2>
          ${autoReplyContent}
          
          <p>If you have any additional questions in the meantime, please don't hesitate to reply to this email.</p>
          
          <p>Best regards,<br>The CNSTRCT Team</p>
          
          <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 20px 0;">
          
          <p style="color: #718096; font-size: 14px;">This is an automated message, please do not reply directly to this email.</p>
        </div>
      `,
    });

    if (autoReplyError) {
      console.error("Error sending auto-reply email:", autoReplyError);
      // We don't throw here as the main email to the owner was sent successfully
    }
    
    return new Response(
      JSON.stringify({ success: true, data }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error("Error in send-contact-email function:", error);
    
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
