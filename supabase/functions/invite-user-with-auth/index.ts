
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InviteUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  companyId: string;
  companyName: string;
  role: string;
  invitedBy: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set');
    }

    // Initialize Supabase client with service role key (admin privileges)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get the request body
    const { 
      email, 
      firstName, 
      lastName, 
      companyId, 
      companyName, 
      role, 
      invitedBy 
    } = await req.json() as InviteUserRequest;
    
    console.log(`Inviting ${email} to company ${companyName} (${companyId}) as ${role}`);
    
    // 1. Create Auth user with admin API
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true, // Auto-confirm email since we're inviting them
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
      },
      password_prompt: true // Force password change on first login
    });
    
    if (userError) {
      console.error("Error creating user:", userError);
      throw userError;
    }
    
    console.log("User created successfully:", userData.user.id);
    
    // 2. Create company_members row with the new user ID
    const { data: memberData, error: memberError } = await supabase
      .from('company_members')
      .insert({
        company_id: companyId,
        user_id: userData.user.id,
        invited_email: email,
        first_name: firstName,
        last_name: lastName,
        role,
        status: 'pending',
        invited_at: new Date().toISOString(),
        invited_by_email: invitedBy
      })
      .select()
      .single();
    
    if (memberError) {
      console.error("Error creating company member:", memberError);
      
      // If member creation fails, delete the auth user to avoid orphaned users
      await supabase.auth.admin.deleteUser(userData.user.id);
      throw memberError;
    }
    
    console.log("Company member created successfully:", memberData.id);
    
    // 3. Send invitation email with password reset link
    const appUrl = Deno.env.get('APP_URL') || 'https://app.cnstrct.com';
    const resetPasswordLink = `${appUrl}/auth/reset-password#access_token=${userData.user.confirmation_token}`;
    
    // Use the existing send-invitation-email function to send the email
    // But with the reset password link instead of the invitation link
    const { data: emailData, error: emailError } = await supabase.functions.invoke('send-invitation-email', {
      body: {
        firstName,
        lastName,
        email,
        companyName,
        invitationId: memberData.id,
        invitedBy,
        role,
        resetPasswordLink // Pass the reset password link to the email function
      }
    });
    
    if (emailError) {
      console.error("Error sending invitation email:", emailError);
      throw emailError;
    }
    
    console.log("Invitation email sent successfully");
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        data: { 
          memberId: memberData.id,
          userId: userData.user.id 
        } 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error("Error in invite-user-with-auth function:", error);
    
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
