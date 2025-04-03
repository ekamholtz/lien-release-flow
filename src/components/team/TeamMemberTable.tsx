
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
  teamMembers: DbTeamMember[] | undefined;
}

export function TeamMemberTable({ teamMembers }: TeamMemberTableProps) {
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
        {teamMembers?.map((member) => (
          <TeamMemberRow key={member.id} member={member} />
        ))}
      </TableBody>
    </Table>
  );
}
