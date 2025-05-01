
import React, { useEffect, useState } from 'react';
import { AuthForm } from '@/components/auth/AuthForm';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';

const Auth = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState<{
    id: string;
    companyName: string;
  } | null>(null);
  
  const inviteId = searchParams.get('invitation');
  const inviteEmail = searchParams.get('email');
  
  // Check for existing user session
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        navigate('/dashboard');
      }
      setLoading(false);
    };
    
    checkSession();
  }, [navigate]);
  
  // Check invitation details if present
  useEffect(() => {
    const checkInvitation = async () => {
      if (inviteId && inviteEmail) {
        try {
          const { data, error } = await supabase.functions.invoke('check-invitations', {
            body: { email: inviteEmail }
          });
          
          if (error) {
            console.error("Error checking invitation:", error);
            return;
          }
          
          const matchingInvite = data.invitations?.find((inv: any) => inv.id === inviteId);
          if (matchingInvite) {
            setInvitation({
              id: matchingInvite.id,
              companyName: matchingInvite.company_name
            });
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
              You've been invited to join {invitation.companyName}. Please register or sign in to accept the invitation.
            </AlertDescription>
          </Alert>
        )}
        
        <AuthForm />
        <p className="text-center text-sm text-gray-500 mt-6">
          By using this service, you agree to our <a href="#" className="text-construction-600 hover:text-construction-700">Terms of Service</a> and <a href="#" className="text-construction-600 hover:text-construction-700">Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
};

export default Auth;
