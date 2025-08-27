const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
// --- Template Rendering Utility ---
function renderTemplate(template, variables) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key)=>String(variables[key] ?? ""));
}
// --- Sample Templates ---
const templates = {
  payment_invoice: `
    <h2>Invoice #{{invoice_number}}</h2>
    <p>Dear {{customer_name}},</p>
    <p>Thank you for your business! Here are your invoice details:</p>
    <table border="1" cellpadding="8" cellspacing="0">
      <tr>
        <th>Description</th><th>Amount</th>
      </tr>
      <tr>
        <td>{{item_description}}</td><td>{{amount}} </td>
      </tr>
    </table>
    <p><strong>Total Due: {{amount}}</strong></p>
    <p>Due Date: {{due_date}}</p>
    <p>Best regards,<br>Your Company</p>
  `,
  welcome: `
    <h1>Welcome, {{customer_name}}!</h1>
    <p>We're excited to have you on board. If you have any questions, just reply to this email.</p>
    <p>Cheers,<br>The Team</p>
  `,
  password_reset: `
    <h2>Password Reset</h2>
    <p>Hello {{customer_name}},</p>
    <p>Click <a href="{{reset_link}}">here</a> to reset your password.</p>
    <p>If you didn't request this, you can safely ignore this email.</p>
  `
};
// --- Edge Function Handler ---
const handler = async (req)=>{
  try {
    const payload = await req.json();
    // Required: to, subject
    if (!payload.to || !payload.subject) {
      return new Response(JSON.stringify({
        error: "Missing 'to' or 'subject'."
      }), {
        status: 400
      });
    }
    // Template rendering
    let html = payload.html;
    if (!html && payload.template_name) {
      const template = templates[payload.template_name];
      if (!template) {
        return new Response(JSON.stringify({
          error: "Unknown template_name."
        }), {
          status: 400
        });
      }
      html = renderTemplate(template, payload.variables || {});
    }
    if (!html) {
      return new Response(JSON.stringify({
        error: "No HTML content provided."
      }), {
        status: 400
      });
    }
    // Prepare attachments if any
    const attachments = payload.attachments || undefined;
    // Send email via Resend API
    const emailData = {
      from: 'support@updates.cnstrctnetwork.com',
      to: payload.to,
      subject: payload.subject,
      html,
      ...attachments && {
        attachments
      }
    };
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify(emailData)
    });
    if (!res.ok) throw new Error(await res.text());
    return new Response(JSON.stringify(await res.json()), {
      status: 200
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 500
    });
  }
};
Deno.serve(handler);
