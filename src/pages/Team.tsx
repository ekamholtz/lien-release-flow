
import React from 'react';
import { AppLayout } from '@/components/AppLayout';
import { TeamHeader } from '@/components/team/TeamHeader';
import { TeamMemberTable } from '@/components/team/TeamMemberTable';
import { useTeamMembers } from '@/hooks/useTeamMembers';

const Team = () => {
  const { teamMembers, loading, error, fetchTeamMembers, updateTeamMemberStatus } = useTeamMembers();

  const handleMemberAdded = () => {
    fetchTeamMembers();
  };

  return (
    <AppLayout>
      <div className="container mx-auto py-6 px-4 md:px-6">
        <TeamHeader onMemberAdded={handleMemberAdded} />
        {loading ? (
          <div className="dashboard-card flex justify-center items-center h-64">
            <p>Loading team members...</p>
          </div>
        ) : error ? (
          <div className="dashboard-card bg-red-50 border-red-200 text-red-600 p-6">
            <p>Error loading team members. Please try again later.</p>
          </div>
        ) : (
          <div className="dashboard-card overflow-hidden">
            <TeamMemberTable teamMembers={teamMembers} onStatusChange={updateTeamMemberStatus} />
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Team;
