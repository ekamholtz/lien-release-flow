
import { supabase } from "@/integrations/supabase/client";

export interface InvitationDetails {
  id: string;
  company_id: string;
  company_name: string;
  role: string;
  invited_by: string;
  invited_email: string;
  status: 'pending' | 'accepted' | 'declined';
}

export const invitationService = {
  // Check if an email has any pending invitations
  checkPendingInvitations: async (email: string): Promise<InvitationDetails[]> => {
    const { data, error } = await supabase.rpc('get_pending_invitations_by_email', {
      p_email: email
    });

    if (error) {
      console.error("Error checking invitations:", error);
      throw error;
    }

    return data as InvitationDetails[] || [];
  },

  // Accept an invitation
  acceptInvitation: async (invitationId: string, userId: string): Promise<boolean> => {
    const { data, error } = await supabase.rpc('accept_company_invitation', {
      p_invitation_id: invitationId,
      p_user_id: userId
    });

    if (error) {
      console.error("Error accepting invitation:", error);
      throw error;
    }

    return data as boolean;
  },

  // Decline an invitation
  declineInvitation: async (invitationId: string): Promise<boolean> => {
    const { data, error } = await supabase.rpc('decline_company_invitation', {
      p_invitation_id: invitationId
    });

    if (error) {
      console.error("Error declining invitation:", error);
      throw error;
    }

    return data as boolean;
  }
};
