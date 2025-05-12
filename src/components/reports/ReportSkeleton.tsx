
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export const ReportSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      <Skeleton className="h-[350px] w-full" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Skeleton className="h-[300px] w-full" />
        <Skeleton className="h-[300px] w-full" />
      </div>
    </div>
  );
};
