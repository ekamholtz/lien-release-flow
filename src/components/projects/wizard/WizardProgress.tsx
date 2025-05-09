
import React from 'react';
import { cn } from '@/lib/utils';

export type WizardStep = 'basic-info' | 'documents' | 'milestones' | 'summary' | string;

interface WizardProgressProps {
  currentStep: WizardStep;
  basicInfoOnly?: boolean;
  steps?: { id: string; label: string }[];
  setStep?: (step: WizardStep) => void;
}

export function WizardProgress({ currentStep, basicInfoOnly = false, steps, setStep }: WizardProgressProps) {
  const isStepActive = (step: WizardStep) => {
    // If custom steps are provided, use their order
    if (steps) {
      const currentStepIndex = steps.findIndex(s => s.id === currentStep);
      const stepIndex = steps.findIndex(s => s.id === step);
      return currentStepIndex >= stepIndex && stepIndex >= 0;
    }
    
    // Default step order for project wizard
    const stepOrder = {
      'basic-info': 0,
      'documents': 1,
      'milestones': 2,
      'summary': 3
    };
    
    return stepOrder[currentStep as keyof typeof stepOrder] >= stepOrder[step as keyof typeof stepOrder];
  };
  
  // If custom steps are provided, render those instead
  if (steps && steps.length > 0) {
    return (
      <div className="flex justify-center mb-6">
        <div className="flex items-center">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              {/* Step circle */}
              <div 
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center cursor-pointer",
                  isStepActive(step.id) ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-500"
                )}
                onClick={() => setStep && setStep(step.id)}
              >
                {index + 1}
              </div>
              
              {/* Connector (except after last step) */}
              {index < steps.length - 1 && (
                <div className="w-12 h-1 bg-gray-200">
                  <div className={cn(
                    "h-1",
                    isStepActive(steps[index + 1].id) ? "bg-blue-500" : "bg-gray-200"
                  )} style={{ width: '100%' }}></div>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  }

  // Default project wizard progress
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
        
        {basicInfoOnly ? (
          // If basicInfoOnly, show direct connection to summary
          <>
            {/* Connector 1-4 */}
            <div className="w-12 h-1 bg-gray-200">
              <div className={cn(
                "h-1",
                isStepActive('summary') ? "bg-blue-500" : "bg-gray-200"
              )} style={{ width: '100%' }}></div>
            </div>
            
            {/* Step 4 (Summary) */}
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center",
              isStepActive('summary') ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-500"
            )}>
              2
            </div>
          </>
        ) : (
          // Regular flow with all steps
          <>
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
          </>
        )}
      </div>
    </div>
  );
}
