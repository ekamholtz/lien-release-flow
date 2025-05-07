
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { ProjectWizard } from '@/components/projects/ProjectWizard';
import { toast } from 'sonner';
import { useProject } from '@/hooks/useProject';

const CreateProject = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [projectId, setProjectId] = useState<string | null>(null);
  const { project, loading, error } = useProject(projectId);

  useEffect(() => {
    // Extract project ID from URL query parameters
    const params = new URLSearchParams(location.search);
    const id = params.get('id');
    
    if (id) {
      console.log(`Loading project with ID: ${id}`);
      setProjectId(id);
    } else {
      // If no project ID is provided, redirect back to the projects page
      toast.error("Missing project ID. Redirecting to projects page.");
      navigate('/projects');
    }
  }, [location.search, navigate]);

  // Handle project loading error
  useEffect(() => {
    if (error) {
      console.error("Error loading project:", error);
      toast.error("Failed to load project. Please try again.");
      navigate('/projects');
    }
  }, [error, navigate]);

  const handleClose = () => {
    navigate('/projects');
  };

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Create Project</h1>
        
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <p>Loading project data...</p>
          </div>
        ) : (
          <div className="dashboard-card">
            <ProjectWizard 
              initialProjectId={projectId || undefined} 
              onClose={handleClose}
            />
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default CreateProject;
