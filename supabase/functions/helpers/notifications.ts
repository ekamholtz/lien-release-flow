
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface ProjectNotification {
  title: string;
  message: string;
  type: string;
  user_id?: string;
  project_id?: string;
  metadata?: Record<string, any>;
}

/**
 * Send a notification for a project event
 */
export async function sendProjectNotification(
  supabase: any, 
  notification: ProjectNotification
): Promise<boolean> {
  try {
    console.log(`Sending notification: ${notification.title}`);
    
    // Insert into app_notifications table
    const { error } = await supabase
      .from('app_notifications')
      .insert({
        user_id: notification.user_id,
        project_id: notification.project_id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        read: false,
        metadata: notification.metadata || {}
      });
      
    if (error) {
      console.error(`Error sending notification: ${error.message}`);
      return false;
    }
    
    // TODO: In the future, implement email/SMS notifications here
    
    console.log(`Successfully sent notification: ${notification.title}`);
    return true;
  } catch (error) {
    console.error(`Error in sendProjectNotification: ${error}`);
    return false;
  }
}

/**
 * Create a Supabase client with admin rights
 */
export function createServiceClient() {
  return createClient(
    "https://oknofqytitpxmlprvekn.supabase.co",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
    { auth: { persistSession: false } }
  );
}
