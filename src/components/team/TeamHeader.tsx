
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export function TeamHeader() {
  const { toast } = useToast();

  const handleInviteMember = () => {
    toast({
      title: "Invite sent",
      description: "Team member invitation has been sent.",
    });
  };

  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-bold">Team Members</h1>
      <Button onClick={handleInviteMember} className="bg-cnstrct-orange hover:bg-cnstrct-orange/90">
        <Plus className="mr-2 h-4 w-4" />
        Invite Member
      </Button>
    </div>
  );
}
