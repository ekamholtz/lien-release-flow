
import React from 'react';

export function TransactionsLoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      {Array(5).fill(0).map((_, i) => (
        <div key={i} className="h-16 bg-gray-100 rounded"></div>
      ))}
    </div>
  );
}
