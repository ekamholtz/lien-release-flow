
import React from 'react';
import { FileText, Upload, Edit } from 'lucide-react';
import { ContractData } from '../ProjectContract';

interface ProjectContractSummaryProps {
  contractData: ContractData;
}

export function ProjectContractSummary({ contractData }: ProjectContractSummaryProps) {
  const getContractIcon = () => {
    switch (contractData.type) {
      case 'create':
        return <Edit className="h-5 w-5 text-blue-500" />;
      case 'upload':
        return <Upload className="h-5 w-5 text-green-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  const getContractTypeLabel = () => {
    switch (contractData.type) {
      case 'create':
        return 'New Contract';
      case 'upload':
        return 'Uploaded Contract';
      default:
        return 'No Contract';
    }
  };

  return (
    <div>
      <h4 className="text-sm font-medium mb-3">Contract</h4>
      <div className="flex items-start space-x-3">
        {getContractIcon()}
        <div>
          <p className="text-sm font-medium">{getContractTypeLabel()}</p>
          {contractData.type === 'create' && contractData.title && (
            <>
              <p className="text-sm text-muted-foreground mt-1">
                Title: {contractData.title}
              </p>
              {contractData.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {contractData.description}
                </p>
              )}
            </>
          )}
          {contractData.type === 'upload' && contractData.file && (
            <p className="text-sm text-muted-foreground mt-1">
              File: {contractData.file.name}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
