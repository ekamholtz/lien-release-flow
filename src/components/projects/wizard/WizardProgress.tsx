
import React from 'react';
import { cn } from '@/lib/utils';

export type WizardStep = 'basic-info' | 'contract' | 'milestones' | 'documents' | 'summary' | string;

interface WizardProgressProps {
  currentStep: WizardStep;
  basicInfoOnly?: boolean;
  steps?: { id: string; label: string }[];
  setStep?: (step: WizardStep) => void;
}

export function WizardProgress({ currentStep, basicInfoOnly = false, steps, setStep, ...restProps }: WizardProgressProps) {
  const isStepActive = (step: WizardStep) => {
    // If custom steps are provided, use their order
    if (steps) {
      const currentStepIndex = steps.findIndex(s => s.id === currentStep);
      const stepIndex = steps.findIndex(s => s.id === step);
      return currentStepIndex >= stepIndex && stepIndex >= 0;
    }
    
    // Updated step order for project wizard: basic-info -> contract -> milestones -> documents -> summary
    const stepOrder = {
      'basic-info': 0,
      'contract': 1,
      'milestones': 2,
      'documents': 3,
      'summary': 4
    };
    
    return stepOrder[currentStep as keyof typeof stepOrder] >= stepOrder[step as keyof typeof stepOrder];
  };
  
  // If custom steps are provided, render those instead
  if (steps && steps.length > 0) {
    return (
      <div className="flex justify-center mb-6">
        <div className="flex items-center">
          {steps.map((step, index) => {
            // Instead of using React.Fragment, use an array of elements
            const elements = [];
            
            // Step circle
            elements.push(
              <div 
                key={`step-${step.id}-${index}`}
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center cursor-pointer",
                  isStepActive(step.id) ? "bg-cnstrct-orange text-white" : "bg-gray-200 text-gray-500"
                )}
                onClick={() => setStep && setStep(step.id)}
              >
                {index + 1}
              </div>
            );
            
            // Connector (except after last step)
            if (index < steps.length - 1) {
              elements.push(
                <div key={`connector-${step.id}-${index}`} className="w-12 h-1 bg-gray-200">
                  <div className={cn(
                    "h-1",
                    isStepActive(steps[index + 1].id) ? "bg-cnstrct-orange" : "bg-gray-200"
                  )} style={{ width: '100%' }}></div>
                </div>
              );
            }
            
            return elements;
          })}
        </div>
      </div>
    );
  }

  // Default project wizard progress with new order
  return (
    <div className="flex justify-center mb-6">
      <div className="flex items-center">
        {/* Step 1: Basic Info */}
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center",
          isStepActive('basic-info') ? "bg-cnstrct-orange text-white" : "bg-gray-200 text-gray-500"
        )}>
          1
        </div>
        
        {basicInfoOnly ? (
          // If basicInfoOnly, show direct connection to summary
          <>
            {/* Connector 1-5 */}
            <div className="w-12 h-1 bg-gray-200">
              <div className={cn(
                "h-1",
                isStepActive('summary') ? "bg-cnstrct-orange" : "bg-gray-200"
              )} style={{ width: '100%' }}></div>
            </div>
            
            {/* Step 5 (Summary) */}
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center",
              isStepActive('summary') ? "bg-cnstrct-orange text-white" : "bg-gray-200 text-gray-500"
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
                isStepActive('contract') ? "bg-cnstrct-orange" : "bg-gray-200"
              )} style={{ width: '100%' }}></div>
            </div>
            
            {/* Step 2: Contract */}
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center",
              isStepActive('contract') ? "bg-cnstrct-orange text-white" : "bg-gray-200 text-gray-500"
            )}>
              2
            </div>
            
            {/* Connector 2-3 */}
            <div className="w-12 h-1 bg-gray-200">
              <div className={cn(
                "h-1",
                isStepActive('milestones') ? "bg-cnstrct-orange" : "bg-gray-200"
              )} style={{ width: '100%' }}></div>
            </div>
            
            {/* Step 3: Milestones */}
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center",
              isStepActive('milestones') ? "bg-cnstrct-orange text-white" : "bg-gray-200 text-gray-500"
            )}>
              3
            </div>
            
            {/* Connector 3-4 */}
            <div className="w-12 h-1 bg-gray-200">
              <div className={cn(
                "h-1",
                isStepActive('documents') ? "bg-cnstrct-orange" : "bg-gray-200"
              )} style={{ width: '100%' }}></div>
            </div>
            
            {/* Step 4: Documents */}
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center",
              isStepActive('documents') ? "bg-cnstrct-orange text-white" : "bg-gray-200 text-gray-500"
            )}>
              4
            </div>
            
            {/* Connector 4-5 */}
            <div className="w-12 h-1 bg-gray-200">
              <div className={cn(
                "h-1",
                isStepActive('summary') ? "bg-cnstrct-orange" : "bg-gray-200"
              )} style={{ width: '100%' }}></div>
            </div>
            
            {/* Step 5: Summary */}
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center",
              isStepActive('summary') ? "bg-cnstrct-orange text-white" : "bg-gray-200 text-gray-500"
            )}>
              5
            </div>
          </>
        )}
      </div>
    </div>
  );
}
