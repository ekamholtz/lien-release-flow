
import React from 'react';
import { FileText } from 'lucide-react';

interface ProjectDescriptionSummaryProps {
  description?: string;
}

export function ProjectDescriptionSummary({ description }: ProjectDescriptionSummaryProps) {
  if (!description) return null;
  
  return (
    <div>
      <h4 className="text-sm font-semibold text-gray-500 mb-2 flex items-center">
        <FileText className="h-4 w-4 mr-1" /> Description
      </h4>
      <p className="text-sm text-gray-600 whitespace-pre-wrap">{description}</p>
    </div>
  );
}
