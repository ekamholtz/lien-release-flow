
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCompany } from '@/contexts/CompanyContext';
import { InviteMemberDialog } from './InviteMemberDialog';

interface TeamHeaderProps {
  onMemberAdded: () => void;
}

export function TeamHeader({ onMemberAdded }: TeamHeaderProps) {
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const { currentCompany } = useCompany();

  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold">Team Members</h1>
        {currentCompany && (
          <p className="text-muted-foreground">Company: {currentCompany.name}</p>
        )}
      </div>
      <Button onClick={() => setIsInviteDialogOpen(true)} className="bg-cnstrct-orange hover:bg-cnstrct-orange/90">
        <Plus className="mr-2 h-4 w-4" />
        Invite Member
      </Button>
      
      {currentCompany && (
        <InviteMemberDialog 
          isOpen={isInviteDialogOpen}
          onClose={() => setIsInviteDialogOpen(false)}
          onMemberAdded={onMemberAdded}
          companyId={currentCompany.id}
        />
      )}
    </div>
  );
}
