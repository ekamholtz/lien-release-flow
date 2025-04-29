
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreateProjectDialog } from '@/components/projects/CreateProjectDialog';
import { ArrowRight } from "lucide-react";

const NewProject = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);

  // Check for projectId in query params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get('id');
    if (id) {
      setProjectId(id);
    } else {
      // If no ID in query params, open the dialog
      setIsDialogOpen(true);
    }
  }, [location.search]);

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    // If user closes the dialog without creating a project, go back to projects
    if (!projectId) {
      navigate('/projects');
    }
  };

  const handleProjectCreated = (id: string) => {
    setProjectId(id);
    setIsDialogOpen(false);
    // Update URL with project ID
    navigate(`/projects/new?id=${id}`, { replace: true });
  };

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Create New Project</h1>
        
        <div className="mb-8">
          {/* Progress bar */}
          <div className="relative">
            <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
              <div className="w-1/3 shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"></div>
            </div>
            <div className="flex justify-between mt-2">
              <div className="text-center">
                <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center mx-auto">1</div>
                <div className="text-sm mt-1 font-medium">Basic Info</div>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 rounded-full bg-gray-300 text-gray-500 flex items-center justify-center mx-auto">2</div>
                <div className="text-sm mt-1 text-gray-500">Documents</div>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 rounded-full bg-gray-300 text-gray-500 flex items-center justify-center mx-auto">3</div>
                <div className="text-sm mt-1 text-gray-500">Milestones</div>
              </div>
            </div>
          </div>
        </div>
        
        <Card className="mb-6">
          <CardContent className="pt-6">
            {/* Show info if a project has been created */}
            {projectId ? (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium">Project Created!</h3>
                  <p className="text-sm text-muted-foreground">
                    You've created a draft project. You can continue setting it up now or come back later.
                  </p>
                </div>
                
                <div className="flex justify-between">
                  <Button
                    variant="ghost"
                    onClick={() => navigate('/projects')}
                  >
                    Back to Projects
                  </Button>
                  
                  <Button
                    onClick={() => navigate(`/projects/${projectId}`)}
                  >
                    Continue Setup <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center">
                <p>Loading project details...</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <CreateProjectDialog
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        onProjectCreated={handleProjectCreated}
      />
    </AppLayout>
  );
};

export default NewProject;
