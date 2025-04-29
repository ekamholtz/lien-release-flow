
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileUpload } from '@/components/payments/FileUpload';
import { FilePreview } from '@/components/payments/FilePreview';
import { AlertCircle } from 'lucide-react';

interface ProjectDocumentsProps {
  initialDocuments: File[];
  onBack: () => void;
  onSubmit: (documents: File[]) => void;
}

export function ProjectDocuments({ initialDocuments, onBack, onSubmit }: ProjectDocumentsProps) {
  const [documents, setDocuments] = useState<File[]>(initialDocuments || []);
  
  const handleAddFile = (file: File) => {
    setDocuments(prev => [...prev, file]);
  };
  
  const handleRemoveFile = (file: File) => {
    setDocuments(prev => prev.filter(f => f !== file));
  };
  
  const handleContinue = () => {
    onSubmit(documents);
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
              {documents.map((file, index) => (
                <div key={index} className="py-3 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <FilePreview file={file} />
                    <div>
                      <p className="text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-gray-500">{bytesToSize(file.size)}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveFile(file)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    Remove
                  </Button>
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
