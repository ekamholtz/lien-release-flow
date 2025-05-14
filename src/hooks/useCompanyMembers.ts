
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { CompanyMember } from '@/lib/types/company';

export function useCompanyMembers(companyId?: string) {
  const queryClient = useQueryClient();
  
  // Get all members for a specific company
  const { 
    data: members = [], 
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['company-members', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      
      // Using a custom RPC function to get company members
      const { data, error } = await supabase.rpc('get_company_members', {
        p_company_id: companyId
      });
      
      if (error) throw error;
      return data as CompanyMember[];
    },
    enabled: !!companyId
  });

  // Invite a new member to the company
  const inviteMember = useMutation({
    mutationFn: async (newMember: {
      companyId: string;
      email: string;
      firstName: string;
      lastName: string;
      role: string;
    }) => {
      const { data, error } = await supabase.rpc('invite_company_member', {
        p_company_id: newMember.companyId,
        p_email: newMember.email,
        p_first_name: newMember.firstName,
        p_last_name: newMember.lastName,
        p_role: newMember.role
      });
        
      if (error) throw error;
      return data as CompanyMember;
    },
    onSuccess: () => {
      toast.success('Member invitation sent');
      queryClient.invalidateQueries({ queryKey: ['company-members', companyId] });
    },
    onError: (error) => {
      console.error('Error inviting member:', error);
      toast.error('Failed to invite member');
    }
  });
  
  // Update member status or role
  const updateMember = useMutation({
    mutationFn: async (member: Partial<CompanyMember> & { id: string }) => {
      const { data, error } = await supabase.rpc('update_company_member', {
        p_id: member.id,
        p_status: member.status,
        p_role: member.role
      });
        
      if (error) throw error;
      return data as CompanyMember;
    },
    onSuccess: () => {
      toast.success('Member updated successfully');
      queryClient.invalidateQueries({ queryKey: ['company-members', companyId] });
    },
    onError: (error) => {
      console.error('Error updating member:', error);
      toast.error('Failed to update member');
    }
  });
  
  // Delete a member from the company
  const deleteMember = useMutation({
    mutationFn: async (memberId: string) => {
      console.log('useCompanyMembers: deleteMember called with ID:', memberId);
      
      // Make sure we have a valid ID
      if (!memberId) {
        console.error('Invalid member ID provided');
        throw new Error('Invalid member ID');
      }
      
      try {
        // Call the Supabase RPC function
        const { data, error } = await supabase.rpc('delete_company_member', {
          p_id: memberId
        });
        
        console.log('Supabase RPC response:', { data, error });
        
        if (error) {
          console.error('Supabase RPC error:', error);
          throw error;
        }
        
        return data;
      } catch (err) {
        console.error('Exception in deleteMember:', err);
        throw err;
      }
    },
    onSuccess: () => {
      toast.success('Member removed from company');
      queryClient.invalidateQueries({ queryKey: ['company-members', companyId] });
    },
    onError: (error) => {
      console.error('Error removing member:', error);
      toast.error('Failed to remove member: ' + (error instanceof Error ? error.message : String(error)));
    }
  });

  // Resend invitation to a pending member
  const resendInvitation = useMutation({
    mutationFn: async (member: CompanyMember) => {
      console.log('Resending invitation to:', member);
      
      // Call the edge function to resend the invitation email
      const { data, error } = await supabase.functions.invoke('send-invitation-email', {
        body: {
          firstName: member.first_name,
          lastName: member.last_name,
          email: member.invited_email,
          companyName: member.company_name,
          invitationId: member.id,
          invitedBy: member.invited_by || 'Administrator',
          role: member.role
        }
      });
      
      console.log('Edge function response:', { data, error });
      
      if (error) {
        console.error('Error from edge function:', error);
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      toast.success('Invitation resent successfully');
    },
    onError: (error) => {
      console.error('Error resending invitation:', error);
      toast.error('Failed to resend invitation: ' + (error instanceof Error ? error.message : String(error)));
    }
  });

  return {
    members,
    isLoading,
    error,
    inviteMember,
    updateMember,
    deleteMember,
    resendInvitation,
    refetch
  };
}
