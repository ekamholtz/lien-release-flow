
import { useState } from 'react';
import { toast } from 'sonner';
import { useSessionRefresh } from '@/hooks/useSessionRefresh';

export function useBillSync() {
  const [isSyncing, setIsSyncing] = useState(false);
  const { session } = useSessionRefresh();

  const syncBillToQbo = async (billId: string) => {
    if (!session?.access_token) {
      toast.error('Please sign in to sync bills');
      return false;
    }

    try {
      setIsSyncing(true);
      toast.info('Syncing bill to QuickBooks...');

      const response = await fetch(
        'https://oknofqytitpxmlprvekn.functions.supabase.co/sync-bill',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({ bill_id: billId })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Sync failed: ${errorText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        toast.success('Bill synced to QuickBooks successfully');
        return true;
      } else {
        toast.error(result.error || 'Failed to sync bill');
        return false;
      }
    } catch (error: any) {
      console.error('Error syncing bill:', error);
      toast.error(`Sync error: ${error.message}`);
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  return {
    syncBillToQbo,
    isSyncing
  };
}
