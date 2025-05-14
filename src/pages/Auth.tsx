
import React, { useEffect, useState } from 'react';
import { AuthForm } from '@/components/auth/AuthForm';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { invitationService } from '@/services/invitationService';
import { type InvitationDetails } from '@/services/invitationService';

const Auth = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  
  const inviteId = searchParams.get('invitation');
  const inviteEmail = searchParams.get('email');
  
  // Check for existing user session
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        // If we have an invitation and the user is already logged in,
        // process the invitation automatically
        if (inviteId && inviteEmail && data.session.user.email === inviteEmail) {
          try {
            const success = await invitationService.acceptInvitation(inviteId, data.session.user.id);
            if (success) {
              toast.success("You've successfully joined the company!");
              navigate('/dashboard');
              return;
            }
          } catch (error) {
            console.error("Error accepting invitation:", error);
          }
        }
        
        navigate('/dashboard');
      }
      setLoading(false);
    };
    
    checkSession();
  }, [navigate, inviteId, inviteEmail]);
  
  // Check invitation details if present
  useEffect(() => {
    const checkInvitation = async () => {
      if (inviteId && inviteEmail) {
        try {
          // Get invitations for this email
          const invitations = await invitationService.checkPendingInvitations(inviteEmail);
          
          // Find the matching invitation
          const matchingInvite = invitations.find(inv => inv.id === inviteId);
          if (matchingInvite) {
            setInvitation(matchingInvite);
          }
        } catch (err) {
          console.error("Error checking invitation:", err);
        }
      }
    };
    
    if (inviteId && inviteEmail) {
      checkInvitation();
    }
  }, [inviteId, inviteEmail]);
  
  // Handle invitation acceptance after authentication
  const handleAuthSuccess = async (newUser: boolean) => {
    if (invitation && inviteId && user) {
      try {
        await invitationService.acceptInvitation(inviteId, user.id);
        toast.success(`You've successfully joined ${invitation.company_name}!`);
        navigate('/dashboard');
      } catch (error) {
        console.error("Error accepting invitation:", error);
        toast.error("Failed to accept invitation. Please try again later.");
        navigate('/dashboard');
      }
    } else {
      navigate('/dashboard');
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-construction-50 to-gray-100 p-4">
      <div className="w-full max-w-md">
        {invitation && (
          <Alert className="mb-4">
            <InfoIcon className="h-4 w-4" />
            <AlertTitle>You're invited</AlertTitle>
            <AlertDescription>
              You've been invited to join {invitation.company_name} as a {invitation.role.replace(/_/g, ' ')}. 
              Please {inviteEmail === user?.email ? 'accept the invitation' : 'register or sign in'} to continue.
            </AlertDescription>
          </Alert>
        )}
        
        <AuthForm onSuccess={handleAuthSuccess} invitedEmail={inviteEmail || undefined} />
        <p className="text-center text-sm text-gray-500 mt-6">
          By using this service, you agree to our <a href="#" className="text-construction-600 hover:text-construction-700">Terms of Service</a> and <a href="#" className="text-construction-600 hover:text-construction-700">Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
};

export default Auth;
