
import React from 'react';
import { ArrowUpRight, ArrowDownRight, DollarSign, FileClock, FileCheck } from 'lucide-react';

type SummaryCardProps = {
  title: string;
  value: string;
  change?: string;
  isPositive?: boolean;
  icon: React.ReactNode;
};

const SummaryCard = ({ title, value, change, isPositive = true, icon }: SummaryCardProps) => (
  <div className="dashboard-card">
    <div className="flex justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <h3 className="text-2xl font-bold mt-1">{value}</h3>
        {change && (
          <div className="flex items-center mt-2">
            {isPositive ? (
              <ArrowUpRight className="h-4 w-4 text-green-500" />
            ) : (
              <ArrowDownRight className="h-4 w-4 text-red-500" />
            )}
            <span className={`text-xs font-medium ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
              {change} from last month
            </span>
          </div>
        )}
      </div>
      <div className="h-12 w-12 rounded-lg bg-construction-50 flex items-center justify-center">
        {icon}
      </div>
    </div>
  </div>
);

export function DashboardSummary() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <SummaryCard
        title="Total Outstanding"
        value="$24,500.00"
        change="12.5%"
        isPositive={false}
        icon={<DollarSign className="h-6 w-6 text-construction-600" />}
      />
      <SummaryCard
        title="Pending Approvals"
        value="7"
        change="3.2%"
        isPositive
        icon={<FileClock className="h-6 w-6 text-construction-600" />}
      />
      <SummaryCard
        title="Completed Payments"
        value="32"
        change="8.1%"
        isPositive
        icon={<FileCheck className="h-6 w-6 text-construction-600" />}
      />
    </div>
  );
}
