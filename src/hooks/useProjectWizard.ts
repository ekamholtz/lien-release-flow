import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCompany } from '@/contexts/CompanyContext';
import { toast } from 'sonner';
import { Milestone } from '@/components/projects/wizard/ProjectMilestones';
import { ProjectDocument } from '@/components/projects/wizard/ProjectDocuments';
import { ProjectType } from '@/types/project';
import { WizardStep } from '@/components/projects/wizard/WizardProgress';

export interface ProjectFormData {
  name: string;
  clientId: string;
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
  companyId?: string;
}

export function useProjectWizard(initialProjectId?: string | null) {
  const { user } = useAuth();
  const { currentCompany } = useCompany();
  const [currentStep, setCurrentStep] = useState<WizardStep>('basic-info');
  const [formData, setFormData] = useState<ProjectFormData>({
    name: '',
    clientId: '',
    value: 0,
    startDate: new Date(),
    documents: [],
    milestones: [],
    companyId: currentCompany?.id
  });
  const [initialLoading, setInitialLoading] = useState(!!initialProjectId);
  const [projectTypes, setProjectTypes] = useState<ProjectType[]>([]);
  // Flag to track if data has been loaded to prevent duplicate loads
  const [dataLoaded, setDataLoaded] = useState(false);

  // Update company ID when it changes
  useEffect(() => {
    if (currentCompany?.id) {
      setFormData(prev => ({
        ...prev,
        companyId: currentCompany.id
      }));
    }
  }, [currentCompany?.id]);

  // Load project data if initialProjectId is provided
  useEffect(() => {
    async function loadProjectData() {
      if (!initialProjectId || !currentCompany?.id || dataLoaded) return;
      
      setInitialLoading(true);
      try {
        console.log(`Loading project data for ID: ${initialProjectId} and company: ${currentCompany.id}`);
        
        // Fetch project details
        const { data: project, error } = await supabase
          .from('projects')
          .select('*, clients(*)')
          .eq('id', initialProjectId)
          .eq('company_id', currentCompany.id)
          .maybeSingle();
          
        if (error) {
          throw error;
        }
        
        if (project) {
          // Debug: Log raw project data from DB
          console.log('Raw project data from DB:', project);
          
          // Load project documents first
          const { data: documents = [] } = await supabase
            .from('project_files')
            .select('*')
            .eq('project_id', initialProjectId);
            
          // Load project milestones
          const { data: milestones = [] } = await supabase
            .from('milestones')
            .select('*')
            .eq('project_id', initialProjectId);
          
          console.log('Documents loaded:', documents?.length || 0);
          console.log('Milestones loaded:', milestones?.length || 0);
          
          // IMPORTANT: Set formData AFTER all data is loaded
          // Convert the data format to match our form data
          setFormData({
            name: project.name || '',
            clientId: project.client_id || '',
            location: project.location || '',
            contactName: project.contact_name || '',
            contactEmail: project.contact_email || '',
            contactPhone: project.contact_phone || '',
            description: project.description || '',
            value: project.value || 0,
            startDate: project.start_date ? new Date(project.start_date) : new Date(),
            endDate: project.end_date ? new Date(project.end_date) : null,
            projectTypeId: project.project_type_id || undefined,
            companyId: project.company_id || currentCompany.id,
            documents: documents?.map(doc => ({
              file: new File([], doc.name, { type: doc.file_type }), // Placeholder file
              sharedWithClient: doc.shared_with_client,
              description: doc.description || ''
            })) || [],
            milestones: milestones?.map(milestone => ({
              name: milestone.name,
              description: milestone.description || '',
              dueDate: milestone.due_date ? new Date(milestone.due_date) : null,
              amount: milestone.amount,
              percentage: milestone.percentage,
              dueType: milestone.due_type as 'time' | 'event'
            })) || []
          });
          
          // Debug: Log what formData is being set
          console.log('Final formData being set:', {
            name: project.name,
            clientId: project.client_id,
            value: project.value,
            projectTypeId: project.project_type_id
          });
            
          console.log('Project loaded successfully:', project.name);
        } else {
          console.error('Project not found or not accessible');
          toast.error('Project not found or not accessible');
        }
      } catch (error) {
        console.error('Error loading project:', error);
        toast.error('Failed to load project data');
      } finally {
        setInitialLoading(false);
      }
    }
    
    if (initialProjectId && !dataLoaded) {
      loadProjectData();
    }
  }, [initialProjectId, currentCompany?.id, dataLoaded]);

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
