
import React from 'react';
import { cn } from '@/lib/utils';

export type WizardStep = 'basic-info' | 'documents' | 'milestones' | 'summary';

interface WizardProgressProps {
  currentStep: WizardStep;
}

export function WizardProgress({ currentStep }: WizardProgressProps) {
  const isStepActive = (step: WizardStep) => {
    const stepOrder = {
      'basic-info': 0,
      'documents': 1,
      'milestones': 2,
      'summary': 3
    };
    
    return stepOrder[currentStep] >= stepOrder[step];
  };
  
  return (
    <div className="flex justify-center mb-6">
      <div className="flex items-center">
        {/* Step 1 */}
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center",
          isStepActive('basic-info') ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-500"
        )}>
          1
        </div>
        
        {/* Connector 1-2 */}
        <div className="w-12 h-1 bg-gray-200">
          <div className={cn(
            "h-1",
            isStepActive('documents') ? "bg-blue-500" : "bg-gray-200"
          )} style={{ width: '100%' }}></div>
        </div>
        
        {/* Step 2 */}
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center",
          isStepActive('documents') ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-500"
        )}>
          2
        </div>
        
        {/* Connector 2-3 */}
        <div className="w-12 h-1 bg-gray-200">
          <div className={cn(
            "h-1",
            isStepActive('milestones') ? "bg-blue-500" : "bg-gray-200"
          )} style={{ width: '100%' }}></div>
        </div>
        
        {/* Step 3 */}
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center",
          isStepActive('milestones') ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-500"
        )}>
          3
        </div>
        
        {/* Connector 3-4 */}
        <div className="w-12 h-1 bg-gray-200">
          <div className={cn(
            "h-1",
            isStepActive('summary') ? "bg-blue-500" : "bg-gray-200"
          )} style={{ width: '100%' }}></div>
        </div>
        
        {/* Step 4 */}
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center",
          isStepActive('summary') ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-500"
        )}>
          4
        </div>
      </div>
    </div>
  );
}
