
import React from 'react';
import { ProjectWizardContainer } from './ProjectWizardContainer';

interface ProjectWizardProps {
  initialProjectId?: string | null;
}

export function ProjectWizard({ initialProjectId }: ProjectWizardProps) {
  return <ProjectWizardContainer initialProjectId={initialProjectId} />;
}
