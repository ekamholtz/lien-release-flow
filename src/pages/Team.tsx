
import React from 'react';
import { AppLayout } from '@/components/AppLayout';
import { type DbTeamMember } from '@/lib/supabase';
import { TeamHeader } from '@/components/team/TeamHeader';
import { TeamMemberTable } from '@/components/team/TeamMemberTable';
import { useQuery } from '@tanstack/react-query';

// Mock team data for initial development
const mockTeamMembers: DbTeamMember[] = [
  {
    id: '1',
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@example.com',
    role: 'Project Manager',
    avatar_url: null,
    status: 'active',
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    first_name: 'Jane',
    last_name: 'Smith',
    email: 'jane.smith@example.com',
    role: 'Accountant',
    avatar_url: null,
    status: 'active',
    created_at: new Date().toISOString(),
  },
  {
    id: '3',
    first_name: 'Michael',
    last_name: 'Wilson',
    email: 'michael.wilson@example.com',
    role: 'Contractor',
    avatar_url: null,
    status: 'inactive',
    created_at: new Date().toISOString(),
  }
];

const Team = () => {
  const { data: teamMembers, isLoading, error } = useQuery({
    queryKey: ['teamMembers'],
    queryFn: async () => {
      return mockTeamMembers;
    }
  });

  return (
    <AppLayout>
      <div className="container mx-auto py-6 px-4 md:px-6">
        <TeamHeader />
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
            <TeamMemberTable teamMembers={teamMembers} />
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Team;
