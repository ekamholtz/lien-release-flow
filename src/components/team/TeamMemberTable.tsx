
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from '@/components/ui/table';
import { TeamMemberRow } from './TeamMemberRow';
import type { CompanyMember } from '@/lib/types/company';

interface TeamMemberTableProps {
  teamMembers: CompanyMember[];
  onStatusChange: (id: string, status: string) => Promise<{ success: boolean, error?: string }>;
  onDelete?: (id: string) => Promise<{ success: boolean, error?: string }>;
  onResendInvitation?: (member: CompanyMember) => Promise<{ success: boolean, error?: string }>;
  canManageUsers: boolean;
}

export function TeamMemberTable({ teamMembers, onStatusChange, onDelete, onResendInvitation, canManageUsers }: TeamMemberTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[250px]">Name</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Status</TableHead>
          {canManageUsers && (
            <TableHead className="text-right">Actions</TableHead>
          )}
        </TableRow>
      </TableHeader>
      <TableBody>
        {teamMembers.length === 0 ? (
          <TableRow>
            <TableCell colSpan={canManageUsers ? 5 : 4} className="text-center py-8 text-gray-500">
              No team members found. Invite someone to get started.
            </TableCell>
          </TableRow>
        ) : (
          teamMembers.map((member) => (
            <TeamMemberRow 
              key={member.id} 
              member={member} 
              onStatusChange={onStatusChange}
              onDelete={canManageUsers ? onDelete : undefined}
              onResendInvitation={canManageUsers ? onResendInvitation : undefined}
            />
          ))
        )}
      </TableBody>
    </Table>
  );
}
