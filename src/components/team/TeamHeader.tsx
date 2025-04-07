
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InviteMemberDialog } from './InviteMemberDialog';

interface TeamHeaderProps {
  onMemberAdded: () => void;
}

export function TeamHeader({ onMemberAdded }: TeamHeaderProps) {
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);

  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-bold">Team Members</h1>
      <Button onClick={() => setIsInviteDialogOpen(true)} className="bg-cnstrct-orange hover:bg-cnstrct-orange/90">
        <Plus className="mr-2 h-4 w-4" />
        Invite Member
      </Button>
      
      <InviteMemberDialog 
        isOpen={isInviteDialogOpen}
        onClose={() => setIsInviteDialogOpen(false)}
        onMemberAdded={onMemberAdded}
      />
    </div>
  );
}
