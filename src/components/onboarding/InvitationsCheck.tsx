
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, X, Check } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/hooks/useAuth';
import { useInvitations } from '@/hooks/useInvitations';
import { useCompany } from '@/contexts/CompanyContext';

export function InvitationsCheck() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { invitations, isLoading, processingId, checkForInvitations, acceptInvitation, declineInvitation } = useInvitations();
  const { refreshCompanies } = useCompany();
  
  useEffect(() => {
    if (user?.email) {
      checkForInvitations();
    }
  }, [user?.email, checkForInvitations]);
  
  const handleAccept = async (invitationId: string) => {
    try {
      const success = await acceptInvitation(invitationId);
      if (success) {
        toast({
          title: "Invitation accepted",
          description: "You have successfully joined the company.",
        });
        
        // Refresh companies and redirect to dashboard
        await refreshCompanies();
        navigate('/dashboard');
      } else {
        toast({
          title: "Could not accept invitation",
          description: "There was an error accepting the invitation.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error accepting invitation:", error);
      toast({
        title: "Error",
        description: "Failed to accept the invitation. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const handleDecline = async (invitationId: string) => {
    try {
      const success = await declineInvitation(invitationId);
      if (success) {
        toast({
          title: "Invitation declined",
          description: "The invitation has been declined.",
        });
      } else {
        toast({
          title: "Could not decline invitation",
          description: "There was an error declining the invitation.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error declining invitation:", error);
      toast({
        title: "Error",
        description: "Failed to decline the invitation. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-construction-600" />
          <span className="text-sm text-gray-600">Checking for invitations...</span>
        </div>
      </div>
    );
  }
  
  if (!invitations || invitations.length === 0) {
    return null;
  }
  
  return (
    <div className="max-w-3xl mx-auto mb-8">
      {invitations.map(invitation => (
        <Card key={invitation.id} className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle>You've been invited!</CardTitle>
            <CardDescription>
              {invitation.invited_by} has invited you to join {invitation.company_name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700">
              You've been invited to join as a <span className="font-medium">{invitation.role.replace('_', ' ')}</span>. 
              Would you like to accept this invitation?
            </p>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleDecline(invitation.id)}
              disabled={!!processingId}
            >
              {processingId === invitation.id ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <X className="h-4 w-4 mr-1" />
              )}
              Decline
            </Button>
            <Button 
              variant="default" 
              size="sm"
              onClick={() => handleAccept(invitation.id)}
              disabled={!!processingId}
            >
              {processingId === invitation.id ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Check className="h-4 w-4 mr-1" />
              )}
              Accept
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
