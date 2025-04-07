
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from '@/components/ui/table';
import { type DbTeamMember } from '@/lib/supabase';
import { TeamMemberRow } from './TeamMemberRow';

interface TeamMemberTableProps {
  teamMembers: DbTeamMember[];
  onStatusChange: (id: string, status: string) => Promise<{ success: boolean, error?: string }>;
}

export function TeamMemberTable({ teamMembers, onStatusChange }: TeamMemberTableProps) {
  return (
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
        {teamMembers.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="text-center py-8 text-gray-500">
              No team members found. Invite someone to get started.
            </TableCell>
          </TableRow>
        ) : (
          teamMembers.map((member) => (
            <TeamMemberRow 
              key={member.id} 
              member={member} 
              onStatusChange={onStatusChange} 
            />
          ))
        )}
      </TableBody>
    </Table>
  );
}
