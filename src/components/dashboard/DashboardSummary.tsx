
import React from 'react';
import { ArrowUpRight, ArrowDownRight, DollarSign, FileClock, FileCheck } from 'lucide-react';
import { useDashboardData } from '@/hooks/useDashboardData';
import { formatCurrency } from '@/lib/utils';

type SummaryCardProps = {
  title: string;
  value: string;
  change?: string;
  isPositive?: boolean;
  icon: React.ReactNode;
  isLoading?: boolean;
};

const SummaryCard = ({ title, value, change, isPositive = true, icon, isLoading = false }: SummaryCardProps) => (
  <div className="dashboard-card">
    <div className="flex justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        {isLoading ? (
          <div className="h-8 w-24 bg-gray-200 animate-pulse rounded mt-1"></div>
        ) : (
          <h3 className="text-2xl font-bold mt-1">{value}</h3>
        )}
        {change && !isLoading && (
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
        {isLoading && change && (
          <div className="h-4 w-32 bg-gray-200 animate-pulse rounded mt-2"></div>
        )}
      </div>
      <div className="h-12 w-12 rounded-lg bg-cnstrct-lightgray flex items-center justify-center">
        {icon}
      </div>
    </div>
  </div>
);

export function DashboardSummary() {
  const { 
    totalOutstanding,
    totalOutstandingChange,
    pendingApprovals,
    pendingApprovalsChange,
    completedPayments,
    completedPaymentsChange,
    isLoading
  } = useDashboardData();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <SummaryCard
        title="Total Outstanding"
        value={formatCurrency(totalOutstanding)}
        change={`${Math.abs(totalOutstandingChange)}%`}
        isPositive={totalOutstandingChange > 0}
        icon={<DollarSign className="h-6 w-6 text-cnstrct-navy" />}
        isLoading={isLoading}
      />
      <SummaryCard
        title="Pending Approvals"
        value={String(pendingApprovals)}
        change={`${Math.abs(pendingApprovalsChange)}%`}
        isPositive={pendingApprovalsChange > 0}
        icon={<FileClock className="h-6 w-6 text-cnstrct-navy" />}
        isLoading={isLoading}
      />
      <SummaryCard
        title="Completed Payments"
        value={String(completedPayments)}
        change={`${Math.abs(completedPaymentsChange)}%`}
        isPositive={completedPaymentsChange > 0}
        icon={<FileCheck className="h-6 w-6 text-cnstrct-navy" />}
        isLoading={isLoading}
      />
    </div>
  );
}
