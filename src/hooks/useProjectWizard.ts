
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Milestone } from '@/components/projects/wizard/ProjectMilestones';
import { ProjectDocument } from '@/components/projects/wizard/ProjectDocuments';
import { ProjectType } from '@/types/project';
import { WizardStep } from '@/components/projects/wizard/WizardProgress';

export interface ProjectFormData {
  name: string;
  client: string;
  location?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  description?: string;
  value: number;
  startDate: Date;
  endDate?: Date | null;
  projectTypeId?: string;
  documents: ProjectDocument[];
  milestones: Milestone[];
}

export function useProjectWizard(initialProjectId?: string | null) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<WizardStep>('basic-info');
  const [formData, setFormData] = useState<ProjectFormData>({
    name: '',
    client: '',
    value: 0,
    startDate: new Date(),
    documents: [],
    milestones: []
  });
  const [initialLoading, setInitialLoading] = useState(!!initialProjectId);
  const [projectTypes, setProjectTypes] = useState<ProjectType[]>([]);

  // Load project data if initialProjectId is provided
  useEffect(() => {
    async function loadProjectData() {
      if (!initialProjectId) return;
      
      setInitialLoading(true);
      try {
        // Fetch project details
        const { data: project, error } = await supabase
          .from('projects')
          .select('*')
          .eq('id', initialProjectId)
          .single();
          
        if (error) {
          throw error;
        }
        
        if (project) {
          // Convert the data format to match our form data
          setFormData({
            name: project.name || '',
            client: project.client || '',
            location: project.location || '',
            contactName: project.contact_name || '',
            contactEmail: project.contact_email || '',
            contactPhone: project.contact_phone || '',
            description: project.description || '',
            value: project.value || 0,
            startDate: project.start_date ? new Date(project.start_date) : new Date(),
            endDate: project.end_date ? new Date(project.end_date) : null,
            projectTypeId: project.project_type_id || undefined,
            documents: [], // These will be loaded separately
            milestones: [] // These will be loaded separately
          });
          
          // Load project documents
          const { data: documents } = await supabase
            .from('project_files')
            .select('*')
            .eq('project_id', initialProjectId);
            
          // Load project milestones
          const { data: milestones } = await supabase
            .from('milestones')
            .select('*')
            .eq('project_id', initialProjectId);
            
          console.log('Project loaded successfully:', project.name);
        }
      } catch (error) {
        console.error('Error loading project:', error);
        toast.error('Failed to load project data');
      } finally {
        setInitialLoading(false);
      }
    }
    
    loadProjectData();
  }, [initialProjectId]);

  const handleNextStep = () => {
    if (currentStep === 'basic-info') {
      setCurrentStep('documents');
    } else if (currentStep === 'documents') {
      setCurrentStep('milestones');
    } else if (currentStep === 'milestones') {
      setCurrentStep('summary');
    }
  };

  const handlePreviousStep = () => {
    if (currentStep === 'documents') {
      setCurrentStep('basic-info');
    } else if (currentStep === 'milestones') {
      setCurrentStep('documents');
    } else if (currentStep === 'summary') {
      setCurrentStep('milestones');
    }
  };

  const updateFormData = (data: Partial<ProjectFormData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  return {
    user,
    currentStep,
    formData,
    initialLoading,
    projectTypes,
    setProjectTypes,
    handleNextStep,
    handlePreviousStep,
    updateFormData,
    setFormData
  };
}
