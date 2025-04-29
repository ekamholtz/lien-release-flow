
import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload } from 'lucide-react';

interface FileUploadProps {
  onFileSelect?: (file: File) => void;
  onFileChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function FileUpload({ onFileSelect, onFileChange }: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onFileChange) {
      onFileChange(e);
    } else if (onFileSelect && e.target.files?.[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <div className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <Upload className="w-8 h-8 mb-2 text-gray-500" />
          <p className="mb-2 text-sm text-gray-500">
            <span className="font-semibold">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-gray-500">PDF, DOC, DOCX, XLS, XLSX, PNG, JPG</p>
        </div>
        
        <Input
          ref={fileInputRef}
          id="file-upload"
          type="file"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
      
      <div className="mt-4">
        <Button onClick={handleButtonClick} type="button">
          Select File
        </Button>
      </div>
    </div>
  );
}
