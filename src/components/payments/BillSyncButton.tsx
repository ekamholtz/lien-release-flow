
import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useBillSync } from '@/hooks/useBillSync';

interface BillSyncButtonProps {
  billId: string;
  onSyncComplete?: () => void;
}

export function BillSyncButton({ billId, onSyncComplete }: BillSyncButtonProps) {
  const { syncBillToQbo, isSyncing } = useBillSync();

  const handleSync = async () => {
    const success = await syncBillToQbo(billId);
    if (success && onSyncComplete) {
      onSyncComplete();
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleSync}
      disabled={isSyncing}
      className="gap-2"
    >
      <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
      {isSyncing ? 'Syncing...' : 'Sync to QBO'}
    </Button>
  );
}
