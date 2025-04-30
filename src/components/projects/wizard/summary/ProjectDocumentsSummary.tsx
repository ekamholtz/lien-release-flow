
import React from 'react';
import { FileIcon } from 'lucide-react';

interface ExtendedFile extends File {
  sharedWithClient?: boolean;
  description?: string | null;
}

interface ProjectDocumentsSummaryProps {
  documents: ExtendedFile[];
}

export function ProjectDocumentsSummary({ documents }: ProjectDocumentsSummaryProps) {
  if (!documents.length) return null;
  
  return (
    <div>
      <h4 className="text-sm font-semibold text-gray-500 mb-2">Documents ({documents.length})</h4>
      <ul className="space-y-2">
        {documents.map((file, index) => (
          <li key={index} className="flex items-center">
            <FileIcon className="h-4 w-4 mr-2 text-blue-500" />
            <span className="text-sm">{file.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
