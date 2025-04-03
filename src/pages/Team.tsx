
import React, { useState } from 'react';
import { AppHeader } from '@/components/AppHeader';
import { AppSidebar } from '@/components/AppSidebar';
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from '@/components/ui/table';
import { 
  SidebarProvider, 
  SidebarTrigger, 
  SidebarInset 
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  MoreHorizontal, 
  UserCheck, 
  UserX, 
  Mail, 
  Edit, 
  Trash2 
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase, type DbTeamMember } from '@/lib/supabase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';

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
  // Fetch team members using React Query
  const { data: teamMembers, isLoading, error } = useQuery({
    queryKey: ['teamMembers'],
    queryFn: async () => {
      // Use mock data for now, later we'll connect to Supabase
      // In a real implementation, we would fetch from Supabase like this:
      // const { data, error } = await supabase.from('team_members').select('*');
      // if (error) throw error;
      // return data;
      
      // Return mock data for now
      return mockTeamMembers;
    }
  });

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const handleStatusToggle = (member: DbTeamMember) => {
    const newStatus = member.status === 'active' ? 'inactive' : 'active';
    toast({
      title: "Status updated",
      description: `${member.first_name} ${member.last_name} is now ${newStatus}.`,
    });
    // In a real app, we would update the status in Supabase here
  };

  const handleInviteMember = () => {
    toast({
      title: "Invite sent",
      description: "Team member invitation has been sent.",
    });
    // In a real app, we would show a modal to invite a new team member
  };

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <SidebarProvider>
        <div className="flex flex-1 overflow-hidden">
          <AppSidebar />
          <SidebarInset className="overflow-y-auto bg-gray-50 p-4 md:p-6 w-full">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">Team Members</h1>
                <div className="flex items-center gap-4">
                  <Button onClick={handleInviteMember} className="bg-cnstrct-orange hover:bg-cnstrct-orange/90">
                    <Plus className="mr-2 h-4 w-4" />
                    Invite Member
                  </Button>
                  <SidebarTrigger />
                </div>
              </div>
              
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
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[250px]">Name</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {teamMembers?.map((member) => (
                        <TableRow key={member.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarImage src={member.avatar_url || undefined} alt={`${member.first_name} ${member.last_name}`} />
                                <AvatarFallback className="bg-cnstrct-navy text-white">
                                  {getInitials(member.first_name, member.last_name)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{member.first_name} {member.last_name}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{member.role}</TableCell>
                          <TableCell>{member.email}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={member.status === 'active' ? "default" : "outline"}
                              className={member.status === 'active' 
                                ? "bg-green-100 text-green-700 hover:bg-green-100" 
                                : "bg-gray-100 text-gray-700 hover:bg-gray-100"
                              }
                            >
                              {member.status === 'active' ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Open menu</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => window.location.href = `mailto:${member.email}`}>
                                  <Mail className="mr-2 h-4 w-4" />
                                  <span>Email</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusToggle(member)}>
                                  {member.status === 'active' ? (
                                    <>
                                      <UserX className="mr-2 h-4 w-4" />
                                      <span>Deactivate</span>
                                    </>
                                  ) : (
                                    <>
                                      <UserCheck className="mr-2 h-4 w-4" />
                                      <span>Activate</span>
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                  <Edit className="mr-2 h-4 w-4" />
                                  <span>Edit</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600">
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  <span>Delete</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
};

export default Team;
