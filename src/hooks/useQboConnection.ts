
import { useSessionRefresh } from "@/hooks/useSessionRefresh";
import { useQboConnectionStatus, QboStatus } from "@/hooks/qbo/useQboConnectionStatus";
import { useQboActions } from "@/hooks/qbo/useQboActions";
import { useCompany } from "@/contexts/CompanyContext";
import { toast } from "sonner";

export type QboConnectionStatus = QboStatus;

export function useQboConnection() {
  const { session, refreshSession } = useSessionRefresh();
  const { currentCompany } = useCompany();
  
  const {
    status: qboStatus,
    error,
    setError,
    debugInfo,
    setDebugInfo,
    checkQboConnection
  } = useQboConnectionStatus(currentCompany?.id);
  
  const {
    connecting,
    isDisconnecting,
    handleConnectQbo,
    handleDisconnectQbo
  } = useQboActions();

  const connectQbo = async () => {
    if (!currentCompany?.id) {
      toast.error("Please select a company to connect QuickBooks");
      return;
    }
    
    try {
      await refreshSession();
      
      const sessionResult = await session?.access_token;
      
      if (!sessionResult) {
        throw new Error("No active session found. Please sign in again.");
      }

      await handleConnectQbo(currentCompany.id, sessionResult);
    } catch (error: any) {
      setError(error.message || String(error));
      throw error;
    }
  };

  const disconnectQbo = async () => {
    if (!currentCompany?.id) return;
    
    const success = await handleDisconnectQbo(currentCompany.id);
    if (success) {
      checkQboConnection(currentCompany.id);
    }
  };

  return {
    qboStatus,
    connecting,
    error,
    setError,
    debugInfo,
    isDisconnecting,
    handleConnectQbo: connectQbo,
    handleDisconnectQbo: disconnectQbo,
    checkQboConnection: () => currentCompany?.id ? checkQboConnection(currentCompany.id) : null
  };
}
