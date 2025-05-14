import { useState } from 'react';
import { Mail } from 'lucide-react';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { CompanyMember } from '@/lib/types/company';

interface ResendInvitationButtonProps {
  member: CompanyMember;
}

export function ResendInvitationButton({ member }: ResendInvitationButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    if (isLoading) return;
    
    console.log('Resend invitation clicked for member:', member);
    setIsLoading(true);
    
    try {
      console.log('Sending invitation with data:', {
        firstName: member.first_name || '',
        lastName: member.last_name || '',
        email: member.invited_email,
        companyName: member.company_name || 'Your Company',
        invitationId: member.id,
        invitedBy: member.invited_by || 'Administrator',
        role: member.role
      });
      
      // Call the edge function directly
      try {
        const { data, error } = await supabase.functions.invoke('send-invitation-email', {
          body: {
            firstName: member.first_name || '',
            lastName: member.last_name || '',
            email: member.invited_email,
            companyName: member.company_name || 'Your Company',
            invitationId: member.id,
            invitedBy: member.invited_by || 'Administrator',
            role: member.role
          }
        });
        
        console.log('Edge function response:', { data, error });
        
        if (error) {
          console.error('Error from edge function:', error);
          console.error('Error details:', JSON.stringify(error, null, 2));
          toast.error(`Failed to resend invitation: ${error.message || 'Unknown error'}`);
        } else {
          toast.success(`Invitation resent to ${member.invited_email}`);
        }
      } catch (invokeError) {
        console.error('Error invoking edge function:', invokeError);
        console.error('Error details:', JSON.stringify(invokeError, null, 2));
        toast.error(`Error invoking edge function: ${invokeError instanceof Error ? invokeError.message : 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Exception during resend invitation:', err);
      toast.error(`Failed to resend invitation: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DropdownMenuItem 
      onClick={handleClick}
      disabled={isLoading}
    >
      <Mail className="mr-2 h-4 w-4" />
      <span>{isLoading ? 'Sending...' : 'Resend Invitation'}</span>
    </DropdownMenuItem>
  );
}
