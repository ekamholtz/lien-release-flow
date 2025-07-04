
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Link2 } from "lucide-react";
import { useProjectCustomerSync } from "@/hooks/qbo/useProjectCustomerSync";

interface ProjectQboSyncButtonProps {
  projectId: string;
  qboCustomerId?: string | null;
  qboJobId?: string | null;
  onSyncComplete?: () => void;
}

export function ProjectQboSyncButton({ 
  projectId, 
  qboCustomerId, 
  qboJobId, 
  onSyncComplete 
}: ProjectQboSyncButtonProps) {
  const { syncProjectCustomer, isLoading } = useProjectCustomerSync();

  const handleSync = async () => {
    const result = await syncProjectCustomer(projectId);
    if (result.success && onSyncComplete) {
      onSyncComplete();
    }
  };

  const isSynced = qboCustomerId && qboJobId;

  return (
    <div className="flex items-center gap-2">
      {isSynced ? (
        <Badge variant="secondary" className="flex items-center gap-1">
          <Link2 className="h-3 w-3" />
          Synced to QBO
        </Badge>
      ) : (
        <Button 
          onClick={handleSync} 
          disabled={isLoading}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Link2 className="h-4 w-4" />
          )}
          {isLoading ? 'Syncing...' : 'Sync to QBO'}
        </Button>
      )}
      {qboCustomerId && !qboJobId && (
        <Badge variant="outline">Customer Only</Badge>
      )}
    </div>
  );
}
