
import React from 'react';
import { X, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FilePreviewProps {
  files: File[];
  onRemoveFile: (index: number) => void;
}

export function FilePreview({ files, onRemoveFile }: FilePreviewProps) {
  if (files.length === 0) {
    return null;
  }
  
  return (
    <div className="mt-4 space-y-2">
      <p className="text-sm font-medium">Uploaded Files:</p>
      <div className="space-y-2">
        {files.map((file, index) => (
          <div key={index} className="flex items-center justify-between p-2 border rounded-md bg-gray-50">
            <div className="flex items-center">
              <FileText className="w-4 h-4 mr-2 text-gray-500" />
              <span className="text-sm truncate max-w-[200px]">{file.name}</span>
              <span className="ml-2 text-xs text-gray-500">
                ({(file.size / 1024).toFixed(1)} KB)
              </span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onRemoveFile(index)}
              className="text-gray-500 hover:text-red-500"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
