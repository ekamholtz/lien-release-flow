
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { TeamHeader } from '@/components/team/TeamHeader';
import { TeamMemberTable } from '@/components/team/TeamMemberTable';
import { useCompany } from '@/contexts/CompanyContext';
import { useCompanyMembers } from '@/hooks/useCompanyMembers';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Team = () => {
  const navigate = useNavigate();
  const { currentCompany, isLoading: companyLoading } = useCompany();
  const { 
    members, 
    isLoading: membersLoading, 
    error, 
    updateMember, 
    refetch 
  } = useCompanyMembers(currentCompany?.id);

  const handleMemberAdded = () => {
    refetch();
  };

  const handleStatusChange = async (id: string, status: string) => {
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
                <TeamMemberTable teamMembers={members} onStatusChange={handleStatusChange} />
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default Team;
