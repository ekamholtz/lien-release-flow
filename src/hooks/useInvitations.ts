
import { useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { invitationService, InvitationDetails } from '@/services/invitationService';

export function useInvitations() {
  const { user } = useAuth();
  const [invitations, setInvitations] = useState<InvitationDetails[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const checkForInvitations = useCallback(async () => {
    if (!user?.email) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const invites = await invitationService.checkPendingInvitations(user.email);
      setInvitations(invites);
    } catch (err) {
      console.error('Error checking for invitations:', err);
      setError(err instanceof Error ? err : new Error('Failed to check for invitations'));
    } finally {
      setIsLoading(false);
    }
  }, [user?.email]);

  const acceptInvitation = useCallback(async (invitationId: string) => {
    if (!user?.id) return false;
    
    try {
      setProcessingId(invitationId);
      const success = await invitationService.acceptInvitation(invitationId, user.id);
      
      if (success) {
        setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
      }
      
      return success;
    } catch (err) {
      console.error('Error accepting invitation:', err);
      throw err;
    } finally {
      setProcessingId(null);
    }
  }, [user?.id]);

  const declineInvitation = useCallback(async (invitationId: string) => {
    try {
      setProcessingId(invitationId);
      const success = await invitationService.declineInvitation(invitationId);
      
      if (success) {
        setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
      }
      
      return success;
    } catch (err) {
      console.error('Error declining invitation:', err);
      throw err;
    } finally {
      setProcessingId(null);
    }
  }, []);

  return {
    invitations,
    isLoading,
    error,
    processingId,
    checkForInvitations,
    acceptInvitation,
    declineInvitation
  };
}
