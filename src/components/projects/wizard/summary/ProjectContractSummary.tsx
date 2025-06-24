
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

  const calculateTotals = () => {
    if (!contractData.lineItems) return { totalBudget: 0, totalPrice: 0, itemCount: 0, subItemCount: 0 };
    
    let totalBudget = 0;
    let totalPrice = 0;
    let subItemCount = 0;
    
    contractData.lineItems.forEach(item => {
      item.subItems.forEach(subItem => {
        totalBudget += subItem.budget || 0;
        totalPrice += subItem.price || 0;
        subItemCount++;
      });
    });
    
    return {
      totalBudget,
      totalPrice,
      itemCount: contractData.lineItems.length,
      subItemCount
    };
  };

  const { totalBudget, totalPrice, itemCount, subItemCount } = calculateTotals();

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
                  <p className="text-sm font-medium">
                    Line Items: {itemCount} items ({subItemCount} sub-items)
                  </p>
                  <div className="bg-gray-50 rounded-md p-3 space-y-2">
                    {contractData.lineItems.slice(0, 2).map((item, index) => (
                      <div key={item.id} className="space-y-1">
                        <div className="flex justify-between text-sm font-medium">
                          <span className="truncate pr-2">{item.description || 'Untitled Item'}</span>
                          <span>
                            ${item.subItems.reduce((sum, sub) => sum + (sub.price || 0), 0).toFixed(2)}
                          </span>
                        </div>
                        {item.subItems.slice(0, 2).map((subItem, subIndex) => (
                          <div key={subItem.id} className="flex justify-between text-xs text-muted-foreground pl-4">
                            <span className="truncate pr-2">• {subItem.description || 'Untitled Sub-item'}</span>
                            <span>${subItem.price?.toFixed(2) || '0.00'}</span>
                          </div>
                        ))}
                        {item.subItems.length > 2 && (
                          <div className="text-xs text-muted-foreground pl-4">
                            +{item.subItems.length - 2} more sub-items
                          </div>
                        )}
                      </div>
                    ))}
                    {contractData.lineItems.length > 2 && (
                      <div className="text-xs text-muted-foreground pt-1">
                        +{contractData.lineItems.length - 2} more line items
                      </div>
                    )}
                    <div className="border-t pt-2 mt-3 space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Total Budget:</span>
                        <span>${totalBudget.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm font-medium">
                        <span>Total Price:</span>
                        <span>${totalPrice.toFixed(2)}</span>
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
