
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

  const totalAmount = contractData.lineItems?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;

  return (
    <div>
      <h4 className="text-sm font-medium mb-3">Contract</h4>
      <div className="flex items-start space-x-3">
        {getContractIcon()}
        <div className="flex-1">
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
              {contractData.lineItems && contractData.lineItems.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-sm font-medium">Line Items ({contractData.lineItems.length})</p>
                  <div className="bg-gray-50 rounded-md p-3 space-y-1">
                    {contractData.lineItems.slice(0, 3).map((item, index) => (
                      <div key={item.id} className="flex justify-between text-xs">
                        <span className="truncate pr-2">{item.description || 'Untitled Item'}</span>
                        <span>${item.amount?.toFixed(2) || '0.00'}</span>
                      </div>
                    ))}
                    {contractData.lineItems.length > 3 && (
                      <div className="text-xs text-muted-foreground pt-1">
                        +{contractData.lineItems.length - 3} more items
                      </div>
                    )}
                    <div className="border-t pt-1 mt-2">
                      <div className="flex justify-between text-sm font-medium">
                        <span>Total:</span>
                        <span>${totalAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
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
