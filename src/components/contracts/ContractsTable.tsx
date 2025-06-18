import React from 'react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { FileText } from "lucide-react";
import { format } from 'date-fns';
import { ContractActions } from './ContractActions';
import { ExtendedContract } from '@/types/contract';


interface ContractsTableProps {
  contracts: ExtendedContract[];
  onViewDetails: (contract: ExtendedContract) => void;
  onDelete: (contract: ExtendedContract) => void;
  onSortChange: (key: 'title' | 'owner' | 'createdAt') => void;
  sortKey: string;
  sortOrder: string;
}

export function ContractsTable({
  contracts,
  onViewDetails,
  onDelete,
  onSortChange,
  sortKey,
  sortOrder,
}: ContractsTableProps) {
  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead onClick={() => onSortChange('title')} className="cursor-pointer">
              Document Title {sortKey === 'title' && (sortOrder === 'asc' ? '↑' : '↓')}
            </TableHead>
            <TableHead>Note</TableHead>
            <TableHead onClick={() => onSortChange('owner')} className="cursor-pointer">
              Owner {sortKey === 'owner' && (sortOrder === 'asc' ? '↑' : '↓')}
            </TableHead>
            <TableHead>Signer Name</TableHead>
            <TableHead onClick={() => onSortChange('createdAt')} className="cursor-pointer">
              Created At {sortKey === 'createdAt' && (sortOrder === 'asc' ? '↑' : '↓')}
            </TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contracts?.map((contract) => (
            <TableRow key={contract.id}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-construction-600" />
                  {contract.title || "Untitled Document"}
                </div>
              </TableCell>
              <TableCell>{contract.note || "—"}</TableCell>
              <TableCell>{contract.owner || "—"}</TableCell>
              <TableCell>{contract.signers?.[0]?.name || "—"}</TableCell>
              <TableCell>
                {contract.createdAt ? format(new Date(contract.createdAt), 'MMM d, yyyy') : "—"}
              </TableCell>
              <TableCell className="text-right">
                <ContractActions
                  contract={contract}
                  onViewDetails={onViewDetails}
                  onDelete={onDelete}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
