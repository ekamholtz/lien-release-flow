import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProject } from '@/hooks/useProject';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { WizardProgress } from '@/components/projects/wizard/WizardProgress';
import ChangeOrderInfo from './ChangeOrderInfo';
import ChangeOrderMilestones from './ChangeOrderMilestones';
import ChangeOrderReview from './ChangeOrderReview';
import { useChangeOrderWizard } from '@/hooks/useChangeOrderWizard';

export type ChangeOrderStep = 'change-info' | 'change-milestones' | 'change-review';

export const ChangeOrderWizard = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { project, loading: projectLoading, error: projectError } = useProject(projectId);
  const [currentStep, setCurrentStep] = useState<ChangeOrderStep>('change-info');
  
  const {
    formData,
    updateFormData,
    isSubmitting,
    submitChangeOrder,
  } = useChangeOrderWizard(projectId);

  useEffect(() => {
    if (projectError) {
      toast.error('Failed to load project information');
    }
  }, [projectError]);

  useEffect(() => {
    // If project is not in progress, redirect to edit options
    if (project && project.status !== 'in_progress') {
      toast.warning('Change orders can only be created for in-progress projects');
      navigate(`/projects/${projectId}/edit-options`);
    }
  }, [project, projectId, navigate]);

  const handleNext = () => {
    if (currentStep === 'change-info') {
      setCurrentStep('change-milestones');
    } else if (currentStep === 'change-milestones') {
      setCurrentStep('change-review');
    }
  };

  const handleBack = () => {
    if (currentStep === 'change-milestones') {
      setCurrentStep('change-info');
    } else if (currentStep === 'change-review') {
      setCurrentStep('change-milestones');
    }
  };

  const handleSubmit = async () => {
    const success = await submitChangeOrder();
    if (success && projectId) {
      toast.success('Change order created successfully');
      navigate(`/projects/${projectId}`);
    }
  };

  if (projectLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!project) {
    return <div>Project not found</div>;
  }

  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold mb-6">Create Change Order</h1>
      <h2 className="text-lg text-muted-foreground mb-6">Project: {project.name}</h2>

      <WizardProgress 
        currentStep={currentStep} 
        steps={[
          { id: 'change-info', label: 'Change Info' },
          { id: 'change-milestones', label: 'Milestones' },
          { id: 'change-review', label: 'Review' }
        ]}
        setStep={(step) => setCurrentStep(step as ChangeOrderStep)}
      />

      <Card className="mt-6">
        <CardContent className="p-6">
          {currentStep === 'change-info' && (
            <ChangeOrderInfo 
              initialData={formData}
              projectValue={project.value}
              updateFormData={updateFormData}
            />
          )}

          {currentStep === 'change-milestones' && (
            <ChangeOrderMilestones
              initialData={formData}
              updateFormData={updateFormData}
              projectId={projectId}
            />
          )}

          {currentStep === 'change-review' && (
            <ChangeOrderReview
              formData={formData}
              project={project}
            />
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between mt-6">
        <div>
          {currentStep !== 'change-info' && (
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={isSubmitting}
            >
              Back
            </Button>
          )}
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate(`/projects/${projectId}/edit-options`)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          
          {currentStep === 'change-review' ? (
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Change Order
                </>
              ) : (
                'Create Change Order'
              )}
            </Button>
          ) : (
            <Button onClick={handleNext}>
              Next
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChangeOrderWizard;
