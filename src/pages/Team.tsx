
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { TeamHeader } from '@/components/team/TeamHeader';
import { TeamMemberTable } from '@/components/team/TeamMemberTable';
import { useCompany } from '@/contexts/CompanyContext';
import { useCompanyMembers } from '@/hooks/useCompanyMembers';
import { usePermissions } from '@/hooks/usePermissions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { CompanyMember } from '@/lib/types/company';
import { supabase } from '@/integrations/supabase/client';

const Team = () => {
  const navigate = useNavigate();
  const { currentCompany, isLoading: companyLoading } = useCompany();
  const { can, isCompanyOwner } = usePermissions(currentCompany?.id);
  const { 
    members, 
    isLoading: membersLoading, 
    error, 
    updateMember, 
    deleteMember,
    resendInvitation,
    refetch 
  } = useCompanyMembers(currentCompany?.id);

  const handleMemberAdded = () => {
    refetch();
  };

  // Fixing type error by ensuring status is one of the allowed values
  const handleStatusChange = async (id: string, status: 'active' | 'pending' | 'disabled') => {
    try {
      await updateMember.mutateAsync({ id, status });
      return { success: true };
    } catch (err) {
      console.error('Error updating member status:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to update status' 
      };
    }
  };
  
  // Handle member deletion
  const handleDelete = async (id: string) => {
    console.log('Team page: handleDelete called with ID:', id);
    console.log('deleteMember object:', deleteMember);
    
    if (!deleteMember || !deleteMember.mutateAsync) {
      console.error('deleteMember mutation is not properly initialized');
      return { success: false, error: 'Delete functionality is not available' };
    }
    
    try {
      console.log('Attempting to call deleteMember.mutateAsync');
      const result = await deleteMember.mutateAsync(id);
      console.log('Delete mutation completed successfully:', result);
      return { success: true };
    } catch (err) {
      console.error('Error removing member:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to remove member' 
      };
    }
  };
  
  // Handle resending invitation
  const handleResendInvitation = async (member: CompanyMember) => {
    console.log('Team page: handleResendInvitation called with member:', member);
    console.log('resendInvitation object:', resendInvitation);
    
    if (!currentCompany?.id) {
      console.error('No company ID available');
      return { success: false, error: 'No company selected' };
    }
    
    if (!resendInvitation || !resendInvitation.mutateAsync) {
      console.error('resendInvitation mutation is not properly initialized');
      // Instead of returning an error, let's try to call the edge function directly
      try {
        const { data, error } = await supabase.functions.invoke('send-invitation-email', {
          body: {
            firstName: member.first_name,
            lastName: member.last_name,
            email: member.invited_email,
            companyName: currentCompany.name,
            invitationId: member.id,
            invitedBy: 'Administrator',
            role: member.role
          }
        });
        
        console.log('Direct edge function call response:', { data, error });
        
        if (error) throw error;
        return { success: true };
      } catch (directErr) {
        console.error('Error calling edge function directly:', directErr);
        return { 
          success: false, 
          error: directErr instanceof Error ? directErr.message : 'Failed to resend invitation' 
        };
      }
    }
    
    try {
      // Use the existing hook instance
      await resendInvitation.mutateAsync(member);
      return { success: true };
    } catch (err) {
      console.error('Error resending invitation:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to resend invitation' 
      };
    }
  };

  const isLoading = companyLoading || membersLoading;

  // Check if user can manage users
  const [canManageUsers, setCanManageUsers] = React.useState(false);
  React.useEffect(() => {
    const checkPermission = async () => {
      if (isCompanyOwner) {
        setCanManageUsers(true);
        return;
      }
      
      const hasPermission = await can.manageUsers();
      setCanManageUsers(hasPermission);
    };
    
    checkPermission();
  }, [isCompanyOwner, can]);

  // No automatic redirects here

  return (
    <AppLayout>
      <div className="container mx-auto py-6 px-4 md:px-6">
        {!currentCompany && !isLoading ? (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>No company selected</AlertTitle>
            <AlertDescription className="flex flex-col gap-4">
              <p>You need to select or create a company before you can manage team members.</p>
              <Button 
                onClick={() => navigate('/onboarding/company')} 
                className="w-fit"
              >
                Create Company
              </Button>
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <TeamHeader onMemberAdded={handleMemberAdded} />
            {isLoading ? (
              <div className="dashboard-card flex justify-center items-center h-64">
                <p>Loading team members...</p>
              </div>
            ) : error ? (
              <div className="dashboard-card bg-red-50 border-red-200 text-red-600 p-6">
                <p>Error loading team members. Please try again later.</p>
              </div>
            ) : (
              <div className="dashboard-card overflow-hidden">
                <TeamMemberTable 
                  teamMembers={members} 
                  onStatusChange={handleStatusChange}
                  onDelete={handleDelete}
                  onResendInvitation={handleResendInvitation}
                  canManageUsers={canManageUsers}
                />
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default Team;
