
import React from 'react';
import { Button } from '@/components/ui/button';

interface WizardActionsProps {
  onBack?: () => void;
  onNext: () => void;
  showBack?: boolean;
  nextLabel?: string;
  nextDisabled?: boolean;
  isLoading?: boolean;
}

export function WizardActions({
  onBack,
  onNext,
  showBack = true,
  nextLabel = 'Continue',
  nextDisabled = false,
  isLoading = false
}: WizardActionsProps) {
  return (
    <div className="flex justify-between pt-4">
      {showBack && onBack ? (
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
      ) : (
        <div></div> // Empty div to maintain flex justification
      )}
      
      <Button
        type="button"
        onClick={onNext}
        disabled={nextDisabled || isLoading}
      >
        {isLoading ? 'Processing...' : nextLabel}
      </Button>
    </div>
  );
}
