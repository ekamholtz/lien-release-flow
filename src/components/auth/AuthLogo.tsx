
import React from 'react';
import { ArrowLeftRight } from 'lucide-react';

export function AuthLogo() {
  return (
    <div className="flex justify-center mb-8">
      <div className="flex items-center space-x-2">
        <div className="h-10 w-10 rounded-md bg-construction-600 flex items-center justify-center">
          <ArrowLeftRight className="h-6 w-6 text-white" />
        </div>
        <span className="font-bold text-2xl text-construction-900">PaymentFlow</span>
      </div>
    </div>
  );
}
