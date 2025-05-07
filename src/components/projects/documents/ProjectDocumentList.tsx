
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';

interface ProjectDocument {
  id: string;
  name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  description?: string;
  created_at: string;
}

interface ProjectDocumentListProps {
  documents: ProjectDocument[];
  onDownload: (document: ProjectDocument) => void;
}

export function ProjectDocumentList({ documents, onDownload }: ProjectDocumentListProps) {
  if (documents.length === 0) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Card className="w-full">
          <CardContent className="p-6 text-center">
            <FileText className="mx-auto h-10 w-10 text-gray-400 my-2" />
            <h3 className="text-lg font-medium">No documents</h3>
            <p className="text-gray-500 mt-1">
              Upload project documents to get started.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {documents.map((document) => (
        <DocumentCard 
          key={document.id} 
          document={document} 
          onDownload={onDownload} 
        />
      ))}
    </div>
  );
}

interface DocumentCardProps {
  document: ProjectDocument;
  onDownload: (document: ProjectDocument) => void;
}

function DocumentCard({ document, onDownload }: DocumentCardProps) {
  return (
    <Card key={document.id}>
      <CardContent className="p-4 flex flex-col justify-between h-full">
        <div>
          <div className="h-24 flex items-center justify-center bg-gray-100 rounded mb-3">
            <FileText className="h-10 w-10 text-gray-400" />
          </div>
          <h3 className="font-medium truncate">{document.name}</h3>
          {document.description && (
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{document.description}</p>
          )}
        </div>
        
        <div className="mt-4 flex justify-between items-center">
          <p className="text-xs text-gray-500">
            {new Date(document.created_at).toLocaleDateString()}
          </p>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onDownload(document)}
            >
              Download
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
