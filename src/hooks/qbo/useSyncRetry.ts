
import { toast } from "sonner";
import { useSessionRefresh } from "@/hooks/useSessionRefresh";

export function useSyncRetry() {
  const { session } = useSessionRefresh();

  const retryFailedSyncs = async (entityType?: string) => {
    if (!session?.access_token) return;
    
    try {
      toast.info(`Retrying failed ${entityType || 'all'} syncs...`);
      
      const endpoints: Record<string, string> = {
        invoice: 'sync-invoice',
        bill: 'sync-bill', 
        vendor: 'sync-vendor',
        payment: 'sync-payment'
      };
      
      const entitiesToRetry = entityType ? [entityType] : Object.keys(endpoints);
      
      for (const entity of entitiesToRetry) {
        if (endpoints[entity]) {
          const response = await fetch(
            `https://oknofqytitpxmlprvekn.functions.supabase.co/${endpoints[entity]}`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`
              },
              body: JSON.stringify({})
            }
          );
          
          if (!response.ok) {
            console.error(`Failed to retry ${entity} syncs:`, await response.text());
          }
        }
      }
      
      toast.success('Sync retry initiated');
      
    } catch (err: any) {
      console.error('Error retrying syncs:', err);
      toast.error(`Retry error: ${err.message}`);
    }
  };

  return { retryFailedSyncs };
}
