
import React from 'react';
import { CheckCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Feature {
  name: string;
  paymentFlow: boolean;
  others: boolean;
}

export interface ComparisonTableProps {
  features: Feature[];
  className?: string;
}

export function ComparisonTable({ features = [], className }: ComparisonTableProps) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="text-left p-4 border-b border-gray-200">Features</th>
            <th className="p-4 border-b border-gray-200 text-center bg-construction-50 text-construction-700">
              PaymentFlow
            </th>
            <th className="p-4 border-b border-gray-200 text-center text-gray-600">
              Other Solutions
            </th>
          </tr>
        </thead>
        <tbody>
          {features.map((feature, index) => (
            <tr key={index} className="hover:bg-gray-50">
              <td className="p-4 border-b border-gray-200 text-gray-700">
                {feature.name}
              </td>
              <td className="p-4 border-b border-gray-200 text-center">
                {feature.paymentFlow ? (
                  <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                ) : (
                  <X className="h-5 w-5 text-gray-300 mx-auto" />
                )}
              </td>
              <td className="p-4 border-b border-gray-200 text-center">
                {feature.others ? (
                  <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                ) : (
                  <X className="h-5 w-5 text-gray-300 mx-auto" />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
