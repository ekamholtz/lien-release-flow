import React from 'react';
import { Button } from "@/components/ui/button";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Eye } from "lucide-react";

// Import the correct type or define it here
type ExtendedContract = {
  id: string;
  title?: string;
  note?: string;
  owner?: string;
  signer_name?: string;
  created_at?: string;
  status: string;
  projects?: {
    name: string;
  };
};

interface ContractActionsProps {
  contract: ExtendedContract;
  onViewDetails: (contract: ExtendedContract) => void;
}

export function ContractActions({ contract, onViewDetails }: ContractActionsProps) {
  return (
    <div className="flex items-center justify-end gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-gray-500"
              onClick={() => onViewDetails(contract)}
            >
              <Eye className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>View Details</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
