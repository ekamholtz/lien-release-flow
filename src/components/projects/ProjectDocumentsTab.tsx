
import { DocumentsTab } from './DocumentsTab';

interface ProjectDocumentsTabProps {
  projectId: string;
}

export function ProjectDocumentsTab({ projectId }: ProjectDocumentsTabProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Project Documents</h2>
      <DocumentsTab projectId={projectId} />
    </div>
  );
}
