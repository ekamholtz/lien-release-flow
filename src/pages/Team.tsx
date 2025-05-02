
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

const Team = () => {
  const navigate = useNavigate();
  const { currentCompany, isLoading: companyLoading } = useCompany();
  const { can, isCompanyOwner } = usePermissions(currentCompany?.id);
  const { 
    members, 
    isLoading: membersLoading, 
    error, 
    updateMember, 
    refetch 
  } = useCompanyMembers(currentCompany?.id);

  useEffect(() => {
    // Since we can't use the migrate_company_member_roles function,
    // we'll just log this for now. The migration should be handled separately
    // through a direct database migration
    if (currentCompany?.id) {
      console.log('Note: Company members roles migration would happen here');
    }
  }, [currentCompany?.id]);

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
