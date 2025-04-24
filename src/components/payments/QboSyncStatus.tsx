
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertCircle, CheckCircle2, Clock, RefreshCw, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { sync_status } from '@/integrations/supabase/types';

type QboSyncStatus = sync_status | null;

interface QboSyncStatusBadgeProps {
  status: QboSyncStatus;
  errorMessage?: string | null;
  retries?: number;
  lastSynced?: string | null;
  className?: string;
  showLabel?: boolean;
  onRetry?: () => void;
}

export function QboSyncStatusBadge({ 
  status, 
  errorMessage, 
  retries = 0, 
  lastSynced,
  className,
  showLabel = true,
  onRetry
}: QboSyncStatusBadgeProps) {
  let icon = null;
  let label = "";
  let tooltipContent = "";
  let badgeClass = "";
  
  switch(status) {
    case 'pending':
      icon = <Clock className="h-3 w-3" />;
      label = "QBO: Pending";
      tooltipContent = "Will be synced to QuickBooks Online";
      badgeClass = "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
      break;
    
    case 'processing':
      icon = <RefreshCw className="h-3 w-3 animate-spin" />;
      label = "QBO: Syncing";
      tooltipContent = "Currently syncing to QuickBooks Online";
      badgeClass = "bg-blue-100 text-blue-800 hover:bg-blue-100";
      break;
      
    case 'success':
      icon = <CheckCircle2 className="h-3 w-3" />;
      label = "QBO: Synced";
      tooltipContent = lastSynced 
        ? `Successfully synced to QuickBooks Online on ${new Date(lastSynced).toLocaleString()}`
        : "Successfully synced to QuickBooks Online";
      badgeClass = "bg-green-100 text-green-800 hover:bg-green-100";
      break;
      
    case 'error':
      icon = <AlertCircle className="h-3 w-3" />;
      label = "QBO: Failed";
      tooltipContent = errorMessage 
        ? `Error: ${errorMessage}${retries > 0 ? ` (Retries: ${retries})` : ''}`
        : "Failed to sync to QuickBooks Online";
      badgeClass = "bg-red-100 text-red-800 hover:bg-red-100";
      break;
      
    default:
      icon = <X className="h-3 w-3" />;
      label = "QBO: Not Synced";
      tooltipContent = "Not configured for QuickBooks Online sync";
      badgeClass = "bg-gray-100 text-gray-800 hover:bg-gray-100";
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            className={cn("flex items-center gap-1 cursor-default", badgeClass, className)}
            onClick={status === 'error' && onRetry ? onRetry : undefined}
          >
            {icon}
            {showLabel && <span className="text-xs">{label}</span>}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltipContent}</p>
          {status === 'error' && onRetry && (
            <p className="text-xs mt-1">Click to retry sync</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
