
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { function_name, error, user_id, retry_count, payload } = await req.json();
    
    // Get webhook URL from environment or use default
    const WEBHOOK_URL = Deno.env.get('QBO_ALERT_WEBHOOK_URL');
    const APP_URL = Deno.env.get('APP_URL') || 'https://example.com';
    
    if (!WEBHOOK_URL) {
      console.log('No webhook URL configured, would have sent alert for:', { function_name, error });
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'No webhook URL configured' 
      }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Format alert message
    const message = {
      text: `:red_circle: *QBO Sync Critical Error*\n` +
            `*Function:* ${function_name}\n` +
            `*Error:* ${error}\n` +
            `*User ID:* ${user_id || 'N/A'}\n` +
            `*Retry Count:* ${retry_count || 'N/A'}\n` +
            `*Time:* ${new Date().toISOString()}\n` +
            `*Details:* ${JSON.stringify(payload || {})}`,
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: "🚨 QBO Sync Critical Error",
            emoji: true
          }
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*Function:*\n${function_name}`
            },
            {
              type: "mrkdwn",
              text: `*Retry Count:*\n${retry_count || 'N/A'}`
            }
          ]
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Error:*\n${error}`
          }
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*User ID:*\n${user_id || 'N/A'}`
            },
            {
              type: "mrkdwn",
              text: `*Time:*\n${new Date().toISOString()}`
            }
          ]
        },
        {
          type: "actions",
          elements: [
            {
              type: "button",
              text: {
                type: "plain_text",
                text: "Go to Admin Dashboard",
                emoji: true
              },
              url: `${APP_URL}/admin/integrations`
            }
          ]
        }
      ]
    };
    
    // Send alert to webhook
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(message)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to send alert: ${await response.text()}`);
    }
    
    return new Response(JSON.stringify({ success: true }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    console.error('Error in qbo-alert:', error);
    
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
