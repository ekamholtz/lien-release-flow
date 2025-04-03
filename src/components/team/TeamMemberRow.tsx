
import { 
  MoreHorizontal, 
  UserCheck, 
  UserX, 
  Mail, 
  Edit, 
  Trash2 
} from 'lucide-react';
import { type DbTeamMember } from '@/lib/supabase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface TeamMemberRowProps {
  member: DbTeamMember;
}

export function TeamMemberRow({ member }: TeamMemberRowProps) {
  const { toast } = useToast();

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const handleStatusToggle = () => {
    const newStatus = member.status === 'active' ? 'inactive' : 'active';
    toast({
      title: "Status updated",
      description: `${member.first_name} ${member.last_name} is now ${newStatus}.`,
    });
  };

  return (
    <TableRow>
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
            <DropdownMenuItem onClick={handleStatusToggle}>
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
  );
}
