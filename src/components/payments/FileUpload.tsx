
import React from 'react';
import { Upload } from "lucide-react";
import { FormLabel } from "@/components/ui/form";

interface FileUploadProps {
  onFileChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFileSelect?: (file: File) => void;
}

export function FileUpload({ onFileChange, onFileSelect }: FileUploadProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onFileChange) {
      onFileChange(e);
    }
    
    if (onFileSelect && e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };
  
  return (
    <div>
      <FormLabel>Supporting Documents</FormLabel>
      <div className="mt-2">
        <div className="flex items-center justify-center w-full">
          <label
            htmlFor="file-upload"
            className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 border-gray-300"
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload className="w-8 h-8 mb-2 text-gray-400" />
              <p className="mb-2 text-sm text-gray-500">
                <span className="font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-500">PDF, PNG, JPG, DOCX (MAX. 10MB)</p>
            </div>
            <input
              id="file-upload"
              type="file"
              className="hidden"
              onChange={handleFileChange}
              multiple
            />
          </label>
        </div>
      </div>
    </div>
  );
}
