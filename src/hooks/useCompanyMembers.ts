
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
      
      // Using a custom RPC function to avoid TypeScript issues with the new table
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
      const { error } = await supabase.rpc('delete_company_member', {
        p_id: memberId
      });
        
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Member removed from company');
      queryClient.invalidateQueries({ queryKey: ['company-members', companyId] });
    },
    onError: (error) => {
      console.error('Error removing member:', error);
      toast.error('Failed to remove member');
    }
  });

  return {
    members,
    isLoading,
    error,
    inviteMember,
    updateMember,
    deleteMember,
    refetch
  };
}
