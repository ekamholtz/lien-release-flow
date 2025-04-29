
import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { FileUpload } from '@/components/payments/FileUpload';
import { FilePreview } from '@/components/payments/FilePreview';
import { AlertCircle, Image, FileText } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface ProjectDocumentsProps {
  initialDocuments: ProjectDocument[];
  onBack: () => void;
  onSubmit: (documents: ProjectDocument[]) => void;
}

export interface ProjectDocument {
  file: File;
  description?: string;
  sharedWithClient: boolean;
}

export function ProjectDocuments({ initialDocuments, onBack, onSubmit }: ProjectDocumentsProps) {
  const [documents, setDocuments] = useState<ProjectDocument[]>(initialDocuments || []);
  
  const handleAddFile = useCallback((file: File) => {
    const newDocument: ProjectDocument = {
      file,
      sharedWithClient: false,
    };
    setDocuments(prev => [...prev, newDocument]);
  }, []);
  
  const handleRemoveFile = useCallback((index: number) => {
    setDocuments(prev => prev.filter((_, i) => i !== index));
  }, []);
  
  const handleToggleShared = useCallback((index: number) => {
    setDocuments(prev => 
      prev.map((doc, i) => 
        i === index ? { ...doc, sharedWithClient: !doc.sharedWithClient } : doc
      )
    );
  }, []);
  
  const handleContinue = useCallback(() => {
    onSubmit(documents);
  }, [documents, onSubmit]);

  const renderFilePreview = (file: File) => {
    const isImage = file.type.startsWith('image/');
    
    if (isImage) {
      return (
        <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center overflow-hidden">
          <img 
            src={URL.createObjectURL(file)} 
            alt={file.name} 
            className="object-cover w-full h-full"
            onLoad={(e) => URL.revokeObjectURL((e.target as HTMLImageElement).src)}
          />
        </div>
      );
    }
    
    return (
      <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center">
        {file.type.includes('pdf') ? (
          <FileText className="h-5 w-5 text-red-500" />
        ) : file.type.includes('doc') ? (
          <FileText className="h-5 w-5 text-blue-500" />
        ) : (
          <FileText className="h-5 w-5 text-gray-500" />
        )}
      </div>
    );
  };

  const bytesToSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Byte';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Project Documents</h3>
        <p className="text-sm text-muted-foreground">
          Upload project documents such as contracts, drawings, or specifications.
        </p>
      </div>
      
      <div className="space-y-4">
        <FileUpload onFileSelect={handleAddFile} />
        
        {documents.length > 0 ? (
          <div className="space-y-4">
            <h4 className="text-sm font-semibold">Uploaded Files ({documents.length})</h4>
            <div className="divide-y">
              {documents.map((doc, index) => (
                <div key={index} className="py-3 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {renderFilePreview(doc.file)}
                    <div>
                      <p className="text-sm font-medium">{doc.file.name}</p>
                      <p className="text-xs text-gray-500">{bytesToSize(doc.file.size)}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Switch 
                        checked={doc.sharedWithClient}
                        onCheckedChange={() => handleToggleShared(index)}
                        id={`share-switch-${index}`}
                      />
                      <Label htmlFor={`share-switch-${index}`} className="text-sm">
                        Share with client
                      </Label>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFile(index)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-md p-6 flex flex-col items-center justify-center text-center">
            <AlertCircle className="h-8 w-8 text-gray-400 mb-2" />
            <h3 className="text-sm font-medium">No documents attached</h3>
            <p className="text-xs text-gray-500 mt-1">Upload project documents using the file uploader above</p>
          </div>
        )}
      </div>
      
      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button type="button" onClick={handleContinue}>
          Continue
        </Button>
      </div>
    </div>
  );
}
