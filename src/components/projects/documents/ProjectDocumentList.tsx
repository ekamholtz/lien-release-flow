
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Trash2 } from 'lucide-react';

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
  onDelete?: (document: ProjectDocument) => void;
}

export function ProjectDocumentList({ documents, onDownload, onDelete }: ProjectDocumentListProps) {
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {documents.map((document) => (
        <DocumentCard 
          key={document.id} 
          document={document} 
          onDownload={onDownload} 
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

interface DocumentCardProps {
  document: ProjectDocument;
  onDownload: (document: ProjectDocument) => void;
  onDelete?: (document: ProjectDocument) => void;
}

function DocumentCard({ document, onDownload, onDelete }: DocumentCardProps) {
  return (
    <Card key={document.id}>
      <CardContent className="p-5 flex flex-col h-full space-y-4">
        {/* Document Header */}
        <div className="flex items-start space-x-3">
          <div className="h-12 w-12 flex-shrink-0 flex items-center justify-center bg-gray-100 rounded">
            <FileText className="h-6 w-6 text-gray-500" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm truncate">{document.name}</h3>
            <p className="text-xs text-gray-500">
              {new Date(document.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
        
        {/* Description (if exists) */}
        {document.description && (
          <p className="text-xs text-gray-600 line-clamp-2 pt-1">{document.description}</p>
        )}
        
        {/* Actions */}
        <div className="flex justify-end gap-2 mt-auto pt-2">
          <Button 
            variant="outline" 
            size="sm"
            className="text-xs px-2 h-8"
            onClick={() => onDownload(document)}
          >
            Download
          </Button>
          {onDelete && (
            <Button 
              variant="ghost" 
              size="sm"
              className="text-xs px-2 h-8 text-red-500 hover:bg-red-50 hover:text-red-600"
              onClick={() => onDelete(document)}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
