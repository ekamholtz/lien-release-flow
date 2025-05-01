
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { invitationService, InvitationDetails } from '@/services/invitationService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export function InvitationsCheck() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [invitations, setInvitations] = useState<InvitationDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.email) {
      checkForInvitations(user.email);
    }
  }, [user?.email]);

  const checkForInvitations = async (email: string) => {
    try {
      setIsLoading(true);
      const invites = await invitationService.checkPendingInvitations(email);
      setInvitations(invites);
    } catch (error) {
      console.error('Error checking for invitations:', error);
      toast.error('Failed to check for invitations');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptInvitation = async (invitationId: string) => {
    if (!user?.id) return;
    
    try {
      setProcessingId(invitationId);
      const success = await invitationService.acceptInvitation(invitationId, user.id);
      
      if (success) {
        toast.success('Invitation accepted successfully');
        setInvitations(invitations.filter(inv => inv.id !== invitationId));
        navigate('/dashboard');
      } else {
        toast.error('Failed to accept invitation');
      }
    } catch (error) {
      console.error('Error accepting invitation:', error);
      toast.error('Failed to accept invitation');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeclineInvitation = async (invitationId: string) => {
    try {
      setProcessingId(invitationId);
      const success = await invitationService.declineInvitation(invitationId);
      
      if (success) {
        toast.success('Invitation declined');
        setInvitations(invitations.filter(inv => inv.id !== invitationId));
      } else {
        toast.error('Failed to decline invitation');
      }
    } catch (error) {
      console.error('Error declining invitation:', error);
      toast.error('Failed to decline invitation');
    } finally {
      setProcessingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-cnstrct-orange" />
        <span className="ml-2">Checking for invitations...</span>
      </div>
    );
  }

  if (invitations.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 my-6">
      <h2 className="text-xl font-semibold">Pending Invitations</h2>
      {invitations.map(invitation => (
        <Card key={invitation.id} className="border-cnstrct-orange/20">
          <CardHeader>
            <CardTitle className="text-lg">
              Invitation to join {invitation.company_name}
            </CardTitle>
            <CardDescription>
              You've been invited by {invitation.invited_by} to join as a {invitation.role.replace('_', ' ')}
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => handleDeclineInvitation(invitation.id)}
              disabled={!!processingId}
            >
              {processingId === invitation.id ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              Decline
            </Button>
            <Button
              onClick={() => handleAcceptInvitation(invitation.id)}
              disabled={!!processingId}
              className="bg-cnstrct-orange hover:bg-cnstrct-orange/90"
            >
              {processingId === invitation.id ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Accept
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
