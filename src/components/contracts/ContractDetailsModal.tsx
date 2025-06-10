import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { ExtendedContract } from '@/types/contract';

interface Signer {
  name: string;
  email: string;
  phone: string;
}



interface ContractDetailsModalProps {
  contract: ExtendedContract;
  isOpen: boolean;
  onClose: () => void;
}

export function ContractDetailsModal({ contract, isOpen, onClose }: ContractDetailsModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Contract Details</DialogTitle>
          <DialogDescription>
            Document ID: {contract.objectId}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-x-6 gap-y-4 mb-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Title</p>
            <div className="font-medium">{contract.title}</div>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Status</p>
            <Badge variant={contract.status === "completed" ? "default" : "outline"}>
              {contract.status}
            </Badge>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Note</p>
            <div className="font-medium">{contract.note}</div>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Owner</p>
            <div className="font-medium">{contract.owner}</div>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Created At</p>
            <div className="font-medium">{format(new Date(contract.createdAt), 'MMM d, yyyy h:mm a')}</div>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Updated At</p>
            <div className="font-medium">{format(new Date(contract.updatedAt), 'MMM d, yyyy h:mm a')}</div>
          </div>
        </div>

        <ScrollArea className="max-h-[400px] pr-4">
          <div className="space-y-6">

            {contract.signers.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-2">Signer Details</h3>
                {contract.signers.map((signer, index) => (
                  <div key={index} className="bg-gray-50 p-3 rounded-md mb-2">
                    <p className="text-sm font-medium">{signer.name}</p>
                    <p className="text-sm text-muted-foreground">Email: {signer.email}</p>
                    <p className="text-sm text-muted-foreground">Phone: {signer.phone}</p>
                  </div>
                ))}
              </div>
            )}

            {contract.audit_trail?.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-2">Audit Trail</h3>
                {contract.audit_trail.map((event, idx) => (
                  <div key={idx} className="text-sm text-gray-700 mb-2">
                    <p><strong>Email:</strong> {event.email}</p>
                    <p><strong>Viewed:</strong> {format(new Date(event.viewed), 'MMM d, yyyy h:mm a')}</p>
                    <p><strong>Signed:</strong> {format(new Date(event.signed), 'MMM d, yyyy h:mm a')}</p>
                  </div>
                ))}
              </div>
            )}

            <Separator />

            <div>
              <h3 className="text-sm font-medium mb-2">Documents</h3>
              <div className="flex flex-col gap-2">
                <a
                  href={contract.file}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline text-sm"
                >
                  View Signed Document
                </a>
                {contract.certificate && (
                  <a
                    href={contract.certificate}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm"
                  >
                    View Certificate
                  </a>
                )}
              </div>
            </div>

          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
